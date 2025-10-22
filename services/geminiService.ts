
import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  // In a real app, you'd handle this more gracefully.
  // For this context, we assume the key is available.
  console.warn("API_KEY environment variable not set.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const generateBookSummary = async (title: string, author: string): Promise<string> => {
  try {
    const prompt = `Gere um resumo conciso e envolvente, em português, do livro "${title}" de ${author}. O resumo deve capturar os principais temas e a essência da obra em cerca de 150 a 200 palavras.`;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
    });
    
    return response.text;
  } catch (error) {
    console.error("Error generating summary with Gemini API:", error);
    return "Desculpe, não foi possível gerar o resumo neste momento. Tente novamente mais tarde.";
  }
};
