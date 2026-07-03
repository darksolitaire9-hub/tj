import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { ScanResult, SuspiciousSegment, SegmentType } from '../types';

// Properly load the worker via Vite bundler instead of relying on external CDNs
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

const STOPWORDS = new Set(['and', 'the', 'of', 'in', 'to', 'for', 'with', 'a', 'an', 'is', 'on', 'at', 'by', 'this', 'that', 'it', 'as', 'be', 'are', 'or', 'from', 'we', 'i', 'you']);

export async function scanPDFBuffer(arrayBuffer: ArrayBuffer, fileName: string): Promise<ScanResult> {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  
  const segments: SuspiciousSegment[] = [];
  
  const typeCounts: Record<SegmentType, number> = {
    keyword_stuffing: 0,
    spatial_anomaly: 0,
    prompt_injection: 0,
    microfont: 0,
    offpage: 0,
    white_text: 0,
    other: 0
  };

  let globalWordCount = 0;
  let globalStopwordCount = 0;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    const viewport = page.getViewport({ scale: 1.0 });
    
    // Process each text item
    for (const item of textContent.items) {
      if (!('str' in item)) continue;
      
      const str = item.str.trim();
      if (!str) continue;

      // Extract geometry and font size
      const fontSize = Math.sqrt((item.transform[0] * item.transform[0]) + (item.transform[1] * item.transform[1]));
      const x = item.transform[4];
      const y = item.transform[5];
      const width = item.width || 0;
      const height = item.height || fontSize;
      
      // Compute density metrics
      const words = str.toLowerCase().split(/\s+/).filter(w => w.length > 0);
      const wordCount = words.length;
      let stopwordCount = 0;
      
      for (const w of words) {
        if (STOPWORDS.has(w)) stopwordCount++;
      }
      
      globalWordCount += wordCount;
      globalStopwordCount += stopwordCount;

      let type: SuspiciousSegment['type'] | null = null;
      let notes = '';
      let stopword_ratio: number | undefined = undefined;
      let char_density: number | undefined = undefined;

      // 1. Spatial Anomaly (Character Density)
      const area = width * height;
      if (area > 0) {
        char_density = str.length / area;
        if (char_density > 5.0 && str.length > 20) {
          type = 'spatial_anomaly';
          notes = `Mathematically impossible text density (${char_density.toFixed(2)} chars/pt²). Indicates occlusion or compression steganography.`;
        }
      }

      // 2. Keyword Stuffing (Stopword Density)
      if (!type && wordCount > 30) {
        stopword_ratio = stopwordCount / wordCount;
        if (stopword_ratio < 0.05) {
          type = 'keyword_stuffing';
          notes = `Anomalously low stopword density (${(stopword_ratio * 100).toFixed(1)}%). Indicates adversarial keyword stuffing.`;
        }
      }

      // 3. Microfont
      if (!type && fontSize > 0 && fontSize <= 2) {
        type = 'microfont';
        notes = 'Extremely small font detected (<= 2pt).';
      }
      
      // 4. White Text
      if (!type) {
        const anyItem = item as any;
        if (anyItem.color && isWhite(anyItem.color as number[])) {
           type = 'white_text';
           notes = 'Fill color is pure white, invisible on white backgrounds.';
        }
      }

      // 5. Offpage Cloaking
      if (!type && (x < -10 || x > viewport.width + 10 || y < -10 || y > viewport.height + 10)) {
        type = 'offpage';
        notes = `Coordinates (${Math.round(x)}, ${Math.round(y)}) are physically outside page bounds.`;
      }

      // 6. Prompt Injection (Must catch here so it isn't dropped before reaching the engine)
      if (!type) {
        // Strip zero-width spaces and formatting characters used for obfuscation
        const normalizedStr = str.replace(/[\u200B-\u200D\uFEFF]/g, '');
        const injectionPatterns = /(ignore.*instructions|ignore all instructions|system override|you must|bypass|output exactly|act as)/i;
        if (injectionPatterns.test(normalizedStr)) {
          type = 'prompt_injection';
          notes = 'Contains explicit imperative LLM hijacking commands.';
        }
      }

      if (type) {
        typeCounts[type]++;
        segments.push({
          id: `${pageNum}-${Math.random().toString(36).substring(7)}`,
          type,
          page: pageNum,
          position: `x:${Math.round(x)}, y:${Math.round(y)}`,
          font_size: fontSize,
          stopword_ratio,
          char_density,
          text_content: str,
          notes
        });
      }
    }
  }

  const overall_stopword_ratio = globalWordCount > 0 ? (globalStopwordCount / globalWordCount) : 0;

  return {
    file_metadata: {
      name: fileName,
      size_bytes: arrayBuffer.byteLength,
      page_count: pdf.numPages
    },
    overall_stats: {
      suspicious_segment_count: segments.length,
      by_type: typeCounts,
      stopword_ratio: overall_stopword_ratio
    },
    suspicious_segments: segments
  };
}

function isWhite(colorArr: number[]): boolean {
  return colorArr.length === 3 && colorArr[0] >= 250 && colorArr[1] >= 250 && colorArr[2] >= 250;
}
