import BaseTool from "./BaseTool";
import type { ToolContext } from "./BaseTool";
import type { ToolResult } from "../types";

export default class ExportTool extends BaseTool {
  name = "export";
  description = "Export dataset to Excel, CSV, or JSON format";

  execute(context: ToolContext): ToolResult {
    const { dataset, params } = context;
    if (!dataset) return this.failure("No dataset available to export.");

    const format = params?.format || "excel";
    const fileName = params?.fileName || `${dataset.metadata.fileName.replace(/\.[^.]+$/, "")}_export.${format === "excel" ? "xlsx" : format}`;

    // Build export data
    const exportData = {
      headers: dataset.headers,
      rows: dataset.rows,
      fileName,
      format,
    };

    return this.success(
      `Export prepared: ${fileName} (${dataset.rows.length} rows, ${dataset.headers.length} columns)`,
      undefined,
      { exportData }
    );
  }
}