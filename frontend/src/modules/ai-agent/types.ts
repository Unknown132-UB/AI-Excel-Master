import type { Dataset } from "../../types/dataset";

// ============================================
// AI Agent Core Types
// ============================================

export type AgentIntent =
  | "clean_data"
  | "transform_data"
  | "analyze_data"
  | "generate_chart"
  | "generate_report"
  | "export_data"
  | "import_data"
  | "web_search"
  | "extract_pdf"
  | "extract_image"
  | "create_column"
  | "filter_data"
  | "sort_data"
  | "calculate"
  | "query_data"
  | "help"
  | "unknown";

export type ToolName =
  | "remove_duplicates"
  | "fill_missing"
  | "trim_spaces"
  | "uppercase"
  | "lowercase"
  | "proper_case"
  | "remove_empty_rows"
  | "remove_empty_columns"
  | "convert_type"
  | "convert_date"
  | "create_column"
  | "apply_formula"
  | "filter"
  | "sort"
  | "generate_chart"
  | "generate_report"
  | "export"
  | "web_search"
  | "extract_pdf"
  | "extract_image"
  | "import_data"
  | "analyze"
  | "query";

export interface AgentRequest {
  input: string;
  dataset?: Dataset | null;
  file?: File | null;
  url?: string;
  screenshot?: string | null;
  context?: Record<string, any>;
}

export interface AgentStep {
  id: string;
  tool: ToolName;
  description: string;
  params?: Record<string, any>;
  status: "pending" | "running" | "completed" | "failed";
  result?: any;
  error?: string;
}

export interface AgentPlan {
  intent: AgentIntent;
  steps: AgentStep[];
  confidence: number;
  summary: string;
}

export interface ToolResult {
  success: boolean;
  message: string;
  data?: Dataset;
  chartConfig?: ChartConfig;
  reportContent?: string;
  exportData?: any;
  queryResult?: any;
  metadata?: Record<string, any>;
}

export interface ChartConfig {
  type: "bar" | "line" | "pie" | "scatter" | "histogram" | "area" | "radar";
  title: string;
  xAxis?: string;
  yAxis?: string;
  columns: string[];
  data: any[][];
  options?: Record<string, any>;
}

export interface AgentExecutionResult {
  success: boolean;
  message: string;
  steps: AgentStep[];
  finalData?: Dataset;
  chartConfigs?: ChartConfig[];
  reportContent?: string;
  exportData?: any;
  queryResult?: any;
  duration: number;
}

export interface MemoryEntry {
  id: string;
  type: "operation" | "instruction" | "dataset_version" | "user_preference";
  timestamp: string;
  content: string;
  data?: any;
}

export interface AgentContext {
  dataset: Dataset | null;
  memory: MemoryEntry[];
  currentPlan: AgentPlan | null;
  executionHistory: AgentExecutionResult[];
}

export interface IntentAnalysis {
  intent: AgentIntent;
  confidence: number;
  entities: Record<string, any>;
  keywords: string[];
  rawInput: string;
}

export interface ColumnInfo {
  name: string;
  index: number;
  dataType: string;
  role: string;
  missingCount: number;
  uniqueCount: number;
  sampleValues: any[];
  isNumeric: boolean;
  isDate: boolean;
  isCategorical: boolean;
}

export interface DatasetInsight {
  type: "trend" | "anomaly" | "correlation" | "summary" | "recommendation";
  title: string;
  description: string;
  severity: "info" | "warning" | "critical" | "success";
  column?: string;
  value?: any;
}

export interface DataAnalysisResult {
  summary: string;
  insights: DatasetInsight[];
  columnAnalysis: ColumnInfo[];
  statistics: Record<string, any>;
  recommendations: string[];
}