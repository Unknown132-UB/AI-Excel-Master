import { useMemo, useState } from "react";
import { useWorkbookStore } from "../../store/workbookStore";

interface SpreadsheetProps {
  data: any[][];
  selectedColumns?: Set<number>;
  onToggleColumn?: (col: number) => void;
  selectable?: boolean;
}

export default function Spreadsheet({
  data,
  selectedColumns,
  onToggleColumn,
  selectable = false,
}: SpreadsheetProps) {
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [editing, setEditing] = useState<{ row: number; col: number } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 50;

  // Persistent design settings from store
  const { designSettings } = useWorkbookStore();
  const { fontSize, showRowNumbers, showHeader, maxRows, viewMode } = designSettings;

  const headers = useMemo(() => (data.length > 0 ? data[0].map((h, i) => String(h ?? `Column ${i + 1}`)) : []), [data]);
  const bodyRows = useMemo(() => (data.length > 1 ? data.slice(1) : []), [data]);

  const processedRows = useMemo(() => {
    let result = bodyRows;
    if (search.trim()) {
      result = result.filter((row) =>
        JSON.stringify(row).toLowerCase().includes(search.toLowerCase())
      );
    }
    if (sortCol !== null) {
      result = [...result].sort((a, b) => {
        const aVal = a[sortCol];
        const bVal = b[sortCol];
        if (aVal === bVal) return 0;
        const comparison = aVal > bVal ? 1 : -1;
        return sortDir === "asc" ? comparison : -comparison;
      });
    }
    return result;
  }, [bodyRows, search, sortCol, sortDir]);

  const totalPages = Math.max(1, Math.ceil(processedRows.length / pageSize));
  const visibleRows = processedRows.slice(page * pageSize, (page + 1) * pageSize);

  function handleSort(col: number) {
    if (sortCol === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortCol(col);
      setSortDir("asc");
    }
  }

  function handleCellEdit(row: number, col: number) {
    setEditing({ row, col });
    const cell = bodyRows[row][col];
    setEditValue(cell instanceof Date ? cell.toLocaleString() : String(cell ?? ""));
  }

  function handleCellSave() {
    if (!editing) return;
    // In-place edit is handled locally; parent can re-apply via props update
    setEditing(null);
  }

  if (!data.length) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}>
        No data loaded
      </div>
    );
  }

  return (
    <div style={{ marginTop: "20px" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "15px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="🔍 Search..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: "8px",
            border: "none",
            background: "#1e293b",
            color: "white",
            minWidth: "200px",
          }}
        />
        <span style={{ color: "#94a3b8", alignSelf: "center", fontSize: "13px" }}>
          Showing {processedRows.length} data rows
        </span>
      </div>

      {/* Table */}
      <div
        style={{
          overflow: "auto",
          background: viewMode === "dark" ? "#111827" : "#ffffff",
          color: viewMode === "dark" ? "#e2e8f0" : "#000",
          borderRadius: "10px",
          maxHeight: "60vh",
        }}
      >
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          {showHeader && (
            <thead>
              <tr>
                {showRowNumbers && <th style={{ ...thStyle, fontSize: `${fontSize}px` }}>#</th>}
                {selectable && <th style={{ ...thStyle, width: "40px", fontSize: `${fontSize}px` }}>✓</th>}
                {headers.map((header, col) => (
                  <th
                    key={col}
                    onClick={() => (selectable ? onToggleColumn?.(col) : handleSort(col))}
                    style={{
                      ...thStyle,
                      cursor: "pointer",
                      background: selectedColumns?.has(col) ? "#dbeafe" : viewMode === "dark" ? "#1f2937" : "#f8fafc",
                      color: viewMode === "dark" ? "#e2e8f0" : "#000",
                      fontSize: `${fontSize}px`,
                      userSelect: "none",
                    }}
                    title={selectable ? "Click to select/deselect column" : "Click to sort"}
                  >
                    {selectable && (
                      <span style={{ marginRight: "6px", fontSize: "14px" }}>
                        {selectedColumns?.has(col) ? "☑" : "☐"}
                      </span>
                    )}
                    {header}
                    {!selectable && sortCol === col ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {visibleRows.slice(0, Math.min(maxRows, visibleRows.length)).map((row, rowIndex) => {
              const actualRowIndex = page * pageSize + rowIndex;
              return (
                <tr
                  key={actualRowIndex}
                  style={{
                    background: viewMode === "striped"
                      ? rowIndex % 2 === 0 ? "#ffffff" : "#f1f5f9"
                      : viewMode === "dark"
                        ? rowIndex % 2 === 0 ? "#111827" : "#1f2937"
                        : viewMode === "cards"
                          ? "#ffffff"
                          : undefined,
                  }}
                >
                  {showRowNumbers && <td style={{ ...tdStyle, fontSize: `${fontSize}px` }}>{actualRowIndex + 1}</td>}
                  {selectable && <td style={{ ...tdStyle, fontSize: `${fontSize}px` }}></td>}
                  {row.map((cell, col) => (
                    <td
                      key={col}
                      onClick={() => handleCellEdit(actualRowIndex, col)}
                      style={{
                        ...tdStyle,
                        fontSize: `${fontSize}px`,
                        color: viewMode === "dark" ? "#e2e8f0" : "#000",
                        background: selectedColumns?.has(col) ? "#eff6ff" : undefined,
                      }}
                    >
                      {editing?.row === actualRowIndex && editing?.col === col ? (
                        <input
                          autoFocus
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => handleCellSave()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleCellSave();
                            if (e.key === "Escape") setEditing(null);
                          }}
                          style={{
                            width: "100%",
                            padding: "4px",
                            border: "2px solid #3b82f6",
                            borderRadius: "4px",
                            fontSize: `${fontSize}px`,
                          }}
                        />
                      ) : (
                        cell instanceof Date ? cell.toLocaleString() : String(cell ?? "")
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: "15px",
          color: "#94a3b8",
        }}
      >
        <span>
          Showing {processedRows.length === 0 ? 0 : page * pageSize + 1} -{" "}
          {Math.min((page + 1) * pageSize, processedRows.length)} of {processedRows.length} rows
        </span>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <button
            onClick={() => setPage(Math.max(0, page - 1))}
            disabled={page === 0}
            style={navBtnStyle}
          >
            ⬅ Prev
          </button>
          <span>
            Page {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
            disabled={page >= totalPages - 1}
            style={navBtnStyle}
          >
            Next ➡
          </button>
        </div>
      </div>
    </div>
  );
}

const thStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "10px 12px",
  background: "#f8fafc",
  fontWeight: "bold",
  textAlign: "left",
  position: "sticky",
  top: 0,
  zIndex: 1,
};

const tdStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "8px",
  minWidth: "100px",
};

const navBtnStyle: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: "8px",
  border: "none",
  background: "#334155",
  color: "white",
  cursor: "pointer",
};