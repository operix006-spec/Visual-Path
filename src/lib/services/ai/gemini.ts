import { GoogleGenAI, Type, Schema } from '@google/genai';
import { AIProvider, AIAnalysisResult } from './index';
import fs from 'fs/promises';
import path from 'path';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class GeminiAdapter implements AIProvider {
  async analyzeImage(imagePath: string, instructions: string): Promise<AIAnalysisResult> {
    const ext = path.extname(imagePath).toLowerCase();
    const mimeType = ext === '.png' ? 'image/png' 
                   : ext === '.webp' ? 'image/webp' 
                   : 'image/jpeg';
                   
    const imageBuffer = await fs.readFile(imagePath);

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        classification: { 
          type: Type.STRING,
          enum: [
            'Dynamic_Action_Splash',
            'Studio_Product',
            'Lifestyle_Context',
            'Macro_CloseUp',
            'Creative_Mood_Lighting'
          ]
        },
        confidence: { type: Type.NUMBER },
      },
      required: ['classification', 'confidence'],
    };

    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      attempts++;
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-3.5-flash-lite',
          contents: [
            instructions,
            {
              inlineData: {
                data: imageBuffer.toString("base64"),
                mimeType: mimeType,
              },
            },
          ],
          config: {
            responseMimeType: 'application/json',
            responseSchema: schema,
            temperature: 0.1,
          },
        });

        if (!response.text) {
          throw new Error("AI returned no text");
        }

        const result = JSON.parse(response.text) as AIAnalysisResult;
        return result;
      } catch (err: any) {
        const errStr = String(err?.message || err);
        const isRateLimitOrBusy = errStr.includes('429') || errStr.includes('503') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('UNAVAILABLE');

        if (isRateLimitOrBusy && attempts < maxAttempts) {
          const waitTime = attempts * 3000;
          console.warn(`[GeminiAdapter] Rate limit or high demand hit (attempt ${attempts}/${maxAttempts}). Waiting ${waitTime}ms before retry...`);
          await sleep(waitTime);
          continue;
        }

        console.error(`[GeminiAdapter] Failed to analyze image after ${attempts} attempts:`, errStr);
        // Graceful fallback to Studio_Product
        return {
          classification: 'Studio_Product',
          confidence: 0.5,
          metadata: { error: errStr }
        };
      }
    }

    return { classification: 'Studio_Product', confidence: 0.5 };
  }
}
