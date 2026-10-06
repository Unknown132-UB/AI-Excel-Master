import BaseTool from "./BaseTool";
import type { ToolContext } from "./BaseTool";
import type { ToolResult } from "../types";

export default class TransformTool extends BaseTool {
  name = "transform";
  description = "Transform data by converting types, dates, and applying transformations";

  execute(context: ToolContext): ToolResult {
    const { dataset, params } = context;
    if (!dataset) return this.failure("No dataset available to transform.");

    const newDataset = this.cloneDataset(dataset);
    const changes: string[] = [];
    const columnName = params?.column;
    const colIndex = this.findColumnIndex(newDataset.headers, columnName);

    // Convert date format
    if (params?.operation === "convert_date" || params?.targetType === "date") {
      const format = params?.format || "DD-MM-YYYY";
      const targetCol = colIndex >= 0 ? colIndex : this.findDateColumn(newDataset.headers);
      if (targetCol < 0) {
        return this.failure("No date column found to convert.");
      }

      let converted = 0;
      newDataset.rows.forEach((row) => {
        const value = String(row[targetCol] || "").trim();
        if (value) {
          const date = this.parseDate(value);
          if (date) {
            row[targetCol] = this.formatDate(date, format);
            converted++;
          }
        }
      });

      changes.push(`Converted "${newDataset.headers[targetCol]}" to ${format} format (${converted} values)`);
    }

    // Convert to number
    if (params?.targetType === "number" || params?.operation === "to_number") {
      const targetCol = colIndex >= 0 ? colIndex : this.findNumericColumn(newDataset.headers, newDataset.rows);
      if (targetCol < 0) {
        return this.failure("No suitable column found to convert to number.");
      }

      let converted = 0;
      newDataset.rows.forEach((row) => {
        const value = String(row[targetCol] || "").replace(/[$,%]/g, "").trim();
        if (value && !isNaN(Number(value))) {
          row[targetCol] = Number(value);
          converted++;
        }
      });

      changes.push(`Converted "${newDataset.headers[targetCol]}" to numeric type (${converted} values)`);
    }

    // Convert to string
    if (params?.targetType === "string" || params?.operation === "to_string") {
      const targetCol = colIndex >= 0 ? colIndex : 0;
      let converted = 0;
      newDataset.rows.forEach((row) => {
        if (row[targetCol] !== null && row[targetCol] !== undefined) {
          row[targetCol] = String(row[targetCol]);
          converted++;
        }
      });
      changes.push(`Converted "${newDataset.headers[targetCol]}" to text type (${converted} values)`);
    }

    if (changes.length === 0) {
      return this.failure("No transformation operation specified. Try: convert_date, to_number, to_string");
    }

    return this.success(
      `Transformation completed:\n\n${changes.map((c) => `• ${c}`).join("\n")}`,
      newDataset,
      { metadata: { changes } }
    );
  }

  private findDateColumn(headers: string[]): number {
    return headers.findIndex((h) => /(date|dob|birth|join|hire|day|time)/i.test(h));
  }

  private findNumericColumn(headers: string[], rows: any[][]): number {
    return headers.findIndex((_h, idx) => {
      const values = rows.slice(0, 20).map((r) => Number(String(r[idx]).replace(/[$,%]/g, "")));
      const numericCount = values.filter((v) => !isNaN(v)).length;
      return numericCount > values.length * 0.7;
    });
  }

  private parseDate(value: string): Date | null {
    if (!value) return null;

    const formats = [
      /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/,
      /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/,
      /^(\d{1,2})[-/](\d{1,2})[-/](\d{2})$/,
      /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})[ T](\d{1,2}):(\d{2})/,
    ];

    for (const format of formats) {
      const match = value.match(format);
      if (match) {
        if (format === formats[0]) {
          return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        }
        if (format === formats[1] || format === formats[2]) {
          return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
        }
        if (format === formats[3]) {
          return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]), Number(match[4]), Number(match[5]));
        }
      }
    }

    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }

  private formatDate(date: Date, format: string): string {
    const dd = String(date.getDate()).padStart(2, "0");
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yyyy = String(date.getFullYear());

    switch (format) {
      case "DD-MM-YYYY":
        return `${dd}-${mm}-${yyyy}`;
      case "MM-DD-YYYY":
        return `${mm}-${dd}-${yyyy}`;
      case "YYYY-MM-DD":
        return `${yyyy}-${mm}-${dd}`;
      default:
        return `${dd}-${mm}-${yyyy}`;
    }
  }
}