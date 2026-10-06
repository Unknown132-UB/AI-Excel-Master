export interface SplitResult {
  headers: string[];
  rows: string[][];
  delimiter: string;
}

export default class SplitEngine {
  split(
    data: string[],
    delimiter: string
  ): SplitResult {

    const rows = data.map(row =>
      row.split(delimiter).map(cell => cell.trim())
    );

    const headers =
      rows.length > 0
        ? rows[0].map((_, index) => `Column ${index + 1}`)
        : [];

    return {
      headers,
      rows,
      delimiter,
    };
  }

  merge(
    rows: string[][],
    delimiter: string
  ): string[] {
    return rows.map(row => row.join(delimiter));
  }
}