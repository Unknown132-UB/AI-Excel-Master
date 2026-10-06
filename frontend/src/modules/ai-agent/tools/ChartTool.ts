import BaseTool from "./BaseTool";
import type { ToolContext } from "./BaseTool";
import type { ToolResult, ChartConfig } from "../types";

export default class ChartTool extends BaseTool {
  name = "chart";
  description = "Generate charts and visualizations from dataset";

  execute(context: ToolContext): ToolResult {
    const { dataset, params } = context;
    if (!dataset) return this.failure("No dataset available to generate charts.");

    const chartType = params?.chartType || this.detectBestChartType(dataset);
    const columnName = params?.column;
    const colIndex = this.findColumnIndex(dataset.headers, columnName);

    const chartConfig = this.buildChartConfig(dataset, chartType, colIndex);

    return this.success(
      `Generated ${chartType} chart: ${chartConfig.title}`,
      undefined,
      { chartConfig }
    );
  }

  private detectBestChartType(dataset: any): string {
    const headers = dataset.headers;
    const rows = dataset.rows;

    // Check for date column
    const dateCol = headers.findIndex((h: string) => /(date|time|day|month|year)/i.test(h));
    if (dateCol >= 0) return "line";

    // Check for categorical + numeric
    const numericCols = headers.map((h: string, idx: number) => {
      const values = rows.map((r: any[]) => Number(r[idx])).filter((v: number) => !isNaN(v));
      return { name: h, index: idx, count: values.length };
    }).filter((c: any) => c.count > rows.length * 0.5);

    if (numericCols.length >= 2) return "scatter";
    if (numericCols.length === 1) return "bar";

    // Check for categorical distribution
    const catCol = headers.findIndex((h: string) => {
      const values = new Set(rows.map((r: any[]) => String(r[headers.indexOf(h)])));
      return values.size > 1 && values.size <= 10;
    });
    if (catCol >= 0) return "pie";

    return "bar";
  }

  private buildChartConfig(dataset: any, chartType: string, colIndex: number): ChartConfig {
    const headers = dataset.headers;
    const rows = dataset.rows;

    // Find numeric columns
    const numericCols = headers.map((h: string, idx: number) => {
      const values = rows.map((r: any[]) => Number(r[idx])).filter((v: number) => !isNaN(v));
      return { name: h, index: idx, values };
    }).filter((c: any) => c.values.length > 0);

    // Find categorical column
    const catCol = headers.findIndex((h: string) => {
      const values = new Set(rows.map((r: any[]) => String(r[headers.indexOf(h)])));
      return values.size > 1 && values.size <= 20;
    });

    // Find date column
    const dateCol = headers.findIndex((h: string) => /(date|time|day|month|year)/i.test(h));

    let title = `${headers[0] || "Data"} Analysis`;
    let xAxis: string | undefined;
    let yAxis: string | undefined;
    let columns: string[] = [];

    switch (chartType) {
      case "line":
        if (dateCol >= 0 && numericCols.length > 0) {
          xAxis = headers[dateCol];
          yAxis = numericCols[0].name;
          columns = [xAxis, yAxis].filter((c): c is string => !!c);
          title = `${yAxis} over ${xAxis}`;
        } else if (numericCols.length > 0) {
          yAxis = numericCols[0].name;
          columns = [yAxis].filter((c): c is string => !!c);
          title = `${yAxis} Trend`;
        }
        break;

      case "bar":
        if (catCol >= 0 && numericCols.length > 0) {
          xAxis = headers[catCol];
          yAxis = numericCols[0].name;
          columns = [xAxis, yAxis].filter((c): c is string => !!c);
          title = `${yAxis} by ${xAxis}`;
        } else if (numericCols.length > 0) {
          yAxis = numericCols[0].name;
          columns = [yAxis].filter((c): c is string => !!c);
          title = `${yAxis} Distribution`;
        }
        break;

      case "pie":
        if (catCol >= 0) {
          xAxis = headers[catCol];
          columns = [xAxis].filter((c): c is string => !!c);
          title = `${xAxis} Distribution`;
        }
        break;

      case "scatter":
        if (numericCols.length >= 2) {
          xAxis = numericCols[0].name;
          yAxis = numericCols[1].name;
          columns = [xAxis, yAxis].filter((c): c is string => !!c);
          title = `${xAxis} vs ${yAxis}`;
        }
        break;

      case "histogram":
        if (numericCols.length > 0) {
          yAxis = numericCols[0].name;
          columns = [yAxis].filter((c): c is string => !!c);
          title = `${yAxis} Distribution`;
        }
        break;

      case "area":
        if (dateCol >= 0 && numericCols.length > 0) {
          xAxis = headers[dateCol];
          yAxis = numericCols[0].name;
          columns = [xAxis, yAxis].filter((c): c is string => !!c);
          title = `${yAxis} Area Chart`;
        } else if (numericCols.length > 0) {
          yAxis = numericCols[0].name;
          columns = [yAxis].filter((c): c is string => !!c);
          title = `${yAxis} Area`;
        }
        break;

      case "radar":
        if (numericCols.length > 0) {
          columns = numericCols.slice(0, 5).map((c: any) => c.name);
          title = "Multi-metric Comparison";
        }
        break;

      default:
        if (numericCols.length > 0) {
          yAxis = numericCols[0].name;
          columns = [yAxis].filter((c): c is string => !!c);
          title = `${yAxis} Chart`;
        }
    }

    // If specific column requested
    if (colIndex >= 0) {
      const colName = headers[colIndex];
      if (numericCols.some((c: any) => c.index === colIndex)) {
        yAxis = colName;
        columns = [colName];
        title = `${colName} Chart`;
      } else {
        xAxis = colName;
        columns = [colName];
        title = `${colName} Distribution`;
      }
    }

    return {
      type: chartType as ChartConfig["type"],
      title,
      xAxis,
      yAxis,
      columns,
      data: rows,
      options: {
        colors: ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"],
        showLegend: true,
        showGrid: true,
      },
    };
  }
}