import type { Dataset } from "./dataset";
import type { DataVersion } from "./version";

export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  dataset: Dataset;
  versions: DataVersion[];
  currentVersionId: string;
  aiCommands: string[];
  exportHistory: ExportRecord[];
}

export interface ExportRecord {
  id: string;
  format: string;
  fileName: string;
  timestamp: string;
  versionId: string;
  rowCount: number;
}