import type { DataType } from "../../types/excel";

export interface ConversionResult {
  success: boolean;
  data: any[][];
  message: string;
  errorRows: number[];
  preview: any[][];
}

export interface ConversionOptions {
  type: DataType;
  format: string | null;
}

const DATE_FORMATS: Record<string, RegExp[]> = {
  "DD-MM-YYYY": [],
  "MM-DD-YYYY": [],
  "YYYY-MM-DD": [],
  "DD/MM/YYYY": [],
  "MM/DD/YYYY": [],
  "YYYY/MM/DD": [],
  "DD.MM.YYYY": [],
  "MM.DD.YYYY": [],
  "YYYY.MM.DD": [],
  "DD-MM-YY": [],
  "MM-DD-YY": [],
  "custom": [],
};

const TIME_FORMATS: Record<string, RegExp[]> = {
  "HH:MM": [],
  "HH:MM:SS": [],
  "hh:mm AM/PM": [],
  "hh:mm:ss AM/PM": [],
  "HH:mm": [],
  "HH:mm:ss": [],
};

const DATETIME_FORMATS: string[] = [
  "DD-MM-YYYY HH:MM",
  "DD-MM-YYYY HH:MM:SS",
  "DD-MM-YYYY hh:mm AM/PM",
  "MM-DD-YYYY HH:MM",
  "YYYY-MM-DD HH:MM",
  "YYYY-MM-DD HH:MM:SS",
  "MM/DD/YYYY hh:mm:ss AM/PM",
  "DD/MM/YYYY HH:MM",
];

function safeNumberParse(text: string): number | null {
  const cleaned = text.replace(/[,₹$€£¥%]/g, "").trim();
  if (cleaned === "") return null;
  const n = Number(cleaned);
  return isNaN(n) ? null : n;
}

function parseTwoDigitYear(year: number): number {
  return year < 100 ? (year > 50 ? 1900 + year : 2000 + year) : year;
}

function pad(n: number, len = 2): string {
  return String(n).padStart(len, "0");
}

function parseFlexibleDate(raw: any): Date | null {
  if (raw instanceof Date) {
    return isNaN(raw.getTime()) ? null : raw;
  }
  if (typeof raw === "number") {
    // Excel serial date
    const d = new Date(Math.round((raw - 25569) * 86400 * 1000));
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof raw !== "string") return null;

  const text = raw.trim();
  if (text === "") return null;

  // Try ISO first
  const iso = new Date(text);
  if (!isNaN(iso.getTime())) return iso;

  // Token-based parsing
  // Capture: day, month, year, hours, minutes, seconds, ampm
  const match = text.match(
    /^(\d{1,4})[\/\-.](\d{1,2})[\/\-.](\d{1,4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?)?$/i
  );
  if (!match) return null;

  let [, a, b, c, h = "0", m = "0", s = "0", ampm] = match;

  let day: number, month: number, year: number;
  const aNum = Number(a);
  const bNum = Number(b);
  const cNum = Number(c);

  // Figure out which token is the year
  if (aNum > 31) {
    // YYYY-MM-DD or YYYY/MM/DD
    year = aNum;
    month = bNum;
    day = cNum;
  } else if (cNum > 31) {
    // DD-MM-YYYY or MM-DD-YYYY (c is year)
    year = parseTwoDigitYear(cNum);
    // If first token > 12, must be day-first
    if (aNum > 12) {
      day = aNum;
      month = bNum;
    } else if (bNum > 12) {
      // second token > 12 → first is month, second is day
      month = aNum;
      day = bNum;
    } else {
      // Ambiguous — assume day first (DD-MM-YYYY)
      day = aNum;
      month = bNum;
    }
  } else {
    // All small → 2-digit year likely at position 3
    year = parseTwoDigitYear(cNum);
    if (aNum > 12) {
      day = aNum;
      month = bNum;
    } else if (bNum > 12) {
      month = aNum;
      day = bNum;
    } else {
      day = aNum;
      month = bNum;
    }
  }

  let hours = Number(h);
  if (ampm) {
    if (/pm/i.test(ampm) && hours < 12) hours += 12;
    if (/am/i.test(ampm) && hours === 12) hours = 0;
  }

  const result = new Date(year, month - 1, day, hours, Number(m), Number(s));
  return isNaN(result.getTime()) ? null : result;
}

function parseFlexibleTime(raw: any): { hours: number; minutes: number; seconds: number } | null {
  if (typeof raw === "number") {
    // Excel time fraction or seconds
    if (raw >= 0 && raw < 1) {
      const totalSecs = Math.round(raw * 86400);
      return {
        hours: Math.floor(totalSecs / 3600),
        minutes: Math.floor((totalSecs % 3600) / 60),
        seconds: totalSecs % 60,
      };
    }
    const totalSecs = Math.round(raw);
    return {
      hours: Math.floor(totalSecs / 3600),
      minutes: Math.floor((totalSecs % 3600) / 60),
      seconds: totalSecs % 60,
    };
  }
  if (typeof raw !== "string") return null;

  const text = raw.trim();
  if (text === "") return null;

  const match = text.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?$/i);
  if (!match) return null;

  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const seconds = match[3] ? Number(match[3]) : 0;
  const ampm = match[4];

  if (ampm) {
    if (/pm/i.test(ampm) && hours < 12) hours += 12;
    if (/am/i.test(ampm) && hours === 12) hours = 0;
  }

  if (hours > 23 || minutes > 59 || seconds > 59) return null;
  return { hours, minutes, seconds };
}

