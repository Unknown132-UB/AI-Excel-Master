import { useDataWorkspaceStore } from "../../store/dataWorkspaceStore";

export default function AttendancePanel() {
  const { attendanceAnalysis } = useDataWorkspaceStore();

  if (!attendanceAnalysis) {
    return (
      <div style={{ background: "#1e293b", padding: "30px", borderRadius: "10px", textAlign: "center", color: "#94a3b8" }}>
        <div style={{ fontSize: "40px", marginBottom: "10px" }}>📋</div>
        <p>No attendance data detected. Import an attendance file to see analysis.</p>
      </div>
    );
  }

  const analysis = attendanceAnalysis;

  return (
    <div>
      <h3>📋 Attendance Analysis</h3>

      {/* Overview Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "15px", marginTop: "20px" }}>
        <div style={cardStyle}>
          <h4 style={{ color: "#94a3b8", fontSize: "13px" }}>Total Employees</h4>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{analysis.totalEmployees}</div>
        </div>
        <div style={cardStyle}>
          <h4 style={{ color: "#94a3b8", fontSize: "13px" }}>Total Days</h4>
          <div style={{ fontSize: "28px", fontWeight: "bold" }}>{analysis.totalDays}</div>
        </div>
        <div style={cardStyle}>
          <h4 style={{ color: "#94a3b8", fontSize: "13px" }}>Present</h4>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: "#4ade80" }}>{analysis.presentCount}</div>
        </div>
        <div style={cardStyle}>
          <h4 style={{ color: "#94a3b8", fontSize: "13px" }}>Absent</h4>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: "#f87171" }}>{analysis.absentCount}</div>
        </div>
        <div style={cardStyle}>
          <h4 style={{ color: "#94a3b8", fontSize: "13px" }}>Late</h4>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: "#fbbf24" }}>{analysis.lateCount}</div>
        </div>
        <div style={cardStyle}>
          <h4 style={{ color: "#94a3b8", fontSize: "13px" }}>Attendance %</h4>
          <div style={{ fontSize: "28px", fontWeight: "bold", color: analysis.attendancePercentage >= 80 ? "#4ade80" : "#fbbf24" }}>
            {analysis.attendancePercentage}%
          </div>
        </div>
      </div>

      {/* Late Employees */}
      {analysis.lateEmployees.length > 0 && (
        <div style={{ marginTop: "25px" }}>
          <h4>⏰ Late Employees</h4>
          <div style={{ overflow: "auto", marginTop: "10px", borderRadius: "10px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#1e293b" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Employee</th>
                  <th style={thStyle}>Late Count</th>
                </tr>
              </thead>
              <tbody>
                {analysis.lateEmployees.map((emp) => (
                  <tr key={emp.name} style={{ borderBottom: "1px solid #334155" }}>
                    <td style={tdStyle}>{emp.name}</td>
                    <td style={{ ...tdStyle, color: "#fbbf24" }}>{emp.lateCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Absent Employees */}
      {analysis.absentEmployees.length > 0 && (
        <div style={{ marginTop: "25px" }}>
          <h4>❌ Absent Employees</h4>
          <div style={{ overflow: "auto", marginTop: "10px", borderRadius: "10px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#1e293b" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Employee</th>
                  <th style={thStyle}>Absent Count</th>
                </tr>
              </thead>
              <tbody>
                {analysis.absentEmployees.map((emp) => (
                  <tr key={emp.name} style={{ borderBottom: "1px solid #334155" }}>
                    <td style={tdStyle}>{emp.name}</td>
                    <td style={{ ...tdStyle, color: "#f87171" }}>{emp.absentCount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Working Hours */}
      {analysis.workingHours.length > 0 && (
        <div style={{ marginTop: "25px" }}>
          <h4>⏱️ Working Hours</h4>
          <div style={{ overflow: "auto", marginTop: "10px", borderRadius: "10px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#1e293b" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Employee</th>
                  <th style={thStyle}>Total Hours</th>
                  <th style={thStyle}>Avg Hours/Day</th>
                </tr>
              </thead>
              <tbody>
                {analysis.workingHours.map((emp) => (
                  <tr key={emp.name} style={{ borderBottom: "1px solid #334155" }}>
                    <td style={tdStyle}>{emp.name}</td>
                    <td style={tdStyle}>{emp.totalHours}</td>
                    <td style={tdStyle}>{emp.avgHours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Daily Summary */}
      {analysis.dailySummary.length > 0 && (
        <div style={{ marginTop: "25px" }}>
          <h4>📅 Daily Summary</h4>
          <div style={{ overflow: "auto", marginTop: "10px", borderRadius: "10px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#1e293b" }}>
              <thead>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Present</th>
                  <th style={thStyle}>Absent</th>
                  <th style={thStyle}>Late</th>
                </tr>
              </thead>
              <tbody>
                {analysis.dailySummary.map((day) => (
                  <tr key={day.date} style={{ borderBottom: "1px solid #334155" }}>
                    <td style={tdStyle}>{day.date}</td>
                    <td style={{ ...tdStyle, color: "#4ade80" }}>{day.present}</td>
                    <td style={{ ...tdStyle, color: "#f87171" }}>{day.absent}</td>
                    <td style={{ ...tdStyle, color: "#fbbf24" }}>{day.late}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const cardStyle: React.CSSProperties = {
  background: "#1e293b",
  padding: "20px",
  borderRadius: "10px",
};

const thStyle: React.CSSProperties = {
  padding: "10px 12px",
  textAlign: "left",
  fontSize: "13px",
  fontWeight: "bold",
  color: "#94a3b8",
};

const tdStyle: React.CSSProperties = {
  padding: "10px 12px",
  fontSize: "13px",
};