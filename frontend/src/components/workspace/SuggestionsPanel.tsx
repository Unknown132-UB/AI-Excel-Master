import { useState } from "react";
import type { DataQualityReport } from "../../types/quality";
import { useDataWorkspaceStore } from "../../store/dataWorkspaceStore";

interface SuggestionsPanelProps {
  report: DataQualityReport;
}

export default function SuggestionsPanel({ report }: SuggestionsPanelProps) {
  const { applyAICommand } = useDataWorkspaceStore();
  const [applied, setApplied] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState("");

  async function applySuggestion(suggestion: any) {
    const command = suggestion.suggestion;
    const result = await applyAICommand(command);

    setApplied((prev) => new Set(prev).add(suggestion.id));
    setMessage(result.message);
  }

  async function applyAll() {
    for (const suggestion of report.suggestions) {
      if (!applied.has(suggestion.id)) {
        await applySuggestion(suggestion);
      }
    }
  }

  return (
    <div>
      <h3>💡 AI Cleaning Suggestions</h3>
      <p style={{ color: "#94a3b8", marginTop: "5px", fontSize: "14px" }}>
        AI detected these issues and suggests fixes. Apply them one by one or all at once.
      </p>

      {message && (
        <div style={{ background: "#064e3b", padding: "12px 16px", borderRadius: "8px", marginTop: "15px", color: "#4ade80", fontSize: "14px" }}>
          ✅ {message}
        </div>
      )}

      {report.suggestions.length > 0 && (
        <button
          onClick={applyAll}
          style={{
            marginTop: "15px",
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            background: "#3b82f6",
            color: "white",
            cursor: "pointer",
            fontWeight: "500",
          }}
        >
          ✨ Apply All Suggestions
        </button>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
        {report.suggestions.length === 0 && (
          <div style={{ background: "#1e293b", padding: "20px", borderRadius: "10px", color: "#4ade80" }}>
            ✅ No suggestions needed. Your data looks clean!
          </div>
        )}

        {report.suggestions.map((suggestion) => {
          const isApplied = applied.has(suggestion.id);
          return (
            <div
              key={suggestion.id}
              style={{
                background: "#1e293b",
                padding: "15px 20px",
                borderRadius: "10px",
                borderLeft: `4px solid ${
                  suggestion.severity === "high" ? "#f87171" : suggestion.severity === "medium" ? "#fbbf24" : "#60a5fa"
                }`,
                opacity: isApplied ? 0.6 : 1,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <strong>{suggestion.issue}</strong>
                  <div style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>
                    Column: {suggestion.column} • Severity: {suggestion.severity}
                  </div>
                  <div style={{ color: "#cbd5e1", fontSize: "13px", marginTop: "4px" }}>
                    💡 {suggestion.suggestion}
                  </div>
                </div>
                <button
                  onClick={() => applySuggestion(suggestion)}
                  disabled={isApplied}
                  style={{
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
                    background: isApplied ? "#334155" : "#3b82f6",
                    color: "white",
                    cursor: isApplied ? "default" : "pointer",
                    fontWeight: "500",
                    fontSize: "13px",
                  }}
                >
                  {isApplied ? "✓ Applied" : "Apply Fix"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}