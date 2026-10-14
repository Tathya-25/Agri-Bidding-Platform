import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const getBidderInsights = async (location: string, cropType: string, area: number, stage: string): Promise<string> => {
  if (!apiKey) return "AI insights are unavailable because the API key is missing.";

  try {
    const prompt = `Act as an expert agricultural economist. Analyze this work order:\nLocation: ${location}\nCrop: ${cropType}\nArea: ${area} Acres\nStage: ${stage}\n\nProvide a very brief 3-sentence insight for a potential bidder regarding standard pricing for this work in India (in INR ₹) and any localized risks or factors to consider.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-3.1-pro-preview',
      contents: prompt,
      config: {
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        }
      }
    });
    
    return response.text || "No insights available.";
  } catch (error) {
    console.error("AI Error:", error);
    return "Failed to fetch AI insights at this time.";
  }
};
