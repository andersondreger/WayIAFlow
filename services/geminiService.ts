
import { GoogleGenAI, Type } from "@google/genai";

// Always initialize GoogleGenAI with a named parameter using process.env.API_KEY directly.
const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

export const generateAgentContext = async (businessDescription: string) => {
  try {
    const ai = getAIClient();
    // Using gemini-3-pro-preview for complex reasoning tasks like system prompt generation.
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
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

    // Extracting text output directly from property response.text (not a method).
    const textOutput = response.text || "{}";
    return JSON.parse(textOutput);
  } catch (error) {
    console.error("Erro Gemini:", error);
    throw new Error("Não foi possível gerar o contexto neural. Verifique sua chave de IA.");
  }
};

export const chatWithAgent = async (message: string, context: string) => {
  const ai = getAIClient();
  // Using gemini-3-flash-preview for general chat tasks.
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: message,
    config: {
      systemInstruction: context
    }
  });
  // Extracting text output directly from property response.text (not a method).
  return response.text;
};
