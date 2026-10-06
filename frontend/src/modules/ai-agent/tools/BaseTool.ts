import type { Dataset } from "../../../types/dataset";
import type { ToolResult } from "../types";

export interface ToolContext {
  dataset: Dataset | null;
  params?: Record<string, any>;
}

export default abstract class BaseTool {
  abstract name: string;
  abstract description: string;

  abstract execute(context: ToolContext): Promise<ToolResult> | ToolResult;

  protected cloneDataset(dataset: Dataset): Dataset {
    return {
      headers: [...dataset.headers],
      rows: dataset.rows.map((row) => [...row]),
      metadata: { ...dataset.metadata },
    };
  }

  protected findColumnIndex(headers: string[], columnName?: string): number {
    if (!columnName) return -1;
    return headers.findIndex((h) =>
      h.toLowerCase().includes(columnName.toLowerCase())
    );
  }

  protected success(message: string, data?: Dataset, extra?: Partial<ToolResult>): ToolResult {
    return {
      success: true,
      message,
      data,
      ...extra,
    };
  }

  protected failure(message: string): ToolResult {
    return {
      success: false,
      message,
    };
  }
}