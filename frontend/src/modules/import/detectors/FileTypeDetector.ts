export type FileType =
  | "csv"
  | "excel"
  | "pdf"
  | "json"
  | "xml"
  | "image"
  | "unknown";

export default class FileTypeDetector {
  detect(file: File): FileType {
    const extension = file.name.split(".").pop()?.toLowerCase();

    switch (extension) {
      case "csv":
      case "txt":
      case "tsv":
      case "text":
      case "tab":
      case "psv":
      case "dat":
      case "log":
      case "prn":
      case "data":
        return "csv";

      case "xls":
      case "xlsx":
      case "xlsm":
      case "xlsb":
        return "excel";

      case "pdf":
        return "pdf";

      case "json":
        return "json";

      case "xml":
        return "xml";

      case "png":
      case "jpg":
      case "jpeg":
      case "gif":
      case "bmp":
      case "webp":
      case "tiff":
      case "tif":
        return "image";

      default:
        return "unknown";
    }
  }

  isSupported(file: File): boolean {
    return this.detect(file) !== "unknown";
  }
}