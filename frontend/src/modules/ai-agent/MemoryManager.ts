import type { MemoryEntry, AgentContext, AgentExecutionResult } from "./types";
import type { Dataset } from "../../types/dataset";

export default class MemoryManager {
  private context: AgentContext;

  constructor() {
    this.context = {
      dataset: null,
      memory: [],
      currentPlan: null,
      executionHistory: [],
    };
  }

  setDataset(dataset: Dataset | null): void {
    this.context.dataset = dataset;
    if (dataset) {
      this.addMemory({
        type: "dataset_version",
        content: `Dataset loaded: ${dataset.metadata.fileName} (${dataset.rows.length} rows, ${dataset.headers.length} columns)`,
        data: { fileName: dataset.metadata.fileName, rows: dataset.rows.length, columns: dataset.headers.length },
      });
    }
  }

  getDataset(): Dataset | null {
    return this.context.dataset;
  }

  addMemory(entry: Omit<MemoryEntry, "id" | "timestamp">): MemoryEntry {
    const memoryEntry: MemoryEntry = {
      ...entry,
      id: `mem-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
    };
    this.context.memory.push(memoryEntry);
    // Keep memory bounded
    if (this.context.memory.length > 100) {
      this.context.memory = this.context.memory.slice(-100);
    }
    return memoryEntry;
  }

  addOperation(operation: string, data?: any): void {
    this.addMemory({
      type: "operation",
      content: operation,
      data,
    });
  }

  addInstruction(instruction: string): void {
    this.addMemory({
      type: "instruction",
      content: instruction,
    });
  }

  addExecutionResult(result: AgentExecutionResult): void {
    this.context.executionHistory.push(result);
    if (this.context.executionHistory.length > 50) {
      this.context.executionHistory = this.context.executionHistory.slice(-50);
    }
  }

  getMemory(type?: MemoryEntry["type"]): MemoryEntry[] {
    if (type) {
      return this.context.memory.filter((m) => m.type === type);
    }
    return [...this.context.memory];
  }

  getRecentOperations(count: number = 10): MemoryEntry[] {
    return this.context.memory
      .filter((m) => m.type === "operation")
      .slice(-count);
  }

  getExecutionHistory(): AgentExecutionResult[] {
    return [...this.context.executionHistory];
  }

  getContext(): AgentContext {
    return {
      ...this.context,
      memory: [...this.context.memory],
      executionHistory: [...this.context.executionHistory],
    };
  }

  clear(): void {
    this.context = {
      dataset: null,
      memory: [],
      currentPlan: null,
      executionHistory: [],
    };
  }

  getDatasetVersions(): MemoryEntry[] {
    return this.context.memory.filter((m) => m.type === "dataset_version");
  }

  getLastDatasetVersion(): MemoryEntry | null {
    const versions = this.getDatasetVersions();
    return versions.length > 0 ? versions[versions.length - 1] : null;
  }
}