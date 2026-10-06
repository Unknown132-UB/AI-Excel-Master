import type { AgentPlan, AgentStep, IntentAnalysis, ToolName } from "./types";
import type { Dataset } from "../../types/dataset";
import DataQualityAnalyzer from "../quality/DataQualityAnalyzer";

export default class AgentPlanner {
  private analyzer: DataQualityAnalyzer;

  constructor() {
    this.analyzer = new DataQualityAnalyzer();
  }

  createPlan(intent: IntentAnalysis, dataset: Dataset | null): AgentPlan {
    const steps: AgentStep[] = [];
    const entities = intent.entities;
    const input = intent.rawInput.toLowerCase();

    switch (intent.intent) {
      case "clean_data":
        steps.push(...this.planCleaning(input, dataset));
        break;

      case "transform_data":
        steps.push(...this.planTransform(input, dataset));
        break;

      case "analyze_data":
        steps.push(...this.planAnalysis(dataset));
        break;

      case "generate_chart":
        steps.push(...this.planCharts(input, dataset));
        break;

      case "generate_report":
        steps.push(...this.planReport(dataset));
        break;

      case "export_data":
        steps.push(...this.planExport(input, dataset));
        break;

      case "import_data":
        steps.push(this.createStep("import_data", "Import data from source"));
        break;

      case "web_search":
        steps.push(this.createStep("web_search", "Search the web for data"));
        break;

      case "extract_pdf":
        steps.push(this.createStep("extract_pdf", "Extract data from PDF"));
        break;

      case "extract_image":
        steps.push(this.createStep("extract_image", "Extract data from image"));
        break;

      case "create_column":
        steps.push(...this.planCreateColumn(input, dataset));
        break;

      case "filter_data":
        steps.push(...this.planFilter(input, dataset));
        break;

      case "sort_data":
        steps.push(...this.planSort(input, dataset));
        break;

      case "calculate":
        steps.push(...this.planCalculate(input, dataset));
        break;

      case "query_data":
        steps.push(...this.planQuery(input, dataset));
        break;

      case "help":
      default:
        steps.push(this.createStep("query", "Provide help and guidance"));
        break;
    }

    // Handle multi-intent (e.g., clean + analyze)
    if (entities.multiIntent && entities.secondaryIntent) {
      if (entities.secondaryIntent === "analyze_data") {
        steps.push(this.createStep("analyze", "Analyze the cleaned data"));
      } else if (entities.secondaryIntent === "generate_chart") {
        steps.push(this.createStep("generate_chart", "Generate charts from cleaned data"));
      }
    }

    return {
      intent: intent.intent,
      steps,
      confidence: intent.confidence,
      summary: this.generateSummary(intent.intent, steps.length),
    };
  }

  private planCleaning(input: string, dataset: Dataset | null): AgentStep[] {
    const steps: AgentStep[] = [];
    const report = dataset ? this.analyzer.analyze(dataset) : null;

    // Remove duplicates
    if (/(duplicate|dedupe|dedup|unique)/i.test(input) || (report && report.duplicateRows > 0)) {
      steps.push(this.createStep("remove_duplicates", "Remove duplicate rows", {
        column: this.extractColumn(input),
      }));
    }

    // Fill missing values
    if (/(fill|missing|empty|blank)/i.test(input) || (report && report.missingValues > 0)) {
      const strategy = /zero|0/.test(input) ? "zero" : /mean|average/.test(input) ? "mean" : /median/.test(input) ? "median" : "empty";
      steps.push(this.createStep("fill_missing", `Fill missing values (${strategy} strategy)`, { strategy }));
    }

    // Trim spaces
    if (/(trim|space|whitespace)/i.test(input)) {
      steps.push(this.createStep("trim_spaces", "Trim whitespace from text cells"));
    }

    // Case conversion
    if (/(uppercase|upper case|capitalize)/i.test(input)) {
      steps.push(this.createStep("uppercase", "Convert text to uppercase"));
    }
    if (/(lowercase|lower case)/i.test(input)) {
      steps.push(this.createStep("lowercase", "Convert text to lowercase"));
    }
    if (/(proper case|title case)/i.test(input)) {
      steps.push(this.createStep("proper_case", "Convert text to proper case"));
    }

    // Remove empty rows/columns
    if (/(remove empty|delete empty|drop empty)/i.test(input)) {
      steps.push(this.createStep("remove_empty_rows", "Remove empty rows"));
      steps.push(this.createStep("remove_empty_columns", "Remove empty columns"));
    }

    // If no specific cleaning mentioned, do a general clean
    if (steps.length === 0) {
      steps.push(this.createStep("remove_duplicates", "Remove duplicate rows"));
      steps.push(this.createStep("fill_missing", "Fill missing values", { strategy: "empty" }));
      steps.push(this.createStep("trim_spaces", "Trim whitespace from text cells"));
    }

    return steps;
  }

