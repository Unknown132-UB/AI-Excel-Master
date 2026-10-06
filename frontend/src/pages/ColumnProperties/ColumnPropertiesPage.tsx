import { useEffect, useMemo, useState } from "react";
import useExcel from "../../hooks/useExcel";
import { useWorkbookStore } from "../../store/workbookStore";
import { convertColumn, detectCurrentType } from "../../modules/datatype/TypeConversionEngine";
import type { DataType } from "../../types/excel";
import Spreadsheet from "../../modules/spreadsheet/Spreadsheet";

const DATA_TYPES: { value: DataType; label: string }[] = [
  { value: "string", label: "Text / String" },
  { value: "integer", label: "Integer" },
  { value: "decimal", label: "Decimal / Float" },
  { value: "boolean", label: "Boolean" },
  { value: "date", label: "Date" },
  { value: "time", label: "Time" },
  { value: "datetime", label: "DateTime" },
];

const DATE_FORMATS = [
  "DD-MM-YYYY", "MM-DD-YYYY", "YYYY-MM-DD",
  "DD/MM/YYYY", "MM/DD/YYYY", "YYYY/MM/DD",
  "DD.MM.YYYY", "MM.DD.YYYY", "YYYY.MM.DD",
  "DD-MM-YY", "MM-DD-YY",
];

const TIME_FORMATS = ["HH:MM", "HH:MM:SS", "hh:mm AM/PM", "hh:mm:ss AM/PM"];

const DATETIME_FORMATS = [
  "DD-MM-YYYY HH:MM", "DD-MM-YYYY HH:MM:SS", "DD-MM-YYYY hh:mm AM/PM",
  "MM-DD-YYYY HH:MM", "YYYY-MM-DD HH:MM", "YYYY-MM-DD HH:MM:SS",
  "MM/DD/YYYY hh:mm:ss AM/PM", "DD/MM/YYYY HH:MM",
];