function toBooleanValue(raw: any): boolean | null {
  if (typeof raw === "boolean") return raw;
  if (typeof raw === "number") {
    if (raw === 1) return true;
    if (raw === 0) return false;
    return null;
  }
  if (typeof raw !== "string") return null;
  const lower = raw.trim().toLowerCase();
  if (["true", "yes", "y", "1", "active", "enabled"].includes(lower)) return true;
  if (["false", "no", "n", "0", "inactive", "disabled"].includes(lower)) return false;
  return null;
}

function formatDate(date: Date, format: string): string {
  const d = pad(date.getDate());
  const m = pad(date.getMonth() + 1);
  const y4 = String(date.getFullYear());
  const y2 = y4.slice(-2);
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  let h12 = date.getHours() % 12;
  if (h12 === 0) h12 = 12;
  const ampm = date.getHours() < 12 ? "AM" : "PM";

  const map: Record<string, string> = {
    "DD": d,
    "MM": m,
    "YYYY": y4,
    "YY": y2,
    "HH": hh,
    "mm": mm,
    "ss": ss,
    "hh": pad(h12),
  };

  let result = format;
  for (const [key, val] of Object.entries(map)) {
    result = result.split(key).join(val);
  }
  result = result.split("AM/PM").join(ampm);
  result = result.split("am/pm").join(ampm.toLowerCase());
  return result;
}

function formatTime(hours: number, minutes: number, seconds: number, format: string): string {
  const hh = pad(hours);
  const mm = pad(minutes);
  const ss = pad(seconds);
  let h12 = hours % 12;
  if (h12 === 0) h12 = 12;
  const ampm = hours < 12 ? "AM" : "PM";

  const map: Record<string, string> = {
    "HH": hh,
    "mm": mm,
    "ss": ss,
    "hh": pad(h12),
  };

  let result = format;
  for (const [key, val] of Object.entries(map)) {
    result = result.split(key).join(val);
  }
  result = result.split("AM/PM").join(ampm);
  result = result.split("am/pm").join(ampm.toLowerCase());
  return result;
}

function convertCell(raw: any, type: DataType, format: string | null): { ok: true; value: any } | { ok: false } {
  if (raw === null || raw === undefined || raw === "") {
    return { ok: true, value: raw };
  }

  switch (type) {
    case "string": {
      return { ok: true, value: String(raw) };
    }
    case "integer": {
      const n = safeNumberParse(String(raw));
      if (n === null || !Number.isFinite(n)) return { ok: false };
      return { ok: true, value: Math.trunc(n) };
    }
    case "decimal": {
      const n = safeNumberParse(String(raw));
      if (n === null || !Number.isFinite(n)) return { ok: false };
      return { ok: true, value: n };
    }
    case "boolean": {
      const b = toBooleanValue(raw);
      if (b === null) return { ok: false };
      return { ok: true, value: b };
    }
    case "date": {
      const d = parseFlexibleDate(raw);
      if (!d) return { ok: false };
      // Date type means just date component; if a time portion exists, strip it away
      const dateOnly = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      if (format && format !== "custom") {
        return { ok: true, value: formatDate(dateOnly, format) };
      }
      return { ok: true, value: dateOnly };
    }
    case "time": {
      const t = parseFlexibleTime(raw);
      if (!t) return { ok: false };
      if (format && format !== "custom") {
        return { ok: true, value: formatTime(t.hours, t.minutes, t.seconds, format) };
      }
      // Store as date with time for underlying truth
      const base = new Date(1970, 0, 1, t.hours, t.minutes, t.seconds);
      return { ok: true, value: base };
    }
    case "datetime": {
      // Try as date+time first
      const d = parseFlexibleDate(raw);
      if (!d) return { ok: false };
      if (format && format !== "custom") {
        return { ok: true, value: formatDate(d, format) };
      }
      return { ok: true, value: d };
    }
    default:
      return { ok: true, value: raw };
  }
}

