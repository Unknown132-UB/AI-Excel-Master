import BaseTool from "./BaseTool";
import type { ToolContext } from "./BaseTool";
import type { ToolResult } from "../types";
import DataQualityAnalyzer from "../../quality/DataQualityAnalyzer";

export default class ReportTool extends BaseTool {
  name = "report";
  description = "Generate comprehensive data reports with insights and recommendations";

  private analyzer: DataQualityAnalyzer;

  constructor() {
    super();
    this.analyzer = new DataQualityAnalyzer();
  }

  execute(context: ToolContext): ToolResult {
    const { dataset } = context;
    if (!dataset) return this.failure("No dataset available to generate report.");

    const report = this.analyzer.analyze(dataset);
    const insights = this.generateInsights(dataset, report);

    let content = `📊 DATA ANALYSIS REPORT\n`;
    content += `===============================\n\n`;
    content += `File: ${dataset.metadata.fileName}\n`;
    content += `Generated: ${new Date().toLocaleString()}\n`;
    content += `Source: ${dataset.metadata.source}\n\n`;

    content += `📋 OVERVIEW\n`;
    content += `-------------------------------\n`;
    content += `• Rows: ${report.totalRows}\n`;
    content += `• Columns: ${report.totalColumns}\n`;
    content += `• Quality Score: ${report.score}/100\n`;
    content += `• Missing Values: ${report.missingValues} (${report.missingPercentage}%)\n`;
    content += `• Duplicate Rows: ${report.duplicateRows} (${report.duplicatePercentage}%)\n\n`;

    content += `📈 COLUMN ANALYSIS\n`;
    content += `-------------------------------\n`;
    report.columnProfiles.forEach((col) => {
      content += `• ${col.name}: ${col.dataType} (${col.confidence}% confidence)\n`;
      if (col.mean !== undefined) {
        content += `  Mean: ${Math.round(col.mean * 100) / 100} | Min: ${col.min} | Max: ${col.max}\n`;
      }
      if (col.missingCount > 0) {
        content += `  ⚠️ ${col.missingCount} missing values (${col.missingPercentage}%)\n`;
      }
    });

    content += `\n💡 KEY INSIGHTS\n`;
    content += `-------------------------------\n`;
    insights.forEach((insight) => {
      content += `• ${insight}\n`;
    });

    content += `\n🔍 DATA QUALITY ISSUES\n`;
    content += `-------------------------------\n`;
    if (report.issues.length === 0) {
      content += `No issues found. Dataset looks clean! ✅\n`;
    } else {
      report.issues.slice(0, 10).forEach((issue) => {
        content += `• [${issue.severity.toUpperCase()}] ${issue.message}\n`;
      });
    }

    content += `\n📋 RECOMMENDATIONS\n`;
    content += `-------------------------------\n`;
    if (report.suggestions.length === 0) {
      content += `No recommendations needed.\n`;
    } else {
      report.suggestions.slice(0, 10).forEach((s) => {
        content += `• ${s.suggestion}\n`;
      });
    }

    return this.success(
      "Report generated successfully",
      undefined,
      { reportContent: content }
    );
  }

  private generateInsights(dataset: any, report: any): string[] {
    const insights: string[] = [];
    const headers = dataset.headers;
    const rows = dataset.rows;

    // Find numeric columns and analyze trends
    const numericCols = headers.map((h: string, idx: number) => {
      const values = rows.map((r: any[]) => Number(r[idx])).filter((v: number) => !isNaN(v));
      return { name: h, index: idx, values };
    }).filter((c: any) => c.values.length > 0);

    numericCols.forEach((col: any) => {
      const sum = col.values.reduce((a: number, b: number) => a + b, 0);
      const avg = sum / col.values.length;
      const max = Math.max(...col.values);
      const min = Math.min(...col.values);

      insights.push(`${col.name}: Total ${Math.round(sum * 100) / 100}, Average ${Math.round(avg * 100) / 100}, Range ${min} - ${max}`);

      // Detect trend
      if (col.values.length > 5) {
        const firstHalf = col.values.slice(0, Math.floor(col.values.length / 2));
        const secondHalf = col.values.slice(Math.floor(col.values.length / 2));
        const firstAvg = firstHalf.reduce((a: number, b: number) => a + b, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((a: number, b: number) => a + b, 0) / secondHalf.length;
        const change = ((secondAvg - firstAvg) / firstAvg) * 100;
        if (Math.abs(change) > 10) {
          insights.push(`${col.name} ${change > 0 ? "increased" : "decreased"} by ${Math.abs(Math.round(change))}%`);
        }
      }

      // Detect outliers
      const stdDev = Math.sqrt(
        col.values.reduce((acc: number, v: number) => acc + Math.pow(v - avg, 2), 0) / col.values.length
      );
      const outliers = col.values.filter((v: number) => Math.abs(v - avg) > 2 * stdDev);
      if (outliers.length > 0) {
        insights.push(`${col.name} has ${outliers.length} potential outliers`);
      }
    });

    // Find best/worst categories
    const catCol = headers.findIndex((h: string) => {
      const values = new Set(rows.map((r: any[]) => String(r[headers.indexOf(h)])));
      return values.size > 1 && values.size <= 20;
    });

    if (catCol >= 0 && numericCols.length > 0) {
      const categories = new Map<string, number[]>();
      rows.forEach((row: any[]) => {
        const cat = String(row[catCol]);
        const val = Number(row[numericCols[0].index]);
        if (!isNaN(val)) {
          if (!categories.has(cat)) categories.set(cat, []);
          categories.get(cat)!.push(val);
        }
      });

      const catAverages = Array.from(categories.entries()).map(([cat, vals]) => ({
        cat,
        avg: vals.reduce((a, b) => a + b, 0) / vals.length,
      }));

      if (catAverages.length > 0) {
        catAverages.sort((a, b) => b.avg - a.avg);
        insights.push(`Best ${headers[catCol]}: ${catAverages[0].cat} (avg ${Math.round(catAverages[0].avg * 100) / 100})`);
        insights.push(`Lowest ${headers[catCol]}: ${catAverages[catAverages.length - 1].cat} (avg ${Math.round(catAverages[catAverages.length - 1].avg * 100) / 100})`);
      }
    }

    // Quality insights
    if (report.missingValues > 0) {
      insights.push(`${report.missingValues} missing values need attention (${report.missingPercentage}% of data)`);
    }
    if (report.duplicateRows > 0) {
      insights.push(`${report.duplicateRows} duplicate rows should be removed`);
    }

    return insights;
  }
}