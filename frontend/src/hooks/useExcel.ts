import { readExcel } from "../services/excelService";
import { useWorkbookStore } from "../store/workbookStore";

export default function useExcel() {
  const {
    workbook,
    updateSheetData,
    currentData,
    fileName,
    isLoaded,
    setWorkbookData,
    updateData,
    undo,
    redo,
    clearWorkbook,
  } = useWorkbookStore();

  async function openExcel(file: File) {
    try {
      const excel = await readExcel(file);

      if (!excel.data || excel.data.length === 0) {
        throw new Error("No data found in file.");
      }

      setWorkbookData({
        fileName: excel.fileName,
        sheetNames: excel.sheetNames,
        originalData: excel.data,
        currentData: excel.data,
      });
    } catch (error) {
      console.error("Failed to read file:", error);
      throw error;
    }
  }

  // Return a combined object with both the store structure and flat data fields
  const activeSheet = workbook?.sheets?.find(
    (sheet: any) => sheet.id === workbook?.activeSheet
  );

  const combinedWorkbook = workbook
    ? {
        ...workbook,
        data: currentData.length > 0 ? currentData : activeSheet?.data || workbook.sheets?.[0]?.data || [],
        fileName: workbook.name,
        sheetNames: workbook.sheets?.map((s: any) => s.name) || [],
      }
    : null;

  return {
    workbook: combinedWorkbook,
    openExcel,
    updateSheetData,
    // Unified store access
    currentData,
    fileName,
    isLoaded,
    setWorkbookData,
    updateData,
    undo,
    redo,
    clearWorkbook,
  };
}