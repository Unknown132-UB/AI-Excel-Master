export interface Worksheet {
  id: string;
  name: string;
  data: any[];
}

export interface Workbook {
  id: string;
  name: string;
  sheets: Worksheet[];
  activeSheet: string;
}

export type DataType =
  | "string"
  | "integer"
  | "decimal"
  | "boolean"
  | "date"
  | "time"
  | "datetime"
  | "mixed";

export interface ColumnProperty {
  /** Logical data type of the column */
  type: DataType;
  /** Display/output format based on type (e.g. DD-MM-YYYY, HH:MM, etc) */
  format: string | null;
}

export type ColumnProperties = Record<string, ColumnProperty>;

export type ViewMode = "table" | "cards" | "striped" | "bordered" | "compact" | "dark";
export type ThemeColor = "blue" | "green" | "purple" | "orange" | "red" | "teal";

export interface DesignSettings {
  viewMode: ViewMode;
  theme: ThemeColor;
  fontSize: number;
  maxRows: number;
  showRowNumbers: boolean;
  showHeader: boolean;
}