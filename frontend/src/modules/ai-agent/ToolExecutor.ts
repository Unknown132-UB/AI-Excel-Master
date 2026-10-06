import type { AgentStep, ToolResult, ToolName } from "./types";
import type { Dataset } from "../../types/dataset";
import BaseTool from "./tools/BaseTool";
import type { ToolContext } from "./tools/BaseTool";
import DataCleanerTool from "./tools/DataCleanerTool";
import TransformTool from "./tools/TransformTool";
import FormulaTool from "./tools/FormulaTool";
import ChartTool from "./tools/ChartTool";
import ReportTool from "./tools/ReportTool";
import ExportTool from "./tools/ExportTool";
import WebSearchTool from "./tools/WebSearchTool";
import PDFExtractorTool from "./tools/PDFExtractorTool";
import OCRTool from "./tools/OCRTool";
import DataQualityAnalyzer from "../quality/DataQualityAnalyzer";

export default class ToolExecutor {
  private tools: Map<ToolName, BaseTool>;

  constructor() {
    this.tools = new Map();

    // Register all tools
    this.registerTool("remove_duplicates", new DataCleanerTool());
    this.registerTool("fill_missing", new DataCleanerTool());
    this.registerTool("trim_spaces", new DataCleanerTool());
    this.registerTool("uppercase", new DataCleanerTool());
    this.registerTool("lowercase", new DataCleanerTool());
    this.registerTool("proper_case", new DataCleanerTool());
    this.registerTool("remove_empty_rows", new DataCleanerTool());
    this.registerTool("remove_empty_columns", new DataCleanerTool());
    this.registerTool("convert_type", new TransformTool());
    this.registerTool("convert_date", new TransformTool());
    this.registerTool("create_column", new FormulaTool());
    this.registerTool("apply_formula", new FormulaTool());
    this.registerTool("filter", new FilterTool());
    this.registerTool("sort", new SortTool());
    this.registerTool("generate_chart", new ChartTool());
    this.registerTool("generate_report", new ReportTool());
    this.registerTool("export", new ExportTool());
    this.registerTool("web_search", new WebSearchTool());
    this.registerTool("extract_pdf", new PDFExtractorTool());
    this.registerTool("extract_image", new OCRTool());
    this.registerTool("analyze", new AnalyzeTool());
    this.registerTool("query", new QueryTool());
    this.registerTool("import_data", new ImportTool());
  }

  private registerTool(name: ToolName, tool: BaseTool): void {
    this.tools.set(name, tool);
  }

