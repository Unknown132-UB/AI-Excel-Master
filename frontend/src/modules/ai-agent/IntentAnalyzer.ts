import type { AgentIntent, IntentAnalysis } from "./types";

export default class IntentAnalyzer {
  analyze(input: string): IntentAnalysis {
    const lower = input.toLowerCase();
    const keywords: string[] = [];
    const entities: Record<string, any> = {};

    // Extract column names mentioned in the input
    const columnMatches = input.match(/(?:column|field|in|by|from)\s+["']?([a-zA-Z\s]+?)["']?\s*(?:column|field)?/gi);
    if (columnMatches) {
      entities.columns = columnMatches.map((m) => m.replace(/(?:column|field|in|by|from)\s+/i, "").trim());
    }

    // Extract numeric values
    const numberMatches = input.match(/\d+(?:\.\d+)?/g);
    if (numberMatches) {
      entities.numbers = numberMatches.map(Number);
    }

    // Detect intent based on keywords
    let intent: AgentIntent = "unknown";
    let confidence = 0;

    // Cleaning intents
    if (/(clean|fix|repair|remove duplicate|dedupe|dedup|fill missing|fill empty|trim|uppercase|lowercase|proper case|remove empty)/i.test(lower)) {
      intent = "clean_data";
      confidence = 0.9;
      keywords.push("clean", "fix", "duplicate", "missing", "trim", "case");
    }

    // Transform intents
    else if (/(transform|convert|change format|change type|reformat|normalize|standardize)/i.test(lower)) {
      intent = "transform_data";
      confidence = 0.85;
      keywords.push("transform", "convert", "format", "type");
    }

    // Analysis intents
    else if (/(analy|insight|trend|pattern|summary|overview|understand|profile|describe)/i.test(lower)) {
      intent = "analyze_data";
      confidence = 0.9;
      keywords.push("analyze", "insight", "trend", "summary");
    }

    // Chart intents
    else if (/(chart|graph|plot|visual|dashboard|diagram|histogram|scatter|pie|bar|line)/i.test(lower)) {
      intent = "generate_chart";
      confidence = 0.9;
      keywords.push("chart", "graph", "visual", "plot");
    }

    // Report intents
    else if (/(report|generate.*report|create.*report|summary report|pdf report|word report)/i.test(lower)) {
      intent = "generate_report";
      confidence = 0.9;
      keywords.push("report", "generate");
    }

    // Export intents
    else if (/(export|download|save as|output|write to)/i.test(lower)) {
      intent = "export_data";
      confidence = 0.85;
      keywords.push("export", "download", "save");
    }

    // Import intents
    else if (/(import|load|open|read|upload|ingest)/i.test(lower)) {
      intent = "import_data";
      confidence = 0.8;
      keywords.push("import", "load", "open", "upload");
    }

    // Web search intents
    else if (/(web|internet|online|search|fetch|scrape|url|website|site)/i.test(lower)) {
      intent = "web_search";
      confidence = 0.85;
      keywords.push("web", "search", "fetch", "url");
    }

    // PDF extraction
    else if (/(pdf|extract.*pdf|read.*pdf|parse.*pdf)/i.test(lower)) {
      intent = "extract_pdf";
      confidence = 0.9;
      keywords.push("pdf", "extract");
    }

    // Image extraction
    else if (/(image|screenshot|ocr|photo|picture|scan)/i.test(lower)) {
      intent = "extract_image";
      confidence = 0.85;
      keywords.push("image", "screenshot", "ocr");
    }

    // Create column
    else if (/(create|add|generate|make|insert).*(column|field|category|status|age|profit|revenue)/i.test(lower)) {
      intent = "create_column";
      confidence = 0.85;
      keywords.push("create", "add", "column");
    }

    // Filter intents
    else if (/(filter|where|select.*where|extract.*where|subset|find.*where)/i.test(lower)) {
      intent = "filter_data";
      confidence = 0.85;
      keywords.push("filter", "where", "select");
    }

    // Sort intents
    else if (/(sort|order|arrange|rank)/i.test(lower)) {
      intent = "sort_data";
      confidence = 0.85;
      keywords.push("sort", "order", "arrange");
    }

    // Calculate intents
    else if (/(calculate|compute|sum|average|mean|total|count|max|min|formula)/i.test(lower)) {
      intent = "calculate";
      confidence = 0.85;
      keywords.push("calculate", "sum", "average", "total");
    }

    // Query intents
    else if (/(show|find|list|query|get|display|who|what|which|how many)/i.test(lower)) {
      intent = "query_data";
      confidence = 0.75;
      keywords.push("show", "find", "list", "query");
    }

    // Help intents
    else if (/(help|what can you|how do|guide|tutorial|assist)/i.test(lower)) {
      intent = "help";
      confidence = 0.95;
      keywords.push("help", "guide");
    }

    // Multi-intent detection (e.g., "clean and analyze")
    if (/(clean|fix).*(analy|report|chart)/i.test(lower)) {
      intent = "clean_data";
      entities.multiIntent = true;
      entities.secondaryIntent = /(analy|report)/i.test(lower) ? "analyze_data" : "generate_chart";
    }

    return {
      intent,
      confidence,
      entities,
      keywords,
      rawInput: input,
    };
  }
}