function detectCurrentTypeOfCell(raw: any): string {
  if (raw === null || raw === undefined || raw === "") return "empty";
  if (typeof raw === "number") return Number.isInteger(raw) ? "integer" : "decimal";
  if (typeof raw === "boolean") return "boolean";
  if (raw instanceof Date) return "datetime";
  if (typeof raw === "string") {
    const text = raw.trim();
    if (text === "") return "empty";
    const n = safeNumberParse(text);
    if (n !== null) return Number.isInteger(n) ? "integer" : "decimal";
    if (parseFlexibleTime(text)) {
      return /^\d{1,2}:\d{2}/.test(text) ? "time" : "string";
    }
    if (parseFlexibleDate(text)) return "date";
    if (toBooleanValue(text) !== null) return "boolean";
    return "string";
  }
  return typeof raw;
}

export function detectCurrentType(values: any[]): { type: string; confidence: number } {
  if (values.length === 0) return { type: "string", confidence: 100 };
  const counts: Record<string, number> = {};
  const nonEmpty = values.filter((v) => v !== null && v !== undefined && v !== "");
  if (nonEmpty.length === 0) return { type: "string", confidence: 100 };
  for (const v of nonEmpty) {
    const t = detectCurrentTypeOfCell(v);
    counts[t] = (counts[t] || 0) + 1;
  }
  let best = "string";
  let max = 0;
  for (const [t, c] of Object.entries(counts)) {
    if (c > max) {
      max = c;
      best = t;
    }
  }
  return { type: best, confidence: Math.round((max / nonEmpty.length) * 100) };
}

export function convertColumn(
  data: any[][],
  columnIndex: number,
  options: ConversionOptions
): ConversionResult {
  const { type, format } = options;

  if (!data || data.length === 0) {
    return { success: false, data, message: "No data.", errorRows: [], preview: [] };
  }

  const result = data.map((row, rIdx) => {
    if (rIdx === 0) return [...row]; // header unchanged
    const newRow = [...row];
    if (columnIndex < newRow.length) {
      const cellResult = convertCell(newRow[columnIndex], type, format);
      if (cellResult.ok) {
        newRow[columnIndex] = cellResult.value;
      }
      // invalid rows are kept as-is (we track them)
    }
    return newRow;
  });

  const errorRows: number[] = [];
  result.forEach((row, rIdx) => {
    if (rIdx === 0) return;
    if (colIsUnchanged(data[rIdx][columnIndex], row[columnIndex])) {
      // Check if original was actually convertible — if not, track as error
      if (data[rIdx][columnIndex] !== null && data[rIdx][columnIndex] !== undefined && data[rIdx][columnIndex] !== "") {
        const check = convertCell(data[rIdx][columnIndex], type, format);
        if (!check.ok) errorRows.push(rIdx);
      }
    }
  });

  // Build preview (first 6 data rows)
  const preview = data.slice(0, 1).concat(result.slice(1, 6 + 1));

  if (errorRows.length > 0) {
    return {
      success: false,
      data: result,
      message: `${errorRows.length} row(s) could not be converted. Rows: ${errorRows.slice(0, 20).join(", ")}`,
      errorRows,
      preview,
    };
  }

  return {
    success: true,
    data: result,
    message: `Converted column to ${type}${format ? ` with format ${format}` : ""}.`,
    errorRows: [],
    preview,
  };
}

function colIsUnchanged(a: any, b: any): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

export { DATE_FORMATS, TIME_FORMATS, DATETIME_FORMATS };