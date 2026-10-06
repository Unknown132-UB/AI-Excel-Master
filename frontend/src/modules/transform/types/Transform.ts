export type DataType =
  | "text"
  | "number"
  | "date"
  | "time"
  | "datetime"
  | "boolean"
  | "currency"
  | "percentage"
  | "email"
  | "phone"
  | "url"
  | "mixed";

export interface TransformOption {
  key: string;
  label: string;
  value?: any;
}

export interface TransformContext {
  row: number;
  column: string;
  value: any;
  dataType: DataType;
}

export interface TransformResult {
  success: boolean;
  value: any;
  message?: string;
}

export interface Transform {
  id: string;
  name: string;
  category: string;
  description: string;

  supportedTypes: DataType[];

  execute(
    value: any,
    context?: TransformContext,
    options?: TransformOption[]
  ): TransformResult;
}