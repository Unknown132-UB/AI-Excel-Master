import { useMemo, useState } from "react";
import useExcel from "../../hooks/useExcel";
import { useWorkbookStore } from "../../store/workbookStore";
import type { ViewMode, ThemeColor } from "../../types/excel";

const themeColors: Record<ThemeColor, { primary: string; secondary: string; accent: string }> = {
  blue: { primary: "#3b82f6", secondary: "#1e3a5f", accent: "#60a5fa" },
  green: { primary: "#10b981", secondary: "#064e3b", accent: "#34d399" },
  purple: { primary: "#8b5cf6", secondary: "#4c1d95", accent: "#a78bfa" },
  orange: { primary: "#f97316", secondary: "#7c2d12", accent: "#fb923c" },
  red: { primary: "#ef4444", secondary: "#7f1d1d", accent: "#f87171" },
  teal: { primary: "#14b8a6", secondary: "#134e4a", accent: "#2dd4bf" },
};

export default function DesignPage() {
  const { workbook } = useExcel();
  const { designSettings, updateDesignSettings } = useWorkbookStore();

  // Local editable copy — only committed to store on Save/Apply
  const [draft, setDraft] = useState({
    viewMode: designSettings.viewMode,
    theme: designSettings.theme,
    fontSize: designSettings.fontSize,
    showRowNumbers: designSettings.showRowNumbers,
    showHeader: designSettings.showHeader,
    maxRows: designSettings.maxRows,
  });
  const [saved, setSaved] = useState(true);

  const data = workbook?.data || [];
  const headers: string[] = useMemo(
    () => (data.length > 0 ? data[0].map((h: any, i: number) => String(h ?? `Column ${i + 1}`)) : []),
    [data]
  );
  const bodyRows = useMemo(() => (data.length > 1 ? data.slice(1, draft.maxRows + 1) : []), [data, draft.maxRows]);

  const colors = themeColors[draft.theme];

  const tableStyles: Record<ViewMode, React.CSSProperties> = {
    table: {
      borderCollapse: "collapse",
      width: "100%",
      background: "#ffffff",
      color: "#1e293b",
    },
    cards: {
      borderCollapse: "separate",
      borderSpacing: "0 8px",
      width: "100%",
      background: "transparent",
    },
    striped: {
      borderCollapse: "collapse",
      width: "100%",
      background: "#ffffff",
      color: "#1e293b",
    },
    bordered: {
      borderCollapse: "collapse",
      width: "100%",
      background: "#ffffff",
      color: "#1e293b",
      border: `2px solid ${colors.primary}`,
    },
    compact: {
      borderCollapse: "collapse",
      width: "100%",
      background: "#ffffff",
      color: "#1e293b",
    },
    dark: {
      borderCollapse: "collapse",
      width: "100%",
      background: "#111827",
      color: "#e2e8f0",
    },
  };

  const thStyle: React.CSSProperties = {
    padding: draft.viewMode === "compact" ? "6px 8px" : "12px 16px",
    border: draft.viewMode === "bordered" ? `1px solid ${colors.primary}` : "1px solid #e2e8f0",
    background: draft.viewMode === "dark" ? colors.secondary : colors.primary,
    color: "white",
    fontWeight: "bold",
    textAlign: "left",
    fontSize: `${draft.fontSize}px`,
  };

  const tdStyle: React.CSSProperties = {
    padding: draft.viewMode === "compact" ? "4px 8px" : "10px 16px",
    border: draft.viewMode === "bordered" ? `1px solid ${colors.primary}` : "1px solid #e2e8f0",
    fontSize: `${draft.fontSize}px`,
  };

  function getRowStyle(index: number): React.CSSProperties {
    if (draft.viewMode === "cards") {
      return {
        background: "#ffffff",
        boxShadow: `0 2px 8px rgba(0,0,0,0.1)`,
        borderRadius: "8px",
      };
    }
    if (draft.viewMode === "striped") {
      return {
        background: index % 2 === 0 ? "#ffffff" : "#f1f5f9",
      };
    }
    if (draft.viewMode === "dark") {
      return {
        background: index % 2 === 0 ? "#111827" : "#1f2937",
      };
    }
    return {};
  }

  function handleSave() {
    // Commit the draft to the authoritative store
    updateDesignSettings({
      viewMode: draft.viewMode,
      theme: draft.theme,
      fontSize: draft.fontSize,
      maxRows: draft.maxRows,
      showRowNumbers: draft.showRowNumbers,
      showHeader: draft.showHeader,
    });
    setSaved(true);
  }

  function updateDraft(patch: Partial<typeof draft>) {
    setDraft((prev) => ({ ...prev, ...patch }));
    setSaved(false);
  }

  return (
    <div>
      <h1>🎨 Design Your Data</h1>

      {!workbook?.data?.length && (
        <p style={{ color: "#94a3b8", marginTop: "20px" }}>
          No data loaded. Please import a file first.
        </p>
      )}

      {((workbook?.data?.length ?? 0) > 0) && (
        <>
          {/* Style Controls */}
          <div style={{ background: "#1e293b", padding: "20px", borderRadius: "12px", marginTop: "20px" }}>
            <strong style={{ color: "#e2e8f0" }}>🎨 Style Options</strong>

            <div style={{ marginTop: "15px" }}>
              <label style={{ color: "#94a3b8", fontSize: "13px", display: "block", marginBottom: "8px" }}>View Mode</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {(["table", "cards", "striped", "bordered", "compact", "dark"] as ViewMode[]).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => updateDraft({ viewMode: mode })}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "8px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "13px",
                      background: draft.viewMode === mode ? colors.primary : "#334155",
                      color: "white",
                      textTransform: "capitalize",
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: "15px" }}>
              <label style={{ color: "#94a3b8", fontSize: "13px", display: "block", marginBottom: "8px" }}>Theme Color</label>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {(Object.keys(themeColors) as ThemeColor[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => updateDraft({ theme: c })}
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      border: draft.theme === c ? "3px solid white" : "none",
                      cursor: "pointer",
                      background: themeColors[c].primary,
                    }}
                    title={c}
                  />
                ))}
              </div>
            </div>

            <div style={{ marginTop: "15px", display: "flex", gap: "20px", flexWrap: "wrap", alignItems: "center" }}>
              <div>
                <label style={{ color: "#94a3b8", fontSize: "13px", display: "block", marginBottom: "4px" }}>
                  Font Size: {draft.fontSize}px
                </label>
                <input
                  type="range"
                  min="10"
                  max="20"
                  value={draft.fontSize}
                  onChange={(e) => updateDraft({ fontSize: Number(e.target.value) })}
                  style={{ width: "150px" }}
                />
              </div>

              <div>
                <label style={{ color: "#94a3b8", fontSize: "13px", display: "block", marginBottom: "4px" }}>
                  Max Rows: {draft.maxRows}
                </label>
                <input
                  type="range"
                  min="10"
                  max="200"
                  step="10"
                  value={draft.maxRows}
                  onChange={(e) => updateDraft({ maxRows: Number(e.target.value) })}
                  style={{ width: "150px" }}
                />
              </div>

              <label style={{ color: "#94a3b8", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                <input type="checkbox" checked={draft.showRowNumbers} onChange={(e) => updateDraft({ showRowNumbers: e.target.checked })} />
                Row Numbers
              </label>

              <label style={{ color: "#94a3b8", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
                <input type="checkbox" checked={draft.showHeader} onChange={(e) => updateDraft({ showHeader: e.target.checked })} />
                Show Header
              </label>
            </div>

            {/* Save / Apply button */}
            <div style={{ marginTop: "20px", display: "flex", gap: "10px", alignItems: "center" }}>
              <button
                onClick={handleSave}
                style={{
                  padding: "12px 28px",
                  borderRadius: "8px",
                  border: "none",
                  background: "#10b981",
                  color: "white",
                  cursor: "pointer",
                  fontWeight: "600",
                  fontSize: "14px",
                }}
              >
                💾 Save / Apply
              </button>
              {saved && (
                <span style={{ color: "#34d399", fontSize: "13px" }}>
                  ✓ Design settings saved
                </span>
              )}
              {!saved && (
                <span style={{ color: "#f59e0b", fontSize: "13px" }}>
                  ⚠️ Unsaved changes
                </span>
              )}
            </div>
          </div>

          {/* Preview */}
          <div style={{ marginTop: "25px", overflow: "auto", borderRadius: "12px" }}>
            <table style={tableStyles[draft.viewMode]}>
              {draft.showHeader && (
                <thead>
                  <tr>
                    {draft.showRowNumbers && <th style={thStyle}>#</th>}
                    {headers.map((h, i) => (
                      <th key={i} style={thStyle}>{h}</th>
                    ))}
                  </tr>
                </thead>
              )}
              <tbody>
                {bodyRows.map((row, rIdx) => (
                  <tr key={rIdx} style={getRowStyle(rIdx)}>
                    {draft.showRowNumbers && <td style={tdStyle}>{rIdx + 1}</td>}
                    {row.map((cell: any, cIdx: number) => (
                      <td key={cIdx} style={tdStyle}>
                        {String(cell ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "15px" }}>
            Showing {bodyRows.length} of {data.length - 1} data rows • Style: {draft.viewMode} • Theme: {draft.theme}
          </p>
        </>
      )}
    </div>
  );
}