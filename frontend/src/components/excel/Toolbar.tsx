import { useNavigate } from "react-router-dom";

interface Props {
  onSearch: (value: string) => void;
}

export default function Toolbar({ onSearch }: Props) {
  const navigate = useNavigate();

  return (
    <div
      style={{
        display: "flex",
        gap: "15px",
        marginBottom: "20px",
      }}
    >
      <input
        type="text"
        placeholder="Search..."
        onChange={(e) => onSearch(e.target.value)}
        style={{
          flex: 1,
          padding: "12px",
          borderRadius: "8px",
        }}
      />

      <button
        onClick={() => navigate("/export")}
        style={{
          padding: "12px 20px",
          borderRadius: "8px",
          border: "none",
          background: "#3b82f6",
          color: "white",
          cursor: "pointer",
          fontWeight: "500",
        }}
      >
        Export
      </button>
    </div>
  );
}