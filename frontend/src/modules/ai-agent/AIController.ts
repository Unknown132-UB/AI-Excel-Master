import type {
  AgentRequest,
  AgentExecutionResult,
  AgentPlan,
  AgentStep,
  ChartConfig,
  ToolResult,
} from "./types";
import IntentAnalyzer from "./IntentAnalyzer";
import AgentPlanner from "./AgentPlanner";
import ToolExecutor from "./ToolExecutor";
import MemoryManager from "./MemoryManager";
import ResponseGenerator from "./ResponseGenerator";

export interface AIControllerCallbacks {
  onThinking?: (message: string) => void;
  onStepStart?: (step: AgentStep, index: number, total: number) => void;
  onStepComplete?: (step: AgentStep, result: ToolResult) => void;
  onStepError?: (step: AgentStep, error: string) => void;
  onPlanCreated?: (plan: AgentPlan) => void;
}

export default class AIController {
  private intentAnalyzer: IntentAnalyzer;
  private planner: AgentPlanner;
  private executor: ToolExecutor;
  private memory: MemoryManager;
  private responseGenerator: ResponseGenerator;

  constructor() {
    this.intentAnalyzer = new IntentAnalyzer();
    this.planner = new AgentPlanner();
    this.executor = new ToolExecutor();
    this.memory = new MemoryManager();
    this.responseGenerator = new ResponseGenerator();
  }

  async execute(
    request: AgentRequest,
    callbacks?: AIControllerCallbacks
  ): Promise<AgentExecutionResult> {
    const startTime = Date.now();
    const { input, dataset, file, url } = request;

    // Store the dataset in memory
    if (dataset) {
      this.memory.setDataset(dataset);
    }

    // Record the instruction
    this.memory.addInstruction(input);

    // 1. Understand intent
    callbacks?.onThinking?.(this.responseGenerator.generateThinkingMessage(input));
    const intent = this.intentAnalyzer.analyze(input);

    // 2. Create plan
    const plan = this.planner.createPlan(intent, dataset || null);
    callbacks?.onPlanCreated?.(plan);

    // 3. Execute plan steps
    let currentDataset = dataset || null;
    const steps: AgentStep[] = [];
    const chartConfigs: ChartConfig[] = [];
    let reportContent: string | undefined;
    let exportData: any;
    let queryResult: any;

    for (let i = 0; i < plan.steps.length; i++) {
      const step = plan.steps[i];
      step.status = "running";
      steps.push(step);

      callbacks?.onStepStart?.(step, i + 1, plan.steps.length);

      // Add file/url params to steps that need them
      if (file && (step.tool === "extract_pdf" || step.tool === "extract_image" || step.tool === "import_data")) {
        step.params = { ...step.params, file };
      }
      if (url && (step.tool === "web_search" || step.tool === "import_data")) {
        step.params = { ...step.params, url };
      }

      const result = await this.executor.executeStep(step, currentDataset);

      if (result.success) {
        step.status = "completed";
        step.result = result;

        // Update dataset if tool returned new data
        if (result.data) {
          currentDataset = result.data;
          this.memory.setDataset(result.data);
        }

        // Collect chart configs
        if (result.chartConfig) {
          chartConfigs.push(result.chartConfig);
        }

        // Collect report content
        if (result.reportContent) {
          reportContent = result.reportContent;
        }

        // Collect export data
        if (result.exportData) {
          exportData = result.exportData;
        }

        // Collect query results
        if (result.queryResult) {
          queryResult = result.queryResult;
        }

        callbacks?.onStepComplete?.(step, result);
      } else {
        step.status = "failed";
        step.error = result.message;
        callbacks?.onStepError?.(step, result.message);
        break;
      }
    }

    // 4. Generate final response
    const executionResult: AgentExecutionResult = {
      success: steps.every((s) => s.status === "completed"),
      message: this.responseGenerator.generateFinalResponse(plan, {
        success: steps.every((s) => s.status === "completed"),
        message: "",
        steps,
        finalData: currentDataset || undefined,
        chartConfigs,
        reportContent,
        exportData,
        queryResult,
        duration: Date.now() - startTime,
      }),
      steps,
      finalData: currentDataset || undefined,
      chartConfigs,
      reportContent,
      exportData,
      queryResult,
      duration: Date.now() - startTime,
    };

    // Store execution in memory
    this.memory.addOperation(
      `Executed: ${input}`,
      { intent: intent.intent, steps: plan.steps.length, success: executionResult.success }
    );
    this.memory.addExecutionResult(executionResult);

    return executionResult;
  }

  getMemory() {
    return this.memory;
  }

  getHelpMessage(): string {
    return this.responseGenerator.generateHelpMessage();
  }

  getAvailableTools(): string[] {
    return this.executor.getAvailableTools();
  }
}