export default function ColumnPropertiesPage() {
  const { workbook, updateSheetData } = useExcel();
  const { columnProperties, updateColumnProperty } = useWorkbookStore();

  const [selectedColumn, setSelectedColumn] = useState<number | null>(null);
  const [newType, setNewType] = useState<DataType>("string");
  const [format, setFormat] = useState<string>("");
  const [preview, setPreview] = useState<any[][] | null>(null);
  const [previewResult, setPreviewResult] = useState<any>(null);
  const [message, setMessage] = useState("");
  const [invalidHandling, setInvalidHandling] = useState<"keep" | "blank">("keep");
  const [showInvalid, setShowInvalid] = useState(false);

  const data = workbook?.data || [];
  const headers: string[] = useMemo(
    () => (data.length > 0 ? data[0].map((h: any, i: number) => String(h ?? `Column ${i + 1}`)) : []),
    [data]
  );

  useEffect(() => {
    if (selectedColumn === null || !data.length) return;
    const colValues = data.slice(1).map((row) => row[selectedColumn]);
    const detected = detectCurrentType(colValues);
    setNewType(detected.type === "integer" || detected.type === "decimal" ? detected.type : "string");
    setFormat("");
    setPreview(null);
    setPreviewResult(null);
    setShowInvalid(false);
  }, [selectedColumn, data]);

  const selectedHeader = selectedColumn !== null ? headers[selectedColumn] : "";
  const storedProp = selectedHeader ? columnProperties[selectedHeader] : null;

  const availableFormats = useMemo(() => {
    if (newType === "date") return DATE_FORMATS;
    if (newType === "time") return TIME_FORMATS;
    if (newType === "datetime") return DATETIME_FORMATS;
    return [];
  }, [newType]);

  function handlePreview() {
    if (selectedColumn === null) { setMessage("Select a column first."); return; }
    if (!data.length) { setMessage("No data loaded."); return; }
    const result = convertColumn(data, selectedColumn, { type: newType, format: format || null });
    setPreview(result.data);
    setPreviewResult(result);
    setMessage(result.errorRows.length > 0 ? `Some values could not be converted.` : `Preview ready. ${result.message}`);
  }

  function handleSave() {
    if (selectedColumn === null) { setMessage("Select a column first."); return; }
    if (!data.length) { setMessage("No data loaded."); return; }

    const result = convertColumn(data, selectedColumn, { type: newType, format: format || null });

    if (result.errorRows.length > 0 && invalidHandling === "blank") {
      result.data = result.data.map((row, rIdx) => {
        if (result.errorRows.includes(rIdx)) {
          const newRow = [...row];
          newRow[selectedColumn] = null;
          return newRow;
        }
        return row;
      });
      result.preview = result.data.slice(0, 7);
    }

    updateSheetData(result.data);
    updateColumnProperty(selectedHeader, { type: newType, format: format || null });

    setPreview(null);
    setPreviewResult(null);
    setMessage(`Column "${selectedHeader}" converted to ${newType}. Data saved.`);
  }

  const displayData = preview || data;
  const inputStyle: React.CSSProperties = { padding: "10px 12px", borderRadius: "8px", border: "none", background: "#334155", color: "white", fontSize: "13px" };
  const btnPrimary: React.CSSProperties = { padding: "10px 20px", borderRadius: "8px", border: "none", background: "#3b82f6", color: "white", cursor: "pointer", fontWeight: "500", fontSize: "13px" };
  const infoBox: React.CSSProperties = { background: "#334155", padding: "10px 14px", borderRadius: "8px" };

  return (
    <div>
      <h1>🏷 Column Properties & Data Types</h1>

      {!data.length && <p style={{ color: "#94a3b8", marginTop: "20px" }}>No data loaded. Please import a file first.</p>}

      {message && (
        <div style={{ background: "#1e293b", padding: "15px", borderRadius: "8px", marginTop: "15px", color: "#60a5fa" }}>{message}</div>
      )}

      {data.length > 0 && (
        <>
          <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", marginTop: "20px" }}>
            <strong style={{ color: "#e2e8f0" }}>🔧 Column Type Converter</strong>
            <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>
              Select a column, choose its logical data type, configure format, preview, then Save.
            </p>

            <div style={{ display: "flex", gap: "12px", marginTop: "15px", flexWrap: "wrap", alignItems: "center" }}>
              <select value={selectedColumn ?? ""} onChange={(e) => setSelectedColumn(e.target.value === "" ? null : Number(e.target.value))} style={inputStyle}>
                <option value="">Select column...</option>
                {headers.map((h, i) => (<option key={i} value={i}>{h}</option>))}
              </select>

              <select
                value={newType}
                onChange={(e) => { setNewType(e.target.value as DataType); setFormat(""); }}
                style={inputStyle}
              >
                {DATA_TYPES.map((dt) => (<option key={dt.value} value={dt.value}>{dt.label}</option>))}
              </select>

              {availableFormats.length > 0 && (
                <select value={format} onChange={(e) => setFormat(e.target.value)} style={{ ...inputStyle, minWidth: "180px" }}>
                  <option value="">Select format...</option>
                  {availableFormats.map((f) => (<option key={f} value={f}>{f}</option>))}
                </select>
              )}
            </div>

            {selectedColumn !== null && (
              <div style={{ marginTop: "15px", display: "flex", gap: "20px", flexWrap: "wrap" }}>
                <div style={infoBox}>
                  <span style={{ color: "#94a3b8", fontSize: "12px" }}>Column Name</span>
                  <strong style={{ color: "white", display: "block", marginTop: "4px" }}>{selectedHeader}</strong>
                </div>
                <div style={infoBox}>
                  <span style={{ color: "#94a3b8", fontSize: "12px" }}>Current Type</span>
                  <strong style={{ color: "white", display: "block", marginTop: "4px", textTransform: "capitalize" }}>{storedProp?.type || "unknown"}</strong>
                </div>
                <div style={infoBox}>
                  <span style={{ color: "#94a3b8", fontSize: "12px" }}>Format</span>
                  <strong style={{ color: "white", display: "block", marginTop: "4px" }}>{storedProp?.format || "—"}</strong>
                </div>
              </div>
            )}

            {previewResult?.errorRows && previewResult.errorRows.length > 0 && (
              <div style={{ marginTop: "15px", background: "#450a0a", padding: "12px", borderRadius: "8px", color: "#fca5a5", fontSize: "13px" }}>
                ⚠️ Some values could not be converted.
                {!showInvalid && (
                  <button onClick={() => setShowInvalid(true)} style={{ marginLeft: "10px", padding: "4px 10px", borderRadius: "6px", border: "none", background: "#7f1d1d", color: "white", cursor: "pointer", fontSize: "12px" }}>
                    Show Invalid Rows
                  </button>
                )}
                <div style={{ marginTop: "8px", display: "flex", gap: "15px", alignItems: "center" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <input type="radio" checked={invalidHandling === "keep"} onChange={() => setInvalidHandling("keep")} /> Keep invalid values
                  </label>
                  <label style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                    <input type="radio" checked={invalidHandling === "blank"} onChange={() => setInvalidHandling("blank")} /> Replace with blank (NaN)
                  </label>
                </div>
                {showInvalid && (
                  <div style={{ marginTop: "8px", fontSize: "12px" }}>
                    Invalid rows: {previewResult.errorRows.map((r: number) => `Row ${r}`).join(", ")}
                  </div>
                )}
              </div>
            )}

            <div style={{ marginTop: "15px", display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button onClick={handlePreview} style={btnPrimary}>👁 Preview</button>
              <button onClick={handleSave} style={{ ...btnPrimary, background: "#10b981" }}>💾 Save / Apply</button>
              <button onClick={() => { setPreview(null); setPreviewResult(null); setMessage(""); }} style={{ ...btnPrimary, background: "#475569" }}>Cancel</button>
            </div>
          </div>

          {previewResult && (
            <div style={{ marginTop: "20px", background: "#1e293b", padding: "15px", borderRadius: "8px" }}>
              <strong style={{ color: "#e2e8f0" }}>🖼 Conversion Preview</strong>
              <div style={{ overflow: "auto", marginTop: "10px" }}>
                <table style={{ borderCollapse: "collapse", width: "100%" }}>
                  <thead>
                    <tr>
                      {previewResult.preview[0]?.map((h: any, i: number) => (
                        <th key={i} style={{ border: "1px solid #334155", padding: "8px", background: "#334155", color: "white", fontSize: "12px" }}>
                          {String(h ?? `Column ${i + 1}`)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewResult.preview.slice(1).map((row: any[], rIdx: number) => (
                      <tr key={rIdx}>
                        {row.map((cell: any, cIdx: number) => (
                          <td key={cIdx} style={{ border: "1px solid #334155", padding: "8px", color: "#e2e8f0", fontSize: "12px" }}>
                            {cell instanceof Date ? cell.toLocaleString() : String(cell ?? "")}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "8px" }}>
                Showing {Math.min(previewResult.preview.length - 1, 6)} preview rows. Click Save/Apply to commit.
              </p>
            </div>
          )}

          <div style={{ marginTop: "25px" }}>
            <Spreadsheet data={displayData} />
          </div>
        </>
      )}
    </div>
  );
}