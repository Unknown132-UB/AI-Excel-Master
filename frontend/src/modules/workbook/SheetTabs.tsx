import { useWorkbookStore } from "../../store/workbookStore";

export default function SheetTabs() {
  const { workbook, setActiveSheet } = useWorkbookStore();

  if (!workbook) return null;

  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        marginTop: "20px",
      }}
    >
      {workbook.sheets.map((sheet) => (
        <button
          key={sheet.id}
          onClick={() => setActiveSheet(sheet.id)}
          style={{
            padding: "10px 18px",
            borderRadius: "8px",
            cursor: "pointer",
            border: "none",
            background:
              workbook.activeSheet === sheet.id
                ? "#3b82f6"
                : "#334155",
            color: "white",
          }}
        >
          {sheet.name}
        </button>
      ))}
    </div>
  );
}