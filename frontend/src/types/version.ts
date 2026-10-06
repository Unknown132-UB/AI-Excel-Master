import type { Dataset } from "./dataset";

export interface DataVersion {
  id: string;
  versionNumber: number;
  operationName: string;
  operationType: string;
  timestamp: string;
  data: Dataset;
  description?: string;
  userAction?: string;
  changes?: VersionChange[];
}

export interface VersionChange {
  type: "added" | "removed" | "modified" | "transformed" | "cleaned";
  description: string;
  affectedRows?: number;
  affectedColumns?: string[];
}