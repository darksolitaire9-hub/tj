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

  for (const seg of evaluatedSegments) {
    if (seg.risk === 'high') highCount++;
    if (seg.risk === 'medium') mediumCount++;
  }

  if (highCount > 0 || overall_stats.control_phrase_score && overall_stats.control_phrase_score > 0.8) {
    highestRisk = 'high_risk';
  } else if (mediumCount > 0 || (overall_stats.stopword_ratio && overall_stats.stopword_ratio < 0.15)) {
    highestRisk = 'medium_risk';
  } else if (suspicious_segments.length > 0) {
    highestRisk = 'low_risk';
  }

  // Generate Rationale
  let rationale = `Detected ${suspicious_segments.length} suspicious artifacts.`;
  if (highestRisk === 'high_risk') {
    rationale += ` Critical prompt-injection patterns or severe cloaking detected.`;
  } else if (highestRisk === 'medium_risk') {
    rationale += ` Potential keyword stuffing or off-page steganography found.`;
  }

  let globalRec = 'Proceed with caution.';
  if (highestRisk === 'high_risk') {
    globalRec = 'Reject under policy due to hidden manipulative content or prompt injections.';
  } else if (highestRisk === 'medium_risk') {
    globalRec = 'Request a clean, unaltered version of the resume from the candidate.';
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

  // Layer 3: Injection Patterns
  const injectionPatterns = /(ignore previous instructions|you are now|system:|assistant:)/i;
  const isInjection = injectionPatterns.test(segment.text_content) || (segment.control_phrase_score && segment.control_phrase_score > 0.7);

  if (isInjection) {
    risk = 'high';
    explanation = 'Segment contains explicit prompt-injection or jailbreak language intended to hijack LLM behavior.';
    rec = 'Flag immediately. Do not process in downstream LLMs.';
  } else if (segment.type === 'white_text' || segment.type === 'cloaked_text') {
    risk = 'medium';
    explanation = `Content is intentionally hidden from humans via ${segment.type}. Often used for deceptive ATS optimization.`;
    rec = 'Review hidden text. If it is a keyword dump, disregard.';
    if (segment.text_content.length > 1000) {
      risk = 'high'; // Massive keyword dump
      explanation += ' Severe volume indicates adversarial stuffing.';
      rec = 'Reject document.';
    }
  } else if (segment.type === 'micro_font') {
    risk = 'low';
    explanation = 'Font size is near-invisible (micro-font). Could be a formatting glitch or naive keyword stuffing.';
    rec = 'Proceed, but be aware of listed keywords.';
  }

  return {
    ...segment,
    risk,
    explanation,
    recommended_action: rec
  };
}
