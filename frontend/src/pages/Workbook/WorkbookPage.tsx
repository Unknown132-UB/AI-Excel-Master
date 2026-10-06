import useExcel from "../../hooks/useExcel";
import Spreadsheet from "../../modules/spreadsheet/Spreadsheet";
import SheetTabs from "../../modules/workbook/SheetTabs";
import WorkbookToolbar from "../../modules/workbook/WorkbookToolbar";
import { useWorkbookStore } from "../../store/workbookStore";

export default function WorkbookPage() {
  const { workbook } = useExcel();
  const { workbook: storedWorkbook } = useWorkbookStore();

  const activeSheetId = storedWorkbook?.activeSheet;
  const activeSheet = storedWorkbook?.sheets?.find(
    (sheet: any) => sheet.id === activeSheetId
  );

  const data = activeSheet?.data || workbook?.data || [];

  return (
    <div>
      <h1>📊 Workbook</h1>

      {!workbook && !storedWorkbook && (
        <p style={{ color: "#94a3b8", marginTop: "20px" }}>
          No workbook loaded. Please import a file first.
        </p>
      )}

      {storedWorkbook && (
        <>
          <p style={{ color: "#94a3b8", marginTop: "10px" }}>
            {storedWorkbook.name} • {activeSheet?.name || "Sheet1"}
          </p>
          <SheetTabs />
          <WorkbookToolbar />
        </>
      )}

      {data.length > 0 && <Spreadsheet data={data} />}
    </div>
  );
}