  private planTransform(input: string, _dataset: Dataset | null): AgentStep[] {
    const steps: AgentStep[] = [];
    const column = this.extractColumn(input);

    if (/(date|datetime|time)/i.test(input)) {
      const format = /dd[-/]mm/i.test(input) ? "DD-MM-YYYY" : /mm[-/]dd/i.test(input) ? "MM-DD-YYYY" : "YYYY-MM-DD";
      steps.push(this.createStep("convert_date", `Convert ${column || "date"} column to ${format}`, {
        column,
        format,
      }));
    }

    if (/(number|numeric|integer|decimal|float)/i.test(input)) {
      steps.push(this.createStep("convert_type", `Convert ${column || "column"} to numeric type`, {
        column,
        targetType: "number",
      }));
    }

    if (/(text|string|character)/i.test(input)) {
      steps.push(this.createStep("convert_type", `Convert ${column || "column"} to text type`, {
        column,
        targetType: "string",
      }));
    }

    if (steps.length === 0) {
      steps.push(this.createStep("convert_type", "Convert column data type", {
        column,
      }));
    }

    return steps;
  }

  private planAnalysis(dataset: Dataset | null): AgentStep[] {
    const steps: AgentStep[] = [];
    steps.push(this.createStep("analyze", "Analyze dataset structure and quality"));
    if (dataset) {
      const report = this.analyzer.analyze(dataset);
      if (report.duplicateRows > 0 || report.missingValues > 0) {
        steps.push(this.createStep("remove_duplicates", "Clean data before analysis"));
        steps.push(this.createStep("fill_missing", "Fill missing values before analysis"));
      }
    }
    return steps;
  }

  private planCharts(input: string, _dataset: Dataset | null): AgentStep[] {
    const steps: AgentStep[] = [];
    const chartType = this.detectChartType(input);
    steps.push(this.createStep("generate_chart", `Generate ${chartType} chart`, {
      chartType,
      column: this.extractColumn(input),
    }));
    return steps;
  }

  private planReport(_dataset: Dataset | null): AgentStep[] {
    const steps: AgentStep[] = [];
    steps.push(this.createStep("analyze", "Analyze dataset for report"));
    steps.push(this.createStep("generate_report", "Generate comprehensive report"));
    return steps;
  }

  private planExport(input: string, _dataset: Dataset | null): AgentStep[] {
    const steps: AgentStep[] = [];
    const format = /csv/i.test(input) ? "csv" : /json/i.test(input) ? "json" : /excel|xlsx/i.test(input) ? "excel" : "excel";
    steps.push(this.createStep("export", `Export data as ${format.toUpperCase()}`, { format }));
    return steps;
  }

  private planCreateColumn(input: string, _dataset: Dataset | null): AgentStep[] {
    const steps: AgentStep[] = [];
    const columnName = this.extractColumnName(input);

    if (/(profit|revenue.*cost|income.*expense)/i.test(input)) {
      steps.push(this.createStep("create_column", "Create profit column (Revenue - Cost)", {
        columnName: columnName || "Profit",
        formula: "revenue - cost",
      }));
    } else if (/(age)/i.test(input)) {
      steps.push(this.createStep("create_column", "Create age column from DOB", {
        columnName: "Age",
        formula: "dob_to_age",
      }));
    } else if (/(category|bracket|tier|band)/i.test(input)) {
      steps.push(this.createStep("create_column", "Create category column", {
        columnName: columnName || "Category",
        formula: "categorize",
      }));
    } else {
      steps.push(this.createStep("create_column", `Create ${columnName || "new"} column`, {
        columnName: columnName || "New Column",
      }));
    }

    return steps;
  }

