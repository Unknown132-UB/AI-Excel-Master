import type { Dataset } from "../../types/dataset";
import type { AICommandResult, ChartRecommendation } from "../../types/ai";
import DataQualityAnalyzer from "../quality/DataQualityAnalyzer";

export default class AICommandEngine {
  private analyzer: DataQualityAnalyzer;

  constructor() {
    this.analyzer = new DataQualityAnalyzer();
  }

  async execute(
    command: string,
    dataset: Dataset
  ): Promise<AICommandResult> {
    const lower = command.toLowerCase();

    // Detect intent and execute
    if (/(remove|delete|drop).*(duplicate|dup)/i.test(lower)) {
      return this.removeDuplicates(dataset, command);
    }

    if (/(fill|replace).*(missing|empty|blank)/i.test(lower)) {
      return this.fillMissingValues(dataset, command);
    }

    if (/(convert|change|format).*(date|time)/i.test(lower)) {
      return this.convertDate(dataset, command);
    }

    if (/(create|add|generate|make).*(column|field|category|status)/i.test(lower)) {
      return this.createColumn(dataset, command);
    }

    if (/(find|detect|identify|show).*(missing|error|invalid)/i.test(lower)) {
      return this.findIssues(dataset, command);
    }

    if (/(generate|create|make).*(report|summary|analysis)/i.test(lower)) {
      return this.generateReport(dataset, command);
    }

    if (/(recommend|suggest).*(chart|graph|visual)/i.test(lower)) {
      return this.recommendCharts(dataset, command);
    }

    if (/(calculate|compute|sum|average|total|count)/i.test(lower)) {
      return this.calculateFormula(dataset, command);
    }

    if (/(analy|profile|quality|score)/i.test(lower)) {
      return this.analyzeQuality(dataset, command);
    }

    if (/(show|find|list|query|filter).*(absent|late|present|attendance)/i.test(lower)) {
      return this.queryAttendance(dataset, command);
    }

    if (/(highlight|mark|flag).*(late|absent|error|invalid)/i.test(lower)) {
      return this.highlightIssues(dataset, command);
    }

    if (/(clean|fix|repair).*(data|dataset|file)/i.test(lower)) {
      return this.autoClean(dataset, command);
    }

    if (/(sort|order|arrange)/i.test(lower)) {
      return this.sortData(dataset, command);
    }

    if (/(filter|select|extract|subset)/i.test(lower)) {
      return this.filterData(dataset, command);
    }

    // Default: provide help and suggestions
    return this.generalHelp(dataset, command);
  }

