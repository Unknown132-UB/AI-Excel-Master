export interface AIRequest {
  task: string;
  data?: any;
}

export interface AIResponse {
  success: boolean;
  message: string;
  result?: any;
}

export default class AIEngine {
  async analyze(request: AIRequest): Promise<AIResponse> {
    try {
      return {
        success: true,
        message: "AI analysis completed",
        result: this.processRequest(request),
      };
    } catch (error) {
      return {
        success: false,
        message: "AI analysis failed",
      };
    }
  }

  /**
   * Process a natural language instruction against the dataset.
   * Returns a structured result with suggestions for actions to take.
   */
  private processRequest(request: AIRequest): any {
    const { task, data } = request;
    const lower = task.toLowerCase();

    // Build dataset summary context
    const summary = this.buildSummary(data);

    // Detect intent from the user's message
    if (/split|separate|delimiter/i.test(lower)) {
      return this.suggestSplitColumn(task, summary);
    }

    if (/(design|style|format table|theme|color|view|layout)/.test(lower)) {
      return this.suggestDesign(task, summary);
    }

    if (/(clean|remove duplicate|fill empty|trim|uppercase|lowercase|title case|special char)/.test(lower)) {
      return this.suggestCleaning(task, data, summary);
    }

    if (/(analy|report|summary|insight|stat)/.test(lower)) {
      return this.suggestAnalysis(task, data, summary);
    }

    if (/(chart|graph|plot|visual)/.test(lower)) {
      return this.suggestCharts(task, data, summary);
    }

    if (/(transform|convert|format|change)/.test(lower)) {
      return this.suggestTransform(task, data, summary);
    }

    return this.generalResponse(task, summary);
  }

  private buildSummary(data: any): any {
    if (!data || data.length === 0) {
      return {
        rows: 0,
        columns: 0,
        headers: [],
        emptyCells: 0,
        duplicateRows: 0,
      };
    }

    const headers = data[0] || [];
    const rows = data.slice(1);
    let emptyCells = 0;
    rows.forEach((row: any[]) => {
      row.forEach((cell: any) => {
        if (cell === "" || cell === null || cell === undefined) emptyCells++;
      });
    });

    const seen = new Set();
    let duplicateRows = 0;
    rows.forEach((row: any[]) => {
      const key = JSON.stringify(row);
      if (seen.has(key)) duplicateRows++;
      else seen.add(key);
    });

    return {
      rows: rows.length,
      columns: headers.length,
      headers,
      emptyCells,
      duplicateRows,
    };
  }

  private suggestCleaning(task: string, _data: any, summary: any): any {
    const suggestions: string[] = [];

    if (/remove duplicate/i.test(task)) suggestions.push("removeduplicaterows");
    if (/fill empty|fill missing|empty cell/i.test(task)) suggestions.push("fillemptycells");
    if (/trim/i.test(task)) suggestions.push("trimspaces");
    if (/uppercase/i.test(task)) suggestions.push("normalizetext (uppercase)");
    if (/lowercase/i.test(task)) suggestions.push("normalizetext (lowercase)");
    if (/title case|proper/i.test(task)) suggestions.push("normalizetext (proper)");
    if (/special char/i.test(task)) suggestions.push("removespecialcharacters");

    let response = `🔍 Cleaning Instructions\n\n`;
    response += `Your dataset has ${summary.rows} rows and ${summary.columns} columns.\n`;
    response += `Empty cells: ${summary.emptyCells} | Duplicate rows: ${summary.duplicateRows}\n\n`;

    if (suggestions.length > 0) {
      response += `Based on your request, here's what you can do:\n`;
      suggestions.forEach((s) => {
        response += `• Go to the Data Cleaning page\n`;
        response += `  → Click "${s}"\n`;
      });
    } else {
      response += `Recommended cleaning steps:\n`;
      if (summary.duplicateRows > 0) {
        response += `• Remove duplicate rows (${summary.duplicateRows} found)\n`;
      }
      if (summary.emptyCells > 0) {
        response += `• Fill empty cells (${summary.emptyCells} found)\n`;
      }
      response += `• Trim spaces\n• Normalize text\n`;
    }

    response += `\n💡 Tip: On the Data Cleaning page you can now select specific columns before applying any operation.`;

    return {
      type: "cleaning",
      text: response,
      suggestions,
    };
  }

