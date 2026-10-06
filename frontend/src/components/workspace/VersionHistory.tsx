import type { DataVersion } from "../../types/version";

interface VersionHistoryProps {
  versions: DataVersion[];
  currentVersionId: string;
  onSelectVersion: (versionId: string) => void;
}

export default function VersionHistory({ versions, currentVersionId, onSelectVersion }: VersionHistoryProps) {
  return (
    <div>
      <h3>🕐 Data Version History</h3>
      <p style={{ color: "#94a3b8", marginTop: "5px", fontSize: "14px" }}>
        Every operation creates a new version. Click any version to restore it.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "20px" }}>
        {versions.length === 0 && (
          <div style={{ background: "#1e293b", padding: "20px", borderRadius: "10px", color: "#94a3b8" }}>
            No versions yet. Import data to get started.
          </div>
        )}

        {[...versions].reverse().map((version) => {
          const isCurrent = version.id === currentVersionId;
          const isLatest = version.id === versions[versions.length - 1]?.id;

          return (
            <div
              key={version.id}
              onClick={() => onSelectVersion(version.id)}
              style={{
                background: isCurrent ? "#1e3a8a" : "#1e293b",
                padding: "15px 20px",
                borderRadius: "10px",
                cursor: "pointer",
                border: isCurrent ? "2px solid #3b82f6" : "2px solid transparent",
                transition: "0.2s",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      background: isCurrent ? "#3b82f6" : "#334155",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: "bold",
                      fontSize: "14px",
                    }}
                  >
                    {version.versionNumber}
                  </div>
                  <div>
                    <strong>{version.operationName}</strong>
                    {isLatest && (
                      <span
                        style={{
                          marginLeft: "8px",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          background: "#059669",
                          color: "white",
                        }}
                      >
                        Latest
                      </span>
                    )}
                    {isCurrent && (
                      <span
                        style={{
                          marginLeft: "8px",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          background: "#3b82f6",
                          color: "white",
                        }}
                      >
                        Current
                      </span>
                    )}
                    <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "3px" }}>
                      {new Date(version.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "13px", color: "#94a3b8" }}>
                    {version.data.rows.length} rows • {version.data.headers.length} columns
                  </div>
                  <div style={{ fontSize: "12px", color: "#64748b", marginTop: "3px" }}>
                    {version.operationType}
                  </div>
                </div>
              </div>

              {version.description && (
                <div style={{ marginTop: "10px", padding: "10px", background: "rgba(0,0,0,0.2)", borderRadius: "6px", fontSize: "13px", color: "#cbd5e1" }}>
                  {version.description}
                </div>
              )}

              {version.changes && version.changes.length > 0 && (
                <div style={{ marginTop: "8px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {version.changes.map((change, idx) => (
                    <span
                      key={idx}
                      style={{
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        background: "#334155",
                        color: "#cbd5e1",
                      }}
                    >
                      {change.description}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}