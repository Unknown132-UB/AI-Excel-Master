import { Link } from "react-router-dom";

const navItems = [
  { to: "/", label: "📊 Dashboard" },
  { to: "/import", label: "📂 Import Data" },
  { to: "/workspace", label: "🛠️ Data Workspace" },
  { to: "/output", label: "💾 Final Output" },
  { to: "/templates", label: "📋 Templates" },
  { to: "/projects", label: "📁 Projects" },
  { to: "/workbook", label: "📗 Workbook" },
  { to: "/cleaning", label: "🧹 Data Cleaning" },
  { to: "/transform", label: "🔄 Transform" },
  { to: "/design", label: "🎨 Design" },
  { to: "/columns", label: "🏷 Column Properties" },
  { to: "/ai", label: "🤖 AI Assistant" },
  { to: "/charts", label: "📈 Charts" },
  { to: "/export", label: "💾 Export" },
  { to: "/reports", label: "📄 Reports" },
];

export default function Sidebar() {
  return (
    <aside
      style={{
        width: "240px",
        background: "#111827",
        color: "white",
        padding: "20px",
        overflowY: "auto",
      }}
    >
      <h2>📊 AI Excel Master</h2>

      <ul
        style={{
          listStyle: "none",
          padding: 0,
          marginTop: "30px",
        }}
      >
        {navItems.map((item) => (
          <li key={item.to} style={{ marginBottom: "12px" }}>
            <Link
              to={item.to}
              style={{
                color: "#94a3b8",
                textDecoration: "none",
                fontSize: "14px",
                display: "block",
                padding: "8px 12px",
                borderRadius: "8px",
              }}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </aside>
  );
}