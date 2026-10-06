export default class XMLReader {
  async read(file: File): Promise<any[][]> {
    const text = await file.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(text, "text/xml");

    // Find all element nodes (excluding root)
    const allElements = Array.from(doc.getElementsByTagName("*"));
    if (allElements.length === 0) return [];

    // Find the deepest repeated element pattern - look for elements with children
    const elementCounts = new Map<string, number>();
    allElements.forEach((el) => {
      const tag = el.tagName;
      elementCounts.set(tag, (elementCounts.get(tag) || 0) + 1);
    });

    // Find the most repeated element that has children (likely a record)
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
      // Fallback: use root's children
      const root = doc.documentElement;
      if (!root) return [];
      const records = Array.from(root.children);
      if (records.length === 0) {
        // Single record - use root's attributes and text
        const headers = Array.from(root.attributes).map((a) => a.name);
        const values = Array.from(root.attributes).map((a) => a.value);
        if (headers.length > 0) return [headers, values];
        return [["Value"], [root.textContent || ""]];
      }
      return this.extractRecords(records);
    }

    const records = Array.from(doc.getElementsByTagName(recordTag));
    return this.extractRecords(records);
  }

  private extractRecords(records: Element[]): any[][] {
    if (records.length === 0) return [];

    // Collect all unique child tags and attributes
    const headers = new Set<string>();
    records.forEach((record) => {
      Array.from(record.children).forEach((child) => headers.add(child.tagName));
      Array.from(record.attributes).forEach((attr) => headers.add(`@${attr.name}`));
    });

    const headerList = Array.from(headers);
    const rows = records.map((record) => {
      return headerList.map((header) => {
        if (header.startsWith("@")) {
          return record.getAttribute(header.slice(1)) || "";
        }
        const child = record.getElementsByTagName(header)[0];
        return child?.textContent || "";
      });
    });

    return [headerList, ...rows];
  }
}