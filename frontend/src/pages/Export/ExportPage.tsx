import { useState } from "react";
import ExportRegistry from "../../modules/export/ExportRegistry";
import { useDataStore } from "../../store/dataStore";

export default function ExportPage() {
  const { currentData, isDataLoaded, activeFile, columns, rows } = useDataStore();
  const [message, setMessage] = useState("");

  function getExportData(): any[][] | null {
    if (!isDataLoaded || currentData.length === 0) {
      setMessage("⚠️ No dataset saved. Please upload and save a dataset first.");
      return null;
    }
    return currentData;
  }

  function exportExcel() {
    const data = getExportData();
    if (!data) return;
    const result: any = ExportRegistry.getEngine().export(data, "excel");
    setMessage(result.success ? `✅ Exported to ${result.fileName}` : `❌ ${result.message}`);
  }

  function exportCSV() {
    const data = getExportData();
    if (!data) return;
    const result: any = ExportRegistry.getEngine().export(data, "csv");
    setMessage(result.success ? `✅ Exported to ${result.fileName}` : `❌ ${result.message}`);
  }

  function exportJSON() {
    const data = getExportData();
    if (!data) return;
    const result: any = ExportRegistry.getEngine().export(data, "json");
    setMessage(result.success ? `✅ Exported to ${result.fileName}` : `❌ ${result.message}`);
  }

  return (
    <div>
      <h1>💾 Export Data</h1>

      {isDataLoaded && (
        <div style={{ background: "#064e3b", padding: "15px 20px", borderRadius: "10px", marginTop: "15px" }}>
          <strong style={{ color: "#6ee7b7" }}>✓ Active Dataset: {activeFile}</strong>
          <span style={{ marginLeft: "15px", color: "#d1d5db", fontSize: "13px" }}>
            {rows.length} rows • {columns.length} columns
          </span>
        </div>
      )}

      {!isDataLoaded && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: "50px", marginBottom: "15px" }}>📭</div>
          <h2 style={{ color: "#e2e8f0" }}>No dataset saved</h2>
          <p style={{ color: "#94a3b8", marginTop: "10px", fontSize: "15px" }}>
            Please upload and save a dataset first.
          </p>
          <a
            href="/import"
            style={{
              display: "inline-block",
              marginTop: "20px",
              padding: "12px 24px",
              background: "#3b82f6",
              color: "white",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "500",
            }}
          >
            📂 Go to Import
          </a>
        </div>
      )}

      {message && (
        <div
          style={{
            background: "#1e293b",
            padding: "15px",
            borderRadius: "8px",
            marginTop: "15px",
            color: "#60a5fa",
          }}
        >
          {message}
        </div>
      )}

      {isDataLoaded && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "20px",
            marginTop: "30px",
          }}
        >
          <button onClick={exportExcel} style={exportCard}>
            <h3>📗 Excel</h3>
            <p style={{ color: "#94a3b8", marginTop: "8px" }}>Export as .xlsx file</p>
          </button>

          <button onClick={exportCSV} style={exportCard}>
            <h3>📄 CSV</h3>
            <p style={{ color: "#94a3b8", marginTop: "8px" }}>Export as .csv file</p>
          </button>

          <button onClick={exportJSON} style={exportCard}>
            <h3>📋 JSON</h3>
            <p style={{ color: "#94a3b8", marginTop: "8px" }}>Export as .json file</p>
          </button>
        </div>
      )}
    </div>
  );
}

const exportCard: React.CSSProperties = {
  background: "#1e293b",
  padding: "30px",
  borderRadius: "12px",
  border: "2px solid #334155",
  color: "white",
  cursor: "pointer",
  transition: "0.2s",
  textAlign: "center",
};