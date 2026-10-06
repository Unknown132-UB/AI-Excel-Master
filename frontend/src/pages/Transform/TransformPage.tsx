import { useMemo, useState } from "react";
import Spreadsheet from "../../modules/spreadsheet/Spreadsheet";
import TransformRegistry from "../../modules/transform/TransformRegistry";
import { useDataStore } from "../../store/dataStore";

export default function TransformPage() {
  const { currentData, isDataLoaded, updateDataset, activeFile, columns, rows } = useDataStore();
  const [message, setMessage] = useState("");

  // Always use the authoritative store data — never a local shadow copy
  const data = currentData.length > 0 ? currentData : [];
  const engine = useMemo(() => TransformRegistry.getEngine(), []);

  function runTransform(id: string) {
    if (!isDataLoaded || data.length === 0) {
      setMessage("⚠️ No dataset saved. Please upload and save a dataset first.");
      return;
    }

    // Always operate on the latest authoritative data from the store
    const source = data.map((row: any[]) => [...row]);
    const result = engine.execute(id, source);

    if (result.success) {
      // Commit to authoritative state immediately
      updateDataset(result.value, id, "transform");
      setMessage(`✅ ${id} applied successfully. Data saved to workspace.`);
    } else {
      setMessage(`❌ ${result.message || "Operation failed."}`);
    }
  }

  const transforms = [
    { id: "uppercase", label: "🔠 Upper Case" },
    { id: "lowercase", label: "🔡 Lower Case" },
    { id: "propercase", label: "✍️ Title Case" },
    { id: "dateformat", label: "📅 Format Date" },
    { id: "timeformat", label: "⏰ Format Time" },
    { id: "currency", label: "💰 Currency" },
    { id: "percentage", label: "📊 Percentage" },
  ];

  return (
    <div>
      <h1>🔄 Transform Data</h1>

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
        <div style={{
          background: "#1e293b", padding: "15px", borderRadius: "8px",
          marginTop: "15px", color: "#60a5fa",
        }}>
          {message}
        </div>
      )}

      {isDataLoaded && (
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
          gap: "10px",
          marginTop: "25px",
        }}>
          {transforms.map((t) => (
            <button
              key={t.id}
              onClick={() => runTransform(t.id)}
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                border: "none",
                background: "#1e293b",
                color: "#e2e8f0",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {isDataLoaded && data.length > 0 && <Spreadsheet data={data} />}
    </div>
  );
}