  private removeDuplicates(dataset: Dataset, command: string): AICommandResult {
    const headers = dataset.headers;
    const rows = dataset.rows;

    // Check if specific column mentioned
    const columnMatch = command.match(/(?:in|by|from)\s+["']?([a-zA-Z\s]+?)["']?\s*(?:column|field)?/i);
    const columnName = columnMatch?.[1]?.trim();
    const colIndex = columnName
      ? headers.findIndex((h) => h.toLowerCase().includes(columnName.toLowerCase()))
      : -1;

    const seen = new Set<string>();
    const newRows: any[][] = [];
    let removedCount = 0;

    rows.forEach((row) => {
      const key = colIndex >= 0
        ? String(row[colIndex] ?? "")
        : JSON.stringify(row);

      if (seen.has(key)) {
        removedCount++;
      } else {
        seen.add(key);
        newRows.push(row);
      }
    });

    const newDataset: Dataset = {
      ...dataset,
      rows: newRows,
      metadata: { ...dataset.metadata, rowCount: newRows.length },
    };

    return {
      success: true,
      message: `Removed ${removedCount} duplicate rows${colIndex >= 0 ? ` based on "${headers[colIndex]}"` : ""}. ${newRows.length} rows remaining.`,
      operation: "remove_duplicates",
      data: newDataset,
    };
  }

  private fillMissingValues(dataset: Dataset, command: string): AICommandResult {
    const headers = dataset.headers;
    const rows = dataset.rows;

    // Determine fill strategy
    const strategy = /zero|0/.test(command)
      ? "zero"
      : /mean|average/.test(command)
        ? "mean"
        : /median/.test(command)
          ? "median"
          : /previous|forward|last/.test(command)
            ? "forward"
            : "empty";

    const newRows = rows.map((row) => [...row]);
    let filledCount = 0;

    headers.forEach((_, colIndex) => {
      // Calculate mean/median for numeric columns
      const numericValues = newRows
        .map((row) => Number(row[colIndex]))
        .filter((v) => !isNaN(v));

      const mean = numericValues.length > 0
        ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length
        : 0;

      const sorted = [...numericValues].sort((a, b) => a - b);
      const median = sorted.length > 0
        ? sorted.length % 2 === 0
          ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
          : sorted[Math.floor(sorted.length / 2)]
        : 0;

      let lastValue: any = "";

      newRows.forEach((row) => {
        if (row[colIndex] === "" || row[colIndex] === null || row[colIndex] === undefined) {
          switch (strategy) {
            case "zero":
              row[colIndex] = 0;
              break;
            case "mean":
              row[colIndex] = Math.round(mean * 100) / 100;
              break;
            case "median":
              row[colIndex] = median;
              break;
            case "forward":
              row[colIndex] = lastValue;
              break;
            default:
              row[colIndex] = "";
          }
          filledCount++;
        } else {
          lastValue = row[colIndex];
        }
      });
    });

    const newDataset: Dataset = {
      ...dataset,
      rows: newRows,
      metadata: { ...dataset.metadata },
    };

    return {
      success: true,
      message: `Filled ${filledCount} missing values using ${strategy} strategy.`,
      operation: "fill_missing",
      data: newDataset,
    };
  }

  private convertDate(dataset: Dataset, command: string): AICommandResult {
    const headers = dataset.headers;
    const rows = dataset.rows;

    // Find date column
    const dateColIndex = headers.findIndex((h) =>
      /(date|dob|birth|join|hire|day)/i.test(h)
    );

    if (dateColIndex < 0) {
      return {
        success: false,
        message: "No date column found in the dataset.",
        operation: "convert_date",
      };
    }

    // Determine target format
    const format = /dd[-/]mm[-/]yyyy|dd[-/]mm[-/]yy/i.test(command)
      ? "DD-MM-YYYY"
      : /mm[-/]dd[-/]yyyy|mm[-/]dd[-/]yy/i.test(command)
        ? "MM-DD-YYYY"
        : /yyyy[-/]mm[-/]dd/i.test(command)
          ? "YYYY-MM-DD"
          : "DD-MM-YYYY";

    const newRows = rows.map((row) => {
      const newRow = [...row];
      const value = String(row[dateColIndex] || "").trim();
      if (value) {
        const date = this.parseDate(value);
        if (date) {
          newRow[dateColIndex] = this.formatDate(date, format);
        }
      }
      return newRow;
    });

    const newDataset: Dataset = {
      ...dataset,
      rows: newRows,
      metadata: { ...dataset.metadata },
    };

    return {
      success: true,
      message: `Converted "${headers[dateColIndex]}" column to ${format} format.`,
      operation: "convert_date",
      data: newDataset,
    };
  }

  private createColumn(dataset: Dataset, command: string): AICommandResult {
    // Detect what kind of column to create
    if (/(attendance|status|present|absent|late)/i.test(command)) {
      return this.createAttendanceColumn(dataset, command);
    }

    if (/(age)/i.test(command)) {
      return this.createAgeColumn(dataset, command);
    }

    if (/(salary|category|bracket|tier|band)/i.test(command)) {
      return this.createSalaryCategory(dataset, command);
    }

    if (/(working|hours|duration|time)/i.test(command)) {
      return this.createWorkingHours(dataset, command);
    }

    return {
      success: false,
      message: "Could not determine what column to create. Try: 'Create attendance status column', 'Create age column from DOB', 'Create salary category column'",
      operation: "create_column",
    };
  }

  private createAttendanceColumn(dataset: Dataset, _command: string): AICommandResult {
    const headers = dataset.headers;
    const rows = dataset.rows;

    // Find relevant columns
    const statusCol = headers.findIndex((h) => /(status|attendance|present|absent)/i.test(h));
    const inCol = headers.findIndex((h) => /(punch.?in|clock.?in|in.?time|login)/i.test(h));
    const outCol = headers.findIndex((h) => /(punch.?out|clock.?out|out.?time|logout)/i.test(h));

    const newHeaders = [...headers, "Attendance Status"];
    const newRows = rows.map((row) => {
      const newRow = [...row];

      if (statusCol >= 0) {
        const status = String(row[statusCol] || "").toLowerCase();
        if (/(present|p|yes|1|true)/i.test(status)) {
          newRow.push("Present");
        } else if (/(absent|a|no|0|false)/i.test(status)) {
          newRow.push("Absent");
        } else if (/(late|l)/i.test(status)) {
          newRow.push("Late");
        } else {
          newRow.push("Unknown");
        }
      } else if (inCol >= 0 && outCol >= 0) {
        const inTime = String(row[inCol] || "");
        const outTime = String(row[outCol] || "");
        if (inTime && outTime) {
          newRow.push("Present");
        } else if (inTime || outTime) {
          newRow.push("Partial");
        } else {
          newRow.push("Absent");
        }
      } else {
        newRow.push("Unknown");
      }

      return newRow;
    });

    const newDataset: Dataset = {
      headers: newHeaders,
      rows: newRows,
      metadata: { ...dataset.metadata, columnCount: newHeaders.length },
    };

    return {
      success: true,
      message: "Created 'Attendance Status' column with Present/Absent/Late values.",
      operation: "create_attendance_column",
      data: newDataset,
    };
  }

  private createAgeColumn(dataset: Dataset, _command: string): AICommandResult {
    const headers = dataset.headers;
    const rows = dataset.rows;

    const dobCol = headers.findIndex((h) => /(dob|birth|date.?of.?birth)/i.test(h));
    if (dobCol < 0) {
      return {
        success: false,
        message: "No DOB/Birth date column found. Cannot create age column.",
        operation: "create_age_column",
      };
    }

    const newHeaders = [...headers, "Age"];
    const newRows = rows.map((row) => {
      const newRow = [...row];
      const dob = this.parseDate(String(row[dobCol] || ""));
      if (dob) {
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const m = today.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
          age--;
        }
        newRow.push(age);
      } else {
        newRow.push("");
      }
      return newRow;
    });

    const newDataset: Dataset = {
      headers: newHeaders,
      rows: newRows,
      metadata: { ...dataset.metadata, columnCount: newHeaders.length },
    };

    return {
      success: true,
      message: "Created 'Age' column calculated from DOB.",
      operation: "create_age_column",
      data: newDataset,
    };
  }

  private createSalaryCategory(dataset: Dataset, _command: string): AICommandResult {
    const headers = dataset.headers;
    const rows = dataset.rows;

    const salaryCol = headers.findIndex((h) => /(salary|pay|wage|income|amount)/i.test(h));
    if (salaryCol < 0) {
      return {
        success: false,
        message: "No salary column found. Cannot create salary category.",
        operation: "create_salary_category",
      };
    }

    const salaries = rows
      .map((row) => Number(row[salaryCol]))
      .filter((v) => !isNaN(v));

    if (salaries.length === 0) {
      return {
        success: false,
        message: "No numeric salary values found.",
        operation: "create_salary_category",
      };
    }

    const min = Math.min(...salaries);
    const max = Math.max(...salaries);
    const range = max - min;
    const third = range / 3;

    const newHeaders = [...headers, "Salary Category"];
    const newRows = rows.map((row) => {
      const newRow = [...row];
      const salary = Number(row[salaryCol]);
      if (!isNaN(salary)) {
        if (salary <= min + third) newRow.push("Low");
        else if (salary <= min + 2 * third) newRow.push("Medium");
        else newRow.push("High");
      } else {
        newRow.push("");
      }
      return newRow;
    });

    const newDataset: Dataset = {
      headers: newHeaders,
      rows: newRows,
      metadata: { ...dataset.metadata, columnCount: newHeaders.length },
    };

    return {
      success: true,
      message: "Created 'Salary Category' column (Low/Medium/High).",
      operation: "create_salary_category",
      data: newDataset,
    };
  }

  private createWorkingHours(dataset: Dataset, _command: string): AICommandResult {
    const headers = dataset.headers;
    const rows = dataset.rows;

    const inCol = headers.findIndex((h) => /(punch.?in|clock.?in|in.?time|login|start)/i.test(h));
    const outCol = headers.findIndex((h) => /(punch.?out|clock.?out|out.?time|logout|end)/i.test(h));

    if (inCol < 0 || outCol < 0) {
      return {
        success: false,
        message: "No punch in/out time columns found. Cannot calculate working hours.",
        operation: "create_working_hours",
      };
    }

    const newHeaders = [...headers, "Working Hours"];
    const newRows = rows.map((row) => {
      const newRow = [...row];
      const inTime = this.parseTime(String(row[inCol] || ""));
      const outTime = this.parseTime(String(row[outCol] || ""));

      if (inTime !== null && outTime !== null) {
        const hours = (outTime - inTime) / 3600000;
        newRow.push(Math.round(hours * 100) / 100);
      } else {
        newRow.push("");
      }
      return newRow;
    });

    const newDataset: Dataset = {
      headers: newHeaders,
      rows: newRows,
      metadata: { ...dataset.metadata, columnCount: newHeaders.length },
    };

    return {
      success: true,
      message: "Created 'Working Hours' column calculated from punch in/out times.",
      operation: "create_working_hours",
      data: newDataset,
    };
  }

  private findIssues(dataset: Dataset, _command: string): AICommandResult {
    const report = this.analyzer.analyze(dataset);

    const issues = report.issues.filter((issue) =>
      /(missing|error|invalid|wrong|incorrect)/i.test(issue.message)
    );

    return {
      success: true,
      message: `Found ${issues.length} data issues:\n\n${issues
        .slice(0, 10)
        .map((i) => `• ${i.message}`)
        .join("\n")}`,
      operation: "find_issues",
      suggestions: issues,
    };
  }

  private generateReport(dataset: Dataset, _command: string): AICommandResult {
    const report = this.analyzer.analyze(dataset);

    let message = `📊 Data Report\n\n`;
    message += `Dataset: ${dataset.metadata.fileName}\n`;
    message += `Rows: ${report.totalRows} | Columns: ${report.totalColumns}\n`;
    message += `Quality Score: ${report.score}%\n\n`;
    message += `Data Quality:\n`;
    message += `• Missing values: ${report.missingValues} (${report.missingPercentage}%)\n`;
    message += `• Duplicate rows: ${report.duplicateRows} (${report.duplicatePercentage}%)\n\n`;
    message += `Column Analysis:\n`;
    report.columnProfiles.forEach((col) => {
      message += `• ${col.name}: ${col.dataType} (${col.confidence}% confidence)\n`;
    });

    return {
      success: true,
      message,
      operation: "generate_report",
      suggestions: report.suggestions,
    };
  }

  private recommendCharts(dataset: Dataset, _command: string): AICommandResult {
    const report = this.analyzer.analyze(dataset);
    const recommendations: ChartRecommendation[] = [];

    const numericCols = report.columnProfiles.filter(
      (c) => c.dataType === "integer" || c.dataType === "decimal"
    );
    const categoricalCols = report.columnProfiles.filter(
      (c) => c.dataType === "string" || c.dataType === "boolean"
    );
    const dateCols = report.columnProfiles.filter(
      (c) => c.dataType === "date" || c.dataType === "datetime"
    );

    if (numericCols.length > 0) {
      recommendations.push({
        type: "bar",
        title: `${numericCols[0].name} Distribution`,
        description: `Bar chart showing distribution of ${numericCols[0].name}`,
        columns: [numericCols[0].name],
      });

      if (numericCols.length > 1) {
        recommendations.push({
          type: "scatter",
          title: `${numericCols[0].name} vs ${numericCols[1].name}`,
          description: `Scatter plot comparing ${numericCols[0].name} and ${numericCols[1].name}`,
          columns: [numericCols[0].name, numericCols[1].name],
        });
      }
    }

    if (dateCols.length > 0 && numericCols.length > 0) {
      recommendations.push({
        type: "line",
        title: `${numericCols[0].name} over time`,
        description: `Line chart showing ${numericCols[0].name} trend over ${dateCols[0].name}`,
        columns: [dateCols[0].name, numericCols[0].name],
      });
    }

    if (categoricalCols.length > 0) {
      recommendations.push({
        type: "pie",
        title: `${categoricalCols[0].name} Distribution`,
        description: `Pie chart showing distribution of ${categoricalCols[0].name}`,
        columns: [categoricalCols[0].name],
      });
    }

    return {
      success: true,
      message: `Recommended ${recommendations.length} charts:\n\n${recommendations
        .map((r, i) => `${i + 1}. ${r.title}\n   ${r.description}`)
        .join("\n")}`,
      operation: "recommend_charts",
      chartRecommendations: recommendations,
    };
  }

  private calculateFormula(dataset: Dataset, command: string): AICommandResult {
    const headers = dataset.headers;
    const rows = dataset.rows;

    // Find numeric columns
    const numericCols = headers.map((h, i) => {
      const values = rows.map((r) => Number(r[i])).filter((v) => !isNaN(v));
      return { name: h, index: i, values };
    }).filter((c) => c.values.length > 0);

    if (numericCols.length === 0) {
      return {
        success: false,
        message: "No numeric columns found to calculate.",
        operation: "calculate",
      };
    }

    // Determine operation
    const operation = /average|avg|mean/i.test(command)
      ? "average"
      : /sum|total/i.test(command)
        ? "sum"
        : /count/i.test(command)
          ? "count"
          : /max|highest|maximum/i.test(command)
            ? "max"
            : /min|lowest|minimum/i.test(command)
              ? "min"
              : "sum";

    // Find target column
    const targetCol = numericCols.find((c) =>
      command.toLowerCase().includes(c.name.toLowerCase())
    ) || numericCols[0];

    let result: number;
    switch (operation) {
      case "average":
        result = targetCol.values.reduce((a, b) => a + b, 0) / targetCol.values.length;
        break;
      case "count":
        result = targetCol.values.length;
        break;
      case "max":
        result = Math.max(...targetCol.values);
        break;
      case "min":
        result = Math.min(...targetCol.values);
        break;
      default:
        result = targetCol.values.reduce((a, b) => a + b, 0);
    }

    return {
      success: true,
      message: `${operation.toUpperCase()} of ${targetCol.name}: ${Math.round(result * 100) / 100}`,
      operation: "calculate",
      queryResult: { operation, column: targetCol.name, result },
    };
  }

  private analyzeQuality(dataset: Dataset, _command: string): AICommandResult {
    const report = this.analyzer.analyze(dataset);

    let message = `📊 Data Quality Analysis\n\n`;
    message += `Quality Score: ${report.score}/100\n\n`;
    message += `Overview:\n`;
    message += `• Rows: ${report.totalRows}\n`;
    message += `• Columns: ${report.totalColumns}\n`;
    message += `• Missing values: ${report.missingValues} (${report.missingPercentage}%)\n`;
    message += `• Duplicate rows: ${report.duplicateRows} (${report.duplicatePercentage}%)\n\n`;

    if (report.issues.length > 0) {
      message += `Issues Found:\n`;
      report.issues.slice(0, 10).forEach((issue) => {
        message += `• [${issue.severity.toUpperCase()}] ${issue.message}\n`;
      });
    } else {
      message += `No issues found. Dataset looks clean! ✅\n`;
    }

    return {
      success: true,
      message,
      operation: "analyze_quality",
      suggestions: report.suggestions,
    };
  }

  private queryAttendance(dataset: Dataset, command: string): AICommandResult {
    const headers = dataset.headers;
    const rows = dataset.rows;

    // Find attendance-related columns
    const statusCol = headers.findIndex((h) => /(status|attendance|present|absent)/i.test(h));
    const nameCol = headers.findIndex((h) => /(name|employee|person)/i.test(h));
    const dateCol = headers.findIndex((h) => /(date|day)/i.test(h));

    if (statusCol < 0) {
      return {
        success: false,
        message: "No attendance status column found in the dataset.",
        operation: "query_attendance",
      };
    }

    // Determine filter
    const filterType = /absent/i.test(command)
      ? "absent"
      : /late/i.test(command)
        ? "late"
        : /present/i.test(command)
          ? "present"
          : "all";

    const filteredRows = rows.filter((row) => {
      const status = String(row[statusCol] || "").toLowerCase();
      switch (filterType) {
        case "absent":
          return /(absent|a|no|0|false)/i.test(status);
        case "late":
          return /(late|l)/i.test(status);
        case "present":
          return /(present|p|yes|1|true)/i.test(status);
        default:
          return true;
      }
    });

    const result = filteredRows.map((row) => {
      const name = nameCol >= 0 ? row[nameCol] : "Unknown";
      const date = dateCol >= 0 ? row[dateCol] : "";
      const status = row[statusCol];
      return { name, date, status };
    });

    return {
      success: true,
      message: `Found ${filteredRows.length} ${filterType} records:\n\n${result
        .slice(0, 20)
        .map((r) => `• ${r.name}${r.date ? ` (${r.date})` : ""}: ${r.status}`)
        .join("\n")}`,
      operation: "query_attendance",
      queryResult: result,
    };
  }

  private highlightIssues(dataset: Dataset, command: string): AICommandResult {
    this.analyzer.analyze(dataset);

    const issueType = /late/i.test(command)
      ? "late"
      : /absent/i.test(command)
        ? "absent"
        : /error|invalid/i.test(command)
          ? "error"
          : "all";

    const headers = dataset.headers;
    const rows = dataset.rows;

    // Find relevant columns
    const statusCol = headers.findIndex((h) => /(status|attendance|present|absent|late)/i.test(h));
    const nameCol = headers.findIndex((h) => /(name|employee|person)/i.test(h));

    const highlighted = rows.map((row, idx) => {
      let issue = "";
      if (statusCol >= 0) {
        const status = String(row[statusCol] || "").toLowerCase();
        if (issueType === "late" && /late/i.test(status)) issue = "Late";
        else if (issueType === "absent" && /absent/i.test(status)) issue = "Absent";
        else if (issueType === "error" && /(error|invalid|#)/i.test(status)) issue = "Error";
      }
      return {
        rowIndex: idx,
        name: nameCol >= 0 ? row[nameCol] : `Row ${idx + 1}`,
        issue,
      };
    }).filter((r) => r.issue);

    return {
      success: true,
      message: `Highlighted ${highlighted.length} records with ${issueType} status:\n\n${highlighted
        .slice(0, 20)
        .map((r) => `• ${r.name}: ${r.issue}`)
        .join("\n")}`,
      operation: "highlight_issues",
      queryResult: highlighted,
    };
  }

  private autoClean(dataset: Dataset, _command: string): AICommandResult {
    const report = this.analyzer.analyze(dataset);
    let newDataset = { ...dataset, rows: dataset.rows.map((r) => [...r]) };
    let changes: string[] = [];

    // Remove duplicates
    if (report.duplicateRows > 0) {
      const seen = new Set<string>();
      const newRows: any[][] = [];
      newDataset.rows.forEach((row) => {
        const key = JSON.stringify(row);
        if (!seen.has(key)) {
          seen.add(key);
          newRows.push(row);
        }
      });
      changes.push(`Removed ${report.duplicateRows} duplicate rows`);
      newDataset = { ...newDataset, rows: newRows };
    }

    // Trim whitespace
    newDataset.rows = newDataset.rows.map((row) =>
      row.map((cell) => typeof cell === "string" ? cell.trim() : cell)
    );
    changes.push("Trimmed whitespace from all text cells");

    // Fill empty cells with empty string
    newDataset.rows = newDataset.rows.map((row) =>
      row.map((cell) => cell === null || cell === undefined ? "" : cell)
    );
    changes.push("Normalized null/undefined values to empty strings");

    return {
      success: true,
      message: `Auto-cleaned dataset:\n\n${changes.map((c) => `• ${c}`).join("\n")}`,
      operation: "auto_clean",
      data: newDataset,
    };
  }

  private sortData(dataset: Dataset, command: string): AICommandResult {
    const headers = dataset.headers;
    const rows = dataset.rows;

    // Find column to sort by
    const columnMatch = command.match(/(?:by|on)\s+["']?([a-zA-Z\s]+?)["']?\s*(?:column|field)?/i);
    const columnName = columnMatch?.[1]?.trim();
    const colIndex = columnName
      ? headers.findIndex((h) => h.toLowerCase().includes(columnName.toLowerCase()))
      : -1;

    if (colIndex < 0) {
      return {
        success: false,
        message: "Could not find the column to sort by.",
        operation: "sort",
      };
    }

    const direction = /desc|descending|z.?a|high.?low/i.test(command) ? "desc" : "asc";

    const sortedRows = [...rows].sort((a, b) => {
      const aVal = a[colIndex];
      const bVal = b[colIndex];
      if (aVal === bVal) return 0;
      const comparison = aVal > bVal ? 1 : -1;
      return direction === "asc" ? comparison : -comparison;
    });

    const newDataset: Dataset = {
      ...dataset,
      rows: sortedRows,
      metadata: { ...dataset.metadata },
    };

    return {
      success: true,
      message: `Sorted data by "${headers[colIndex]}" (${direction === "asc" ? "ascending" : "descending"}).`,
      operation: "sort",
      data: newDataset,
    };
  }

  private filterData(dataset: Dataset, command: string): AICommandResult {
    const headers = dataset.headers;
    const rows = dataset.rows;

    // Find filter conditions
    const conditions: { colIndex: number; operator: string; value: string }[] = [];

    // Pattern: "where column > value" or "column is value" or "column = value"
    const patterns = [
      /(?:where|filter|select|extract)\s+["']?([a-zA-Z\s]+?)["']?\s*(>=|<=|>|<|=|is|contains|not)\s*["']?([^"']+?)["']?/i,
      /["']?([a-zA-Z\s]+?)["']?\s*(>=|<=|>|<|=|is|contains|not)\s*["']?([^"']+?)["']?/i,
    ];

    for (const pattern of patterns) {
      const match = command.match(pattern);
      if (match) {
        const colName = match[1].trim();
        const operator = match[2].toLowerCase();
        const value = match[3].trim();
        const colIndex = headers.findIndex((h) => h.toLowerCase().includes(colName.toLowerCase()));
        if (colIndex >= 0) {
          conditions.push({ colIndex, operator, value });
        }
      }
    }

    if (conditions.length === 0) {
      return {
        success: false,
        message: "Could not understand the filter. Try: 'Filter rows where Salary > 50000'",
        operation: "filter",
      };
    }

    const filteredRows = rows.filter((row) => {
      return conditions.every((cond) => {
        const cellValue = row[cond.colIndex];
        const cellStr = String(cellValue ?? "").toLowerCase();
        const filterValue = cond.value.toLowerCase();

        switch (cond.operator) {
          case ">":
            return Number(cellValue) > Number(filterValue);
          case "<":
            return Number(cellValue) < Number(filterValue);
          case ">=":
            return Number(cellValue) >= Number(filterValue);
          case "<=":
            return Number(cellValue) <= Number(filterValue);
          case "=":
          case "is":
            return cellStr === filterValue;
          case "contains":
            return cellStr.includes(filterValue);
          case "not":
            return !cellStr.includes(filterValue);
          default:
            return true;
        }
      });
    });

    const newDataset: Dataset = {
      ...dataset,
      rows: filteredRows,
      metadata: { ...dataset.metadata, rowCount: filteredRows.length },
    };

    return {
      success: true,
      message: `Filtered to ${filteredRows.length} rows matching the conditions.`,
      operation: "filter",
      data: newDataset,
    };
  }

  private generalHelp(dataset: Dataset, _command: string): AICommandResult {
    const report = this.analyzer.analyze(dataset);

    let message = `🤖 AI Data Assistant\n\n`;
    message += `I can help you with your dataset (${report.totalRows} rows, ${report.totalColumns} columns).\n\n`;
    message += `Here's what you can ask me:\n`;
    message += `• "Remove duplicate rows" - Clean duplicates\n`;
    message += `• "Fill missing values" - Handle empty cells\n`;
    message += `• "Convert date column to DD-MM-YYYY" - Format dates\n`;
    message += `• "Create attendance status column" - Add new columns\n`;
    message += `• "Create age column from DOB" - Calculate derived data\n`;
    message += `• "Find missing employee IDs" - Detect issues\n`;
    message += `• "Generate attendance report" - Create summaries\n`;
    message += `• "Recommend charts" - Get visualization ideas\n`;
    message += `• "Calculate total salary" - Run formulas\n`;
    message += `• "Show employees absent more than 5 days" - Query data\n`;
    message += `• "Sort by salary descending" - Reorder data\n`;
    message += `• "Filter rows where Salary > 50000" - Subset data\n`;
    message += `• "Clean my data" - Auto-fix common issues\n\n`;
    message += `Try one of these commands!`;

    return {
      success: true,
      message,
      operation: "help",
      suggestions: report.suggestions,
    };
  }

  private parseDate(value: string): Date | null {
    if (!value) return null;

    // Try various date formats
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

  private parseTime(value: string): number | null {
    if (!value) return null;

    // Handle "HH:MM" or "HH:MM:SS" or "HH:MM AM/PM"
    const match = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (!match) return null;

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const seconds = Number(match[3] || 0);
    const meridiem = match[4]?.toUpperCase();

    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;

    return (hours * 3600 + minutes * 60 + seconds) * 1000;
  }
}