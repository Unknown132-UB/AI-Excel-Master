import ImportRegistry from "../modules/import/ImportRegistry";

export interface ExcelData {
  fileName: string;
  sheetNames: string[];
  activeSheet: string;
  data: any[][];
}

export async function readExcel(file: File): Promise<ExcelData> {
  const importer = ImportRegistry.getEngine();

  const data = await importer.import(file);

  const sheets = await getSheetNames(file);

  return {
    fileName: file.name,
    sheetNames: sheets,
    activeSheet: sheets[0] || "Sheet1",
    data,
  };
}

export async function getSheetNames(file: File): Promise<string[]> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  const excelExtensions = ["xlsx", "xls", "xlsm", "xlsb"];

  if (excelExtensions.includes(extension || "")) {
    const { default: ExcelReader } = await import("../modules/import/readers/ExcelReader");
    const reader = new ExcelReader();
    return await reader.getSheets(file);
  }

  return ["Sheet1"];
}