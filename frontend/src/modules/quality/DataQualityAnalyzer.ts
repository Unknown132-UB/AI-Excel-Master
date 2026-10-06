import type { Dataset } from "../../types/dataset";
import type {
  DataQualityReport,
  ColumnProfile,
  ColumnIssue,
  CleaningSuggestion,
  DetectedColumn,
} from "../../types/quality";

export default class DataQualityAnalyzer {
  analyze(dataset: Dataset): DataQualityReport {
    const { headers, rows } = dataset;
    const totalRows = rows.length;
    const totalColumns = headers.length;

    // Count missing values
    let missingValues = 0;
    rows.forEach((row) => {
      row.forEach((cell) => {
        if (cell === "" || cell === null || cell === undefined) missingValues++;
      });
    });

    // Count duplicate rows
    const seen = new Set<string>();
    let duplicateRows = 0;
    rows.forEach((row) => {
      const key = JSON.stringify(row);
      if (seen.has(key)) duplicateRows++;
      else seen.add(key);
    });

    // Analyze each column
    const columnProfiles: ColumnProfile[] = headers.map((header, index) =>
      this.analyzeColumn(header, index, rows)
    );

    // Collect all issues
    const issues: ColumnIssue[] = [];
    columnProfiles.forEach((profile) => {
      profile.issues.forEach((issue) => issues.push(issue));
    });

    // Detect column roles
    const detectedColumns = this.detectColumnRoles(headers, rows);

    // Generate cleaning suggestions
    const suggestions = this.generateSuggestions(columnProfiles, detectedColumns);

    // Calculate quality score (0-100)
    const score = this.calculateScore(
      totalRows,
      totalColumns,
      missingValues,
      duplicateRows,
      issues
    );

    return {
      score,
      totalRows,
      totalColumns,
      missingValues,
      missingPercentage: totalRows * totalColumns > 0
        ? Math.round((missingValues / (totalRows * totalColumns)) * 100)
        : 0,
      duplicateRows,
      duplicatePercentage: totalRows > 0
        ? Math.round((duplicateRows / totalRows) * 100)
        : 0,
      columnProfiles,
      issues,
      suggestions,
      detectedColumns,
    };
  }

