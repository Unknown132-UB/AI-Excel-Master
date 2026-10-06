import type { Dataset } from "../../types/dataset";

export default class WebDataImporter {
  async importFromUrl(url: string): Promise<Dataset> {
    try {
      // Fetch the webpage content
      const response = await fetch(url, {
        mode: "cors",
        headers: {
          "Accept": "text/html,application/json,text/csv,application/xml,*/*",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status} ${response.statusText}`);
      }

      const contentType = response.headers.get("content-type") || "";
      const text = await response.text();

      // Detect content type and parse accordingly
      if (contentType.includes("json") || this.looksLikeJSON(text)) {
        return this.parseJSON(text, url);
      }

      if (contentType.includes("csv") || this.looksLikeCSV(text)) {
        return this.parseCSV(text, url);
      }

      if (contentType.includes("xml") || this.looksLikeXML(text)) {
        return this.parseXML(text, url);
      }

      // Default: parse HTML tables
      return this.parseHTML(text, url);
    } catch (error) {
      throw new Error(`Web import failed: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  private parseJSON(text: string, url: string): Dataset {
    const data = JSON.parse(text);

    let headers: string[] = [];
    let rows: any[][] = [];

    if (Array.isArray(data)) {
      if (data.length > 0 && typeof data[0] === "object") {
        headers = Object.keys(data[0]);
        rows = data.map((item) => headers.map((h) => item[h] ?? ""));
      } else {
        headers = ["Value"];
        rows = data.map((v) => [v]);
      }
    } else if (typeof data === "object" && data !== null) {
      if (Array.isArray(data.data) || Array.isArray(data.rows)) {
        const arr = data.data || data.rows;
        if (arr.length > 0 && typeof arr[0] === "object") {
          headers = Object.keys(arr[0]);
          rows = arr.map((item: any) => headers.map((h) => item[h] ?? ""));
        }
      } else {
        headers = Object.keys(data);
        rows = [headers.map((h) => data[h] ?? "")];
      }
    }

    return this.createDataset(headers, rows, url, "json");
  }

  private parseCSV(text: string, url: string): Dataset {
    const lines = text.replace(/\r/g, "").split("\n").filter((l) => l.trim());
    if (lines.length === 0) return this.createDataset([], [], url, "csv");

    const headers = this.parseCSVLine(lines[0]);
    const rows = lines.slice(1).map((line) => this.parseCSVLine(line));

    return this.createDataset(headers, rows, url, "csv");
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (inQuotes) {
        if (char === '"') {
          if (line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            inQuotes = false;
          }
        } else {
          current += char;
        }
      } else {
        if (char === '"') {
          inQuotes = true;
        } else if (char === ",") {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
    }
    result.push(current.trim());
    return result;
  }

  private parseXML(text: string, url: string): Dataset {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/xml");

    const allElements = Array.from(doc.getElementsByTagName("*"));
    const elementCounts = new Map<string, number>();
    allElements.forEach((el) => {
      elementCounts.set(el.tagName, (elementCounts.get(el.tagName) || 0) + 1);
    });

    let recordTag = "";
    let maxCount = 0;
    elementCounts.forEach((count, tag) => {
      if (count > maxCount && count > 1) {
        const elements = doc.getElementsByTagName(tag);
        if (elements.length > 0 && elements[0].children.length > 0) {
          recordTag = tag;
          maxCount = count;
        }
      }
    });

    if (!recordTag) {
      return this.createDataset([], [], url, "xml");
    }

    const records = Array.from(doc.getElementsByTagName(recordTag));
    const headers = new Set<string>();
    records.forEach((record) => {
      Array.from(record.children).forEach((child) => headers.add(child.tagName));
    });

    const headerList = Array.from(headers);
    const rows = records.map((record) =>
      headerList.map((header) => record.getElementsByTagName(header)[0]?.textContent || "")
    );

    return this.createDataset(headerList, rows, url, "xml");
  }

  private parseHTML(text: string, url: string): Dataset {
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/html");

    // Find all tables
    const tables = doc.getElementsByTagName("table");
    if (tables.length === 0) {
      // Try to extract text content as a single column
      const body = doc.body;
      const text = body?.textContent?.split("\n").filter((l) => l.trim()) || [];
      return this.createDataset(["Content"], text.map((t) => [t.trim()]), url, "html");
    }

    // Use the largest table
    let bestTable = tables[0];
    let bestRows = 0;
    Array.from(tables).forEach((table) => {
      const rowCount = table.getElementsByTagName("tr").length;
      if (rowCount > bestRows) {
        bestRows = rowCount;
        bestTable = table;
      }
    });

    const rows = Array.from(bestTable.getElementsByTagName("tr"));
    if (rows.length === 0) return this.createDataset([], [], url, "html");

    const parseRow = (row: HTMLTableRowElement): string[] => {
      const cells = Array.from(row.children);
      return cells.map((cell) => cell.textContent?.trim() || "");
    };

    const headers = parseRow(rows[0]);
    const dataRows = rows.slice(1).map(parseRow);

    return this.createDataset(headers, dataRows, url, "html");
  }

  private looksLikeJSON(text: string): boolean {
    const trimmed = text.trim();
    return trimmed.startsWith("{") || trimmed.startsWith("[");
  }

  private looksLikeCSV(text: string): boolean {
    const firstLine = text.split("\n")[0] || "";
    return firstLine.includes(",") && !firstLine.includes("<");
  }

  private looksLikeXML(text: string): boolean {
    const trimmed = text.trim();
    return trimmed.startsWith("<?xml") || (trimmed.startsWith("<") && !trimmed.startsWith("<html"));
  }

  private createDataset(
    headers: string[],
    rows: any[][],
    url: string,
    fileType: string
  ): Dataset {
    return {
      headers,
      rows,
      metadata: {
        fileName: `web-${fileType}-${Date.now()}`,
        fileType,
        fileSize: 0,
        importedAt: new Date().toISOString(),
        source: "web",
        sourceUrl: url,
        rowCount: rows.length,
        columnCount: headers.length,
      },
    };
  }
}