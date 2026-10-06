import { useMemo, useState } from "react";
import Spreadsheet from "../../modules/spreadsheet/Spreadsheet";
import CleaningRegistry from "../../modules/cleaning/CleaningRegistry";
import ConditionalColumnEngine from "../../modules/cleaning/ConditionalColumnEngine";
import { useDataStore } from "../../store/dataStore";

interface PipelineStep {
  id: string;
  name: string;
  label: string;
  category: string;
  options?: any;
}

export default function CleaningPage() {
  const { currentData, isDataLoaded, updateDataset, undo, redo, versions, currentVersionId, activeFile, columns, rows } = useDataStore();
  const [message, setMessage] = useState("");
  const [selectedColumns, setSelectedColumns] = useState<Set<number>>(new Set());
  const [selectMode, setSelectMode] = useState(false);
  const [splitCol, setSplitCol] = useState<number | null>(null);
  const [splitDelimiter, setSplitDelimiter] = useState(",");
  const [splitColName, setSplitColName] = useState("");
  const [condColName, setCondColName] = useState("");
  const [condSourceCol, setCondSourceCol] = useState<number | null>(null);
  const [condSourceCol2, setCondSourceCol2] = useState<number | null>(null);
  const [condOperator, setCondOperator] = useState("<=");
  const [condValue, setCondValue] = useState("");
  const [condTrueValue, setCondTrueValue] = useState("");
  const [condFalseValue, setCondFalseValue] = useState("");
  const [condNaturalLanguage, setCondNaturalLanguage] = useState("");
  const [condEngine] = useState(() => new ConditionalColumnEngine());

  // Multi-feature pipeline state
  const [pipeline, setPipeline] = useState<PipelineStep[]>([]);
  const [selectedFeature, setSelectedFeature] = useState<string>("");
  const [fillValue, setFillValue] = useState("");
  const [caseType, setCaseType] = useState<string>("uppercase");
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");

  // Always use authoritative store data — never a local shadow copy
  const data = currentData.length > 0 ? currentData : [];
  const engine = useMemo(() => CleaningRegistry.getEngine(), []);

  const headers: string[] =
    data.length > 0 ? data[0].map((h: any, i: number) => String(h ?? `Column ${i + 1}`)) : [];

  // All available cleaning features
  const allFeatures: PipelineStep[] = [
    // Duplicate & Empty Data
    { id: "removeduplicaterows", name: "removeduplicaterows", label: "Remove Duplicate Rows", category: "Duplicate & Empty" },
    { id: "removeduplicatecolumns", name: "removeduplicatecolumns", label: "Remove Duplicate Columns", category: "Duplicate & Empty" },
    { id: "removeemptyrows", name: "removeemptyrows", label: "Remove Empty Rows", category: "Duplicate & Empty" },
    { id: "removeemptycolumns", name: "removeemptycolumns", label: "Remove Empty Columns", category: "Duplicate & Empty" },

    // Text Cleaning
    { id: "trimspaces", name: "trimspaces", label: "Trim Spaces", category: "Text Cleaning" },
    { id: "removeextraspaces", name: "removeextraspaces", label: "Remove Extra Spaces", category: "Text Cleaning" },
    { id: "removespecialcharacters", name: "removespecialcharacters", label: "Remove Special Characters", category: "Text Cleaning" },
    { id: "normalizetext", name: "normalizetext", label: "Normalize Text", category: "Text Cleaning" },
    { id: "findreplace", name: "findreplace", label: "Find & Replace", category: "Text Cleaning", options: { find: "", replace: "" } },

    // Missing Data
    { id: "fillemptycells", name: "fillemptycells", label: "Fill Empty Cells", category: "Missing Data", options: { method: "value", value: "" } },

    // Data Type Conversion
    { id: "converttonumber", name: "converttonumber", label: "Convert to Number", category: "Data Type Conversion" },
    { id: "converttodate", name: "converttodate", label: "Convert to Date", category: "Data Type Conversion", options: { output: "string" } },
    { id: "converttoboolean", name: "converttoboolean", label: "Convert to Boolean", category: "Data Type Conversion" },
  ];

  const categories = Array.from(new Set(allFeatures.map((f) => f.category)));

  function toggleColumn(col: number) {
    setSelectedColumns((prev) => {
      const next = new Set(prev);
      if (next.has(col)) {
        next.delete(col);
      } else {
        next.add(col);
      }
      return next;
    });
  }

  function selectAll() {
    setSelectedColumns(new Set(headers.map((_, i) => i)));
  }

  function clearSelection() {
    setSelectedColumns(new Set());
  }

  function addToPipeline() {
    if (!selectedFeature) {
      setMessage("⚠️ Please select a cleaning feature to add.");
      return;
    }

    const feature = allFeatures.find((f) => f.id === selectedFeature);
    if (!feature) return;

    let options = feature.options ? { ...feature.options } : undefined;

    // Apply user-configured options
    if (feature.id === "fillemptycells") {
      options = { method: fillValue ? "value" : "zero", value: fillValue || "" };
    } else if (feature.id === "normalizetext") {
      options = { caseType };
    } else if (feature.id === "findreplace") {
      if (!findText) {
        setMessage("⚠️ Please enter text to find for Find & Replace.");
        return;
      }
      options = { find: findText, replace: replaceText };
    }

    const step: PipelineStep = {
      ...feature,
      options,
    };

    setPipeline((prev) => [...prev, step]);
    setSelectedFeature("");
    setMessage(`✅ Added "${feature.label}" to pipeline.`);
  }

  function removeFromPipeline(index: number) {
    setPipeline((prev) => prev.filter((_, i) => i !== index));
  }

  function clearPipeline() {
    setPipeline([]);
    setMessage("🧹 Pipeline cleared.");
  }

  function moveStep(index: number, direction: -1 | 1) {
    setPipeline((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function runPipeline() {
    if (!isDataLoaded || data.length === 0) {
      setMessage("⚠️ No dataset saved. Please upload and save a dataset first.");
      return;
    }

    if (pipeline.length === 0) {
      setMessage("⚠️ Please add at least one cleaning feature to the pipeline.");
      return;
    }

    // Apply to selected columns only, or all columns if none selected
    const targetColumns =
      selectedColumns.size > 0 ? Array.from(selectedColumns) : headers.map((_, i) => i);

    let workingData = data.map((row: any[]) => [...row]);

    for (const step of pipeline) {
      // Row/column level operations apply to whole dataset
      const rowLevelOps = ["removeduplicaterows", "removeduplicatecolumns", "removeemptyrows", "removeemptycolumns"];

      if (rowLevelOps.includes(step.name)) {
        const result = engine.execute(step.name, workingData, step.options);
        if (result.success) {
          workingData = result.data;
        } else {
          setMessage(`❌ Failed at "${step.label}": ${result.message || "Unknown error"}`);
          return;
        }
      } else {
        // Cell-level operations apply to selected columns
        workingData = workingData.map((row: any[], rIdx: number) => {
          if (rIdx === 0) return [...row]; // keep header row unchanged
          const newRow = [...row];
          targetColumns.forEach((col) => {
            if (col < newRow.length) {
              const singleCell = [[newRow[col]]];
              const result = engine.execute(step.name, singleCell, step.options);
              if (result.success) {
                newRow[col] = result.data[0][0];
              }
            }
          });
          return newRow;
        });
      }
    }

    // Commit to authoritative store
    updateDataset(workingData, `Pipeline: ${pipeline.map((s) => s.label).join(", ")}`, "cleaning");
    setMessage(`✅ Pipeline executed: ${pipeline.length} feature(s) applied to ${targetColumns.length} column(s). Data saved.`);
  }

  function runCleaning(name: string, options?: any) {
    if (!isDataLoaded || data.length === 0) {
      setMessage("⚠️ No dataset saved. Please upload and save a dataset first.");
      return;
    }

    // Apply to selected columns only, or all columns if none selected
    const targetColumns =
      selectedColumns.size > 0 ? Array.from(selectedColumns) : headers.map((_, i) => i);

    const source = data;
    const finalData = source.map((row: any[], rIdx: number) => {
      if (rIdx === 0) return [...row]; // keep header row unchanged
      const newRow = [...row];
      targetColumns.forEach((col) => {
        if (col < newRow.length) {
          const singleCell = [[newRow[col]]];
          const result = engine.execute(name, singleCell, options);
          if (result.success) {
            newRow[col] = result.data[0][0];
          }
        }
      });
      return newRow;
    });

    // Commit to authoritative store
    updateDataset(finalData, name, "cleaning");
    setMessage(`✅ ${name} applied to ${targetColumns.length} column(s). Data saved.`);
  }

  function runFill(method: "value" | "zero" | "na" | "previous" | "next", value?: any) {
    runCleaning("fillemptycells", { method, value });
  }

  function addConditionalColumn() {
    if (!condColName.trim()) {
      setMessage("⚠️ Please enter a column name.");
      return;
    }
    if (condSourceCol === null) {
      setMessage("⚠️ Please select a source column.");
      return;
    }
    if (!condValue && condOperator !== "==" && condOperator !== "!=") {
      setMessage("⚠️ Please enter a comparison value.");
      return;
    }

    const source = data;
    if (source.length === 0) {
      setMessage("⚠️ No data to process.");
      return;
    }

    const sourceHeaders = source[0];
    const sourceColName = String(sourceHeaders[condSourceCol] ?? `Column ${condSourceCol + 1}`);
    const sourceCol2Name = condSourceCol2 !== null ? String(sourceHeaders[condSourceCol2] ?? `Column ${condSourceCol2 + 1}`) : null;

    // Build condition expression
    let condition = "";
    if (sourceCol2Name) {
      condition = `${sourceColName} ${condOperator} ${sourceCol2Name}`;
    } else {
      condition = `${sourceColName} ${condOperator} ${condValue}`;
    }

    const config = {
      columnName: condColName.trim(),
      sourceColumns: sourceCol2Name ? [sourceColName, sourceCol2Name] : [sourceColName],
      condition,
      trueValue: condTrueValue || "True",
      falseValue: condFalseValue || "False",
    };

    const result = condEngine.addColumn(source, config);
    updateDataset(result, `Add column ${condColName}`, "transform");
    setMessage(`✅ Column "${condColName}" added with condition: ${condition}`);
    setCondColName("");
    setCondValue("");
    setCondTrueValue("");
    setCondFalseValue("");
  }

  function addConditionalColumnNaturalLanguage() {
    if (!condNaturalLanguage.trim()) {
      setMessage("⚠️ Please enter a condition description.");
      return;
    }

    const source = data;
    if (source.length === 0) {
      setMessage("⚠️ No data to process.");
      return;
    }

    const sourceHeaders = source[0];
    const config = condEngine.parseNaturalLanguage(condNaturalLanguage, sourceHeaders);

    if (!config) {
      setMessage("⚠️ Could not understand the condition. Try: 'Add column Status: if outtime - intime <= 5 then Halftime else Fulltime'");
      return;
    }

    const result = condEngine.addColumn(source, config);
    updateDataset(result, `Add column ${config.columnName}`, "transform");
    setMessage(`✅ Column "${config.columnName}" added with condition: ${config.condition}`);
    setCondNaturalLanguage("");
  }

  function splitColumn() {
    if (splitCol === null) {
      setMessage("⚠️ Please select a column to split.");
      return;
    }
    if (!splitDelimiter.trim()) {
      setMessage("⚠️ Please enter a delimiter (e.g. , | ; tab).");
      return;
    }

    const source = data;
    if (source.length === 0) {
      setMessage("⚠️ No data to split.");
      return;
    }

    const delimiter = splitDelimiter === "\\t" ? "\t" : splitDelimiter;
    const newData: any[][] = [];

    source.forEach((row: any[], rIdx: number) => {
      if (rIdx === 0) {
        // Split header
        const headerVal = String(row[splitCol] ?? "");
        const parts = headerVal.split(delimiter);
        const newRow = [...row];
        newRow.splice(splitCol, 1, ...parts.map((p, i) => (i === 0 ? p.trim() : `${splitColName || "Split"}_${i + 1}`)));
        newData.push(newRow);
      } else {
        const cellVal = String(row[splitCol] ?? "");
        const parts = cellVal.split(delimiter);
        const newRow = [...row];
        newRow.splice(splitCol, 1, ...parts.map((p) => p.trim()));
        newData.push(newRow);
      }
    });

    updateDataset(newData, `Split column ${headers[splitCol]}`, "transform");
    setMessage(`✅ Column "${headers[splitCol]}" split by "${delimiter}" into ${newData[0].length} columns.`);
    setSplitCol(null);
    setSplitDelimiter(",");
  }

  const textButtons = [
    { label: "Trim Spaces", action: () => runCleaning("trimspaces") },
    { label: "Remove Extra Spaces", action: () => runCleaning("removeextraspaces") },
    { label: "Remove Special Characters", action: () => runCleaning("removespecialcharacters") },
    { label: "Normalize Text", action: () => runCleaning("normalizetext") },
    { label: "Uppercase", action: () => runCleaning("normalizetext", { caseType: "uppercase" }) },
    { label: "Lowercase", action: () => runCleaning("normalizetext", { caseType: "lowercase" }) },
    { label: "Title Case", action: () => runCleaning("normalizetext", { caseType: "proper" }) },
  ];

  const dataButtons = [
    { label: "Remove Duplicate Rows", action: () => runCleaning("removeduplicaterows") },
    { label: "Remove Duplicate Columns", action: () => runCleaning("removeduplicatecolumns") },
    { label: "Remove Empty Rows", action: () => runCleaning("removeemptyrows") },
    { label: "Remove Empty Columns", action: () => runCleaning("removeemptycolumns") },
  ];

  const fillButtons = [
    { label: "Fill Empty (Default)", action: () => runFill("value", "") },
    { label: "Fill Empty (Zero)", action: () => runFill("zero") },
    { label: "Fill Empty (N/A)", action: () => runFill("na") },
    { label: "Fill from Previous", action: () => runFill("previous") },
    { label: "Fill from Next", action: () => runFill("next") },
  ];

  const conversionButtons = [
    { label: "Convert to Number", action: () => runCleaning("converttonumber") },
    { label: "Convert to Date", action: () => runCleaning("converttodate", { output: "string" }) },
    { label: "Convert to Boolean", action: () => runCleaning("converttoboolean") },
  ];

  return (
    <div>
      <h1>🧹 Data Cleaning</h1>

      {/* Active dataset info */}
      {isDataLoaded && (
        <div style={{ background: "#064e3b", padding: "15px 20px", borderRadius: "10px", marginTop: "15px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <strong style={{ color: "#6ee7b7" }}>✓ Active Dataset: {activeFile}</strong>
            <span style={{ marginLeft: "15px", color: "#d1d5db", fontSize: "13px" }}>
              {rows.length} rows • {columns.length} columns
            </span>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={undo}
              disabled={!versions.length || versions.findIndex((v) => v.id === currentVersionId) <= 0}
              style={{ ...toggleBtn, opacity: !versions.length || versions.findIndex((v) => v.id === currentVersionId) <= 0 ? 0.4 : 1 }}
            >
              ↩️ Undo
            </button>
            <button
              onClick={redo}
              disabled={!versions.length || versions.findIndex((v) => v.id === currentVersionId) >= versions.length - 1}
              style={{ ...toggleBtn, opacity: !versions.length || versions.findIndex((v) => v.id === currentVersionId) >= versions.length - 1 ? 0.4 : 1 }}
            >
              ↪️ Redo
            </button>
          </div>
        </div>
      )}

      {!isDataLoaded && (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
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

      {message && (
        <div style={{ background: "#1e293b", padding: "15px", borderRadius: "8px", marginBottom: "20px", color: "#60a5fa", marginTop: "15px" }}>
          {message}
        </div>
      )}

      {isDataLoaded && data.length > 0 && (
        <>
          {/* Column Selection */}
          <div style={{ background: "#1e293b", padding: "15px", borderRadius: "8px", marginTop: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <strong style={{ color: "#e2e8f0" }}>🛠 Column Selection</strong>
                <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>
                  Click column headers to select multiple columns. If none selected, applies to all columns.
                </p>
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={() => setSelectMode(!selectMode)} style={toggleBtn}>
                  {selectMode ? "🔒 Done Selecting" : "🔓 Select Columns"}
                </button>
                <button onClick={selectAll} style={toggleBtn}>Select All</button>
                <button onClick={clearSelection} style={toggleBtn}>Clear</button>
              </div>
            </div>

            {headers.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px" }}>
                {headers.map((header, i) => (
                  <button
                    key={i}
                    onClick={() => toggleColumn(i)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "6px",
                      border: "none",
                      cursor: "pointer",
                      fontSize: "12px",
                      background: selectedColumns.has(i) ? "#3b82f6" : "#334155",
                      color: "white",
                    }}
                  >
                    {selectedColumns.has(i) ? "☑" : "☐"} {header}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Multi-Feature Pipeline */}
          <div style={{ background: "#1e293b", padding: "15px", borderRadius: "8px", marginTop: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <strong style={{ color: "#e2e8f0" }}>⚙️ Multi-Feature Cleaning Pipeline</strong>
                <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>
                  Select multiple cleaning features and run them all together on your data.
                </p>
              </div>
              {pipeline.length > 0 && (
                <button onClick={clearPipeline} style={{ ...toggleBtn, background: "#ef4444" }}>
                  🗑 Clear Pipeline
                </button>
              )}
            </div>

            {/* Feature selector */}
            <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap", alignItems: "center" }}>
              <select
                value={selectedFeature}
                onChange={(e) => setSelectedFeature(e.target.value)}
                style={{ ...inputStyle, minWidth: "220px" }}
              >
                <option value="">Select cleaning feature...</option>
                {categories.map((cat) => (
                  <optgroup key={cat} label={cat}>
                    {allFeatures
                      .filter((f) => f.category === cat)
                      .map((f) => (
                        <option key={f.id} value={f.id}>{f.label}</option>
                      ))}
                  </optgroup>
                ))}
              </select>

              {/* Feature-specific options */}
              {selectedFeature === "fillemptycells" && (
                <input
                  type="text"
                  value={fillValue}
                  onChange={(e) => setFillValue(e.target.value)}
                  placeholder="Fill value (empty = zero)"
                  style={{ ...inputStyle, width: "180px" }}
                />
              )}
              {selectedFeature === "normalizetext" && (
                <select value={caseType} onChange={(e) => setCaseType(e.target.value)} style={inputStyle}>
                  <option value="uppercase">UPPERCASE</option>
                  <option value="lowercase">lowercase</option>
                  <option value="proper">Title Case</option>
                </select>
              )}
              {selectedFeature === "findreplace" && (
                <>
                  <input
                    type="text"
                    value={findText}
                    onChange={(e) => setFindText(e.target.value)}
                    placeholder="Find text"
                    style={{ ...inputStyle, width: "120px" }}
                  />
                  <input
                    type="text"
                    value={replaceText}
                    onChange={(e) => setReplaceText(e.target.value)}
                    placeholder="Replace with"
                    style={{ ...inputStyle, width: "120px" }}
                  />
                </>
              )}

              <button onClick={addToPipeline} style={primaryBtn}>➕ Add to Pipeline</button>
            </div>

            {/* Pipeline steps */}
            {pipeline.length > 0 && (
              <div style={{ marginTop: "15px", borderTop: "1px solid #334155", paddingTop: "15px" }}>
                <strong style={{ color: "#e2e8f0", fontSize: "14px" }}>
                  📋 Pipeline Steps ({pipeline.length})
                </strong>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
                  {pipeline.map((step, index) => (
                    <div
                      key={`${step.id}-${index}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                        background: "#334155",
                        padding: "10px 14px",
                        borderRadius: "8px",
                        flexWrap: "wrap",
                      }}
                    >
                      <span style={{ color: "#94a3b8", fontSize: "13px", minWidth: "24px" }}>
                        {index + 1}.
                      </span>
                      <span style={{ color: "#e2e8f0", fontWeight: "500", flex: 1, minWidth: "150px" }}>
                        {step.label}
                      </span>
                      <span style={{ color: "#60a5fa", fontSize: "12px", background: "#1e293b", padding: "3px 8px", borderRadius: "4px" }}>
                        {step.category}
                      </span>
                      {step.options && Object.keys(step.options).length > 0 && (
                        <span style={{ color: "#94a3b8", fontSize: "12px" }}>
                          {JSON.stringify(step.options)}
                        </span>
                      )}
                      <div style={{ display: "flex", gap: "4px" }}>
                        <button
                          onClick={() => moveStep(index, -1)}
                          disabled={index === 0}
                          style={{ ...miniBtn, opacity: index === 0 ? 0.4 : 1 }}
                          title="Move up"
                        >
                          ↑
                        </button>
                        <button
                          onClick={() => moveStep(index, 1)}
                          disabled={index === pipeline.length - 1}
                          style={{ ...miniBtn, opacity: index === pipeline.length - 1 ? 0.4 : 1 }}
                          title="Move down"
                        >
                          ↓
                        </button>
                        <button
                          onClick={() => removeFromPipeline(index)}
                          style={{ ...miniBtn, background: "#ef4444" }}
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={runPipeline}
                  style={{
                    ...primaryBtn,
                    marginTop: "15px",
                    background: "#10b981",
                    fontSize: "14px",
                    padding: "12px 24px",
                  }}
                >
                  🚀 Run All {pipeline.length} Feature(s)
                </button>
              </div>
            )}
          </div>

          {/* Split Column */}
          <div style={{ background: "#1e293b", padding: "15px", borderRadius: "8px", marginTop: "15px" }}>
            <strong style={{ color: "#e2e8f0" }}>✂️ Split Column by Delimiter</strong>
            <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>
              Split a column like "id,name,date" or "id|name|date" into separate columns.
            </p>
            <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: "wrap", alignItems: "center" }}>
              <select
                value={splitCol ?? ""}
                onChange={(e) => setSplitCol(e.target.value === "" ? null : Number(e.target.value))}
                style={inputStyle}
              >
                <option value="">Select column...</option>
                {headers.map((h, i) => (
                  <option key={i} value={i}>{h}</option>
                ))}
              </select>
              <input
                type="text"
                value={splitDelimiter}
                onChange={(e) => setSplitDelimiter(e.target.value)}
                placeholder="Delimiter (e.g. , | ; tab)"
                style={{ ...inputStyle, width: "150px" }}
              />
              <input
                type="text"
                value={splitColName}
                onChange={(e) => setSplitColName(e.target.value)}
                placeholder="New column prefix (optional)"
                style={{ ...inputStyle, width: "180px" }}
              />
              <button onClick={splitColumn} style={primaryBtn}>✂️ Split Column</button>
            </div>
          </div>

          {/* Add Column with Condition */}
          <div style={{ background: "#1e293b", padding: "15px", borderRadius: "8px", marginTop: "15px" }}>
            <strong style={{ color: "#e2e8f0" }}>➕ Add Column with Condition</strong>
            <p style={{ color: "#94a3b8", fontSize: "13px", marginTop: "4px" }}>
              Create a new column based on a condition. Example: if outtime - intime {"<="} 5 then Halftime else Fulltime
            </p>

            {/* Natural Language Input */}
            <div style={{ marginTop: "12px" }}>
              <input
                type="text"
                value={condNaturalLanguage}
                onChange={(e) => setCondNaturalLanguage(e.target.value)}
                placeholder="Describe condition: 'Add column Status: if outtime - intime <= 5 then Halftime else Fulltime'"
                style={{ ...inputStyle, width: "100%" }}
              />
              <button onClick={addConditionalColumnNaturalLanguage} style={{ ...primaryBtn, marginTop: "8px" }}>
                🤖 Auto-Parse Condition
              </button>
            </div>

            <div style={{ borderTop: "1px solid #334155", marginTop: "15px", paddingTop: "15px" }}>
              <p style={{ color: "#94a3b8", fontSize: "12px", marginBottom: "8px" }}>OR build manually:</p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
                <input
                  type="text"
                  value={condColName}
                  onChange={(e) => setCondColName(e.target.value)}
                  placeholder="New column name"
                  style={{ ...inputStyle, width: "140px" }}
                />
                <select
                  value={condSourceCol ?? ""}
                  onChange={(e) => setCondSourceCol(e.target.value === "" ? null : Number(e.target.value))}
                  style={inputStyle}
                >
                  <option value="">Source col...</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>{h}</option>
                  ))}
                </select>
                <select value={condOperator} onChange={(e) => setCondOperator(e.target.value)} style={inputStyle}>
                  <option value="<=">{"<="}</option>
                  <option value=">=">{">="}</option>
                  <option value="<">{"<"}</option>
                  <option value=">">{">"}</option>
                  <option value="==">{"=="}</option>
                  <option value="!=">{"!="}</option>
                </select>
                <select
                  value={condSourceCol2 ?? ""}
                  onChange={(e) => setCondSourceCol2(e.target.value === "" ? null : Number(e.target.value))}
                  style={inputStyle}
                >
                  <option value="">Compare with col...</option>
                  {headers.map((h, i) => (
                    <option key={i} value={i}>{h}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={condValue}
                  onChange={(e) => setCondValue(e.target.value)}
                  placeholder="Value (if no col)"
                  style={{ ...inputStyle, width: "100px" }}
                />
                <input
                  type="text"
                  value={condTrueValue}
                  onChange={(e) => setCondTrueValue(e.target.value)}
                  placeholder="If true"
                  style={{ ...inputStyle, width: "100px" }}
                />
                <input
                  type="text"
                  value={condFalseValue}
                  onChange={(e) => setCondFalseValue(e.target.value)}
                  placeholder="If false"
                  style={{ ...inputStyle, width: "100px" }}
                />
                <button onClick={addConditionalColumn} style={primaryBtn}>➕ Add Column</button>
              </div>
            </div>
          </div>
        </>
      )}

      {isDataLoaded && (
        <>
          <h3 style={{ marginTop: "30px", color: "#94a3b8" }}>Duplicate & Empty Data</h3>
          <div style={gridStyle}>
            {dataButtons.map((btn) => (
              <button key={btn.label} onClick={btn.action} style={actionBtn}>{btn.label}</button>
            ))}
          </div>

          <h3 style={{ marginTop: "30px", color: "#94a3b8" }}>Text Cleaning</h3>
          <div style={gridStyle}>
            {textButtons.map((btn) => (
              <button key={btn.label} onClick={btn.action} style={actionBtn}>{btn.label}</button>
            ))}
          </div>

          <h3 style={{ marginTop: "30px", color: "#94a3b8" }}>Missing Data</h3>
          <div style={gridStyle}>
            {fillButtons.map((btn) => (
              <button key={btn.label} onClick={btn.action} style={actionBtn}>{btn.label}</button>
            ))}
          </div>

          <h3 style={{ marginTop: "30px", color: "#94a3b8" }}>Data Type Conversion</h3>
          <div style={gridStyle}>
            {conversionButtons.map((btn) => (
              <button key={btn.label} onClick={btn.action} style={actionBtn}>{btn.label}</button>
            ))}
          </div>

          {data.length > 0 && (
            <Spreadsheet
              data={data}
              selectable={selectMode}
              selectedColumns={selectedColumns}
              onToggleColumn={toggleColumn}
            />
          )}
        </>
      )}
    </div>
  );
}

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
  gap: "10px",
  marginTop: "10px",
};

const actionBtn: React.CSSProperties = {
  padding: "12px 16px",
  borderRadius: "8px",
  border: "none",
  background: "#1e293b",
  color: "#e2e8f0",
  cursor: "pointer",
  fontWeight: "500",
  textAlign: "center",
  transition: "0.2s",
};

const toggleBtn: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: "8px",
  border: "none",
  background: "#334155",
  color: "white",
  cursor: "pointer",
  fontWeight: "500",
  fontSize: "13px",
};

const inputStyle: React.CSSProperties = {
  padding: "10px 12px",
  borderRadius: "8px",
  border: "none",
  background: "#334155",
  color: "white",
  fontSize: "13px",
};

const primaryBtn: React.CSSProperties = {
  padding: "10px 16px",
  borderRadius: "8px",
  border: "none",
  background: "#3b82f6",
  color: "white",
  cursor: "pointer",
  fontWeight: "500",
  fontSize: "13px",
};

const miniBtn: React.CSSProperties = {
  padding: "4px 8px",
  borderRadius: "4px",
  border: "none",
  background: "#475569",
  color: "white",
  cursor: "pointer",
  fontSize: "12px",
};