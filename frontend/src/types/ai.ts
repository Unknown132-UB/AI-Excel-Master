import type { Dataset } from "./dataset";

export interface AICommandResult {
  success: boolean;
  message: string;
  operation?: string;
  data?: Dataset;
  versionId?: string;
  suggestions?: any[];
  chartRecommendations?: ChartRecommendation[];
  queryResult?: any;
}

export interface ChartRecommendation {
  type: string;
  title: string;
  description: string;
  columns: string[];
  config?: any;
}