  async executeStep(
    step: AgentStep,
    dataset: Dataset | null
  ): Promise<ToolResult> {
    const tool = this.tools.get(step.tool);
    if (!tool) {
      return {
        success: false,
        message: `Tool "${step.tool}" not found`,
      };
    }

    const context: ToolContext = {
      dataset,
      params: step.params,
    };

    try {
      const result = await tool.execute(context);
      return result;
    } catch (error) {
      return {
        success: false,
        message: `Tool execution failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  getAvailableTools(): string[] {
    return Array.from(this.tools.keys());
  }
}

// ============================================
// Filter Tool
// ============================================
class FilterTool extends BaseTool {
  name = "filter";
  description = "Filter dataset rows based on conditions";

  execute(context: ToolContext): ToolResult {
    const { dataset, params } = context;
    if (!dataset) return this.failure("No dataset available to filter.");

    const newDataset = this.cloneDataset(dataset);
    const columnName = params?.column;
    const condition = params?.condition || "";
    const colIndex = this.findColumnIndex(newDataset.headers, columnName);

    if (colIndex < 0) {
      return this.failure(`Could not find column "${columnName || "specified"}" to filter by.`);
    }

    // Parse condition: "> 50000", "< 100", "= value", "contains text"
    const operatorMatch = condition.match(/(>=|<=|>|<|=|is|contains|not)\s*(.+)/i);
    if (!operatorMatch) {
      return this.failure(`Could not parse filter condition: "${condition}"`);
    }

    const operator = operatorMatch[1].toLowerCase();
    const value = operatorMatch[2].trim();

    const filteredRows = newDataset.rows.filter((row) => {
      const cellValue = row[colIndex];
      const cellStr = String(cellValue ?? "").toLowerCase();
      const filterValue = value.toLowerCase();

      switch (operator) {
        case ">":
          return Number(cellValue) > Number(value);
        case "<":
          return Number(cellValue) < Number(value);
        case ">=":
          return Number(cellValue) >= Number(value);
        case "<=":
          return Number(cellValue) <= Number(value);
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

    newDataset.rows = filteredRows;
    newDataset.metadata.rowCount = filteredRows.length;

    return this.success(
      `Filtered to ${filteredRows.length} rows where ${newDataset.headers[colIndex]} ${operator} ${value}`,
      newDataset
    );
  }
}

// ============================================
// Sort Tool
// ============================================
class SortTool extends BaseTool {
  name = "sort";
  description = "Sort dataset rows by a column";

  execute(context: ToolContext): ToolResult {
    const { dataset, params } = context;
    if (!dataset) return this.failure("No dataset available to sort.");

    const newDataset = this.cloneDataset(dataset);
    const columnName = params?.column;
    const direction = params?.direction || "asc";
    const colIndex = this.findColumnIndex(newDataset.headers, columnName);

    if (colIndex < 0) {
      return this.failure(`Could not find column "${columnName || "specified"}" to sort by.`);
    }

    newDataset.rows.sort((a, b) => {
      const aVal = a[colIndex];
      const bVal = b[colIndex];
      if (aVal === bVal) return 0;
      const comparison = aVal > bVal ? 1 : -1;
      return direction === "asc" ? comparison : -comparison;
    });

    return this.success(
      `Sorted data by "${newDataset.headers[colIndex]}" (${direction === "asc" ? "ascending" : "descending"})`,
      newDataset
    );
  }
}

// ============================================
// Analyze Tool
// ============================================
class AnalyzeTool extends BaseTool {
  name = "analyze";
  description = "Analyze dataset structure, quality, and generate insights";

  private analyzer: DataQualityAnalyzer;

  constructor() {
    super();
    this.analyzer = new DataQualityAnalyzer();
  }

  execute(context: ToolContext): ToolResult {
    const { dataset } = context;
    if (!dataset) return this.failure("No dataset available to analyze.");

    const report = this.analyzer.analyze(dataset);

    let message = `📊 Data Analysis\n\n`;
    message += `Dataset: ${dataset.metadata.fileName}\n`;
    message += `Rows: ${report.totalRows} | Columns: ${report.totalColumns}\n`;
    message += `Quality Score: ${report.score}/100\n\n`;

    message += `Column Types:\n`;
    report.columnProfiles.forEach((col) => {
      message += `• ${col.name}: ${col.dataType} (${col.confidence}% confidence)\n`;
    });

    message += `\nIssues Found:\n`;
    if (report.issues.length === 0) {
      message += `• No issues found ✅\n`;
    } else {
      report.issues.slice(0, 10).forEach((issue) => {
        message += `• [${issue.severity.toUpperCase()}] ${issue.message}\n`;
      });
    }

    return this.success(message, undefined, {
      queryResult: {
        report,
        columnProfiles: report.columnProfiles,
        detectedColumns: report.detectedColumns,
      },
    });
  }
}

// ============================================
// Query Tool
// ============================================
class QueryTool extends BaseTool {
  name = "query";
  description = "Query dataset and return results";

  execute(context: ToolContext): ToolResult {
    const { dataset, params } = context;
    if (!dataset) return this.failure("No dataset available to query.");

    const query = params?.query || "";
    const lower = query.toLowerCase();

    // Find relevant columns
    const headers = dataset.headers;
    const rows = dataset.rows;

    // Detect what to query
    const nameCol = headers.findIndex((h) => /(name|employee|person|customer)/i.test(h));
    const statusCol = headers.findIndex((h) => /(status|attendance|present|absent|late)/i.test(h));
    const dateCol = headers.findIndex((h) => /(date|day)/i.test(h));
    const salaryCol = headers.findIndex((h) => /(salary|pay|amount|revenue|sales|cost)/i.test(h));

    // Filter by status
    if (/(absent|late|present)/i.test(lower) && statusCol >= 0) {
      const filterType = /absent/i.test(lower) ? "absent" : /late/i.test(lower) ? "late" : "present";
      const filtered = rows.filter((row) => {
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

      const result = filtered.slice(0, 20).map((row) => ({
        name: nameCol >= 0 ? row[nameCol] : "Unknown",
        date: dateCol >= 0 ? row[dateCol] : "",
        status: row[statusCol],
      }));

      return this.success(
        `Found ${filtered.length} ${filterType} records:\n\n${result
          .map((r) => `• ${r.name}${r.date ? ` (${r.date})` : ""}: ${r.status}`)
          .join("\n")}`,
        undefined,
        { queryResult: result }
      );
    }

    // Query by salary threshold
    if (/(more than|greater than|above|>)\s*(\d+)/i.test(lower) && salaryCol >= 0) {
      const threshold = Number(lower.match(/(?:more than|greater than|above|>)\s*(\d+)/i)?.[1] || 0);
      const filtered = rows.filter((row) => Number(row[salaryCol]) > threshold);

      const result = filtered.slice(0, 20).map((row) => ({
        name: nameCol >= 0 ? row[nameCol] : "Unknown",
        [headers[salaryCol]]: row[salaryCol],
      }));

      return this.success(
        `Found ${filtered.length} records with ${headers[salaryCol]} > ${threshold}:\n\n${result
          .map((r) => `• ${r.name}: ${r[headers[salaryCol]]}`)
          .join("\n")}`,
        undefined,
        { queryResult: result }
      );
    }

    // General query - show first rows
    const preview = rows.slice(0, 10);
    return this.success(
      `Dataset preview (${rows.length} total rows):\n\n${preview
        .map((row) => `• ${row.map((cell, i) => `${headers[i]}: ${cell}`).join(" | ")}`)
        .join("\n")}`,
      undefined,
      { queryResult: preview }
    );
  }
}

// ============================================
// Import Tool
// ============================================
class ImportTool extends BaseTool {
  name = "import_data";
  description = "Import data from file or URL";

  async execute(context: ToolContext): Promise<ToolResult> {
    const { params } = context;
    const file = params?.file as File | undefined;
    const url = params?.url as string | undefined;

    if (file) {
      // Use ImportEngine to read the file
      const ImportEngine = (await import("../import/ImportEngine")).default;
      const engine = new ImportEngine();
      try {
        const rows = await engine.import(file);
        const headers = rows[0] || [];
        const dataRows = rows.slice(1);

        const dataset = {
          headers,
          rows: dataRows,
          metadata: {
            fileName: file.name,
            fileType: file.type || "unknown",
            fileSize: file.size,
            importedAt: new Date().toISOString(),
            source: "file" as const,
            rowCount: dataRows.length,
            columnCount: headers.length,
          },
        };

        return this.success(
          `Successfully imported ${dataRows.length} rows and ${headers.length} columns from ${file.name}.`,
          dataset
        );
      } catch (error) {
        return this.failure(`Import failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    if (url) {
      const WebDataImporter = (await import("../import/WebDataImporter")).default;
      const importer = new WebDataImporter();
      try {
        const dataset = await importer.importFromUrl(url);
        return this.success(
          `Successfully imported data from ${url}: ${dataset.rows.length} rows, ${dataset.headers.length} columns.`,
          dataset
        );
      } catch (error) {
        return this.failure(`URL import failed: ${error instanceof Error ? error.message : "Unknown error"}`);
      }
    }

    return this.failure("No file or URL provided for import.");
  }
}