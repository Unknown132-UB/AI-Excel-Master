interface Props {
  data: Record<string, any>[];
}

export default function ExcelTable({ data }: Props) {
  if (data.length === 0) return null;

  return (
    <div
      style={{
        overflow: "auto",
        maxHeight: "600px",
      }}
    >
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          background: "white",
          color: "black",
        }}
      >
        <thead>
          <tr>
            {Object.keys(data[0]).map((column) => (
              <th
                key={column}
                style={{
                  border: "1px solid #ddd",
                  padding: "10px",
                  position: "sticky",
                  top: 0,
                  background: "#e5e7eb",
                }}
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>

        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {Object.values(row).map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  style={{
                    border: "1px solid #ddd",
                    padding: "8px",
                  }}
                >
                  {String(cell)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}