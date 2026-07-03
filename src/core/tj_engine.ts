import type { ScanResult, TJOutput, SuspiciousSegment, RiskLevel } from '../types';

/**
 * TJ Deterministic Rule Engine
 * Evaluates structured PDF scan results and assigns risk scores and explanations.
 */
export function evaluateScan(scan: ScanResult): TJOutput {
  const { overall_stats, file_metadata, suspicious_segments } = scan;

  if (!file_metadata || suspicious_segments.length === 0) {
    return {
      summary: `Document "${file_metadata?.name || 'unknown'}" has 0 suspicious segments.`,
      risk_level: 'no_risk',
      rationale: 'No hidden text, micro-fonts, or injection patterns were detected by the structural scanner.',
      segments: [],
      global_recommendation: 'Proceed safely.',
      policy_notes: 'Document passed initial edge WAF structural checks.'
    };
  }

  const evaluatedSegments = suspicious_segments.map(evaluateSegment);
  
  // Aggregate Risk
  let highestRisk: RiskLevel = 'no_risk';
  let highCount = 0;
  let mediumCount = 0;
  let hasSpatialAnomaly = false;
  let hasPromptInjection = false;
  let keywordStuffingCount = 0;

  for (const seg of evaluatedSegments) {
    if (seg.risk === 'high') highCount++;
    if (seg.risk === 'medium') mediumCount++;
    if (seg.type === 'spatial_anomaly') hasSpatialAnomaly = true;
    if (seg.type === 'prompt_injection') hasPromptInjection = true;
    if (seg.type === 'obfuscated_payload') hasPromptInjection = true; // Route to high risk
    if (seg.type === 'keyword_stuffing') keywordStuffingCount++;
  }

  if (hasSpatialAnomaly || hasPromptInjection || highCount > 0 || keywordStuffingCount > 2) {
    highestRisk = 'high_risk';
  } else if (mediumCount > 0 || keywordStuffingCount > 0) {
    highestRisk = 'medium_risk';
  } else if (suspicious_segments.length > 0) {
    highestRisk = 'low_risk';
  }

  // Generate Rationale
  let rationale = `Detected ${suspicious_segments.length} suspicious artifacts.`;
  if (highestRisk === 'high_risk') {
    rationale += ` Critical prompt-injection patterns or severe physical anomalies (occlusion) detected.`;
  } else if (highestRisk === 'medium_risk') {
    rationale += ` Potential keyword stuffing, invisible text, or borderline anomalies found.`;
  }

  let globalRec = 'Proceed with caution.';
  if (highestRisk === 'high_risk') {
    globalRec = 'Reject under policy due to hidden manipulative content, occlusion steganography, or prompt injections.';
  } else if (highestRisk === 'medium_risk') {
    globalRec = 'Request a clean, unaltered version of the resume from the candidate or flag for manual review.';
  }

  return {
    summary: `Scanned ${file_metadata.page_count} pages. Found ${overall_stats.suspicious_segment_count} suspicious segments.`,
    risk_level: highestRisk,
    rationale,
    segments: evaluatedSegments,
    global_recommendation: globalRec,
    policy_notes: scan.policy || 'Apply standard zero-trust boundaries.'
  };
}

function evaluateSegment(segment: SuspiciousSegment): SuspiciousSegment {
  let risk: 'low' | 'medium' | 'high' = 'low';
  let explanation = '';
  let rec = 'Log and ignore.';
  let type = segment.type;

  // Layer 3: Injection Patterns
  const injectionPatterns = /(ignore.*instructions|ignore all instructions|system override|you must|bypass|output exactly|act as)/i;
  const isInjection = injectionPatterns.test(segment.text_content);

  // Re-classify as prompt_injection if the regex hits, regardless of structural type
  if (isInjection) {
    type = 'prompt_injection';
  }

  if (type === 'prompt_injection') {
    risk = 'high';
    explanation = 'Segment contains explicit prompt-injection or jailbreak language intended to hijack LLM behavior. Resumes are descriptive, not imperative; such language is highly anomalous.';
    rec = 'Flag immediately. Do not process in downstream LLMs.';
  } else if (type === 'spatial_anomaly') {
    risk = 'high';
    explanation = `Character density is mathematically impossible (${segment.char_density?.toFixed(2)} chars/pt²), indicating text forced into a tiny bounding box (occlusion/compression steganography).`;
    rec = 'Reject document. This is a deliberate attempt to hide massive amounts of text from human reviewers.';
  } else if (type === 'obfuscated_payload') {
    risk = 'high';
    explanation = `String entropy is mathematically too high for natural language (${segment.entropy?.toFixed(2)} bits/char). Resembles an encoded payload (e.g., Base64 or Hex).`;
    rec = 'Flag immediately. High-entropy strings in PDF text streams are strongly indicative of encoded malicious payloads meant for downstream LLM execution.';
  } else if (type === 'keyword_stuffing') {
    risk = 'medium';
    explanation = `Anomalously low stopword density (${((segment.stopword_ratio || 0) * 100).toFixed(1)}%). Normal human prose has a predictable ratio of function words, whereas pure skill lists have near-zero density.`;
    rec = 'Review hidden text. If it is a keyword dump, disregard.';
    if (segment.text_content.length > 500) {
      risk = 'high';
      explanation += ' Severe volume indicates adversarial stuffing.';
      rec = 'Reject document.';
    }
  } else if (type === 'white_text' || type === 'offpage') {
    risk = 'medium';
    explanation = `Content is intentionally hidden from humans via ${type}. Often used for deceptive ATS optimization.`;
    rec = 'Review text contents for relevance.';
  } else if (type === 'microfont') {
    risk = 'low';
    explanation = 'Font size is near-invisible. Could be a formatting glitch or naive keyword stuffing.';
    rec = 'Proceed, but be aware of listed keywords.';
  }

  return {
    ...segment,
    type,
    risk,
    explanation,
    recommended_action: rec
  };
}
