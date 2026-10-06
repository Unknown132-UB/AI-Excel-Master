import { create } from "zustand";
import type { Dataset } from "../types/dataset";
import type { DataVersion } from "../types/version";
import type { DataQualityReport } from "../types/quality";
import VersionManager from "../modules/history/VersionManager";
import DataQualityAnalyzer from "../modules/quality/DataQualityAnalyzer";
import AttendanceAnalyzer from "../modules/attendance/AttendanceAnalyzer";
import type { AttendanceAnalysis } from "../modules/attendance/AttendanceAnalyzer";
import { useWorkbookStore } from "./workbookStore";

interface DataStoreState {
  // ============================================
  // ACTIVE DATASET STATE
  // ============================================
  activeFile: string;
  originalData: any[][];
  currentData: any[][];
  columns: string[];
  rows: any[][];
  isDataLoaded: boolean;

  // ============================================
  // VERSION HISTORY
  // ============================================
  versions: DataVersion[];
  currentVersionId: string | null;
  qualityReport: DataQualityReport | null;
  attendanceAnalysis: AttendanceAnalysis | null;

  // ============================================
  // ACTIONS
  // ============================================
  saveDataset: (dataset: Dataset) => void;
  updateDataset: (newData: any[][], operationName: string, operationType?: string) => void;
  getDataset: () => { headers: string[]; rows: any[][]; data: any[][] } | null;
  clearDataset: () => void;
  undo: () => void;
  redo: () => void;
  goToVersion: (versionId: string) => void;
}

const versionManager = new VersionManager();
const qualityAnalyzer = new DataQualityAnalyzer();
const attendanceAnalyzer = new AttendanceAnalyzer();

export const useDataStore = create<DataStoreState>((set, get) => ({
  // Initial state
  activeFile: "",
  originalData: [],
  currentData: [],
  columns: [],
  rows: [],
  isDataLoaded: false,
  versions: [],
  currentVersionId: null,
  qualityReport: null,
  attendanceAnalysis: null,

  /**
   * Save a dataset to the workspace.
   * This is the SINGLE entry point for all data.
   * All pages must read from this store.
   */
  saveDataset: (dataset) => {
    const fullData = [dataset.headers, ...dataset.rows];
    const version = versionManager.initialize(dataset);
    const qualityReport = qualityAnalyzer.analyze(dataset);
    const attendanceAnalysis = attendanceAnalyzer.analyze(dataset);

    // Sync to workbook store for backward compatibility
    const workbookStore = useWorkbookStore.getState();
    workbookStore.setWorkbookData({
      fileName: dataset.metadata.fileName,
      sheetNames: ["Sheet1"],
      originalData: fullData.map((row) => [...row]),
      currentData: fullData.map((row) => [...row]),
    });

    set({
      activeFile: dataset.metadata.fileName,
      originalData: fullData.map((row) => [...row]),
      currentData: fullData.map((row) => [...row]),
      columns: [...dataset.headers],
      rows: dataset.rows.map((row) => [...row]),
      isDataLoaded: true,
      versions: versionManager.getAllVersions(),
      currentVersionId: version.id,
      qualityReport,
      attendanceAnalysis,
    });
  },

  /**
   * Update the current dataset after any operation.
   * Automatically creates a version snapshot.
   */
  updateDataset: (newData, operationName, operationType = "transform") => {
    const state = get();
    if (!state.isDataLoaded || newData.length === 0) return;

    const headers = newData[0].map((h: any, i: number) => String(h ?? `Column ${i + 1}`));
    const rows = newData.slice(1);

    const dataset: Dataset = {
      headers,
      rows,
      metadata: {
        fileName: state.activeFile,
        fileType: state.activeFile.split(".").pop()?.toLowerCase() || "unknown",
        fileSize: 0,
        importedAt: new Date().toISOString(),
        source: "file",
        rowCount: rows.length,
        columnCount: headers.length,
      },
    };

    const version = versionManager.addVersion(dataset, operationName, operationType);
    const qualityReport = qualityAnalyzer.analyze(dataset);
    const attendanceAnalysis = attendanceAnalyzer.analyze(dataset);

    // Sync to workbook store
    const workbookStore = useWorkbookStore.getState();
    workbookStore.updateData(newData.map((row) => [...row]), operationName);

    set({
      currentData: newData.map((row) => [...row]),
      columns: headers,
      rows: rows.map((row) => [...row]),
      versions: versionManager.getAllVersions(),
      currentVersionId: version.id,
      qualityReport,
      attendanceAnalysis,
    });
  },

  /**
   * Get the current dataset.
   * Returns null if no data is loaded.
   */
  getDataset: () => {
    const state = get();
    if (!state.isDataLoaded || state.currentData.length === 0) {
      return null;
    }
    return {
      headers: state.columns,
      rows: state.rows,
      data: state.currentData.map((row) => [...row]),
    };
  },

  /**
   * Clear all dataset state.
   */
  clearDataset: () => {
    versionManager.reset();
    set({
      activeFile: "",
      originalData: [],
      currentData: [],
      columns: [],
      rows: [],
      isDataLoaded: false,
      versions: [],
      currentVersionId: null,
      qualityReport: null,
      attendanceAnalysis: null,
    });
  },

  /**
   * Undo the last operation.
   */
  undo: () => {
    const version = versionManager.undo();
    if (version) {
      const fullData = [version.data.headers, ...version.data.rows];
      const qualityReport = qualityAnalyzer.analyze(version.data);
      const attendanceAnalysis = attendanceAnalyzer.analyze(version.data);

      // Sync to workbook store
      const workbookStore = useWorkbookStore.getState();
      workbookStore.updateData(fullData.map((row) => [...row]), "Undo");

      set({
        currentData: fullData.map((row) => [...row]),
        columns: [...version.data.headers],
        rows: version.data.rows.map((row) => [...row]),
        currentVersionId: version.id,
        versions: versionManager.getAllVersions(),
        qualityReport,
        attendanceAnalysis,
      });
    }
  },

  /**
   * Redo the last undone operation.
   */
  redo: () => {
    const version = versionManager.redo();
    if (version) {
      const fullData = [version.data.headers, ...version.data.rows];
      const qualityReport = qualityAnalyzer.analyze(version.data);
      const attendanceAnalysis = attendanceAnalyzer.analyze(version.data);

      // Sync to workbook store
      const workbookStore = useWorkbookStore.getState();
      workbookStore.updateData(fullData.map((row) => [...row]), "Redo");

      set({
        currentData: fullData.map((row) => [...row]),
        columns: [...version.data.headers],
        rows: version.data.rows.map((row) => [...row]),
        currentVersionId: version.id,
        versions: versionManager.getAllVersions(),
        qualityReport,
        attendanceAnalysis,
      });
    }
  },

  /**
   * Jump to a specific version.
   */
  goToVersion: (versionId) => {
    const version = versionManager.getVersion(versionId);
    if (version) {
      const fullData = [version.data.headers, ...version.data.rows];
      const qualityReport = qualityAnalyzer.analyze(version.data);
      const attendanceAnalysis = attendanceAnalyzer.analyze(version.data);

      // Sync to workbook store
      const workbookStore = useWorkbookStore.getState();
      workbookStore.updateData(fullData.map((row) => [...row]), `Version ${version.versionNumber}`);

      set({
        currentData: fullData.map((row) => [...row]),
        columns: [...version.data.headers],
        rows: version.data.rows.map((row) => [...row]),
        currentVersionId: version.id,
        qualityReport,
        attendanceAnalysis,
      });
    }
  },
}));