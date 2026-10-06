import type { Template } from "../../types/workflow";

class TemplateRegistry {
  private static templates: Template[] = [
    {
      id: "attendance-analyzer",
      name: "Attendance Analyzer",
      description: "Analyze biometric attendance data, calculate working hours, and generate attendance reports",
      icon: "📋",
      category: "HR",
      steps: [
        { id: "import", type: "import", name: "Import Attendance File", config: {} },
        { id: "clean", type: "clean", name: "Remove Duplicates", config: { action: "remove_duplicates" } },
        { id: "transform", type: "transform", name: "Format Dates", config: { action: "convert_date", format: "DD-MM-YYYY" } },
        { id: "ai", type: "ai", name: "Create Attendance Status", config: { command: "Create attendance status column" } },
        { id: "ai", type: "ai", name: "Calculate Working Hours", config: { command: "Calculate employee working hours" } },
        { id: "analyze", type: "analyze", name: "Analyze Attendance", config: {} },
        { id: "export", type: "export", name: "Export Report", config: { format: "excel" } },
      ],
      suggestedColumns: ["Employee ID", "Name", "Date", "Punch In", "Punch Out", "Working Hours", "Late Time"],
    },
    {
      id: "sales-report",
      name: "Sales Report Generator",
      description: "Clean sales data, calculate totals, and generate sales performance reports",
      icon: "💰",
      category: "Sales",
      steps: [
        { id: "import", type: "import", name: "Import Sales Data", config: {} },
        { id: "clean", type: "clean", name: "Clean Data", config: { action: "auto_clean" } },
        { id: "ai", type: "ai", name: "Calculate Total Sales", config: { command: "Calculate total sales" } },
        { id: "ai", type: "ai", name: "Create Sales Category", config: { command: "Create sales category column" } },
        { id: "analyze", type: "analyze", name: "Analyze Sales", config: {} },
        { id: "export", type: "export", name: "Export Report", config: { format: "excel" } },
      ],
      suggestedColumns: ["Product", "Category", "Price", "Quantity", "Sales Date", "Salesperson"],
    },
    {
      id: "student-results",
      name: "Student Result Analyzer",
      description: "Analyze student exam results, calculate grades, and generate performance reports",
      icon: "🎓",
      category: "Education",
      steps: [
        { id: "import", type: "import", name: "Import Student Results", config: {} },
        { id: "clean", type: "clean", name: "Clean Data", config: { action: "auto_clean" } },
        { id: "ai", type: "ai", name: "Create Grade Column", config: { command: "Create grade column from marks" } },
        { id: "analyze", type: "analyze", name: "Analyze Results", config: {} },
        { id: "export", type: "export", name: "Export Report", config: { format: "excel" } },
      ],
      suggestedColumns: ["Student ID", "Name", "Subject", "Marks", "Grade", "Class"],
    },
    {
      id: "employee-db",
      name: "Employee Database Cleaner",
      description: "Clean employee records, detect duplicates, and standardize data formats",
      icon: "👥",
      category: "HR",
      steps: [
        { id: "import", type: "import", name: "Import Employee Data", config: {} },
        { id: "clean", type: "clean", name: "Remove Duplicates", config: { action: "remove_duplicates" } },
        { id: "clean", type: "clean", name: "Fill Missing Values", config: { action: "fill_missing" } },
        { id: "ai", type: "ai", name: "Detect Issues", config: { command: "Find missing employee IDs" } },
        { id: "export", type: "export", name: "Export Cleaned Data", config: { format: "excel" } },
      ],
      suggestedColumns: ["Employee ID", "Name", "Email", "Phone", "Department", "DOB", "Salary"],
    },
    {
      id: "inventory-manager",
      name: "Inventory Manager",
      description: "Track inventory levels, detect low stock, and generate inventory reports",
      icon: "📦",
      category: "Operations",
      steps: [
        { id: "import", type: "import", name: "Import Inventory Data", config: {} },
        { id: "clean", type: "clean", name: "Clean Data", config: { action: "auto_clean" } },
        { id: "ai", type: "ai", name: "Calculate Stock Value", config: { command: "Calculate total stock value" } },
        { id: "analyze", type: "analyze", name: "Analyze Inventory", config: {} },
        { id: "export", type: "export", name: "Export Report", config: { format: "excel" } },
      ],
      suggestedColumns: ["Product ID", "Product Name", "Category", "Quantity", "Price", "Supplier"],
    },
  ];

  static getAll(): Template[] {
    return this.templates;
  }

  static getById(id: string): Template | undefined {
    return this.templates.find((t) => t.id === id);
  }

  static getByCategory(category: string): Template[] {
    return this.templates.filter((t) => t.category === category);
  }

  static getCategories(): string[] {
    return Array.from(new Set(this.templates.map((t) => t.category)));
  }

  static register(template: Template): void {
    this.templates.push(template);
  }
}

export default TemplateRegistry;