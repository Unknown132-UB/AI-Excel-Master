import type { AgentExecutionResult, AgentPlan, AgentStep } from "./types";

export default class ResponseGenerator {
  generateFinalResponse(
    plan: AgentPlan,
    executionResult: AgentExecutionResult
  ): string {
    const { success, steps, finalData, chartConfigs, reportContent, queryResult, duration } = executionResult;

    if (!success) {
      return this.generateFailureResponse(plan, steps);
    }

    let response = `✅ **Task Completed**\n\n`;
    response += `**Plan:** ${plan.summary}\n\n`;
    response += `**Execution Steps:**\n`;

    steps.forEach((step, index) => {
      const statusIcon = step.status === "completed" ? "✅" : step.status === "failed" ? "❌" : "⏳";
      response += `${index + 1}. ${statusIcon} ${step.description}\n`;
    });

    response += `\n**Results:**\n`;

    if (finalData) {
      response += `• Dataset updated: ${finalData.rows.length} rows, ${finalData.headers.length} columns\n`;
    }

    if (chartConfigs && chartConfigs.length > 0) {
      response += `• Generated ${chartConfigs.length} chart${chartConfigs.length > 1 ? "s" : ""}:\n`;
      chartConfigs.forEach((chart) => {
        response += `  - ${chart.title} (${chart.type})\n`;
      });
    }

    if (reportContent) {
      response += `• Report generated\n\n`;
      response += `---\n\n${reportContent}`;
    }

    if (queryResult) {
      response += `• Query results available\n`;
    }

    response += `\n⏱️ Completed in ${(duration / 1000).toFixed(1)}s`;

    return response;
  }

  generateProgressUpdate(step: AgentStep, index: number, total: number): string {
    return `🔄 Step ${index + 1}/${total}: ${step.description}...`;
  }

  generateThinkingMessage(input: string): string {
    return `🤔 Understanding request: "${input}"\n\nAnalyzing dataset...\nPlanning execution steps...`;
  }

  generateHelpMessage(): string {
    let help = `🤖 **AI Data Analyst Help**\n\n`;
    help += `I can understand, plan, and execute data operations automatically.\n\n`;
    help += `**What you can ask me:**\n\n`;
    help += `**🧹 Cleaning**\n`;
    help += `• "Clean this dataset" - Remove duplicates, fill missing values\n`;
    help += `• "Remove duplicate customers" - Deduplicate by column\n`;
    help += `• "Fill missing values with mean" - Handle empty cells\n`;
    help += `• "Convert all names to proper case" - Normalize text\n\n`;

    help += `**📊 Analysis**\n`;
    help += `• "Analyze this sales data" - Get insights and trends\n`;
    help += `• "Find customers who spend more than 50000" - Query data\n`;
    help += `• "Calculate total revenue" - Run calculations\n\n`;

    help += `**📈 Charts & Reports**\n`;
    help += `• "Create monthly sales dashboard" - Generate charts\n`;
    help += `• "Generate a sales report" - Create comprehensive report\n`;
    help += `• "Create a bar chart of sales by region" - Specific chart\n\n`;

    help += `**🔄 Transformations**\n`;
    help += `• "Create a profit column" - Revenue - Cost\n`;
    help += `• "Convert date column to DD-MM-YYYY" - Format dates\n`;
    help += `• "Sort by salary descending" - Reorder data\n\n`;

    help += `**📂 Import & Export**\n`;
    help += `• "Import data from URL" - Web data extraction\n`;
    help += `• "Extract data from this PDF" - PDF parsing\n`;
    help += `• "Export as CSV" - Download data\n\n`;

    help += `**💡 Tips:**\n`;
    help += `• You can combine commands: "Clean this data, analyze it, and create charts"\n`;
    help += `• Upload screenshots for visual understanding\n`;
    help += `• Provide URLs for web data extraction`;

    return help;
  }

  private generateFailureResponse(plan: AgentPlan, steps: AgentStep[]): string {
    let response = `❌ **Task Failed**\n\n`;
    response += `**Plan:** ${plan.summary}\n\n`;

    const failedStep = steps.find((s) => s.status === "failed");
    if (failedStep) {
      response += `**Failed at:** ${failedStep.description}\n`;
      response += `**Error:** ${failedStep.error || "Unknown error"}\n\n`;
    }

    response += `**Completed steps:**\n`;
    steps.filter((s) => s.status === "completed").forEach((step, index) => {
      response += `${index + 1}. ✅ ${step.description}\n`;
    });

    response += `\n**Suggestions:**\n`;
    response += `• Try rephrasing your request\n`;
    response += `• Make sure data is loaded\n`;
    response += `• Check column names in your dataset`;

    return response;
  }
}