  private analyzeColumn(name: string, index: number, rows: any[][]): ColumnProfile {
    const values = rows.map((row) => row[index]);
    const nonEmpty = values.filter((v) => v !== "" && v !== null && v !== undefined);
    const missingCount = values.length - nonEmpty.length;

    // Detect data type
    const typeCounts = new Map<string, number>();
    nonEmpty.forEach((v) => {
      const type = this.detectType(v);
      typeCounts.set(type, (typeCounts.get(type) || 0) + 1);
    });

    let dataType = "mixed";
    let maxCount = 0;
    typeCounts.forEach((count, type) => {
      if (count > maxCount) {
        maxCount = count;
        dataType = type;
      }
    });

    // Unique and duplicate counts
    const uniqueValues = new Set(nonEmpty.map((v) => String(v)));
    const duplicateCount = nonEmpty.length - uniqueValues.size;

    // Numeric stats
    const numericValues = nonEmpty
      .map((v) => Number(v))
      .filter((v) => !isNaN(v));

    const min = numericValues.length > 0 ? Math.min(...numericValues) : undefined;
    const max = numericValues.length > 0 ? Math.max(...numericValues) : undefined;
    const mean = numericValues.length > 0
      ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length
      : undefined;

    const sorted = [...numericValues].sort((a, b) => a - b);
    const median = sorted.length > 0
      ? sorted.length % 2 === 0
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)]
      : undefined;

    // Detect issues
    const issues: ColumnIssue[] = [];

    if (missingCount > 0) {
      const pct = Math.round((missingCount / values.length) * 100);
      issues.push({
        type: "missing",
        severity: pct > 20 ? "high" : pct > 5 ? "medium" : "low",
        message: `${missingCount} missing values (${pct}%)`,
        suggestion: `Fill or remove missing values in "${name}"`,
      });
    }

    if (duplicateCount > 0) {
      issues.push({
        type: "duplicate",
        severity: duplicateCount > 20 ? "medium" : "low",
        message: `${duplicateCount} duplicate values`,
        suggestion: `Remove duplicates in "${name}"`,
      });
    }

    // Check for mixed types
    if (typeCounts.size > 1) {
      issues.push({
        type: "inconsistent",
        severity: "medium",
        message: `Mixed data types detected: ${Array.from(typeCounts.keys()).join(", ")}`,
        suggestion: `Convert all values in "${name}" to a consistent type`,
      });
    }

    // Check for outliers (values > 3 standard deviations from mean)
    if (numericValues.length > 3) {
      const stdDev = Math.sqrt(
        numericValues.reduce((acc, v) => acc + Math.pow(v - (mean || 0), 2), 0) /
          numericValues.length
      );
      const outliers = numericValues.filter(
        (v) => Math.abs(v - (mean || 0)) > 3 * stdDev
      );
      if (outliers.length > 0) {
        issues.push({
          type: "outlier",
          severity: "low",
          message: `${outliers.length} potential outliers detected`,
          suggestion: `Review outliers in "${name}"`,
        });
      }
    }

    return {
      name,
      index,
      dataType,
      confidence: nonEmpty.length > 0
        ? Math.round((maxCount / nonEmpty.length) * 100)
        : 0,
      missingCount,
      missingPercentage: values.length > 0
        ? Math.round((missingCount / values.length) * 100)
        : 0,
      uniqueCount: uniqueValues.size,
      duplicateCount,
      min,
      max,
      mean,
      median,
      sampleValues: nonEmpty.slice(0, 5),
      issues,
    };
  }

  private detectType(value: any): string {
    if (typeof value === "number") {
      return Number.isInteger(value) ? "integer" : "decimal";
    }
    if (typeof value === "boolean") return "boolean";
    if (value instanceof Date) return "date";

    const str = String(value).trim();
    if (str === "") return "empty";

    // Date detection
    if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(str) ||
        /^\d{1,2}[-/]\d{1,2}[-/]\d{4}$/.test(str) ||
        /^\d{1,2}[-/]\d{1,2}[-/]\d{2}$/.test(str)) {
      return "date";
    }

    // Time detection
    if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(str)) return "time";

    // Datetime detection
    if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}[ T]\d{1,2}:\d{2}/.test(str)) return "datetime";

    // Number detection
    if (/^-?\d+$/.test(str)) return "integer";
    if (/^-?\d*\.\d+$/.test(str)) return "decimal";

    // Boolean detection
    if (/^(true|false|yes|no|y|n)$/i.test(str)) return "boolean";

    return "string";
  }

  private detectColumnRoles(headers: string[], rows: any[][]): DetectedColumn[] {
    return headers.map((header, index) => {
      const lower = header.toLowerCase();
      const values = rows.slice(0, 20).map((row) => String(row[index] || ""));

      let role: DetectedColumn["role"] = "other";
      let confidence = 0;

      // Name detection
      if (/(name|employee|student|customer|person|full.?name)/i.test(lower)) {
        role = "name";
        confidence = 90;
      }
      // Email detection
      else if (/(email|e-?mail|mail)/i.test(lower)) {
        role = "email";
        confidence = 95;
      }
      // Phone detection
      else if (/(phone|mobile|contact|tel|cell)/i.test(lower)) {
        role = "phone";
        confidence = 90;
      }
      // Date detection
      else if (/(date|day|dob|birth|join|hire|attendance.?date)/i.test(lower)) {
        role = "date";
        confidence = 85;
      }
      // Time detection
      else if (/(time|punch|clock|in|out|hour)/i.test(lower)) {
        role = "time";
        confidence = 80;
      }
      // Attendance detection
      else if (/(attendance|present|absent|status|leave)/i.test(lower)) {
        role = "attendance";
        confidence = 85;
      }
      // Salary detection
      else if (/(salary|pay|wage|income|amount|cost|price|revenue)/i.test(lower)) {
        role = "salary";
        confidence = 85;
      }
      // ID detection
      else if (/(id|code|number|emp.?id|employee.?id|aadhaar|pan|ssn)/i.test(lower)) {
        role = "id";
        confidence = 80;
      }
      // Location detection
      else if (/(address|city|state|country|location|zip|pincode|region)/i.test(lower)) {
        role = "location";
        confidence = 85;
      }
      // Department detection
      else if (/(department|dept|team|division|unit)/i.test(lower)) {
        role = "department";
        confidence = 85;
      }

      // Validate with sample values
      if (role === "email" && values.length > 0) {
        const emailCount = values.filter((v) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)).length;
        confidence = Math.min(95, Math.round((emailCount / values.length) * 100));
      }
      if (role === "phone" && values.length > 0) {
        const phoneCount = values.filter((v) => /^[+\d][\d\s\-()]{7,}$/.test(v)).length;
        confidence = Math.min(90, Math.round((phoneCount / values.length) * 100));
      }

      return { name: header, role, confidence };
    });
  }

  private generateSuggestions(
    profiles: ColumnProfile[],
    detectedColumns: DetectedColumn[]
  ): CleaningSuggestion[] {
    const suggestions: CleaningSuggestion[] = [];

    profiles.forEach((profile) => {
      const detected = detectedColumns.find((d) => d.name === profile.name);

      if (profile.missingCount > 0) {
        suggestions.push({
          id: `missing-${profile.name}`,
          column: profile.name,
          issue: `${profile.missingCount} missing values`,
          suggestion: `Fill missing values in "${profile.name}"`,
          action: "fill_missing",
          severity: profile.missingPercentage > 20 ? "high" : "medium",
        });
      }

      if (profile.duplicateCount > 0) {
        suggestions.push({
          id: `duplicate-${profile.name}`,
          column: profile.name,
          issue: `${profile.duplicateCount} duplicate values`,
          suggestion: `Remove duplicates in "${profile.name}"`,
          action: "remove_duplicates",
          severity: "low",
        });
      }

      if (profile.dataType === "mixed") {
        suggestions.push({
          id: `type-${profile.name}`,
          column: profile.name,
          issue: "Mixed data types",
          suggestion: `Convert "${profile.name}" to a consistent data type`,
          action: "convert_type",
          severity: "medium",
        });
      }

      // Role-specific suggestions
      if (detected?.role === "date" && profile.dataType !== "date") {
        suggestions.push({
          id: `date-${profile.name}`,
          column: profile.name,
          issue: "Date column has non-date values",
          suggestion: `Convert "${profile.name}" to date format`,
          action: "convert_date",
          severity: "high",
        });
      }

      if (detected?.role === "phone" && profile.dataType !== "string") {
        suggestions.push({
          id: `phone-${profile.name}`,
          column: profile.name,
          issue: "Phone column has non-string values",
          suggestion: `Format "${profile.name}" as phone numbers`,
          action: "format_phone",
          severity: "medium",
        });
      }
    });

    return suggestions;
  }

  private calculateScore(
    totalRows: number,
    totalColumns: number,
    missingValues: number,
    duplicateRows: number,
    issues: ColumnIssue[]
  ): number {
    if (totalRows === 0 || totalColumns === 0) return 0;

    let score = 100;

    // Deduct for missing values
    const totalCells = totalRows * totalColumns;
    const missingPct = missingValues / totalCells;
    score -= missingPct * 40;

    // Deduct for duplicates
    const dupPct = duplicateRows / totalRows;
    score -= dupPct * 20;

    // Deduct for issues
    issues.forEach((issue) => {
      if (issue.severity === "high") score -= 5;
      else if (issue.severity === "medium") score -= 3;
      else score -= 1;
    });

    return Math.max(0, Math.min(100, Math.round(score)));
  }
}