export interface WorkflowStep {
  id: string;
  type: "import" | "clean" | "transform" | "analyze" | "export" | "ai";
  name: string;
  config: any;
}

export interface Workflow {
  id: string;
  name: string;
  description?: string;
  steps: WorkflowStep[];
  createdAt: string;
  updatedAt: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  steps: WorkflowStep[];
  suggestedColumns?: string[];
}