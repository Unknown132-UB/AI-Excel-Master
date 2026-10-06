import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router-dom";

import ImportRegistry from "../../modules/import/ImportRegistry";
import WebDataImporter from "../../modules/import/WebDataImporter";
import { useWorkbookStore } from "../../store/workbookStore";
import { useDataStore } from "../../store/dataStore";
import type { Dataset } from "../../types/dataset";

export default function ImportPage() {
  const navigate = useNavigate();
  const { setWorkbookData } = useWorkbookStore();
  const { saveDataset, isDataLoaded, activeFile, columns, rows } = useDataStore();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [webUrl, setWebUrl] = useState("");
  const [webLoading, setWebLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any[][] | null>(null);
  const [previewFile, setPreviewFile] = useState<string>("");
  const [saveMessage, setSaveMessage] = useState("");

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      setError("");
      setLoading(true);
      setSaveMessage("");

      try {
        const file = acceptedFiles[0];
        const importer = ImportRegistry.getEngine();
        const data = await importer.import(file);

        if (!data || data.length === 0) {
          throw new Error("No data found in file.");
        }

        // Store the preview data locally (not yet saved to workspace)
        setPreviewData(data);
        setPreviewFile(file.name);

        // Sync to workbook store for immediate preview
        setWorkbookData({
          fileName: file.name,
          sheetNames: ["Sheet1"],
          originalData: data,
          currentData: data,
        });

        setSaveMessage(`✅ File "${file.name}" loaded. Click "Save Dataset to Workspace" to make it available across all modules.`);
      } catch (err) {
        setError(`⚠️ Failed to load file: ${err instanceof Error ? err.message : "Unknown error"}`);
      } finally {
        setLoading(false);
      }
    },
    [setWorkbookData]
  );

  const handleSaveDataset = () => {
    if (!previewData || previewData.length === 0) {
      setSaveMessage("⚠️ No data to save. Please upload a file first.");
      return;
    }

    const headers = previewData[0].map((h: any, i: number) => String(h ?? `Column ${i + 1}`));
    const dataRows = previewData.slice(1);

    const dataset: Dataset = {
      headers,
      rows: dataRows,
      metadata: {
        fileName: previewFile,
        fileType: previewFile.split(".").pop()?.toLowerCase() || "unknown",
        fileSize: 0,
        importedAt: new Date().toISOString(),
        source: "file",
        rowCount: dataRows.length,
        columnCount: headers.length,
      },
    };

    saveDataset(dataset);
    setSaveMessage(`✅ Dataset saved successfully! "${previewFile}" is now available in all modules.`);
  };

  const onDropRejected = useCallback((fileRejections: any[]) => {
    const reasons = fileRejections
      .map((rej: any) => rej.errors?.map((e: any) => e.message).join(", ") || "Unknown error")
      .join("; ");
    setError(`⚠️ File rejected: ${reasons || "Unsupported file format"}`);
  }, []);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      "text/csv": [".csv", ".txt", ".tsv", ".text", ".tab", ".psv", ".dat", ".log", ".data", ".prn"],
      "text/plain": [".txt", ".csv", ".tsv", ".text", ".tab", ".psv", ".dat", ".log", ".data", ".prn"],
      "text/tab-separated-values": [".tsv", ".tab"],
      "application/csv": [".csv", ".txt", ".dat"],
      "application/octet-stream": [".dat", ".data", ".txt", ".csv", ".log", ".tsv"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "application/vnd.ms-excel": [".xls", ".xlsm", ".xlsb", ".csv"],
      "application/pdf": [".pdf"],
      "application/json": [".json"],
      "application/xml": [".xml"],
      "text/xml": [".xml"],
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"],
      "image/gif": [".gif"],
      "image/bmp": [".bmp"],
      "image/webp": [".webp"],
      "image/tiff": [".tiff", ".tif"],
    },
  });

  const handleWebImport = async () => {
    if (!webUrl.trim()) return;
    setWebLoading(true);
    setError("");
    setSaveMessage("");

    try {
      const importer = new WebDataImporter();
      const dataset = await importer.importFromUrl(webUrl.trim());

      // Store preview
      const fullData = [dataset.headers, ...dataset.rows];
      setPreviewData(fullData);
      setPreviewFile(dataset.metadata.fileName);

      // Sync to workbook store
      setWorkbookData({
        fileName: dataset.metadata.fileName,
        sheetNames: ["Sheet1"],
        originalData: fullData,
        currentData: fullData,
      });

      setSaveMessage(`✅ Web data loaded. Click "Save Dataset to Workspace" to make it available across all modules.`);
    } catch (err) {
      setError(`⚠️ Web import failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setWebLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "1000px" }}>
      <h1>📂 Universal Data Import</h1>
      <p style={{ color: "#94a3b8", marginTop: "8px" }}>
        Import data from files, web pages, or paste data directly
      </p>

      {error && (
        <div style={{ background: "#450a0a", padding: "15px", borderRadius: "8px", marginTop: "15px", color: "#fca5a5", fontSize: "14px" }}>
          {error}
        </div>
      )}

      {saveMessage && (
        <div style={{ background: "#064e3b", padding: "15px", borderRadius: "8px", marginTop: "15px", color: "#6ee7b7", fontSize: "14px" }}>
          {saveMessage}
        </div>
      )}

      {/* File Upload */}
      <div
        {...getRootProps()}
        style={{
          border: "2px dashed #3b82f6",
          padding: "50px",
          borderRadius: "12px",
          marginTop: "20px",
          cursor: "pointer",
          background: "#1e293b",
          opacity: loading ? 0.6 : 1,
        }}
      >
        <input {...getInputProps()} />
        <h2>{loading ? "⏳ Processing..." : "📁 Drag & Drop File"}</h2>
        <p>or click here to browse</p>
        <p style={{ color: "#94a3b8", marginTop: "12px", fontSize: "14px" }}>
          Supported: .xlsx, .xls, .csv, .txt, .tsv, .json, .xml, .pdf, .png, .jpg, .jpeg
        </p>
      </div>

      {/* Web Import */}
      <div style={{ marginTop: "30px", background: "#1e293b", padding: "25px", borderRadius: "12px" }}>
        <h3>🌐 Web Data Import</h3>
        <p style={{ color: "#94a3b8", marginTop: "8px", fontSize: "14px" }}>
          Import tables and data from any website URL
        </p>
        <div style={{ display: "flex", gap: "10px", marginTop: "15px" }}>
          <input
            type="url"
            value={webUrl}
            onChange={(e) => setWebUrl(e.target.value)}
            placeholder="https://example.com/data-table"
            style={{
              flex: 1,
              padding: "12px 14px",
              borderRadius: "8px",
              border: "none",
              background: "#111827",
              color: "white",
            }}
          />
          <button
            onClick={handleWebImport}
            disabled={webLoading || !webUrl.trim()}
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              border: "none",
              background: "#3b82f6",
              color: "white",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            {webLoading ? "⏳ Fetching..." : "Import ➤"}
          </button>
        </div>
      </div>

      {/* Preview & Save Section */}
      {previewData && previewData.length > 0 && (
        <div style={{ marginTop: "30px", background: "#1e293b", padding: "25px", borderRadius: "12px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "15px" }}>
            <div>
              <h3>📄 Preview: {previewFile}</h3>
              <p style={{ color: "#94a3b8", marginTop: "8px", fontSize: "14px" }}>
                {previewData.length - 1} rows • {previewData[0].length} columns
              </p>
            </div>
            <button
              onClick={handleSaveDataset}
              style={{
                padding: "14px 28px",
                borderRadius: "10px",
                border: "none",
                background: "#10b981",
                color: "white",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "15px",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.3)",
              }}
            >
              💾 Save Dataset to Workspace
            </button>
          </div>

          {/* Data preview table */}
          <div style={{ marginTop: "20px", overflowX: "auto", maxHeight: "300px", overflowY: "auto", borderRadius: "8px", border: "1px solid #334155" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#334155" }}>
                  {previewData[0].map((h: any, i: number) => (
                    <th key={i} style={{ padding: "10px 12px", textAlign: "left", color: "#e2e8f0", whiteSpace: "nowrap" }}>
                      {String(h ?? `Column ${i + 1}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewData.slice(1, 11).map((row: any[], rIdx: number) => (
                  <tr key={rIdx} style={{ borderTop: "1px solid #334155" }}>
                    {row.map((cell: any, cIdx: number) => (
                      <td key={cIdx} style={{ padding: "8px 12px", color: "#94a3b8", whiteSpace: "nowrap" }}>
                        {String(cell ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {previewData.length > 11 && (
            <p style={{ color: "#64748b", fontSize: "12px", marginTop: "8px" }}>
              Showing first 10 rows of {previewData.length - 1} total rows
            </p>
          )}
        </div>
      )}

      {/* Active Dataset Status */}
      {isDataLoaded && (
        <div style={{ marginTop: "30px", background: "#064e3b", padding: "20px", borderRadius: "12px" }}>
          <h3 style={{ color: "#6ee7b7" }}>✓ Active Dataset</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "15px", marginTop: "15px" }}>
            <div>
              <div style={{ color: "#94a3b8", fontSize: "12px" }}>File</div>
              <div style={{ color: "white", fontWeight: "500", marginTop: "4px" }}>{activeFile}</div>
            </div>
            <div>
              <div style={{ color: "#94a3b8", fontSize: "12px" }}>Rows</div>
              <div style={{ color: "white", fontWeight: "500", marginTop: "4px" }}>{rows.length}</div>
            </div>
            <div>
              <div style={{ color: "#94a3b8", fontSize: "12px" }}>Columns</div>
              <div style={{ color: "white", fontWeight: "500", marginTop: "4px" }}>{columns.length}</div>
            </div>
            <div>
              <div style={{ color: "#94a3b8", fontSize: "12px" }}>Status</div>
              <div style={{ color: "#6ee7b7", fontWeight: "500", marginTop: "4px" }}>✓ Loaded</div>
            </div>
          </div>
          <button
            onClick={() => navigate("/workspace")}
            style={{
              marginTop: "20px",
              padding: "12px 24px",
              borderRadius: "8px",
              border: "none",
              background: "#3b82f6",
              color: "white",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            📊 Open Data Workspace →
          </button>
        </div>
      )}

      {/* Supported formats */}
      <div style={{ marginTop: "30px" }}>
        <h3>Supported Formats</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "15px", marginTop: "15px" }}>
          {[
            { icon: "📗", name: "Excel", formats: ".xlsx, .xls" },
            { icon: "📄", name: "CSV", formats: ".csv, .txt, .tsv" },
            { icon: "📋", name: "JSON", formats: ".json" },
            { icon: "📝", name: "XML", formats: ".xml" },
            { icon: "📕", name: "PDF", formats: ".pdf" },
            { icon: "🖼️", name: "Images", formats: ".png, .jpg" },
            { icon: "🌐", name: "Web", formats: "URL" },
          ].map((f) => (
            <div key={f.name} style={{ background: "#1e293b", padding: "20px", borderRadius: "10px", textAlign: "center" }}>
              <div style={{ fontSize: "30px" }}>{f.icon}</div>
              <h4 style={{ marginTop: "10px" }}>{f.name}</h4>
              <p style={{ color: "#94a3b8", fontSize: "12px", marginTop: "5px" }}>{f.formats}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}