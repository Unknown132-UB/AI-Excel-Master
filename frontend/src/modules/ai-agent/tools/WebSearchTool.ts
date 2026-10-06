import BaseTool from "./BaseTool";
import type { ToolContext } from "./BaseTool";
import type { ToolResult } from "../types";
import WebDataImporter from "../../import/WebDataImporter";

export default class WebSearchTool extends BaseTool {
  name = "web_search";
  description = "Search the web and extract data from URLs";

  private webImporter: WebDataImporter;

  constructor() {
    super();
    this.webImporter = new WebDataImporter();
  }

  async execute(context: ToolContext): Promise<ToolResult> {
    const { params } = context;
    const url = params?.url || params?.query;

    if (!url) {
      return this.failure("No URL or search query provided. Please provide a URL to extract data from.");
    }

    try {
      // If it's a URL, import data from it
      if (/^https?:\/\//i.test(url)) {
        const dataset = await this.webImporter.importFromUrl(url);
        return this.success(
          `Successfully extracted data from ${url}\n\n` +
          `Found ${dataset.rows.length} rows and ${dataset.headers.length} columns.`,
          dataset,
          { metadata: { source: url } }
        );
      }

      // Otherwise, treat as a search query and try to find data
      return this.failure(
        `Web search for "${url}" requires a URL. Please provide a valid URL like "https://example.com/data".`
      );
    } catch (error) {
      return this.failure(
        `Web extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}