  private planFilter(input: string, _dataset: Dataset | null): AgentStep[] {
    const steps: AgentStep[] = [];
    const column = this.extractColumn(input);
    const condition = this.extractCondition(input);

    steps.push(this.createStep("filter", `Filter data${column ? ` by ${column}` : ""}`, {
      column,
      condition,
    }));

    return steps;
  }

  private planSort(input: string, _dataset: Dataset | null): AgentStep[] {
    const steps: AgentStep[] = [];
    const column = this.extractColumn(input);
    const direction = /desc|descending|z.?a|high.?low/i.test(input) ? "desc" : "asc";

    steps.push(this.createStep("sort", `Sort data by ${column || "column"} (${direction})`, {
      column,
      direction,
    }));

    return steps;
  }

  private planCalculate(input: string, _dataset: Dataset | null): AgentStep[] {
    const steps: AgentStep[] = [];
    const operation = /average|avg|mean/i.test(input) ? "average" : /sum|total/i.test(input) ? "sum" : /count/i.test(input) ? "count" : /max|highest/i.test(input) ? "max" : /min|lowest/i.test(input) ? "min" : "sum";
    const column = this.extractColumn(input);

    steps.push(this.createStep("apply_formula", `Calculate ${operation} of ${column || "column"}`, {
      operation,
      column,
    }));

    return steps;
  }

  private planQuery(input: string, _dataset: Dataset | null): AgentStep[] {
    const steps: AgentStep[] = [];
    steps.push(this.createStep("query", "Query dataset", {
      query: input,
    }));
    return steps;
  }

  private createStep(tool: ToolName, description: string, params?: Record<string, any>): AgentStep {
    return {
      id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      tool,
      description,
      params,
      status: "pending",
    };
  }

  private extractColumn(input: string): string | undefined {
    const match = input.match(/(?:column|field|by|from|in)\s+["']?([a-zA-Z\s]+?)["']?\s*(?:column|field)?/i);
    return match?.[1]?.trim() || undefined;
  }

  private extractColumnName(input: string): string | undefined {
    const match = input.match(/(?:called|named|as|column)\s+["']?([a-zA-Z\s]+?)["']?\s*(?:column|field)?/i);
    return match?.[1]?.trim() || undefined;
  }

  private extractCondition(input: string): string | undefined {
    const match = input.match(/(?:where|if)\s+(.+)/i);
    return match?.[1]?.trim() || undefined;
  }

  private detectChartType(input: string): string {
    if (/(pie)/i.test(input)) return "pie";
    if (/(line|trend|time|over time)/i.test(input)) return "line";
    if (/(scatter|correlation|relationship)/i.test(input)) return "scatter";
    if (/(histogram|distribution|frequency)/i.test(input)) return "histogram";
    if (/(area)/i.test(input)) return "area";
    if (/(radar)/i.test(input)) return "radar";
    return "bar";
  }

  private generateSummary(intent: string, stepCount: number): string {
    const intentLabels: Record<string, string> = {
      clean_data: "Cleaning dataset",
      transform_data: "Transforming data",
      analyze_data: "Analyzing dataset",
      generate_chart: "Generating charts",
      generate_report: "Generating report",
      export_data: "Exporting data",
      import_data: "Importing data",
      web_search: "Searching web for data",
      extract_pdf: "Extracting data from PDF",
      extract_image: "Extracting data from image",
      create_column: "Creating new column",
      filter_data: "Filtering data",
      sort_data: "Sorting data",
      calculate: "Calculating values",
      query_data: "Querying data",
      help: "Providing assistance",
      unknown: "Processing request",
    };

    return `${intentLabels[intent] || "Processing request"} (${stepCount} steps)`;
  }
}