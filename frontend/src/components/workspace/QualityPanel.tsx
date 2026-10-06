import type { DataQualityReport } from "../../types/quality";

interface QualityPanelProps {
  report: DataQualityReport;
}

export default function QualityPanel({ report }: QualityPanelProps) {
  return (
    <div>
      {/* Score Overview */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px" }}>
        <div style={cardStyle}>
          <h3 style={{ color: "#94a3b8", fontSize: "13px" }}>Quality Score</h3>
          <div style={{ fontSize: "36px", fontWeight: "bold", color: report.score >= 80 ? "#4ade80" : report.score >= 50 ? "#fbbf24" : "#f87171" }}>
            {report.score}%
          </div>
        </div>
        <div style={cardStyle}>
          <h3 style={{ color: "#94a3b8", fontSize: "13px" }}>Total Rows</h3>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{report.totalRows}</div>
        </div>
        <div style={cardStyle}>
          <h3 style={{ color: "#94a3b8", fontSize: "13px" }}>Total Columns</h3>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{report.totalColumns}</div>
        </div>
        <div style={cardStyle}>
          <h3 style={{ color: "#94a3b8", fontSize: "13px" }}>Missing Values</h3>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: report.missingValues > 0 ? "#fbbf24" : "#4ade80" }}>
            {report.missingValues} ({report.missingPercentage}%)
          </div>
        </div>
        <div style={cardStyle}>
          <h3 style={{ color: "#94a3b8", fontSize: "13px" }}>Duplicate Rows</h3>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: report.duplicateRows > 0 ? "#fbbf24" : "#4ade80" }}>
            {report.duplicateRows} ({report.duplicatePercentage}%)
          </div>
        </div>
      </div>

      {/* Detected Columns */}
      <div style={{ marginTop: "25px" }}>
        <h3>🔍 Detected Columns</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginTop: "10px" }}>
          {report.detectedColumns.map((col) => (
            <div key={col.name} style={{ ...cardStyle, padding: "12px" }}>
              <strong>{col.name}</strong>
              <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>
                {col.role} • {col.confidence}% confidence
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Column Profiles */}
      <div style={{ marginTop: "25px" }}>
        <h3>📊 Column Analysis</h3>
        <div style={{ overflow: "auto", marginTop: "10px", borderRadius: "10px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", background: "#1e293b" }}>
            <thead>
              <tr>
                {["Column", "Type", "Confidence", "Missing", "Unique", "Duplicates", "Min", "Max", "Mean"].map((h) => (
                  <th key={h} style={{ ...thStyle, color: "#94a3b8" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {report.columnProfiles.map((col) => (
                <tr key={col.name} style={{ borderBottom: "1px solid #334155" }}>
                  <td style={tdStyle}><strong>{col.name}</strong></td>
                  <td style={tdStyle}>{col.dataType}</td>
                  <td style={tdStyle}>{col.confidence}%</td>
                  <td style={{ ...tdStyle, color: col.missingCount > 0 ? "#fbbf24" : "#4ade80" }}>
                    {col.missingCount} ({col.missingPercentage}%)
                  </td>
                  <td style={tdStyle}>{col.uniqueCount}</td>
                  <td style={{ ...tdStyle, color: col.duplicateCount > 0 ? "#fbbf24" : "#4ade80" }}>
                    {col.duplicateCount}
                  </td>
                  <td style={tdStyle}>{col.min ?? "-"}</td>
                  <td style={tdStyle}>{col.max ?? "-"}</td>
                  <td style={tdStyle}>{col.mean !== undefined ? Math.round(col.mean * 100) / 100 : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issues */}
      <div style={{ marginTop: "25px" }}>
        <h3>⚠️ Issues Found ({report.issues.length})</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
          {report.issues.length === 0 && (
            <div style={{ ...cardStyle, color: "#4ade80" }}>✅ No issues found. Dataset looks clean!</div>
          )}
          {report.issues.map((issue, idx) => (
            <div
              key={idx}
              style={{
                ...cardStyle,
                borderLeft: `4px solid ${
                  issue.severity === "high" ? "#f87171" : issue.severity === "medium" ? "#fbbf24" : "#60a5fa"
                }`,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <strong>{issue.message}</strong>
                <span
                  style={{
                    padding: "3px 8px",
                    borderRadius: "4px",
                    fontSize: "11px",
                    background: issue.severity === "high" ? "#7f1d1d" : issue.severity === "medium" ? "#78350f" : "#1e3a8a",
                    color: "white",
                  }}
                >
                  {issue.severity.toUpperCase()}
                </span>
              </div>
              {issue.suggestion && (
                <div style={{ color: "#94a3b8", fontSize: "13px", marginTop: "5px" }}>
                  💡 {issue.suggestion}
                </div>
              )}
            </div>
          ))}
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

const thStyle: React.CSSProperties = {
  padding: "10px 12px",
  textAlign: "left",
  fontSize: "13px",
  fontWeight: "bold",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: "13px",
};