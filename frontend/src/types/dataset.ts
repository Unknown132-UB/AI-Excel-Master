export interface Dataset {
  headers: string[];
  rows: any[][];
  metadata: DatasetMetadata;
}

export interface DatasetMetadata {
  fileName: string;
  fileType: string;
  fileSize: number;
  sheetName?: string;
  importedAt: string;
  source: "file" | "web" | "paste" | "template";
  sourceUrl?: string;
  rowCount: number;
  columnCount: number;
}