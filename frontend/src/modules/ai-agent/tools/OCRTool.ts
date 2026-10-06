import BaseTool from "./BaseTool";
import type { ToolContext } from "./BaseTool";
import type { ToolResult } from "../types";
import ImageReader from "../../import/readers/ImageReader";

export default class OCRTool extends BaseTool {
  name = "extract_image";
  description = "Extract data from images using OCR and table detection";

  private imageReader: ImageReader;

  constructor() {
    super();
    this.imageReader = new ImageReader();
  }

  async execute(context: ToolContext): Promise<ToolResult> {
    const { params } = context;
    const file = params?.file as File | undefined;

    if (!file) {
      return this.failure("No image file provided. Please upload an image to extract data from.");
    }

    try {
      const rows = await this.imageReader.read(file);

      if (rows.length === 0) {
        return this.failure("No data could be extracted from the image.");
      }

      // Convert extracted rows to a Dataset
      const headers = rows[0] || [];
      const dataRows = rows.slice(1);

      const dataset = {
        headers,
        rows: dataRows,
        metadata: {
          fileName: file.name,
          fileType: "image",
          fileSize: file.size,
          importedAt: new Date().toISOString(),
          source: "file" as const,
          rowCount: dataRows.length,
          columnCount: headers.length,
        },
      };

      return this.success(
        `Successfully extracted ${dataRows.length} rows and ${headers.length} columns from image.`,
        dataset,
        { metadata: { source: file.name } }
      );
    } catch (error) {
      return this.failure(
        `Image extraction failed: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }
  }
}