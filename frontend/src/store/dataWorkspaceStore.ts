import { create } from "zustand";
import type { Dataset } from "../types/dataset";
import type { DataVersion } from "../types/version";
import type { DataQualityReport } from "../types/quality";
import type { Project } from "../types/project";
import VersionManager from "../modules/history/VersionManager";
import DataQualityAnalyzer from "../modules/quality/DataQualityAnalyzer";
import AIController from "../modules/ai-agent/AIController";
import type { AgentExecutionResult, ChartConfig } from "../modules/ai-agent/types";
import AttendanceAnalyzer from "../modules/attendance/AttendanceAnalyzer";
import type { AttendanceAnalysis } from "../modules/attendance/AttendanceAnalyzer";
import { useWorkbookStore } from "./workbookStore";
import { useDataStore } from "./dataStore";

interface DataWorkspaceState {
  dataset: Dataset | null;
  versions: DataVersion[];
  currentVersionId: string | null;
  qualityReport: DataQualityReport | null;
  attendanceAnalysis: AttendanceAnalysis | null;
  projects: Project[];
  currentProjectId: string | null;
  aiHistory: { command: string; result: string; timestamp: string }[];
  aiExecution: AgentExecutionResult | null;
  aiChartConfigs: ChartConfig[];
  aiThinking: string | null;
  aiSteps: { description: string; status: string }[];

  // Actions
  importDataset: (dataset: Dataset) => void;
  applyAICommand: (command: string) => Promise<{ success: boolean; message: string; data?: Dataset }>;
  undo: () => void;
  redo: () => void;
  goToVersion: (versionId: string) => void;
  updateDataset: (dataset: Dataset, operationName: string, operationType: string) => void;
  saveProject: (name: string, description?: string) => void;
  loadProject: (projectId: string) => void;
  clearAll: () => void;
}

const versionManager = new VersionManager();
const qualityAnalyzer = new DataQualityAnalyzer();
const aiController = new AIController();
const attendanceAnalyzer = new AttendanceAnalyzer();

