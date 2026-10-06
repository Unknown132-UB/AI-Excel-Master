import { useState } from "react";
import { useDataStore } from "../../store/dataStore";
import DataTable from "../../components/workspace/DataTable";
import QualityPanel from "../../components/workspace/QualityPanel";
import VersionHistory from "../../components/workspace/VersionHistory";
import AIAssistant from "../../components/workspace/AIAssistant";
import AttendancePanel from "../../components/workspace/AttendancePanel";
import SuggestionsPanel from "../../components/workspace/SuggestionsPanel";

type Tab = "data" | "quality" | "history" | "ai" | "attendance" | "suggestions";

export default function WorkspacePage() {
  const { isDataLoaded, activeFile, columns, rows, versions, currentVersionId, qualityReport, undo, redo, goToVersion } = useDataStore();
  const [activeTab, setActiveTab] = useState<Tab>("data");

  if (!isDataLoaded) {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ fontSize: "60px", marginBottom: "20px" }}>📊</div>
        <h1>AI Data Workspace</h1>
        <p style={{ color: "#94a3b8", marginTop: "15px", fontSize: "16px" }}>
          Import a file and save it to the workspace to get started
        </p>
        <a
          href="/import"
          style={{
            display: "inline-block",
            marginTop: "25px",
            padding: "14px 30px",
            background: "#3b82f6",
            color: "white",
            borderRadius: "10px",
            textDecoration: "none",
            fontWeight: "500",
          }}
        >
          📂 Go to Import
        </a>
      </div>
    );
  }

  const currentVersion = versions.find((v) => v.id === currentVersionId);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "data", label: "Data", icon: "📊" },
    { id: "quality", label: "Quality", icon: "📈" },
    { id: "history", label: "History", icon: "🕐" },
    { id: "ai", label: "AI Assistant", icon: "🤖" },
    { id: "attendance", label: "Attendance", icon: "📋" },
    { id: "suggestions", label: "Suggestions", icon: "💡" },
  ];

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
        <div>
          <h1>📊 Data Workspace</h1>
          <p style={{ color: "#94a3b8", marginTop: "5px", fontSize: "14px" }}>
            {activeFile} • {rows.length} rows • {columns.length} columns
            {currentVersion && ` • Version ${currentVersion.versionNumber}`}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={undo}
            disabled={!versions.length || versions.findIndex((v) => v.id === currentVersionId) <= 0}
            style={btnStyle}
          >
            ↩️ Undo
          </button>
          <button
            onClick={redo}
            disabled={!versions.length || versions.findIndex((v) => v.id === currentVersionId) >= versions.length - 1}
            style={btnStyle}
          >
            ↪️ Redo
          </button>
        </div>
      </div>

      {/* Quality Score Banner */}
      {qualityReport && (
        <div
          style={{
            marginTop: "20px",
            padding: "15px 20px",
            borderRadius: "10px",
            background: qualityReport.score >= 80 ? "#064e3b" : qualityReport.score >= 50 ? "#78350f" : "#7f1d1d",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            <strong style={{ fontSize: "16px" }}>Dataset Quality: {qualityReport.score}%</strong>
            <span style={{ marginLeft: "15px", color: "#d1d5db", fontSize: "13px" }}>
              {qualityReport.missingValues} missing • {qualityReport.duplicateRows} duplicates • {qualityReport.issues.length} issues
            </span>
          </div>
          <button
            onClick={() => setActiveTab("quality")}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              background: "rgba(255,255,255,0.2)",
              color: "white",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            View Details →
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", marginTop: "25px", flexWrap: "wrap", borderBottom: "1px solid #334155", paddingBottom: "10px" }}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 18px",
              borderRadius: "8px",
              border: "none",
              background: activeTab === tab.id ? "#3b82f6" : "#1e293b",
              color: "white",
              cursor: "pointer",
              fontWeight: "500",
              fontSize: "14px",
            }}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ marginTop: "20px" }}>
        {activeTab === "data" && (
          <DataTable
            dataset={{
              headers: columns,
              rows,
              metadata: {
                fileName: activeFile,
                fileType: activeFile.split(".").pop()?.toLowerCase() || "unknown",
                fileSize: 0,
                importedAt: new Date().toISOString(),
                source: "file",
                rowCount: rows.length,
                columnCount: columns.length,
              },
            }}
          />
        )}
        {activeTab === "quality" && qualityReport && <QualityPanel report={qualityReport} />}
        {activeTab === "history" && (
          <VersionHistory
            versions={versions}
            currentVersionId={currentVersionId || ""}
            onSelectVersion={goToVersion}
          />
        )}
        {activeTab === "ai" && <AIAssistant />}
        {activeTab === "attendance" && <AttendancePanel />}
        {activeTab === "suggestions" && qualityReport && <SuggestionsPanel report={qualityReport} />}
      </div>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "10px 18px",
  borderRadius: "8px",
  border: "none",
  background: "#1e293b",
  color: "white",
  cursor: "pointer",
  fontWeight: "500",
};