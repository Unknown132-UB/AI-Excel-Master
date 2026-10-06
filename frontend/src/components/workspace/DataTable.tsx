import { useMemo, useState } from "react";
import type { Dataset } from "../../types/dataset";

interface DataTableProps {
  dataset: Dataset;
}

export default function DataTable({ dataset }: DataTableProps) {
  const [search, setSearch] = useState("");
  const [sortCol, setSortCol] = useState<number | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(0);
  const pageSize = 50;

  const { headers, rows } = dataset;

  const processedRows = useMemo(() => {
    let result = rows;
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
  }, [rows, search, sortCol, sortDir]);

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

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "15px", flexWrap: "wrap" }}>
        <input
          type="text"
          placeholder="🔍 Search data..."
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
          Showing {processedRows.length} of {rows.length} rows
        </span>
      </div>

      {/* Table */}
      <div style={{ overflow: "auto", background: "#ffffff", color: "#000", borderRadius: "10px", maxHeight: "65vh" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={thStyle}>#</th>
              {headers.map((header, col) => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  style={{ ...thStyle, cursor: "pointer", userSelect: "none" }}
                  title="Click to sort"
                >
                  {header}
                  {sortCol === col ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, rowIndex) => {
              const actualRowIndex = page * pageSize + rowIndex;
              return (
                <tr key={actualRowIndex} style={{ background: rowIndex % 2 === 0 ? "#ffffff" : "#f8fafc" }}>
                  <td style={tdStyle}>{actualRowIndex + 1}</td>
                  {row.map((cell, col) => (
                    <td key={col} style={tdStyle}>
                      {cell instanceof Date ? cell.toLocaleString() : String(cell ?? "")}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "15px", color: "#94a3b8" }}>
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
          <span>Page {page + 1} / {totalPages}</span>
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