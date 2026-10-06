export interface ConditionalColumnConfig {
  columnName: string;
  sourceColumns: string[];
  condition: string;
  trueValue: string;
  falseValue: string;
}

/**
 * Engine that evaluates conditions against row data to create new columns.
 * Supports conditions like:
 * - "outtime - intime <= 5" → "Halftime" else "Fulltime"
 * - "age >= 18" → "Adult" else "Minor"
 * - "salary > 50000" → "High" else "Low"
 */
export default class ConditionalColumnEngine {
  /**
   * Add a new column to the data based on a condition.
   * @param data - 2D array with headers in first row
   * @param config - Configuration for the new column
   */
  addColumn(data: any[][], config: ConditionalColumnConfig): any[][] {
    if (!data || data.length === 0) {
      return data;
    }

    const headers = data[0];
    const rows = data.slice(1);

    // Find column indices for source columns
    const colIndices: Record<string, number> = {};
    config.sourceColumns.forEach((colName) => {
      const idx = headers.findIndex(
        (h: any) => String(h).toLowerCase() === colName.toLowerCase()
      );
      if (idx >= 0) {
        colIndices[colName] = idx;
      }
    });

    // Build new headers
    const newHeaders = [...headers, config.columnName];

    // Process each row
    const newRows = rows.map((row: any[]) => {
      const context: Record<string, any> = {};
      Object.entries(colIndices).forEach(([name, idx]) => {
        context[name] = row[idx];
      });

      const result = this.evaluateCondition(config.condition, context);
      return [...row, result ? config.trueValue : config.falseValue];
    });

    return [newHeaders, ...newRows];
  }

  /**
   * Evaluate a condition expression against a context of column values.
   * Supports: >, <, >=, <=, ==, !=, &&, ||, and parentheses
   */
  private evaluateCondition(condition: string, context: Record<string, any>): boolean {
    try {
      // Replace column names with their values
      let expr = condition;

      // Replace column references with actual values
      Object.entries(context).forEach(([name, value]) => {
        const regex = new RegExp(`\\b${name}\\b`, "gi");
        const numericValue = this.toNumber(value);
        expr = expr.replace(regex, String(numericValue));
      });

      // Handle string comparisons
      Object.entries(context).forEach(([name, value]) => {
        if (typeof value === "string" && isNaN(Number(value))) {
          const regex = new RegExp(`\\b${name}\\b`, "gi");
          expr = expr.replace(regex, `"${value}"`);
        }
      });

      // Evaluate the expression safely
      // eslint-disable-next-line no-new-func
      const result = new Function(`return (${expr})`)();
      return Boolean(result);
    } catch (error) {
      console.error("Condition evaluation error:", error);
      return false;
    }
  }

  private toNumber(value: any): number {
    if (value === null || value === undefined || value === "") return 0;
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Parse a natural language condition into a structured config.
   * Example: "if outtime - intime <= 5 then Halftime else Fulltime"
   */
  parseNaturalLanguage(text: string, headers: string[]): ConditionalColumnConfig | null {
    // Extract column name (after "add column" or "create column")
    let columnName = "Result";
    const colMatch = text.match(/(?:add|create)\s+column\s+["']?([^"'\n]+?)["']?\s*(?:with|based|if|when|where|using|on)/i);
    if (colMatch) {
      columnName = colMatch[1].trim();
    }

    // Extract condition (between "if/when/where" and "then")
    let condition = "";
    const condMatch = text.match(/(?:if|when|where|condition\s*:?)\s*(.+?)\s*(?:then|print|output|=>|→)/i);
    if (condMatch) {
      condition = condMatch[1].trim();
    }

    // Extract true value (after "then/print" and before "else")
    let trueValue = "True";
    const trueMatch = text.match(/(?:then|print|output)\s*["']?([^"'\n]+?)["']?\s*(?:else|otherwise|;|$)/i);
    if (trueMatch) {
      trueValue = trueMatch[1].trim();
    }

    // Extract false value (after "else")
    let falseValue = "False";
    const falseMatch = text.match(/(?:else|otherwise)\s*["']?([^"'\n]+?)["']?\s*$/i);
    if (falseMatch) {
      falseValue = falseMatch[1].trim();
    }

    // Find source columns referenced in the condition
    const sourceColumns = headers.filter((h: any) => {
      const headerStr = String(h);
      return condition.toLowerCase().includes(headerStr.toLowerCase());
    });

    if (!condition || sourceColumns.length === 0) {
      return null;
    }

    return {
      columnName,
      sourceColumns,
      condition,
      trueValue,
      falseValue,
    };
  }
}