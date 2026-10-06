import FileTypeDetector from "./detectors/FileTypeDetector";
import type { FileType } from "./detectors/FileTypeDetector";

import CSVReader from "./readers/CSVReader";
import ExcelReader from "./readers/ExcelReader";
import PDFReader from "./readers/PDFReader";
import JSONReader from "./readers/JSONReader";
import XMLReader from "./readers/XMLReader";
import ImageReader from "./readers/ImageReader";

export default class ImportEngine {
  private fileDetector: FileTypeDetector;
  private csvReader: CSVReader;
  private excelReader: ExcelReader;
  private pdfReader: PDFReader;
  private jsonReader: JSONReader;
  private xmlReader: XMLReader;
  private imageReader: ImageReader;

  constructor() {
    this.fileDetector = new FileTypeDetector();
    this.csvReader = new CSVReader();
    this.excelReader = new ExcelReader();
    this.pdfReader = new PDFReader();
    this.jsonReader = new JSONReader();
    this.xmlReader = new XMLReader();
    this.imageReader = new ImageReader();
  }

  async import(file: File): Promise<any[][]> {
    const type = this.fileDetector.detect(file);

    switch (type) {
      case "csv":
        return await this.csvReader.read(file);

      case "excel":
        return await this.excelReader.read(file);

      case "pdf":
        return await this.pdfReader.read(file);

      case "json":
        return await this.jsonReader.read(file);

      case "xml":
        return await this.xmlReader.read(file);

      case "image":
        return await this.imageReader.read(file);

      default:
        throw new Error("Unsupported file format");
    }
  }

  async preview(file: File, rows: number = 10) {
    const data = await this.import(file);
    return data.slice(0, rows);
  }

  detectType(file: File): FileType {
    return this.fileDetector.detect(file);
  }
}