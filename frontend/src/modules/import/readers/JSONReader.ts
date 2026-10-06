export default class JSONReader {
  async read(file: File): Promise<any[][]> {
    const text = await file.text();
    const data = JSON.parse(text);

    // Handle array of objects
    if (Array.isArray(data)) {
      if (data.length === 0) return [];
      if (typeof data[0] === "object" && data[0] !== null) {
        const headers = Object.keys(data[0]);
        const rows = data.map((item) => headers.map((h) => item[h] ?? ""));
        return [headers, ...rows];
      }
      // Array of primitives
      return [["Value"], ...data.map((v) => [v])];
    }

    // Handle single object
    if (typeof data === "object" && data !== null) {
      // Check if it has a data/rows structure
      if (Array.isArray(data.data) || Array.isArray(data.rows)) {
        const arr = data.data || data.rows;
        if (arr.length === 0) return [];
        if (typeof arr[0] === "object" && arr[0] !== null) {
          const headers = Object.keys(arr[0]);
          const rows = arr.map((item: any) => headers.map((h) => item[h] ?? ""));
          return [headers, ...rows];
        }
        return [["Value"], ...arr.map((v: any) => [v])];
      }
      // Single object as one row
      const headers = Object.keys(data);
      return [headers, [headers.map((h) => data[h] ?? "")]];
    }

    return [["Value"], [data]];
  }
}