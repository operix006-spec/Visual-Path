export interface AIAnalysisResult {
  classification: string;
  confidence: number;
  metadata?: Record<string, any>;
}

export interface AIProvider {
  analyzeImage(imagePath: string, instructions: string): Promise<AIAnalysisResult>;
}

import { GeminiAdapter } from './gemini';

export function getAIProvider(): AIProvider {
  return new GeminiAdapter();
}
