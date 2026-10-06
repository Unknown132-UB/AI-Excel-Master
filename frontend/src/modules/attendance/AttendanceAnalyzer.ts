import type { Dataset } from "../../types/dataset";

export interface AttendanceAnalysis {
  totalEmployees: number;
  totalDays: number;
  presentCount: number;
  absentCount: number;
  lateCount: number;
  attendancePercentage: number;
  lateEmployees: { name: string; lateCount: number }[];
  absentEmployees: { name: string; absentCount: number }[];
  dailySummary: { date: string; present: number; absent: number; late: number }[];
  workingHours: { name: string; totalHours: number; avgHours: number }[];
}

export default class AttendanceAnalyzer {
  analyze(dataset: Dataset): AttendanceAnalysis {
    const { headers, rows } = dataset;

    // Find relevant columns
    const nameCol = headers.findIndex((h) => /(name|employee|person|staff)/i.test(h));
    const dateCol = headers.findIndex((h) => /(date|day|attendance.?date)/i.test(h));
    const statusCol = headers.findIndex((h) => /(status|attendance|present|absent)/i.test(h));
    const inCol = headers.findIndex((h) => /(punch.?in|clock.?in|in.?time|login|start)/i.test(h));
    const outCol = headers.findIndex((h) => /(punch.?out|clock.?out|out.?time|logout|end)/i.test(h));
    const hoursCol = headers.findIndex((h) => /(working.?hours|hours|duration|total.?time)/i.test(h));

    // Collect data
    const employees = new Set<string>();
    const dates = new Set<string>();
    let presentCount = 0;
    let absentCount = 0;
    let lateCount = 0;

    const lateMap = new Map<string, number>();
    const absentMap = new Map<string, number>();
    const hoursMap = new Map<string, number[]>();
    const dailyMap = new Map<string, { present: number; absent: number; late: number }>();

    rows.forEach((row) => {
      const name = nameCol >= 0 ? String(row[nameCol] || "Unknown") : "Unknown";
      const date = dateCol >= 0 ? String(row[dateCol] || "") : "";
      const status = statusCol >= 0 ? String(row[statusCol] || "").toLowerCase() : "";

      employees.add(name);
      if (date) dates.add(date);

      // Determine attendance status
      let isPresent = false;
      let isAbsent = false;
      let isLate = false;

      if (statusCol >= 0) {
        isPresent = /(present|p|yes|1|true)/i.test(status);
        isAbsent = /(absent|a|no|0|false)/i.test(status);
        isLate = /(late|l)/i.test(status);
      } else if (inCol >= 0 && outCol >= 0) {
        const inTime = String(row[inCol] || "");
        const outTime = String(row[outCol] || "");
        isPresent = Boolean(inTime && outTime);
        isAbsent = !inTime && !outTime;
      }

      if (isPresent) presentCount++;
      if (isAbsent) {
        absentCount++;
        absentMap.set(name, (absentMap.get(name) || 0) + 1);
      }
      if (isLate) {
        lateCount++;
        lateMap.set(name, (lateMap.get(name) || 0) + 1);
      }

      // Track working hours
      if (hoursCol >= 0) {
        const hours = Number(row[hoursCol]);
        if (!isNaN(hours)) {
          const list = hoursMap.get(name) || [];
          list.push(hours);
          hoursMap.set(name, list);
        }
      } else if (inCol >= 0 && outCol >= 0) {
        const inTime = this.parseTime(String(row[inCol] || ""));
        const outTime = this.parseTime(String(row[outCol] || ""));
        if (inTime !== null && outTime !== null) {
          const hours = (outTime - inTime) / 3600000;
          const list = hoursMap.get(name) || [];
          list.push(Math.round(hours * 100) / 100);
          hoursMap.set(name, list);
        }
      }

      // Daily summary
      if (date) {
        const daily = dailyMap.get(date) || { present: 0, absent: 0, late: 0 };
        if (isPresent) daily.present++;
        if (isAbsent) daily.absent++;
        if (isLate) daily.late++;
        dailyMap.set(date, daily);
      }
    });

    const totalRecords = presentCount + absentCount;
    const attendancePercentage = totalRecords > 0
      ? Math.round((presentCount / totalRecords) * 100)
      : 0;

    const lateEmployees = Array.from(lateMap.entries())
      .map(([name, lateCount]) => ({ name, lateCount }))
      .sort((a, b) => b.lateCount - a.lateCount);

    const absentEmployees = Array.from(absentMap.entries())
      .map(([name, absentCount]) => ({ name, absentCount }))
      .sort((a, b) => b.absentCount - a.absentCount);

    const workingHours = Array.from(hoursMap.entries())
      .map(([name, hours]) => ({
        name,
        totalHours: Math.round(hours.reduce((a, b) => a + b, 0) * 100) / 100,
        avgHours: Math.round((hours.reduce((a, b) => a + b, 0) / hours.length) * 100) / 100,
      }))
      .sort((a, b) => b.totalHours - a.totalHours);

    const dailySummary = Array.from(dailyMap.entries())
      .map(([date, summary]) => ({ date, ...summary }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      totalEmployees: employees.size,
      totalDays: dates.size,
      presentCount,
      absentCount,
      lateCount,
      attendancePercentage,
      lateEmployees,
      absentEmployees,
      dailySummary,
      workingHours,
    };
  }

  private parseTime(value: string): number | null {
    if (!value) return null;
    const match = value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
    if (!match) return null;

    let hours = Number(match[1]);
    const minutes = Number(match[2]);
    const seconds = Number(match[3] || 0);
    const meridiem = match[4]?.toUpperCase();

    if (meridiem === "PM" && hours < 12) hours += 12;
    if (meridiem === "AM" && hours === 12) hours = 0;

    return (hours * 3600 + minutes * 60 + seconds) * 1000;
  }
}