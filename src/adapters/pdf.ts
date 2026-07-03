import * as pdfjsLib from 'pdfjs-dist';
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import type { ScanResult, SuspiciousSegment } from '../types';

// Properly load the worker via Vite bundler instead of relying on external CDNs
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorker;

export async function scanPDFBuffer(arrayBuffer: ArrayBuffer, fileName: string): Promise<ScanResult> {
  const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) });
  const pdf = await loadingTask.promise;
  
  const segments: SuspiciousSegment[] = [];
  let whiteTextCount = 0;
  let microFontCount = 0;
  let cloakedCount = 0;

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();
    
    // Very basic heuristic scaffolding for the adapter
    for (const item of textContent.items) {
      if (!('str' in item)) continue;
      
      const str = item.str.trim();
      if (!str) continue;

      // Extract font size (approximation from transform matrix)
      const fontSize = Math.sqrt((item.transform[0] * item.transform[0]) + (item.transform[1] * item.transform[1]));
      
      // Determine potential type
      let type: SuspiciousSegment['type'] | null = null;
      let notes = '';

      if (fontSize > 0 && fontSize <= 2) {
        type = 'micro_font';
        microFontCount++;
        notes = 'Extremely small font detected (<= 2pt).';
      }
      
      // We would ideally inspect the render operations for fill color, 
      // but as a mock heuristic adapter step:
      const anyItem = item as any;
      if (anyItem.color && isWhite(anyItem.color as number[])) {
         type = 'white_text';
         whiteTextCount++;
         notes = 'Fill color is pure white, invisible on white backgrounds.';
      }

      // Check coordinates (Off-page)
      const x = item.transform[4];
      const y = item.transform[5];
      const viewport = page.getViewport({ scale: 1.0 });
      if (x < 0 || x > viewport.width || y < 0 || y > viewport.height) {
        type = 'cloaked_text';
        cloakedCount++;
        notes = `Coordinates (${Math.round(x)}, ${Math.round(y)}) are outside page bounds.`;
      }

      if (type) {
        segments.push({
          id: `${pageNum}-${Math.random().toString(36).substring(7)}`,
          type,
          page: pageNum,
          position: `x:${Math.round(x)}, y:${Math.round(y)}`,
          font_size: fontSize,
          text_content: str,
          notes
        });
      }
    }
  }

  return {
    file_metadata: {
      name: fileName,
      size_bytes: arrayBuffer.byteLength,
      page_count: pdf.numPages
    },
    overall_stats: {
      suspicious_segment_count: segments.length,
      by_type: {
        white_text: whiteTextCount,
        micro_font: microFontCount,
        cloaked_text: cloakedCount,
        other: 0
      }
    },
    suspicious_segments: segments
  };
}

function isWhite(colorArr: number[]): boolean {
  // Mock check for RGB white
  return colorArr.length === 3 && colorArr[0] >= 250 && colorArr[1] >= 250 && colorArr[2] >= 250;
}
