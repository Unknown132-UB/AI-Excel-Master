import type { Dataset } from "../../types/dataset";
import type { DataVersion, VersionChange } from "../../types/version";

export default class VersionManager {
  private versions: DataVersion[] = [];
  private currentIndex: number = -1;

  constructor() {}

  initialize(dataset: Dataset): DataVersion {
    const version: DataVersion = {
      id: this.generateId(),
      versionNumber: 1,
      operationName: "Original Upload",
      operationType: "import",
      timestamp: new Date().toISOString(),
      data: this.cloneDataset(dataset),
      description: "Initial data upload",
      changes: [],
    };

    this.versions = [version];
    this.currentIndex = 0;
    return version;
  }

  addVersion(
    dataset: Dataset,
    operationName: string,
    operationType: string,
    description?: string,
    userAction?: string,
    changes?: VersionChange[]
  ): DataVersion {
    // Truncate any redo history
    this.versions = this.versions.slice(0, this.currentIndex + 1);

    const version: DataVersion = {
      id: this.generateId(),
      versionNumber: this.versions.length + 1,
      operationName,
      operationType,
      timestamp: new Date().toISOString(),
      data: this.cloneDataset(dataset),
      description,
      userAction,
      changes,
    };

    this.versions.push(version);
    this.currentIndex = this.versions.length - 1;
    return version;
  }

  undo(): DataVersion | null {
    if (this.currentIndex <= 0) return null;
    this.currentIndex--;
    return this.getCurrent();
  }

  redo(): DataVersion | null {
    if (this.currentIndex >= this.versions.length - 1) return null;
    this.currentIndex++;
    return this.getCurrent();
  }

  getCurrent(): DataVersion | null {
    if (this.currentIndex < 0 || this.currentIndex >= this.versions.length) {
      return null;
    }
    return this.versions[this.currentIndex];
  }

  getVersion(id: string): DataVersion | null {
    return this.versions.find((v) => v.id === id) || null;
  }

  getVersionByNumber(number: number): DataVersion | null {
    return this.versions.find((v) => v.versionNumber === number) || null;
  }

  getAllVersions(): DataVersion[] {
    return [...this.versions];
  }

  getVersionCount(): number {
    return this.versions.length;
  }

  canUndo(): boolean {
    return this.currentIndex > 0;
  }

  canRedo(): boolean {
    return this.currentIndex < this.versions.length - 1;
  }

  getCurrentIndex(): number {
    return this.currentIndex;
  }

  reset(): void {
    this.versions = [];
    this.currentIndex = -1;
  }

  private cloneDataset(dataset: Dataset): Dataset {
    return {
      headers: [...dataset.headers],
      rows: dataset.rows.map((row) => [...row]),
      metadata: { ...dataset.metadata },
    };
  }

  private generateId(): string {
    return `v-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}