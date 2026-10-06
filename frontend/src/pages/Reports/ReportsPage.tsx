import { useMemo, useState } from "react";
import DataAnalyzer from "../../modules/ai/analyzer/DataAnalyzer";
import CleaningAdvisor from "../../modules/ai/analyzer/CleaningAdvisor";
import { useDataStore } from "../../store/dataStore";

type ReportSection = "all" | "quality" | "columns" | "stats" | "cleaning" | "insights";

export default function ReportsPage() {
  const { currentData, isDataLoaded, activeFile, columns, rows } = useDataStore();
  const [reportText, setReportText] = useState("");
  const [selectedSection, setSelectedSection] = useState<ReportSection>("all");

  const analyzer = useMemo(() => new DataAnalyzer(), []);
  const advisor = useMemo(() => new CleaningAdvisor(), []);

  function generateReport() {
    if (!isDataLoaded || currentData.length === 0) {
      setReportText("⚠️ No dataset saved. Please upload and save a dataset first.");
      return;
    }

    const report = analyzer.analyze(currentData);
    const suggestions = advisor.generate(report);
    const headers = currentData[0] || [];
    const dataRows = currentData.slice(1);

    let text = `📊 DATA QUALITY REPORT\n`;
    text += `===============================\n\n`;
    text += `File: ${activeFile}\n`;
    text += `Generated: ${new Date().toLocaleString()}\n`;
    text += `--------------------------------\n`;
    text += `Rows: ${report.rows}\n`;
    text += `Columns: ${report.columns}\n`;
    text += `Empty Cells: ${report.emptyCells}\n`;
    text += `Duplicate Rows: ${report.duplicateRows}\n\n`;

    if (selectedSection === "all" || selectedSection === "stats") {
      text += `📈 STATISTICAL SUMMARY\n`;
      text += `-------------------------------\n`;
      headers.forEach((header: string, colIdx: number) => {
        const values = dataRows.map((r: any[]) => Number(r[colIdx])).filter((v: number) => !isNaN(v));
        if (values.length > 0) {
          const sum = values.reduce((a, b) => a + b, 0);
          const avg = sum / values.length;
          const sorted = [...values].sort((a, b) => a - b);
          text += `${header}:\n`;
          text += `  Count: ${values.length}\n`;
          text += `  Sum: ${sum.toFixed(2)}\n`;
          text += `  Avg: ${avg.toFixed(2)}\n`;
          text += `  Min: ${Math.min(...values)}\n`;
          text += `  Max: ${Math.max(...values)}\n`;
          text += `  Median: ${sorted[Math.floor(sorted.length / 2)]}\n\n`;
        } else {
          const unique = new Set(dataRows.map((r: any[]) => r[colIdx])).size;
          text += `${header}: Text column (${unique} unique values)\n\n`;
        }
      });
    }

    if (selectedSection === "all" || selectedSection === "columns") {
      text += `📋 COLUMN DETAILS\n`;
      text += `-------------------------------\n`;
      report.columnInfo.forEach((col: any) => {
        const fillRate = report.rows > 0 ? Math.round((col.filled / report.rows) * 100) : 0;
        text += `${col.name}: ${col.filled}/${report.rows} filled (${fillRate}%)\n`;
      });
      text += `\n`;
    }

    if (selectedSection === "all" || selectedSection === "quality") {
      text += `🧹 DATA QUALITY\n`;
      text += `-------------------------------\n`;
      text += `Empty Cells: ${report.emptyCells}\n`;
      text += `Duplicate Rows: ${report.duplicateRows}\n`;
      text += `Fill Rate: ${report.rows > 0 ? Math.round(((report.rows * report.columns - report.emptyCells) / (report.rows * report.columns)) * 100) : 0}%\n\n`;
    }

    if (selectedSection === "all" || selectedSection === "cleaning") {
      text += `🧹 CLEANING SUGGESTIONS\n`;
      text += `-------------------------------\n`;
      if (suggestions.length === 0) {
        text += `No issues found.\n`;
      } else {
        suggestions.forEach((s: any) => {
          text += `• ${s.issue} (${s.count})\n`;
          text += `  Action: ${s.action}\n\n`;
        });
      }
    }

    if (selectedSection === "all" || selectedSection === "insights") {
      text += `💡 KEY INSIGHTS\n`;
      text += `-------------------------------\n`;
      if (report.columns > 0) {
        text += `• Dataset has ${report.columns} columns and ${report.rows} data rows.\n`;
        if (report.emptyCells > 0) {
          text += `• ${report.emptyCells} empty cells need attention.\n`;
        }
        if (report.duplicateRows > 0) {
          text += `• ${report.duplicateRows} duplicate rows should be removed.\n`;
        }
        if (report.emptyCells === 0 && report.duplicateRows === 0) {
          text += `• Dataset is clean with no quality issues.\n`;
        }
        text += `• Columns: ${report.columnInfo.map((c: any) => c.name).join(", ")}\n`;
      }
    }

    setReportText(text);
  }

  function exportReport() {
    if (!reportText) {
      generateReport();
      return;
    }

    const blob = new Blob([reportText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "data_report.txt";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h1>📄 Reports</h1>

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

      {isDataLoaded && (
        <div style={{ display: "flex", gap: "10px", marginTop: "25px", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {([
              { value: "all", label: "📄 Full" },
              { value: "quality", label: "🧹 Quality" },
              { value: "columns", label: "📋 Columns" },
              { value: "stats", label: "📈 Stats" },
              { value: "cleaning", label: "🧽 Cleaning" },
              { value: "insights", label: "💡 Insights" },
            ] as { value: ReportSection; label: string }[]).map((s) => (
              <button
                key={s.value}
                onClick={() => { setSelectedSection(s.value); generateReport(); }}
                style={{
                  padding: "10px 14px",
                  borderRadius: "8px",
                  border: "none",
                  cursor: "pointer",
                  fontWeight: "500",
                  fontSize: "13px",
                  background: selectedSection === s.value ? "#3b82f6" : "#1e293b",
                  color: "white",
                }}
              >
                {s.label}
              </button>
            ))}
          </div>

          <div style={{ flex: 1 }} />

          <button onClick={generateReport} style={btnStyle}>
            📊 Generate Report
          </button>

          {reportText && (
            <button onClick={exportReport} style={{ ...btnStyle, background: "#22c55e" }}>
              💾 Download Report
            </button>
          )}
        </div>
      )}

      {reportText && (
        <div
          style={{
            background: "#1e293b",
            padding: "25px",
            borderRadius: "12px",
            marginTop: "25px",
            whiteSpace: "pre-wrap",
            fontFamily: "monospace",
            color: "#e2e8f0",
            lineHeight: 1.6,
          }}
        >
          {reportText}
        </div>
      )}
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "12px 20px",
  borderRadius: "8px",
  border: "none",
  background: "#3b82f6",
  color: "white",
  cursor: "pointer",
  fontWeight: "500",
};