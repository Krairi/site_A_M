import { GoogleGenAI, Type } from "@google/genai";
import { Product, Recipe } from "../types";

// Note: In a real app, never expose API keys on the client side without proper restrictions.
// We assume process.env.API_KEY is available or handled by a proxy.
const API_KEY = process.env.API_KEY || ''; 

export const generateRecipeWithGemini = async (stock: Product[], preferences: string): Promise<Recipe | null> => {
  if (!API_KEY) {
    console.warn("Gemini API Key is missing. Using mock data.");
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    const stockList = stock.map(p => `${p.quantity} ${p.unit} of ${p.name}`).join(', ');
    const prompt = `
      Je suis un assistant culinaire. Voici mon stock actuel d'ingrédients : ${stockList}.
      Mes préférences alimentaires sont : ${preferences || 'Aucune'}.
      Génère une recette créative et savoureuse que je peux cuisiner MAINTENANT avec ces ingrédients.
      Je peux utiliser des ingrédients de base (sel, poivre, huile, eau) en plus.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            ingredients: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            steps: { 
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            prepTime: { type: Type.STRING },
            calories: { type: Type.NUMBER }
          },
          required: ["title", "description", "ingredients", "steps", "prepTime"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      return {
        id: Math.random().toString(36).substr(2, 9),
        ...data,
        isAiGenerated: true,
        imageUrl: 'https://picsum.photos/400/300?grayscale' // Placeholder
      };
    }
    return null;
  } catch (error) {
    console.error("Gemini API error:", error);
    return null;
  }
};

export interface ScannedReceipt {
  store: string;
  date: string;
  total: number;
  items: Array<{
    name: string;
    quantity: number;
    unit: string;
    category: string;
    price: number;
  }>;
}

export const parseReceiptWithGemini = async (imageBase64: string): Promise<ScannedReceipt | null> => {
  if (!API_KEY) return null;

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    
    // Clean base64 string if needed (remove data:image/png;base64, prefix)
    const cleanBase64 = imageBase64.split(',')[1] || imageBase64;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg', // Assuming jpeg for simplicity, or detect from header
              data: cleanBase64
            }
          },
          {
            text: `Analyse ce ticket de caisse. Extrais le nom du magasin, la date (format YYYY-MM-DD), le total, et la liste des produits.
            Pour chaque produit, devine la catégorie parmi : [Frais, Epicerie, Légumes, Hygiène, Autre].
            Si la quantité n'est pas explicite, mets 1. Essaie de déduire l'unité (kg, g, L, pcs) sinon mets 'pcs'.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            store: { type: Type.STRING },
            date: { type: Type.STRING },
            total: { type: Type.NUMBER },
            items: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  quantity: { type: Type.NUMBER },
                  unit: { type: Type.STRING },
                  category: { type: Type.STRING },
                  price: { type: Type.NUMBER }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as ScannedReceipt;
    }
    return null;

  } catch (error) {
    console.error("Gemini Vision API error:", error);
    return null;
  }
};