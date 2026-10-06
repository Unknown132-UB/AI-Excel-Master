import { useState } from "react";
import { useDataWorkspaceStore } from "../../store/dataWorkspaceStore";
import { useDataStore } from "../../store/dataStore";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  type?: "text" | "thinking" | "chart" | "report";
}

const presetPrompts = [
  { label: "🧹 Clean my data", prompt: "Clean this dataset - remove duplicates and fill empty cells" },
  { label: "📊 Analyze dataset", prompt: "Analyze this dataset and give me insights" },
  { label: "📈 Create charts", prompt: "Create charts for my data" },
  { label: "📄 Generate report", prompt: "Generate a comprehensive report" },
  { label: "💰 Calculate total", prompt: "Calculate total sales/revenue" },
  { label: "🔄 Create profit column", prompt: "Create a profit column (Revenue - Cost)" },
];

export default function AIPage() {
  const { applyAICommand, aiChartConfigs, aiThinking, aiSteps } = useDataWorkspaceStore();
  const { activeFile, isDataLoaded, columns, rows } = useDataStore();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

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
    <div style={{ maxWidth: "900px" }}>
      <h1>🤖 AI Command Center</h1>
      <p style={{ color: "#94a3b8", marginTop: "10px", fontSize: "14px" }}>
        Autonomous AI agent that understands, plans, executes, and validates data operations automatically.
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

      {!isDataLoaded && (
        <div style={{ textAlign: "center", padding: "40px 20px" }}>
          <div style={{ fontSize: "50px", marginBottom: "15px" }}>📭</div>
          <h2 style={{ color: "#e2e8f0" }}>No dataset saved</h2>
          <p style={{ color: "#94a3b8", marginTop: "10px", fontSize: "15px" }}>
            Please upload and save a dataset first.
          </p>
          <a
            href="/import"
            style={{
              display: "inline-block",
              marginTop: "20px",
              padding: "12px 24px",
              background: "#3b82f6",
              color: "white",
              borderRadius: "8px",
              textDecoration: "none",
              fontWeight: "500",
            }}
          >
            📂 Go to Import
          </a>
        </div>
      )}

      {/* Preset prompts */}
      <div style={{ display: "flex", gap: "10px", marginTop: "25px", flexWrap: "wrap" }}>
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

      {/* Execution status */}
      {(aiThinking || aiSteps.length > 0) && (
        <div style={{ marginTop: "20px", background: "#111827", borderRadius: "12px", padding: "20px" }}>
          <h4 style={{ color: "#94a3b8", marginBottom: "10px" }}>⚡ Execution Status</h4>
          {aiThinking && (
            <p style={{ color: "#f59e0b", fontSize: "14px", marginBottom: "10px" }}>{aiThinking}</p>
          )}
          {aiSteps.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {aiSteps.map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                  <span>
                    {step.status === "completed" ? "✅" : step.status === "failed" ? "❌" : "⏳"}
                  </span>
                  <span style={{ color: step.status === "completed" ? "#22c55e" : step.status === "failed" ? "#ef4444" : "#f59e0b" }}>
                    {step.description}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Chat window */}
      <div
        style={{
          background: "#111827",
          borderRadius: "12px",
          marginTop: "25px",
          padding: "20px",
          minHeight: "400px",
          display: "flex",
          flexDirection: "column",
          maxHeight: "60vh",
        }}
      >
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "15px" }}>
          {messages.length === 0 && (
            <div style={{ color: "#64748b", textAlign: "center", marginTop: "80px" }}>
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