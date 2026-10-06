import { useState } from "react";
import { useNavigate } from "react-router-dom";
import TemplateRegistry from "../../modules/templates/TemplateRegistry";
import type { Template } from "../../types/workflow";

export default function TemplatesPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const templates = TemplateRegistry.getAll();
  const categories = ["All", ...TemplateRegistry.getCategories()];

  const filteredTemplates = selectedCategory === "All"
    ? templates
    : templates.filter((t) => t.category === selectedCategory);

  function useTemplate(_template: Template) {
    // Navigate to import page with template context
    navigate("/import");
  }

  return (
    <div>
      <h1>📋 Workflow Templates</h1>
      <p style={{ color: "#94a3b8", marginTop: "8px" }}>
        Ready-made workflows for common data tasks. Each template applies cleaning, transformation, analysis, and reporting automatically.
      </p>

      {/* Category filter */}
      <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              border: "none",
              background: selectedCategory === cat ? "#3b82f6" : "#1e293b",
              color: "white",
              cursor: "pointer",
              fontWeight: "500",
              fontSize: "13px",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Templates grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginTop: "25px" }}>
        {filteredTemplates.map((template) => (
          <div
            key={template.id}
            style={{
              background: "#1e293b",
              padding: "25px",
              borderRadius: "12px",
              border: "2px solid #334155",
              transition: "0.2s",
            }}
          >
            <div style={{ fontSize: "40px" }}>{template.icon}</div>
            <h3 style={{ marginTop: "12px" }}>{template.name}</h3>
            <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "8px", lineHeight: 1.5 }}>
              {template.description}
            </p>

            <div style={{ marginTop: "15px" }}>
              <div style={{ color: "#64748b", fontSize: "12px", fontWeight: "bold" }}>WORKFLOW STEPS</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginTop: "8px" }}>
                {template.steps.map((step, idx) => (
                  <div key={step.id} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#cbd5e1" }}>
                    <span style={{ color: "#3b82f6", fontWeight: "bold" }}>{idx + 1}.</span>
                    <span>{step.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {template.suggestedColumns && (
              <div style={{ marginTop: "15px" }}>
                <div style={{ color: "#64748b", fontSize: "12px", fontWeight: "bold" }}>EXPECTED COLUMNS</div>
                <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "8px" }}>
                  {template.suggestedColumns.map((col) => (
                    <span
                      key={col}
                      style={{
                        padding: "3px 8px",
                        borderRadius: "4px",
                        fontSize: "11px",
                        background: "#334155",
                        color: "#cbd5e1",
                      }}
                    >
                      {col}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => useTemplate(template)}
              style={{
                marginTop: "20px",
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                background: "#3b82f6",
                color: "white",
                cursor: "pointer",
                fontWeight: "500",
                width: "100%",
              }}
            >
              Use Template →
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}