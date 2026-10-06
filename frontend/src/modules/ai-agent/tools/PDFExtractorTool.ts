import BaseTool from "./BaseTool";
import type { ToolContext } from "./BaseTool";
import type { ToolResult } from "../types";
import PDFReader from "../../import/readers/PDFReader";

export default class PDFExtractorTool extends BaseTool {
  name = "extract_pdf";
  description = "Extract tabular data from PDF files";

  private pdfReader: PDFReader;

  constructor() {
    super();
    this.pdfReader = new PDFReader();
  }

  async execute(context: ToolContext): Promise<ToolResult> {
    const { params } = context;
    const file = params?.file as File | undefined;

    if (!file) {
      return this.failure("No PDF file provided. Please upload a PDF file to extract data from.");
    }

    try {
      const rows = await this.pdfReader.read(file);

      if (rows.length === 0) {
        return this.failure("No data could be extracted from the PDF.");
      }

      // Convert extracted rows to a Dataset
      const headers = rows[0] || [];
      const dataRows = rows.slice(1);

      const dataset = {
        headers,
        rows: dataRows,
        metadata: {
          fileName: file.name,
          fileType: "pdf",
          fileSize: file.size,
          importedAt: new Date().toISOString(),
          source: "file" as const,
          rowCount: dataRows.length,
          columnCount: headers.length,
        },
      };

      return this.success(
        `Successfully extracted ${dataRows.length} rows and ${headers.length} columns from PDF.`,
        dataset,
        { metadata: { source: file.name } }
      );
    } catch (error) {
      return this.failure(
        `PDF extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}