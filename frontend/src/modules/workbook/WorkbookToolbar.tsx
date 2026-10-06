import { useNavigate } from "react-router-dom";

export default function WorkbookToolbar() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        gap: "10px",
        marginTop: "15px",
        flexWrap: "wrap",
      }}
    >
      <button
        onClick={() => navigate("/cleaning")}
        style={btnStyle}
      >
        🧹 Clean Data
      </button>

      <button
        onClick={() => navigate("/ai")}
        style={btnStyle}
      >
        🤖 AI Assistant
      </button>

      <button
        onClick={() => navigate("/charts")}
        style={btnStyle}
      >
        📈 Charts
      </button>

      <button
        onClick={() => navigate("/export")}
        style={btnStyle}
      >
        💾 Export
      </button>
    </div>
  );
}

const btnStyle: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: "8px",
  border: "none",
  background: "#334155",
  color: "white",
  cursor: "pointer",
  fontWeight: "500",
};