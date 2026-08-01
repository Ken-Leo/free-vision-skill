export type ProviderKind = "openai" | "cohere";
export type Region = "cn" | "global";
export type VisionMode = "ocr" | "error" | "ui" | "chart" | "general";

export interface ProviderConfig {
  id: string;
  name: string;
  region: Region;
  kind: ProviderKind;
  baseUrl: string;
  baseUrlEnv?: string;
  apiKeyEnv: string;
  models: string[];
  defaultModel: string;
  modelEnv?: string;
  free: string;
  supportsDetail: boolean;
  priority: number;
  notes: string;
  authPrefix?: string; // Optional auth prefix (default: "Bearer ")
}

export interface Registry {
  version: number;
  verifiedAt: string;
  providers: ProviderConfig[];
}

export interface VisionResult {
  provider: string;
  model: string;
  mode: VisionMode;
  answer?: string;
  text?: string;
  summary?: string;
  objects?: string[];
  issues?: string[];
  values?: string[];
  confidence?: number;
  raw: string;
  cached: boolean;
}

export interface CliArgs {
  [key: string]: string | boolean;
}
