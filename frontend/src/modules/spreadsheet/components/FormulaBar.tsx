import { useState } from "react";

interface FormulaBarProps {
  value?: string;
  onChange?: (value: string) => void;
}

export default function FormulaBar({
  value = "",
  onChange,
}: FormulaBarProps) {
  const [formula, setFormula] = useState(value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormula(e.target.value);

    if (onChange) {
      onChange(e.target.value);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "10px",
        background: "#1e293b",
        padding: "10px",
        borderRadius: "8px",
        marginBottom: "15px",
      }}
    >
      <div
        style={{
          color: "#60a5fa",
          fontWeight: "bold",
          fontSize: "18px",
        }}
      >
        fx
      </div>

      <input
        type="text"
        value={formula}
        onChange={handleChange}
        placeholder="Enter value or formula..."
        style={{
          flex: 1,
          padding: "10px",
          borderRadius: "6px",
          border: "1px solid #334155",
          background: "#0f172a",
          color: "white",
          outline: "none",
        }}
      />
    </div>
  );
}