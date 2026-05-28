export type AnalysisInputKind = "text" | "url" | "file";

export type AnalyzeOptions = {
  isDeepScan?: boolean | undefined;
  isPrivateScan?: boolean | undefined;
};

export type AnalyzeTextRequest = AnalyzeOptions & {
  text: string;
};

export type AnalyzeUrlRequest = AnalyzeOptions & {
  url: string;
};

export type AnalyzeFileRequest = AnalyzeOptions & {
  filename: string;
  mimeType?: string | undefined;
  base64: string;
};

export type AnalyzePreparedFileRequest = AnalyzeOptions & {
  filename: string;
  mimeType: string;
  bytes: Buffer;
};

export type ZeroTrueErrorEnvelope = {
  error: {
    status_code?: number;
    message?: string;
  } | null;
};

export type SuspectedModel = {
  model_name: string | null;
  confidence_pct: number | null;
};

export type Segment = {
  label: string | null;
  confidence_pct: number | null;
  start_char?: number | null;
  end_char?: number | null;
  start_line?: number | null;
  end_line?: number | null;
  start_s?: number | null;
  end_s?: number | null;
  timecode?: string | null;
};

export type AnalysisResult = {
  ai_probability?: number | null;
  human_probability?: number | null;
  combined_probability?: number | null;
  result_type?: string | null;
  ml_model?: string | null;
  ml_model_version?: string | null;
  details?: Record<string, unknown> | null;
  feedback?: string | null;
  created_at?: string | null;
  status?: string | null;
  file_url?: string | null;
  original_filename?: string | null;
  size_bytes?: number | null;
  size_mb?: number | null;
  resolution?: string | null;
  length?: number | null;
  content?: string | null;
  is_private_scan?: boolean | null;
  is_deep_scan?: boolean | null;
  price?: number | null;
  inference_time_ms?: number | null;
  api_schema_version?: string | null;
  meta_mime?: string | null;
  meta_file_size_bytes?: number | null;
  meta_sha256?: string | null;
  meta_content_url?: string | null;
  meta_content_type?: string | null;
  details_summary?: Record<string, unknown> | null;
  details_extra?: Record<string, unknown> | null;
  suspected_models?: SuspectedModel[] | null;
  segments?: Segment[] | null;
  views_count?: number | null;
};

export type AnalysisResponse = ZeroTrueErrorEnvelope & {
  id: string;
  status: string;
  result?: AnalysisResult | null;
};

export type ApiInfo = {
  name: string;
  version: string;
  description: string;
  endpoints: Record<string, string>;
  supported_formats: Record<string, string[]>;
};
