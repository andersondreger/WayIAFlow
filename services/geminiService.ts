
import { GoogleGenAI, Type } from "@google/genai";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateAgentContext = async (businessDescription: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Crie um prompt de sistema detalhado para um agente de IA especialista em recuperação de checkouts abandonados para o seguinte negócio: ${businessDescription}. O prompt deve incluir tom de voz, gatilhos mentais e diretrizes éticas. Responda em JSON.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          systemPrompt: { type: Type.STRING },
          suggestedTemperature: { type: Type.NUMBER }
        },
        required: ["name", "systemPrompt", "suggestedTemperature"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const chatWithAgent = async (message: string, context: string) => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: message,
    config: {
      systemInstruction: context
    }
  });
  return response.text;
};
