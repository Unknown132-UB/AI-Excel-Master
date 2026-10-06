import { useState } from "react";
import { useDataWorkspaceStore } from "../../store/dataWorkspaceStore";
import { useDataStore } from "../../store/dataStore";
import { useDropzone } from "react-dropzone";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  type?: "text" | "thinking" | "step" | "chart" | "report";
}

const presetPrompts = [
  { label: "🧹 Clean my data", prompt: "Clean this dataset - remove duplicates and fill empty cells" },
  { label: "📊 Analyze dataset", prompt: "Analyze this dataset and give me insights" },
  { label: "📈 Create charts", prompt: "Create charts for my data" },
  { label: "📄 Generate report", prompt: "Generate a comprehensive report" },
  { label: "💰 Calculate total", prompt: "Calculate total sales/revenue" },
  { label: "🔄 Create profit column", prompt: "Create a profit column (Revenue - Cost)" },
];

export default function AIAssistant() {
  const { applyAICommand, aiChartConfigs } = useDataWorkspaceStore();
  const { activeFile, isDataLoaded, columns, rows, saveDataset } = useDataStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const { getRootProps, getInputProps } = useDropzone({
    accept: {
      "application/pdf": [".pdf"],
      "image/*": [".png", ".jpg", ".jpeg", ".webp", ".gif"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls"],
      "text/csv": [".csv"],
    },
    maxFiles: 1,
    onDrop: async (files) => {
      if (files[0]) {
        setUploadedFile(files[0]);
        // Import the file into the central data store
        try {
          const ImportEngine = (await import("../../modules/import/ImportEngine")).default;
          const engine = new ImportEngine();
          const data = await engine.import(files[0]);
          if (data && data.length > 0) {
            const headers = data[0].map((h: any, i: number) => String(h ?? `Column ${i + 1}`));
            const dataRows = data.slice(1);
            saveDataset({
              headers,
              rows: dataRows,
              metadata: {
                fileName: files[0].name,
                fileType: files[0].name.split(".").pop()?.toLowerCase() || "unknown",
                fileSize: files[0].size,
                importedAt: new Date().toISOString(),
                source: "file",
                rowCount: dataRows.length,
                columnCount: headers.length,
              },
            });
          }
        } catch (err) {
          console.error("Failed to import file:", err);
        }
      }
    },
  });

  async function sendMessage(text?: string) {
    const userMessage = (text ?? input).trim();
    if (!userMessage) return;

    const newMessages: ChatMessage[] = [...messages, { role: "user", content: userMessage }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      // Add thinking indicator
      setMessages((prev) => [...prev, { role: "assistant", content: "🤔 Processing...", type: "thinking" }]);

      const result = await applyAICommand(userMessage);

      const response: ChatMessage = {
        role: "assistant",
        content: result.message,
        type: "text",
      };

      setMessages((prev) => [...prev.filter((m) => m.type !== "thinking"), response]);

      // Add chart configs as informational messages
      if (aiChartConfigs && aiChartConfigs.length > 0) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `📈 Generated ${aiChartConfigs.length} chart${aiChartConfigs.length > 1 ? "s" : ""}:\n${aiChartConfigs
              .map((c, i) => `${i + 1}. ${c.title} (${c.type.charAt(0).toUpperCase() + c.type.slice(1)})`)
              .join("\n")}`,
            type: "chart",
          },
        ]);
      }
    } catch (error) {
      setMessages((prev) => [
        ...prev.filter((m) => m.type !== "thinking"),
        {
          role: "assistant",
          content: `❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        },
      ]);
    }

    setLoading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div>
      <h3>🤖 AI Data Analyst</h3>
      <p style={{ color: "#94a3b8", marginTop: "5px", fontSize: "14px" }}>
        Autonomous AI agent that understands, plans, executes, and validates data operations.
      </p>

      {/* Current file info */}
      {isDataLoaded && (
        <div style={{ background: "#064e3b", borderRadius: "8px", padding: "12px 16px", marginTop: "15px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "20px" }}>📄</span>
            <div>
              <div style={{ color: "#6ee7b7", fontWeight: "500", fontSize: "14px" }}>{activeFile}</div>
              <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "2px" }}>
                Rows: {rows.length} | Columns: {columns.length}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File upload */}
      <div
        {...getRootProps()}
        style={{
          border: "2px dashed #334155",
          borderRadius: "12px",
          padding: "20px",
          textAlign: "center",
          cursor: "pointer",
          marginTop: "20px",
          background: "#0f172a",
        }}
      >
        <input {...getInputProps()} />
        <p style={{ color: "#64748b", fontSize: "13px" }}>
          {uploadedFile ? (
            <>📎 {uploadedFile.name}</>
          ) : (
            <>📤 Drop file here or click to upload (PDF, Image, Excel, CSV)</>
          )}
        </p>
      </div>

      {/* Preset prompts */}
      <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
        {presetPrompts.map((p) => (
          <button
            key={p.label}
            onClick={() => sendMessage(p.prompt)}
            disabled={loading || !isDataLoaded}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              border: "none",
              background: "#1e293b",
              color: "#e2e8f0",
              cursor: "pointer",
              fontWeight: "500",
              fontSize: "13px",
              opacity: !isDataLoaded ? 0.4 : 1,
            }}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Chat window */}
      <div
        style={{
          background: "#111827",
          borderRadius: "12px",
          marginTop: "20px",
          padding: "20px",
          minHeight: "350px",
          display: "flex",
          flexDirection: "column",
          maxHeight: "55vh",
        }}
      >
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "15px" }}>
          {messages.length === 0 && (
            <div style={{ color: "#64748b", textAlign: "center", marginTop: "40px" }}>
              <div style={{ fontSize: "40px", marginBottom: "10px" }}>🤖</div>
              <p>Ask me to perform complete data analysis workflows!</p>
              <p style={{ fontSize: "13px", marginTop: "8px" }}>
                Try: "Clean this dataset, analyze sales, create charts and generate a report"
              </p>
            </div>
          )}

          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "80%",
                  padding: "12px 16px",
                  borderRadius: "12px",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.6,
                  fontSize: "14px",
                  background: msg.role === "user" ? "#3b82f6" : "#1e293b",
                  color: "white",
                }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              <div style={{ padding: "12px 16px", borderRadius: "12px", background: "#1e293b", color: "#94a3b8" }}>
                <span>🤖 Processing command...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your instruction... (e.g. 'Clean and analyze this dataset')"
            rows={2}
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: "8px",
              border: "none",
              background: "#1e293b",
              color: "white",
              resize: "none",
              fontFamily: "inherit",
            }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim() || !isDataLoaded}
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              border: "none",
              background: "#3b82f6",
              color: "white",
              cursor: "pointer",
              fontWeight: "500",
              alignSelf: "flex-end",
              opacity: !isDataLoaded ? 0.4 : 1,
            }}
          >
            Send ➤
          </button>
        </div>
      </div>
    </div>
  );
}