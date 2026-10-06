export default class ImageReader {
  async read(file: File): Promise<any[][]> {
    // Load image and extract data using canvas-based analysis
    const imageUrl = URL.createObjectURL(file);
    try {
      const img = await this.loadImage(imageUrl);
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return [["Error"], ["Could not process image"]];

      ctx.drawImage(img, 0, 0);

      // Try to detect table structure by analyzing pixel patterns
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const detectedRows = this.detectTableStructure(imageData, canvas.width, canvas.height);

      if (detectedRows.length > 0) {
        return detectedRows;
      }

      // Fallback: return image metadata as a single row
      return [
        ["Property", "Value"],
        ["Image Width", String(img.width)],
        ["Image Height", String(img.height)],
        ["File Name", file.name],
        ["File Size", `${(file.size / 1024).toFixed(2)} KB`],
      ];
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  }

  private loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = src;
    });
  }

  /**
   * Detect table-like structures in an image by analyzing
   * horizontal and vertical line patterns.
   */
  private detectTableStructure(
    imageData: ImageData,
    width: number,
    height: number
  ): any[][] {
    const data = imageData.data;
    const horizontalLines: number[] = [];
    const verticalLines: number[] = [];

    // Detect horizontal lines (rows of similar dark pixels)
    for (let y = 0; y < height; y += 2) {
      let darkCount = 0;
      for (let x = 0; x < width; x += 2) {
        const idx = (y * width + x) * 4;
        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        if (brightness < 128) darkCount++;
      }
      if (darkCount > width * 0.3) {
        horizontalLines.push(y);
      }
    }

    // Detect vertical lines
    for (let x = 0; x < width; x += 2) {
      let darkCount = 0;
      for (let y = 0; y < height; y += 2) {
        const idx = (y * width + x) * 4;
        const brightness = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
        if (brightness < 128) darkCount++;
      }
      if (darkCount > height * 0.3) {
        verticalLines.push(x);
      }
    }

    // If we found a grid structure, create a placeholder table
    if (horizontalLines.length > 3 && verticalLines.length > 1) {
      const rowCount = Math.min(horizontalLines.length - 1, 20);
      const colCount = Math.min(verticalLines.length - 1, 10);

      const headers = Array.from({ length: colCount }, (_, i) => `Column ${i + 1}`);
      const rows = Array.from({ length: rowCount }, () =>
        Array.from({ length: colCount }, () => "")
      );

      return [headers, ...rows];
    }

    return [];
  }
}