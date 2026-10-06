interface Props {
  fileName: string;
  rows: number;
  sheets: number;
}

export default function FileInfo({
  fileName,
  rows,
  sheets,
}: Props) {
  return (
    <div
      style={{
        background: "#1e293b",
        padding: "20px",
        borderRadius: "12px",
        marginBottom: "20px",
      }}
    >
      <h2>📄 File Information</h2>

      <p><strong>Name:</strong> {fileName}</p>

      <p><strong>Rows:</strong> {rows}</p>

      <p><strong>Sheets:</strong> {sheets}</p>
    </div>
  );
}