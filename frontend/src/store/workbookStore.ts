import { create } from "zustand";
import type { Workbook, DesignSettings, ColumnProperties, DataType } from "../types/excel";

export const DEFAULT_DESIGN_SETTINGS: DesignSettings = {
  viewMode: "table",
  theme: "blue",
  fontSize: 14,
  maxRows: 50,
  showRowNumbers: true,
  showHeader: true,
};

export const DEFAULT_COLUMN_PROPERTIES: ColumnProperties = {};

interface HistoryEntry {
  operation: string;
  beforeData: any[][];
  afterData: any[][];
  timestamp: string;
}

interface WorkbookStore {
  // ============================================
  // UNIFIED DATA STATE - Single Source of Truth
  // ============================================
  fileName: string;
  sheetNames: string[];
  originalData: any[][];
  currentData: any[][];
  history: HistoryEntry[];
  version: number;
  isLoaded: boolean;

  // Legacy workbook structure (kept for backward compatibility)
  workbook: Workbook | null;
  setWorkbook: (workbook: Workbook) => void;
  setActiveSheet: (sheetId: string) => void;
  updateSheetData: (data: any[][]) => void;

  // ============================================
  // UNIFIED ACTIONS
  // ============================================
  setWorkbookData: (data: {
    fileName: string;
    sheetNames: string[];
    originalData: any[][];
    currentData: any[][];
  }) => void;
  updateData: (data: any[][], operation?: string) => void;
  undo: () => void;
  redo: () => void;
  clearWorkbook: () => void;

  // DESIGN STATE — persistent across reruns and panel switches
  designSettings: DesignSettings;
  updateDesignSettings: (settings: Partial<DesignSettings>) => void;

  // COLUMN PROPERTY STATE — persistent metadata describing each column
  columnProperties: ColumnProperties;
  updateColumnProperty: (columnName: string, property: { type?: DataType; format?: string | null }) => void;
  setColumnProperties: (properties: ColumnProperties) => void;

  clearAllState: () => void;
}

