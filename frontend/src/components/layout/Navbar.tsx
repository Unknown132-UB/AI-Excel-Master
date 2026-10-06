export default function Navbar() {
  return (
    <header
      style={{
        height: "70px",
        background: "#1e293b",
        color: "white",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 25px",
        borderBottom: "1px solid #334155",
      }}
    >
      <h2>AI Excel Master</h2>

      <div style={{ display: "flex", gap: "15px" }}>
        <button>🌙</button>
        <button>⚙️</button>
      </div>
    </header>
  );
}