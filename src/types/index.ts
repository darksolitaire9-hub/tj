export type RiskLevel = 'no_risk' | 'low_risk' | 'medium_risk' | 'high_risk';
export type SegmentType = 'white_text' | 'micro_font' | 'cloaked_text' | 'other';

export interface SuspiciousSegment {
  id: string;
  type: SegmentType;
  page: number;
  position?: string;
  visibility_score?: number;
  font_size?: number;
  color?: string;
  z_index?: number;
  stopword_ratio?: number;
  control_phrase_score?: number;
  text_content: string;
  notes?: string;
  risk?: 'low' | 'medium' | 'high';
  explanation?: string;
  recommended_action?: string;
}

export interface FileMetadata {
  name: string;
  size_bytes: number;
  page_count: number;
}

export interface OverallStats {
  suspicious_segment_count: number;
  by_type: Record<SegmentType, number>;
  stopword_ratio?: number;
  control_phrase_score?: number;
}

export interface ScanResult {
  file_metadata: FileMetadata;
  overall_stats: OverallStats;
  suspicious_segments: SuspiciousSegment[];
  policy?: string;
}

export interface TJOutput {
  summary: string;
  risk_level: RiskLevel;
  rationale: string;
  segments: SuspiciousSegment[];
  global_recommendation: string;
  policy_notes: string;
}
