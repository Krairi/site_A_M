
import { GoogleGenAI, Type } from "@google/genai";

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { stock, user } = req.body;

  if (!process.env.API_KEY) {
    return res.status(500).json({ error: "Clé API manquante" });
  }

  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const stockContext = stock?.map((p: any) => 
      `${p.name} (${p.quantity} ${p.unit}, péremption: ${p.expiryDate || 'N/A'})`
    ).join(', ');

    const prompt = `
      Tu es un coach de vie domestique intelligent. Analyse ce stock : ${stockContext}.
      Calcule un score de 0 à 100 basé sur :
      1. Prévention du gaspillage (dates proches).
      2. Équilibre alimentaire potentiel.
      3. Économies d'échelle.

      Génère aussi 3 missions concrètes pour l'utilisateur.
      Réponds UNIQUEMENT en JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER },
            summary: { type: Type.STRING },
            missions: { 
              type: Type.ARRAY, 
              items: { 
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  reward: { type: Type.NUMBER },
                  difficulty: { type: Type.STRING }
                }
              }
            },
            savingsPotential: { type: Type.STRING }
          },
          required: ["score", "summary", "missions"]
        }
      }
    });

    return res.status(200).json(JSON.parse(response.text));
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
