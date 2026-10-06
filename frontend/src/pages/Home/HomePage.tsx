import { useNavigate } from "react-router-dom";

export default function HomePage() {
  const navigate = useNavigate();

  const cards = [
    { title: "📂 Import Data", path: "/import", desc: "Excel, CSV, JSON, XML, PDF, Images, Web" },
    { title: "🛠️ Data Workspace", path: "/workspace", desc: "Preview, analyze, and transform data" },
    { title: "💾 Final Output", path: "/output", desc: "Export cleaned data in any format" },
    { title: "📋 Templates", path: "/templates", desc: "Ready-made workflows" },
    { title: "📁 Projects", path: "/projects", desc: "Save and manage projects" },
    { title: "🤖 AI Assistant", path: "/ai", desc: "Natural language data control" },
    { title: "📈 Charts", path: "/charts", desc: "Visualize your data" },
    { title: "📄 Reports", path: "/reports", desc: "Generate professional reports" },
  ];

  return (
    <>
      <h1>Welcome to AI Excel Master 🚀</h1>
      <p style={{ color: "#94a3b8", marginTop: "10px" }}>
        An AI-powered alternative to Excel + Power Query + Tableau + ChatGPT for data processing
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
          gap: "20px",
          marginTop: "40px",
        }}
      >
        {cards.map((card) => (
          <div
            key={card.title}
            onClick={() => navigate(card.path)}
            style={{
              background: "#1e293b",
              padding: "30px",
              borderRadius: "12px",
              textAlign: "center",
              cursor: "pointer",
              transition: "0.3s",
            }}
          >
            <h3>{card.title}</h3>
            <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "8px" }}>{card.desc}</p>
          </div>
        ))}
      </div>
    </>
  );
}