
import { GoogleGenAI, Type } from "@google/genai";

export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.error("ERREUR: GEMINI_API_KEY manquante.");
    return res.status(500).json({ error: "Configuration serveur incomplète (Clé API manquante)." });
  }

  const { stock, user, mealType } = req.body;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const householdSize = user?.householdSize || 2;
    const diet = user?.diet || 'Standard';

    const stockList = stock?.map((p: any) => {
        const exp = p.expiryDate ? ` (Périme le ${p.expiryDate})` : "";
        return `${p.quantity} ${p.unit} de ${p.name}${exp}`;
    }).join(', ') || "Stock vide";

    const prompt = `
      Tu es un Chef IA Expert. Génère une recette créative pour le repas suivant : ${mealType}.
      Taille du foyer : ${householdSize} personnes.
      Régime alimentaire : ${diet}.
      Ingrédients disponibles en stock : ${stockList}.
      
      Instructions :
      - Utilise en priorité les ingrédients proches de la date de péremption.
      - Propose des étapes claires et un temps de préparation réaliste.
      - Réponds UNIQUEMENT au format JSON.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            ingredients: { type: Type.ARRAY, items: { type: Type.STRING } },
            steps: { type: Type.ARRAY, items: { type: Type.STRING } },
            prepTime: { type: Type.STRING },
            calories: { type: Type.NUMBER },
            servings: { type: Type.NUMBER }
          },
          required: ["title", "description", "ingredients", "steps", "prepTime", "servings"]
        }
      }
    });

    const textResponse = response.text;
    if (!textResponse) {
      throw new Error("Réponse vide de l'IA.");
    }

    return res.status(200).json(JSON.parse(textResponse));

  } catch (error: any) {
    console.error("Erreur API Gemini:", error);
    return res.status(500).json({ 
      error: "Erreur lors de la génération de la recette.",
      details: error.message 
    });
  }
}