export const useWorkbookStore = create<WorkbookStore>((set) => ({
  // Unified data state
  fileName: "",
  sheetNames: [],
  originalData: [],
  currentData: [],
  history: [],
  version: 0,
  isLoaded: false,

  // Legacy workbook
  workbook: null,

  setWorkbook: (workbook) =>
    set(() => {
      // Also sync unified state
      const activeSheet = workbook.sheets?.find((s) => s.id === workbook.activeSheet);
      const data = activeSheet?.data || workbook.sheets?.[0]?.data || [];

      return {
        workbook,
        fileName: workbook.name || "",
        sheetNames: workbook.sheets?.map((s) => s.name) || [],
        originalData: data.length > 0 ? data.map((row: any[]) => [...row]) : [],
        currentData: data.length > 0 ? data.map((row: any[]) => [...row]) : [],
        isLoaded: data.length > 0,
        version: 1,
        history: [],
        // New data → reset column properties but keep design settings
        columnProperties: { ...DEFAULT_COLUMN_PROPERTIES },
      };
    }),

  setActiveSheet: (sheetId) =>
    set((state) => ({
      workbook: state.workbook
        ? {
            ...state.workbook,
            activeSheet: sheetId,
          }
        : null,
    })),

  // ✅ SINGLE SOURCE OF TRUTH:
  // Every transformation/cleaning operation MUST call this
  // so Export always gets the latest modified data.
  updateSheetData: (data) =>
    set((state) => {
      if (!state.workbook) return state;

      const activeSheetId = state.workbook.activeSheet;
      const sheets = state.workbook.sheets.map((sheet) =>
        sheet.id === activeSheetId
          ? { ...sheet, data }
          : sheet
      );

      // Also update unified state
      const beforeData = state.currentData;
      const historyEntry: HistoryEntry = {
        operation: "Data Update",
        beforeData: beforeData.map((row) => [...row]),
        afterData: data.map((row) => [...row]),
        timestamp: new Date().toISOString(),
      };

      return {
        workbook: {
          ...state.workbook,
          sheets,
        },
        currentData: data.map((row) => [...row]),
        history: [...state.history, historyEntry],
        version: state.version + 1,
      };
    }),

  // ============================================
  // UNIFIED ACTIONS
  // ============================================
  setWorkbookData: ({ fileName, sheetNames, originalData, currentData }) =>
    set(() => {
      // Build legacy workbook structure too
      const workbook: Workbook = {
        id: `wb-${Date.now()}`,
        name: fileName,
        sheets: sheetNames.map((name, index) => ({
          id: `sheet-${index}`,
          name,
          data: currentData.map((row) => [...row]),
        })),
        activeSheet: `sheet-0`,
      };

      return {
        fileName,
        sheetNames,
        originalData: originalData.map((row) => [...row]),
        currentData: currentData.map((row) => [...row]),
        history: [],
        version: 1,
        isLoaded: currentData.length > 0,
        workbook,
        columnProperties: { ...DEFAULT_COLUMN_PROPERTIES },
      };
    }),

  updateData: (data, operation) =>
    set((state) => {
      const beforeData = state.currentData;
      const historyEntry: HistoryEntry = {
        operation: operation || "Data Update",
        beforeData: beforeData.map((row) => [...row]),
        afterData: data.map((row) => [...row]),
        timestamp: new Date().toISOString(),
      };

      // Also update legacy workbook
      let workbook = state.workbook;
      if (workbook) {
        const activeSheetId = workbook.activeSheet;
        const sheets = workbook.sheets.map((sheet) =>
          sheet.id === activeSheetId
            ? { ...sheet, data: data.map((row) => [...row]) }
            : sheet
        );
        workbook = { ...workbook, sheets };
      }

      return {
        currentData: data.map((row) => [...row]),
        history: [...state.history, historyEntry],
        version: state.version + 1,
        workbook,
      };
    }),

  undo: () =>
    set((state) => {
      if (state.history.length === 0) return state;
      const lastEntry = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);

      // Also update legacy workbook
      let workbook = state.workbook;
      if (workbook) {
        const activeSheetId = workbook.activeSheet;
        const sheets = workbook.sheets.map((sheet) =>
          sheet.id === activeSheetId
            ? { ...sheet, data: lastEntry.beforeData.map((row) => [...row]) }
            : sheet
        );
        workbook = { ...workbook, sheets };
      }

      return {
        currentData: lastEntry.beforeData.map((row) => [...row]),
        history: newHistory,
        version: Math.max(1, state.version - 1),
        workbook,
      };
    }),

  redo: () =>
    set((state) => {
      // Redo is not tracked separately; we keep it simple
      return state;
    }),

  clearWorkbook: () =>
    set({
      fileName: "",
      sheetNames: [],
      originalData: [],
      currentData: [],
      history: [],
      version: 0,
      isLoaded: false,
      workbook: null,
      columnProperties: { ...DEFAULT_COLUMN_PROPERTIES },
    }),

  designSettings: { ...DEFAULT_DESIGN_SETTINGS },

  updateDesignSettings: (settings) =>
    set((state) => ({
      designSettings: {
        ...state.designSettings,
        ...settings,
      },
    })),

  columnProperties: { ...DEFAULT_COLUMN_PROPERTIES },

  updateColumnProperty: (columnName, property) =>
    set((state) => ({
      columnProperties: {
        ...state.columnProperties,
        [columnName]: {
          ...(state.columnProperties[columnName] || { type: "string", format: null }),
          ...property,
        },
      },
    })),

  setColumnProperties: (properties) =>
    set({ columnProperties: { ...properties } }),

  clearAllState: () =>
    set({
      workbook: null,
      columnProperties: { ...DEFAULT_COLUMN_PROPERTIES },
      fileName: "",
      sheetNames: [],
      originalData: [],
      currentData: [],
      history: [],
      version: 0,
      isLoaded: false,
    }),
}));