export const useDataWorkspaceStore = create<DataWorkspaceState>((set, get) => ({
  dataset: null,
  versions: [],
  currentVersionId: null,
  qualityReport: null,
  attendanceAnalysis: null,
  projects: [],
  currentProjectId: null,
  aiHistory: [],
  aiExecution: null,
  aiChartConfigs: [],
  aiThinking: null,
  aiSteps: [],

  importDataset: (dataset) => {
    const version = versionManager.initialize(dataset);
    const qualityReport = qualityAnalyzer.analyze(dataset);
    const attendanceAnalysis = attendanceAnalyzer.analyze(dataset);

    // Sync to unified workbook store
    const workbookStore = useWorkbookStore.getState();
    workbookStore.setWorkbookData({
      fileName: dataset.metadata.fileName,
      sheetNames: ["Sheet1"],
      originalData: [dataset.headers, ...dataset.rows],
      currentData: [dataset.headers, ...dataset.rows],
    });

    // Sync to central data store
    useDataStore.getState().saveDataset(dataset);

    set({
      dataset,
      versions: versionManager.getAllVersions(),
      currentVersionId: version.id,
      qualityReport,
      attendanceAnalysis,
    });
  },

  applyAICommand: async (command) => {
    const { dataset } = get();
    if (!dataset) {
      return { success: false, message: "No dataset loaded. Please import data first." };
    }

    const execution = await aiController.execute(
      { input: command, dataset },
      {
        onThinking: (message) => set({ aiThinking: message }),
        onStepStart: (step) => set((state) => ({
          aiSteps: [
            ...state.aiSteps,
            { description: step.description, status: "running" },
          ],
        })),
        onStepComplete: (step) => set((state) => ({
          aiSteps: state.aiSteps.map((s) =>
            s.description === step.description ? { ...s, status: "completed" } : s
          ),
        })),
        onStepError: (step) => set((state) => ({
          aiSteps: state.aiSteps.map((s) =>
            s.description === step.description ? { ...s, status: "failed" } : s
          ),
        })),
      }
    );

    if (execution.success && execution.finalData) {
      const version = versionManager.addVersion(
        execution.finalData,
        command,
        "ai",
        command,
        command
      );

      const qualityReport = qualityAnalyzer.analyze(execution.finalData);
      const attendanceAnalysis = attendanceAnalyzer.analyze(execution.finalData);

      // Sync to central data store
      const fullData = [execution.finalData.headers, ...execution.finalData.rows];
      useDataStore.getState().updateDataset(fullData, command, "ai");

      set((state) => ({
        dataset: execution.finalData,
        versions: versionManager.getAllVersions(),
        currentVersionId: version.id,
        qualityReport,
        attendanceAnalysis,
        aiExecution: execution,
        aiChartConfigs: execution.chartConfigs || [],
        aiThinking: null,
        aiSteps: execution.steps.map((s) => ({
          description: s.description,
          status: s.status,
        })),
        aiHistory: [
          ...state.aiHistory,
          {
            command,
            result: execution.message,
            timestamp: new Date().toISOString(),
          },
        ],
      }));

      return {
        success: true,
        message: execution.message,
        data: execution.finalData,
      };
    }

    set((state) => ({
      aiExecution: execution,
      aiThinking: null,
      aiSteps: execution.steps.map((s) => ({
        description: s.description,
        status: s.status,
      })),
      aiHistory: [
        ...state.aiHistory,
        {
          command,
          result: execution.message,
          timestamp: new Date().toISOString(),
        },
      ],
    }));

    return { success: execution.success, message: execution.message };
  },

  undo: () => {
    const version = versionManager.undo();
    if (version) {
      const qualityReport = qualityAnalyzer.analyze(version.data);
      const attendanceAnalysis = attendanceAnalyzer.analyze(version.data);
      set({
        dataset: version.data,
        currentVersionId: version.id,
        versions: versionManager.getAllVersions(),
        qualityReport,
        attendanceAnalysis,
      });
    }
  },

  redo: () => {
    const version = versionManager.redo();
    if (version) {
      const qualityReport = qualityAnalyzer.analyze(version.data);
      const attendanceAnalysis = attendanceAnalyzer.analyze(version.data);
      set({
        dataset: version.data,
        currentVersionId: version.id,
        versions: versionManager.getAllVersions(),
        qualityReport,
        attendanceAnalysis,
      });
    }
  },

  goToVersion: (versionId) => {
    const version = versionManager.getVersion(versionId);
    if (version) {
      const qualityReport = qualityAnalyzer.analyze(version.data);
      const attendanceAnalysis = attendanceAnalyzer.analyze(version.data);
      set({
        dataset: version.data,
        currentVersionId: version.id,
        qualityReport,
        attendanceAnalysis,
      });
    }
  },

  updateDataset: (dataset, operationName, operationType) => {
    const version = versionManager.addVersion(dataset, operationName, operationType);
    const qualityReport = qualityAnalyzer.analyze(dataset);
    const attendanceAnalysis = attendanceAnalyzer.analyze(dataset);

    // Sync to central data store
    const fullData = [dataset.headers, ...dataset.rows];
    useDataStore.getState().updateDataset(fullData, operationName, operationType);

    set({
      dataset,
      versions: versionManager.getAllVersions(),
      currentVersionId: version.id,
      qualityReport,
      attendanceAnalysis,
    });
  },

  saveProject: (name, description) => {
    const { dataset, versions, currentVersionId, aiHistory } = get();
    if (!dataset) return;

    const project: Project = {
      id: `project-${Date.now()}`,
      name,
      description,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      dataset,
      versions,
      currentVersionId: currentVersionId || "",
      aiCommands: aiHistory.map((h) => h.command),
      exportHistory: [],
    };

    set((state) => ({
      projects: [...state.projects, project],
      currentProjectId: project.id,
    }));
  },

  loadProject: (projectId) => {
    const { projects } = get();
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;

    // Rebuild version manager state
    versionManager.reset();
    project.versions.forEach((v, index) => {
      if (index === 0) {
        versionManager.initialize(v.data);
      } else {
        versionManager.addVersion(v.data, v.operationName, v.operationType);
      }
    });

    const qualityReport = qualityAnalyzer.analyze(project.dataset);
    const attendanceAnalysis = attendanceAnalyzer.analyze(project.dataset);

    set({
      dataset: project.dataset,
      versions: project.versions,
      currentVersionId: project.currentVersionId,
      qualityReport,
      attendanceAnalysis,
      currentProjectId: projectId,
    });
  },

  clearAll: () => {
    versionManager.reset();
    set({
      dataset: null,
      versions: [],
      currentVersionId: null,
      qualityReport: null,
      attendanceAnalysis: null,
      currentProjectId: null,
      aiHistory: [],
    });
  },
}));