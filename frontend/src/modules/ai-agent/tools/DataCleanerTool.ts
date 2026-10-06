import BaseTool from "./BaseTool";
import type { ToolContext } from "./BaseTool";
import type { ToolResult } from "../types";

export default class DataCleanerTool extends BaseTool {
  name = "data_cleaner";
  description = "Clean dataset by removing duplicates, filling missing values, trimming spaces, and normalizing text";

  execute(context: ToolContext): ToolResult {
    const { dataset, params } = context;
    if (!dataset) return this.failure("No dataset available to clean.");

    const newDataset = this.cloneDataset(dataset);
    const changes: string[] = [];
    const operations = params?.operations || ["remove_duplicates", "fill_missing", "trim_spaces"];

    // Remove duplicates
    if (operations.includes("remove_duplicates")) {
      const columnName = params?.column;
      const colIndex = this.findColumnIndex(newDataset.headers, columnName);
      const seen = new Set<string>();
      const uniqueRows: any[][] = [];
      let removed = 0;

      newDataset.rows.forEach((row) => {
        const key = colIndex >= 0 ? String(row[colIndex] ?? "") : JSON.stringify(row);
        if (seen.has(key)) {
          removed++;
        } else {
          seen.add(key);
          uniqueRows.push(row);
        }
      });

      if (removed > 0) {
        newDataset.rows = uniqueRows;
        newDataset.metadata.rowCount = uniqueRows.length;
        changes.push(`Removed ${removed} duplicate rows${colIndex >= 0 ? ` based on "${newDataset.headers[colIndex]}"` : ""}`);
      }
    }

    // Fill missing values
    if (operations.includes("fill_missing")) {
      const strategy = params?.strategy || "empty";
      let filled = 0;

      newDataset.rows.forEach((row) => {
        row.forEach((cell, idx) => {
          if (cell === "" || cell === null || cell === undefined) {
            switch (strategy) {
              case "zero":
                row[idx] = 0;
                break;
              case "mean": {
                const numericValues = newDataset.rows
                  .map((r) => Number(r[idx]))
                  .filter((v) => !isNaN(v));
                const mean = numericValues.length > 0
                  ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length
                  : 0;
                row[idx] = Math.round(mean * 100) / 100;
                break;
              }
              case "median": {
                const numericValues = newDataset.rows
                  .map((r) => Number(r[idx]))
                  .filter((v) => !isNaN(v))
                  .sort((a, b) => a - b);
                const median = numericValues.length > 0
                  ? numericValues.length % 2 === 0
                    ? (numericValues[numericValues.length / 2 - 1] + numericValues[numericValues.length / 2]) / 2
                    : numericValues[Math.floor(numericValues.length / 2)]
                  : 0;
                row[idx] = median;
                break;
              }
              default:
                row[idx] = "";
            }
            filled++;
          }
        });
      });

      if (filled > 0) {
        changes.push(`Filled ${filled} missing values using ${strategy} strategy`);
      }
    }

    // Trim spaces
    if (operations.includes("trim_spaces")) {
      let trimmed = 0;
      newDataset.rows.forEach((row) => {
        row.forEach((cell, idx) => {
          if (typeof cell === "string" && cell !== cell.trim()) {
            row[idx] = cell.trim();
            trimmed++;
          }
        });
      });
      if (trimmed > 0) {
        changes.push(`Trimmed whitespace from ${trimmed} cells`);
      }
    }

    // Uppercase
    if (operations.includes("uppercase")) {
      const colIndex = this.findColumnIndex(newDataset.headers, params?.column);
      newDataset.rows.forEach((row) => {
        if (colIndex >= 0) {
          if (typeof row[colIndex] === "string") {
            row[colIndex] = row[colIndex].toUpperCase();
          }
        } else {
          row.forEach((cell, idx) => {
            if (typeof cell === "string") row[idx] = cell.toUpperCase();
          });
        }
      });
      changes.push("Converted text to uppercase");
    }

    // Lowercase
    if (operations.includes("lowercase")) {
      const colIndex = this.findColumnIndex(newDataset.headers, params?.column);
      newDataset.rows.forEach((row) => {
        if (colIndex >= 0) {
          if (typeof row[colIndex] === "string") {
            row[colIndex] = row[colIndex].toLowerCase();
          }
        } else {
          row.forEach((cell, idx) => {
            if (typeof cell === "string") row[idx] = cell.toLowerCase();
          });
        }
      });
      changes.push("Converted text to lowercase");
    }

    // Proper case
    if (operations.includes("proper_case")) {
      const colIndex = this.findColumnIndex(newDataset.headers, params?.column);
      newDataset.rows.forEach((row) => {
        if (colIndex >= 0) {
          if (typeof row[colIndex] === "string") {
            row[colIndex] = this.toProperCase(row[colIndex]);
          }
        } else {
          row.forEach((cell, idx) => {
            if (typeof cell === "string") row[idx] = this.toProperCase(cell);
          });
        }
      });
      changes.push("Converted text to proper case");
    }

    // Remove empty rows
    if (operations.includes("remove_empty_rows")) {
      const before = newDataset.rows.length;
      newDataset.rows = newDataset.rows.filter((row) =>
        row.some((cell) => cell !== "" && cell !== null && cell !== undefined)
      );
      const removed = before - newDataset.rows.length;
      if (removed > 0) {
        newDataset.metadata.rowCount = newDataset.rows.length;
        changes.push(`Removed ${removed} empty rows`);
      }
    }

    // Remove empty columns
    if (operations.includes("remove_empty_columns")) {
      const emptyCols: number[] = [];
      newDataset.headers.forEach((_, colIdx) => {
        const isEmpty = newDataset.rows.every((row) =>
          row[colIdx] === "" || row[colIdx] === null || row[colIdx] === undefined
        );
        if (isEmpty) emptyCols.push(colIdx);
      });

      if (emptyCols.length > 0) {
        newDataset.headers = newDataset.headers.filter((_, i) => !emptyCols.includes(i));
        newDataset.rows = newDataset.rows.map((row) =>
          row.filter((_, i) => !emptyCols.includes(i))
        );
        newDataset.metadata.columnCount = newDataset.headers.length;
        changes.push(`Removed ${emptyCols.length} empty columns`);
      }
    }

    if (changes.length === 0) {
      return this.success("Dataset is already clean. No changes needed.", newDataset);
    }

    return this.success(
      `Cleaning completed:\n\n${changes.map((c) => `• ${c}`).join("\n")}`,
      newDataset,
      { metadata: { changes } }
    );
  }

  private toProperCase(text: string): string {
    return text
      .toLowerCase()
      .split(/\s+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
}