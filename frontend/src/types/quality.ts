export interface ColumnProfile {
  name: string;
  index: number;
  dataType: string;
  confidence: number;
  missingCount: number;
  missingPercentage: number;
  uniqueCount: number;
  duplicateCount: number;
  min?: any;
  max?: any;
  mean?: number;
  median?: number;
  sampleValues: any[];
  detectedRole?: string;
  issues: ColumnIssue[];
}

export interface ColumnIssue {
  type: "missing" | "wrong_format" | "wrong_type" | "outlier" | "duplicate" | "inconsistent";
  severity: "low" | "medium" | "high";
  message: string;
  suggestion?: string;
}

export interface DataQualityReport {
  score: number;
  totalRows: number;
  totalColumns: number;
  missingValues: number;
  missingPercentage: number;
  duplicateRows: number;
  duplicatePercentage: number;
  columnProfiles: ColumnProfile[];
  issues: ColumnIssue[];
  suggestions: CleaningSuggestion[];
  detectedColumns: DetectedColumn[];
}

export interface CleaningSuggestion {
  id: string;
  column: string;
  issue: string;
  suggestion: string;
  action: string;
  severity: "low" | "medium" | "high";
}

export interface DetectedColumn {
  name: string;
  role: "name" | "email" | "phone" | "date" | "time" | "attendance" | "salary" | "id" | "location" | "department" | "other";
  confidence: number;
}