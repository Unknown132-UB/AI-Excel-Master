import { useMemo, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, AreaChart, Area,
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadialBarChart, RadialBar,
} from "recharts";
import { useDataStore } from "../../store/dataStore";

const COLORS = ["#3b82f6", "#ef4444", "#22c55e", "#f59e0b", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

type ChartType = "bar" | "line" | "pie" | "histogram" | "area" | "scatter" | "radial" | "stacked";

export default function ChartsPage() {
  const { currentData, isDataLoaded, activeFile, columns, rows } = useDataStore();
  const [categoryCol, setCategoryCol] = useState(0);
  const [valueCol, setValueCol] = useState(1);
  const [valueCol2, setValueCol2] = useState<number | null>(null);
  const [chartType, setChartType] = useState<ChartType>("bar");
  const [maxItems, setMaxItems] = useState(20);
  const [showGrid, setShowGrid] = useState(true);
  const [showLegend, setShowLegend] = useState(true);

  const headers = useMemo(() => currentData?.[0] || [], [currentData]);
  const dataRows = useMemo(() => currentData?.slice(1) || [], [currentData]);

  const chartData = useMemo(
    () => dataRows.slice(0, maxItems).map((row: any[]) => ({
      name: String(row[categoryCol] ?? "N/A"),
      value: Number(row[valueCol]) || 0,
      value2: valueCol2 !== null ? Number(row[valueCol2]) || 0 : undefined,
    })),
    [dataRows, categoryCol, valueCol, valueCol2, maxItems]
  );

  const histogramData = useMemo(() => {
    const values = dataRows.map((row: any[]) => Number(row[valueCol])).filter((v: number) => !isNaN(v));
    if (values.length === 0) return [];
    const min = Math.min(...values);
    const max = Math.max(...values);
    const binSize = (max - min) / 10 || 1;
    const bins = Array.from({ length: 10 }, (_, i) => ({
      range: `${(min + i * binSize).toFixed(0)}-${(min + (i + 1) * binSize).toFixed(0)}`,
      count: 0,
    }));
    values.forEach((v: number) => {
      const idx = Math.min(9, Math.floor((v - min) / binSize));
      bins[idx].count++;
    });
    return bins;
  }, [dataRows, valueCol]);

  const summary = useMemo(() => {
    const values = dataRows.map((row: any[]) => Number(row[valueCol])).filter((v: number) => !isNaN(v));
    if (values.length === 0) return null;
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const sorted = [...values].sort((a, b) => a - b);
    const median = sorted[Math.floor(sorted.length / 2)];
    return {
      count: values.length,
      sum,
      avg: avg.toFixed(2),
      min: Math.min(...values),
      max: Math.max(...values),
      median,
    };
  }, [dataRows, valueCol]);

  if (!isDataLoaded || currentData.length === 0) {
    return (
      <div>
        <h1>📈 Charts</h1>
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
      </div>
    );
  }

  return (
    <div>
      <h1>📈 Chart Builder</h1>

      {isDataLoaded && (
        <div style={{ background: "#064e3b", padding: "15px 20px", borderRadius: "10px", marginTop: "15px" }}>
          <strong style={{ color: "#6ee7b7" }}>✓ Active Dataset: {activeFile}</strong>
          <span style={{ marginLeft: "15px", color: "#d1d5db", fontSize: "13px" }}>
            {rows.length} rows • {columns.length} columns
          </span>
        </div>
      )}

      <div style={{ display: "flex", gap: "20px", marginTop: "25px", flexWrap: "wrap", alignItems: "center" }}>
        <div>
          <label style={{ color: "#94a3b8", marginRight: "8px" }}>Category:</label>
          <select value={categoryCol} onChange={(e) => setCategoryCol(Number(e.target.value))} style={selectStyle}>
            {headers.map((h: string, i: number) => <option key={i} value={i}>{h}</option>)}
          </select>
        </div>
        <div>
          <label style={{ color: "#94a3b8", marginRight: "8px" }}>Value 1:</label>
          <select value={valueCol} onChange={(e) => setValueCol(Number(e.target.value))} style={selectStyle}>
            {headers.map((h: string, i: number) => <option key={i} value={i}>{h}</option>)}
          </select>
        </div>
        <div>
          <label style={{ color: "#94a3b8", marginRight: "8px" }}>Value 2 (optional):</label>
          <select value={valueCol2 ?? ""} onChange={(e) => setValueCol2(e.target.value === "" ? null : Number(e.target.value))} style={selectStyle}>
            <option value="">None</option>
            {headers.map((h: string, i: number) => <option key={i} value={i}>{h}</option>)}
          </select>
        </div>
        <div>
          <label style={{ color: "#94a3b8", marginRight: "8px" }}>Chart Type:</label>
          <select value={chartType} onChange={(e) => setChartType(e.target.value as ChartType)} style={selectStyle}>
            <option value="bar">Bar Chart</option>
            <option value="line">Line Chart</option>
            <option value="pie">Pie Chart</option>
            <option value="histogram">Histogram</option>
            <option value="area">Area Chart</option>
            <option value="scatter">Scatter Plot</option>
            <option value="radial">Radial Chart</option>
            <option value="stacked">Stacked Bar</option>
          </select>
        </div>
        <div>
          <label style={{ color: "#94a3b8", marginRight: "8px" }}>Max Items:</label>
          <input
            type="number"
            min={5}
            max={100}
            value={maxItems}
            onChange={(e) => setMaxItems(Number(e.target.value))}
            style={{ ...selectStyle, width: "70px" }}
          />
        </div>
      </div>

      <div style={{ display: "flex", gap: "20px", marginTop: "15px", flexWrap: "wrap" }}>
        <label style={{ color: "#94a3b8", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
          <input type="checkbox" checked={showGrid} onChange={(e) => setShowGrid(e.target.checked)} />
          Show Grid
        </label>
        <label style={{ color: "#94a3b8", fontSize: "13px", display: "flex", alignItems: "center", gap: "6px" }}>
          <input type="checkbox" checked={showLegend} onChange={(e) => setShowLegend(e.target.checked)} />
          Show Legend
        </label>
      </div>

      <div style={{ background: "#1e293b", padding: "30px", borderRadius: "12px", marginTop: "25px", height: "450px" }}>
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "bar" ? (
            <BarChart data={chartData}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" />}
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={tipStyle} />
              {showLegend && <Legend />}
              <Bar dataKey="value" fill="#3b82f6" />
              {valueCol2 !== null && <Bar dataKey="value2" fill="#22c55e" />}
            </BarChart>
          ) : chartType === "line" ? (
            <LineChart data={chartData}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" />}
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={tipStyle} />
              {showLegend && <Legend />}
              <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} />
              {valueCol2 !== null && <Line type="monotone" dataKey="value2" stroke="#22c55e" strokeWidth={2} />}
            </LineChart>
          ) : chartType === "pie" ? (
            <PieChart>
              <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={150} label>
                {chartData.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={tipStyle} />
              {showLegend && <Legend />}
            </PieChart>
          ) : chartType === "histogram" ? (
            <BarChart data={histogramData}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" />}
              <XAxis dataKey="range" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={tipStyle} />
              {showLegend && <Legend />}
              <Bar dataKey="count" fill="#22c55e" />
            </BarChart>
          ) : chartType === "area" ? (
            <AreaChart data={chartData}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" />}
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={tipStyle} />
              {showLegend && <Legend />}
              <Area type="monotone" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} />
              {valueCol2 !== null && <Area type="monotone" dataKey="value2" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />}
            </AreaChart>
          ) : chartType === "scatter" ? (
            <ScatterChart>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" />}
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis dataKey="value" stroke="#94a3b8" />
              <Tooltip contentStyle={tipStyle} />
              {showLegend && <Legend />}
              <Scatter data={chartData} fill="#3b82f6" />
            </ScatterChart>
          ) : chartType === "radial" ? (
            <RadialBarChart data={chartData.slice(0, 10)} innerRadius="20%" outerRadius="90%">
              <RadialBar dataKey="value" fill="#3b82f6" label={{ fill: "#94a3b8", fontSize: 12 }} background={{ fill: "#334155" }} />
              <Tooltip contentStyle={tipStyle} />
              {showLegend && <Legend />}
            </RadialBarChart>
          ) : (
            <BarChart data={chartData}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#334155" />}
              <XAxis dataKey="name" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip contentStyle={tipStyle} />
              {showLegend && <Legend />}
              <Bar dataKey="value" stackId="a" fill="#3b82f6" />
              {valueCol2 !== null && <Bar dataKey="value2" stackId="a" fill="#22c55e" />}
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>

      {summary && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px", marginTop: "25px" }}>
          {[
            { label: "Count", value: summary.count },
            { label: "Sum", value: summary.sum.toFixed(2) },
            { label: "Average", value: summary.avg },
            { label: "Min", value: summary.min },
            { label: "Max", value: summary.max },
            { label: "Median", value: summary.median },
          ].map((stat) => (
            <div key={stat.label} style={{ background: "#1e293b", padding: "15px", borderRadius: "8px", textAlign: "center" }}>
              <div style={{ color: "#94a3b8", fontSize: "12px" }}>{stat.label}</div>
              <div style={{ color: "white", fontSize: "20px", fontWeight: "bold", marginTop: "4px" }}>{stat.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const tipStyle: React.CSSProperties = { background: "#1e293b", border: "none", borderRadius: "8px" };
const selectStyle: React.CSSProperties = { padding: "10px 14px", borderRadius: "8px", border: "none", background: "#1e293b", color: "white", fontSize: "14px" };