  private suggestAnalysis(_task: string, _data: any, summary: any): any {
    let response = `📊 AI Analysis\n\n`;
    response += `Dataset Overview:\n`;
    response += `• Rows: ${summary.rows}\n`;
    response += `• Columns: ${summary.columns}\n`;
    response += `• Empty Cells: ${summary.emptyCells}\n`;
    response += `• Duplicate Rows: ${summary.duplicateRows}\n\n`;

    if (summary.headers.length > 0) {
      response += `Columns:\n`;
      summary.headers.forEach((h: any, i: number) => {
        response += `  ${i + 1}. ${h}\n`;
      });
    }

    response += `\n💡 To dive deeper:`;
    response += `\n• Use the Data Cleaning page to fix quality issues`;
    response += `\n• Use the Transform page to change formats`;
    response += `\n• Use the Charts page to visualize the data`;

    return {
      type: "analysis",
      text: response,
      suggestions: [],
    };
  }

  private suggestCharts(_task: string, data: any, summary: any): any {
    const headers = summary.headers || [];
    const numericCols: string[] = [];

    (data || []).slice(1, 20).forEach((row: any[]) => {
      row.forEach((cell: any, index: number) => {
        if (!isNaN(Number(cell)) && !numericCols.includes(headers[index])) {
          numericCols.push(headers[index]);
        }
      });
    });

    let response = `📈 Chart Recommendations\n\n`;
    if (numericCols.length >= 1) {
      response += `• Bar Chart: ${numericCols[0]}\n`;
      response += `• Line Chart: ${numericCols[0]} over time\n`;
    }
    if (numericCols.length >= 2) {
      response += `• Scatter: ${numericCols[0]} vs ${numericCols[1]}\n`;
    }
    response += `• Pie Chart: Distribution of ${headers[0] || "first column"}\n`;

    response += `\n💡 Go to the Charts page to create these visualizations.`;

    return {
      type: "charts",
      text: response,
      suggestions: [],
    };
  }

  private suggestTransform(_task: string, _data: any, _summary: any): any {
    let response = `🔄 Transform Instructions\n\n`;
    response += `To transform your data:\n`;
    response += `• Go to the Transform page\n`;
    response += `• Select the transform type you need:\n`;
    response += `  - Uppercase / Lowercase / Title Case\n`;
    response += `  - Date / Time formatting\n`;
    response += `  - Currency / Percentage\n\n`;
    response += `💡 You can use the Data Cleaning page for text operations like trimming or removing special characters.`;

    return {
      type: "transform",
      text: response,
      suggestions: [],
    };
  }

  private suggestSplitColumn(_task: string, summary: any): any {
    let response = `✂️ Split Column Instructions\n\n`;
    response += `Your dataset has ${summary.columns} columns.\n\n`;
    response += `To split a column that contains combined data like "id,name,date" or "id|name|date":\n`;
    response += `1. Go to the Data Cleaning page\n`;
    response += `2. Find the "Split Column by Delimiter" section\n`;
    response += `3. Select the column you want to split\n`;
    response += `4. Enter the delimiter (e.g. , | ; tab)\n`;
    response += `5. Optionally set a prefix for the new columns\n`;
    response += `6. Click "Split Column"\n\n`;
    response += `💡 Your data will be split into separate columns automatically!`;

    return {
      type: "split",
      text: response,
      suggestions: [],
    };
  }

  private suggestDesign(_task: string, summary: any): any {
    let response = `🎨 Design Instructions\n\n`;
    response += `Your dataset has ${summary.rows} rows and ${summary.columns} columns.\n\n`;
    response += `To design and style your data table:\n`;
    response += `1. Go to the Design page (🎨 Design in the sidebar)\n`;
    response += `2. Choose a view mode:\n`;
    response += `   • Table - standard table\n`;
    response += `   • Cards - card style rows\n`;
    response += `   • Striped - alternating row colors\n`;
    response += `   • Bordered - colored borders\n`;
    response += `   • Compact - dense layout\n`;
    response += `   • Dark - dark theme\n`;
    response += `3. Pick a theme color (blue, green, purple, orange, red, teal)\n`;
    response += `4. Adjust font size and max rows\n`;
    response += `5. Toggle row numbers and header visibility\n\n`;
    response += `💡 Your data will be displayed in the style you choose!`;

    return {
      type: "design",
      text: response,
      suggestions: [],
    };
  }

  private generalResponse(_task: string, summary: any): any {
    let response = `🤖 AI Assistant\n\n`;
    response += `I can help you with your Excel data (${summary.rows} rows, ${summary.columns} columns).\n\n`;
    response += `Here's what you can ask me:\n`;
    response += `• "Clean my data" - Get cleaning suggestions\n`;
    response += `• "Split column by ," - Split combined data into columns\n`;
    response += `• "Design my table" - Style your data table\n`;
    response += `• "Analyze the dataset" - Get a data overview\n`;
    response += `• "Recommend charts" - Get chart suggestions\n`;
    response += `• "Transform column X" - Get transform instructions\n\n`;
    response += `Try typing one of these commands, or give me a specific instruction!`;

    return {
      type: "general",
      text: response,
      suggestions: [],
    };
  }
}