import { useState } from "react";
import { useDataWorkspaceStore } from "../../store/dataWorkspaceStore";

export default function ProjectsPage() {
  const { projects, currentProjectId, saveProject, loadProject, clearAll, dataset } = useDataWorkspaceStore();
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [showSaveForm, setShowSaveForm] = useState(false);

  function handleSave() {
    if (!projectName.trim()) return;
    saveProject(projectName.trim(), projectDesc.trim() || undefined);
    setProjectName("");
    setProjectDesc("");
    setShowSaveForm(false);
  }

  return (
    <div>
      <h1>📁 Projects</h1>
      <p style={{ color: "#94a3b8", marginTop: "8px" }}>
        Save and manage your data analysis projects
      </p>

      {/* Save current project */}
      {dataset && (
        <div style={{ marginTop: "20px", background: "#1e293b", padding: "20px", borderRadius: "10px" }}>
          {!showSaveForm ? (
            <button
              onClick={() => setShowSaveForm(true)}
              style={{
                padding: "10px 20px",
                borderRadius: "8px",
                border: "none",
                background: "#3b82f6",
                color: "white",
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              💾 Save Current Project
            </button>
          ) : (
            <div>
              <h3>Save Project</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "15px" }}>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Project name (e.g. My Attendance Analysis Project)"
                  style={inputStyle}
                />
                <input
                  type="text"
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  placeholder="Description (optional)"
                  style={inputStyle}
                />
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={handleSave}
                    disabled={!projectName.trim()}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#3b82f6",
                      color: "white",
                      cursor: "pointer",
                      fontWeight: "500",
                    }}
                  >
                    Save Project
                  </button>
                  <button
                    onClick={() => setShowSaveForm(false)}
                    style={{
                      padding: "10px 20px",
                      borderRadius: "8px",
                      border: "none",
                      background: "#334155",
                      color: "white",
                      cursor: "pointer",
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Clear all */}
      {dataset && (
        <button
          onClick={clearAll}
          style={{
            marginTop: "15px",
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            background: "#7f1d1d",
            color: "white",
            cursor: "pointer",
          }}
        >
          🗑️ Clear All Data
        </button>
      )}

      {/* Projects list */}
      <div style={{ marginTop: "30px" }}>
        <h3>Saved Projects ({projects.length})</h3>

        {projects.length === 0 && (
          <div style={{ background: "#1e293b", padding: "30px", borderRadius: "10px", textAlign: "center", color: "#94a3b8", marginTop: "15px" }}>
            <div style={{ fontSize: "40px", marginBottom: "10px" }}>📁</div>
            <p>No saved projects yet. Import data and save your first project!</p>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "20px", marginTop: "15px" }}>
          {projects.map((project) => (
            <div
              key={project.id}
              style={{
                background: currentProjectId === project.id ? "#1e3a8a" : "#1e293b",
                padding: "20px",
                borderRadius: "10px",
                border: currentProjectId === project.id ? "2px solid #3b82f6" : "2px solid #334155",
              }}
            >
              <h3>{project.name}</h3>
              {project.description && (
                <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "5px" }}>{project.description}</p>
              )}
              <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "10px" }}>
                Created: {new Date(project.createdAt).toLocaleDateString()}
              </div>
              <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "4px" }}>
                {project.dataset.rows.length} rows • {project.dataset.headers.length} columns • {project.versions.length} versions
              </div>
              <div style={{ display: "flex", gap: "8px", marginTop: "15px" }}>
                <button
                  onClick={() => loadProject(project.id)}
                  style={{
                    flex: 1,
                    padding: "8px 16px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#3b82f6",
                    color: "white",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "13px",
                  }}
                >
                  Load Project
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "12px 14px",
  borderRadius: "8px",
  border: "none",
  background: "#111827",
  color: "white",
  width: "100%",
  maxWidth: "500px",
};