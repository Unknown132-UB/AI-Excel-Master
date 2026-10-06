import { useState } from "react";
import { useDataWorkspaceStore } from "../../store/dataWorkspaceStore";
import ExportRegistry from "../../modules/export/ExportRegistry";

export default function OutputPage() {
  const { dataset, versions, currentVersionId, qualityReport } = useDataWorkspaceStore();
  const [message, setMessage] = useState("");
  const [exportType, setExportType] = useState<"current" | "original" | "version">("current");
  const [selectedVersion, setSelectedVersion] = useState("");

  if (!dataset) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: "50px", marginBottom: "20px" }}>💾</div>
        <h1>Final Output</h1>
        <p style={{ color: "#94a3b8", marginTop: "15px" }}>No data to export. Please import a file first.</p>
      </div>
    );
  }

  function getExportData(): any[][] | null {
    if (!dataset) return null;

    if (exportType === "current") {
      return [dataset.headers, ...dataset.rows];
    }

    if (exportType === "original") {
      const original = versions[0];
      if (original) {
        return [original.data.headers, ...original.data.rows];
      }
    }

    if (exportType === "version" && selectedVersion) {
      const version = versions.find((v) => v.id === selectedVersion);
      if (version) {
        return [version.data.headers, ...version.data.rows];
      }
    }

    return null;
  }

  function exportData(format: "excel" | "csv" | "json") {
    const data = getExportData();
    if (!data) {
      setMessage("⚠️ No data available for the selected export option.");
      return;
    }

    const result: any = ExportRegistry.getEngine().export(data, format);
    setMessage(result.success ? `✅ Exported to ${result.fileName}` : `❌ ${result.message}`);
  }

  const currentVersion = versions.find((v) => v.id === currentVersionId);

  return (
    <div style={{ maxWidth: "1000px" }}>
      <h1>💾 Final Output</h1>
      <p style={{ color: "#94a3b8", marginTop: "8px" }}>
        Review your data changes and export the final result
      </p>

      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginTop: "25px" }}>
        <div style={cardStyle}>
          <h4 style={{ color: "#94a3b8", fontSize: "13px" }}>Current Data</h4>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{dataset.rows.length} rows</div>
          <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>{dataset.headers.length} columns</div>
        </div>
        <div style={cardStyle}>
          <h4 style={{ color: "#94a3b8", fontSize: "13px" }}>Versions</h4>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{versions.length}</div>
          <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>
            {currentVersion ? `Current: v${currentVersion.versionNumber}` : ""}
          </div>
        </div>
        <div style={cardStyle}>
          <h4 style={{ color: "#94a3b8", fontSize: "13px" }}>Quality Score</h4>
          <div style={{ fontSize: "24px", fontWeight: "bold", color: qualityReport && qualityReport.score >= 80 ? "#4ade80" : "#fbbf24" }}>
            {qualityReport?.score ?? 0}%
          </div>
          <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>
            {qualityReport?.issues.length ?? 0} issues remaining
          </div>
        </div>
        <div style={cardStyle}>
          <h4 style={{ color: "#94a3b8", fontSize: "13px" }}>Original Data</h4>
          <div style={{ fontSize: "24px", fontWeight: "bold" }}>{versions[0]?.data.rows.length ?? 0} rows</div>
          <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>
            {versions[0]?.data.headers.length ?? 0} columns
          </div>
        </div>
      </div>

      {/* Changes Applied */}
      <div style={{ marginTop: "25px" }}>
        <h3>📋 Changes Applied</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
          {versions.map((version) => (
            <div key={version.id} style={{ ...cardStyle, padding: "12px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <strong>v{version.versionNumber}: {version.operationName}</strong>
                <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "2px" }}>
                  {new Date(version.timestamp).toLocaleString()}
                </div>
              </div>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                {version.data.rows.length} rows
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export Options */}
      <div style={{ marginTop: "25px" }}>
        <h3>📤 Export Options</h3>

        <div style={{ display: "flex", gap: "15px", marginTop: "15px", flexWrap: "wrap" }}>
          <label style={radioStyle}>
            <input
              type="radio"
              checked={exportType === "current"}
              onChange={() => setExportType("current")}
            />
            <div>
              <strong>Export Final Data</strong>
              <div style={{ color: "#94a3b8", fontSize: "12px" }}>Current cleaned dataset</div>
            </div>
          </label>

          <label style={radioStyle}>
            <input
              type="radio"
              checked={exportType === "original"}
              onChange={() => setExportType("original")}
            />
            <div>
              <strong>Export Original</strong>
              <div style={{ color: "#94a3b8", fontSize: "12px" }}>Original uploaded data</div>
            </div>
          </label>

          <label style={radioStyle}>
            <input
              type="radio"
              checked={exportType === "version"}
              onChange={() => setExportType("version")}
            />
            <div>
              <strong>Export Specific Version</strong>
              <div style={{ color: "#94a3b8", fontSize: "12px" }}>Choose a version to export</div>
            </div>
          </label>
        </div>

        {exportType === "version" && (
          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            style={{
              marginTop: "15px",
              padding: "10px 14px",
              borderRadius: "8px",
              border: "none",
              background: "#1e293b",
              color: "white",
              width: "100%",
              maxWidth: "400px",
            }}
          >
            <option value="">Select a version...</option>
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                v{v.versionNumber}: {v.operationName} ({v.data.rows.length} rows)
              </option>
            ))}
          </select>
        )}

        {message && (
          <div style={{ background: "#1e293b", padding: "12px 16px", borderRadius: "8px", marginTop: "15px", color: "#60a5fa" }}>
            {message}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginTop: "20px" }}>
          <button onClick={() => exportData("excel")} style={exportCard}>
            <h3>📗 Excel</h3>
            <p style={{ color: "#94a3b8", marginTop: "8px", fontSize: "13px" }}>Export as .xlsx file</p>
          </button>
          <button onClick={() => exportData("csv")} style={exportCard}>
            <h3>📄 CSV</h3>
            <p style={{ color: "#94a3b8", marginTop: "8px", fontSize: "13px" }}>Export as .csv file</p>
          </button>
          <button onClick={() => exportData("json")} style={exportCard}>
            <h3>📋 JSON</h3>
            <p style={{ color: "#94a3b8", marginTop: "8px", fontSize: "13px" }}>Export as .json file</p>
          </button>
        </div>
      </div>
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#1e293b",
  padding: "20px",
  borderRadius: "10px",
};

const radioStyle: React.CSSProperties = {
  display: "flex",
  gap: "10px",
  alignItems: "flex-start",
  background: "#1e293b",
  padding: "15px",
  borderRadius: "10px",
  cursor: "pointer",
  flex: "1",
  minWidth: "200px",
};

const exportCard: React.CSSProperties = {
  background: "#1e293b",
  padding: "25px",
  borderRadius: "12px",
  border: "2px solid #334155",
  color: "white",
  cursor: "pointer",
  transition: "0.2s",
  textAlign: "center",
};