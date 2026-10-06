import BaseTool from "./BaseTool";
import type { ToolContext } from "./BaseTool";
import type { ToolResult } from "../types";

export default class FormulaTool extends BaseTool {
  name = "formula";
  description = "Apply formulas, create calculated columns, and perform calculations";

  execute(context: ToolContext): ToolResult {
    const { dataset, params } = context;
    if (!dataset) return this.failure("No dataset available for calculation.");

    const newDataset = this.cloneDataset(dataset);
    const operation = params?.operation || "sum";
    const columnName = params?.column;
    const colIndex = this.findColumnIndex(newDataset.headers, columnName);

    // Create calculated column
    if (params?.createColumn) {
      return this.createCalculatedColumn(newDataset, params);
    }

    // Find numeric columns
    const numericCols = newDataset.headers.map((h, idx) => {
      const values = newDataset.rows.map((r) => Number(r[idx])).filter((v) => !isNaN(v));
      return { name: h, index: idx, values };
    }).filter((c) => c.values.length > 0);

    if (numericCols.length === 0) {
      return this.failure("No numeric columns found to calculate.");
    }

    const targetCol = colIndex >= 0
      ? numericCols.find((c) => c.index === colIndex) || numericCols[0]
      : numericCols[0];

    let result: number;
    switch (operation) {
      case "average":
      case "avg":
      case "mean":
        result = targetCol.values.reduce((a, b) => a + b, 0) / targetCol.values.length;
        break;
      case "count":
        result = targetCol.values.length;
        break;
      case "max":
      case "highest":
        result = Math.max(...targetCol.values);
        break;
      case "min":
      case "lowest":
        result = Math.min(...targetCol.values);
        break;
      case "median": {
        const sorted = [...targetCol.values].sort((a, b) => a - b);
        result = sorted.length % 2 === 0
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
          : sorted[Math.floor(sorted.length / 2)];
        break;
      }
      case "sum":
      case "total":
      default:
        result = targetCol.values.reduce((a, b) => a + b, 0);
    }

    return this.success(
      `${operation.toUpperCase()} of ${targetCol.name}: ${Math.round(result * 100) / 100}`,
      undefined,
      {
        queryResult: { operation, column: targetCol.name, result },
      }
    );
  }

  private createCalculatedColumn(dataset: any, params: Record<string, any>): ToolResult {
    const newDataset = this.cloneDataset(dataset);
    const columnName = params.columnName || "Calculated";
    const formula = params.formula || "";

    // Profit = Revenue - Cost
    if (/(revenue|sales).*(cost|expense)/i.test(formula) || /profit/i.test(formula)) {
      const revenueCol = newDataset.headers.findIndex((h) => /(revenue|sales|income)/i.test(h));
      const costCol = newDataset.headers.findIndex((h) => /(cost|expense|spend)/i.test(h));

      if (revenueCol >= 0 && costCol >= 0) {
        newDataset.headers.push(columnName);
        newDataset.rows.forEach((row) => {
          const revenue = Number(row[revenueCol]) || 0;
          const cost = Number(row[costCol]) || 0;
          row.push(Math.round((revenue - cost) * 100) / 100);
        });
        newDataset.metadata.columnCount = newDataset.headers.length;
        return this.success(
          `Created "${columnName}" column: ${newDataset.headers[revenueCol]} - ${newDataset.headers[costCol]}`,
          newDataset
        );
      }
    }

    // Age from DOB
    if (/dob_to_age|age/i.test(formula)) {
      const dobCol = newDataset.headers.findIndex((h) => /(dob|birth|date.?of.?birth)/i.test(h));
      if (dobCol >= 0) {
        newDataset.headers.push(columnName);
        newDataset.rows.forEach((row) => {
          const dob = this.parseDate(String(row[dobCol] || ""));
          if (dob) {
            const today = new Date();
            let age = today.getFullYear() - dob.getFullYear();
            const m = today.getMonth() - dob.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
            row.push(age);
          } else {
            row.push("");
          }
        });
        newDataset.metadata.columnCount = newDataset.headers.length;
        return this.success(`Created "${columnName}" column calculated from DOB`, newDataset);
      }
    }

    // Categorize
    if (/categorize|category/i.test(formula)) {
      const salaryCol = newDataset.headers.findIndex((h) => /(salary|pay|wage|income|amount|revenue|sales)/i.test(h));
      if (salaryCol >= 0) {
        const values = newDataset.rows.map((r) => Number(r[salaryCol])).filter((v) => !isNaN(v));
        if (values.length > 0) {
          const min = Math.min(...values);
          const max = Math.max(...values);
          const range = max - min;
          const third = range / 3;

          newDataset.headers.push(columnName);
          newDataset.rows.forEach((row) => {
            const value = Number(row[salaryCol]);
            if (!isNaN(value)) {
              if (value <= min + third) row.push("Low");
              else if (value <= min + 2 * third) row.push("Medium");
              else row.push("High");
            } else {
              row.push("");
            }
          });
          newDataset.metadata.columnCount = newDataset.headers.length;
          return this.success(`Created "${columnName}" column with Low/Medium/High categories`, newDataset);
        }
      }
    }

    return this.failure(`Could not determine formula for "${formula}". Try: "revenue - cost", "dob_to_age", "categorize"`);
  }

  private parseDate(value: string): Date | null {
    if (!value) return null;
    const formats = [
      /^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/,
      /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/,
      /^(\d{1,2})[-/](\d{1,2})[-/](\d{2})$/,
    ];
    for (const format of formats) {
      const match = value.match(format);
      if (match) {
        if (format === formats[0]) {
          return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
        }
        return new Date(Number(match[3]), Number(match[2]) - 1, Number(match[1]));
      }
    }
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
  }
}