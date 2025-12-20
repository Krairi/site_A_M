import { GoogleGenAI, Type } from "@google/genai";
import { Product, Recipe, User } from "../types";

/**
 * Analyse la santé de l'inventaire avec Gemini
 */
export const analyzeInventoryHealth = async (stock: Product[], householdSize: number = 2): Promise<{
  wasteScore: number;
  insights: string[];
  missingEssentials: string[];
  restockSuggestions: string[];
  urgentToConsume: string[];
} | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const now = new Date();
    
    const stockList = stock.map(p => {
      let expiryStatus = "Date non spécifiée";
      if (p.expiryDate) {
        const exp = new Date(p.expiryDate);
        const diff = Math.ceil((exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        expiryStatus = diff < 0 ? "EXPIRÉ" : `Périme dans ${diff} jours`;
      }
      return `${p.quantity} ${p.unit} de ${p.name} (${p.category}) - Statut: ${expiryStatus}`;
    }).join(', ');
    
    const prompt = `
      Tu es un expert anti-gaspillage alimentaire.
      Le foyer est composé de ${householdSize} personnes.
      Analyse ce stock : ${stockList}.
      
      TÂCHE :
      1. Calcule un score de gaspillage (0-100). 
      2. Donne des insights stratégiques basés sur la taille du foyer.
      3. Identifie les produits critiques.
      
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
            wasteScore: { type: Type.NUMBER },
            insights: { type: Type.ARRAY, items: { type: Type.STRING } },
            missingEssentials: { type: Type.ARRAY, items: { type: Type.STRING } },
            restockSuggestions: { type: Type.ARRAY, items: { type: Type.STRING } },
            urgentToConsume: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["wasteScore", "insights", "missingEssentials", "restockSuggestions", "urgentToConsume"]
        }
      }
    });

    // Correctly accessing the .text property as per guidelines
    const responseText = response.text;
    if (responseText) {
      return JSON.parse(responseText);
    }
    return null;
  } catch (error) {
    console.error("Inventory analysis error:", error);
    return null;
  }
};

/**
 * Génère une recette basée sur le stock et le moment de la journée
 */
export const generateRecipeWithGemini = async (stock: Product[], user: Partial<User>, mealType: string): Promise<Recipe | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const householdSize = user.householdSize || 2;
    
    const stockList = stock.map(p => {
        const exp = p.expiryDate ? ` (Périme le ${p.expiryDate})` : "";
        return `${p.quantity} ${p.unit} of ${p.name}${exp}`;
    }).join(', ');

    const prompt = `
      Tu es un Chef IA. Génère une recette pour ${mealType}.
      Taille du foyer : ${householdSize} personnes.
      Stock disponible : ${stockList}.
      Régime : ${user.diet || 'Standard'}.
      
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

    const responseText = response.text;
    if (responseText) {
      const data = JSON.parse(responseText);
      return {
        id: Math.random().toString(36).substr(2, 9),
        ...data,
        isAiGenerated: true,
        imageUrl: `https://picsum.photos/seed/${encodeURIComponent(data.title)}/600/400`
      };
    }
    return null;
  } catch (error) {
    console.error("Gemini Recipe API error:", error);
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
    warning?: string;
  }>;
}

/**
 * Analyse un ticket de caisse avec Gemini Vision
 */
export const parseReceiptWithGemini = async (imageBase64: string, user?: Partial<User>): Promise<ScannedReceipt | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data } },
          { text: "Extrais les données de ce ticket de caisse en JSON. Inclus le magasin, la date, le total et la liste des articles avec prix, quantité et catégorie." }
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

    const responseText = response.text;
    if (responseText) return JSON.parse(responseText);
    return null;
  } catch (error) {
    console.error("Gemini Vision error:", error);
    return null;
  }
};

/**
 * Identifie un produit à partir d'une photo
 */
export const identifyProductWithVision = async (imageBase64: string, user?: Partial<User>): Promise<any | null> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        let data = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data } },
                    { text: "Identifie cet aliment. Nom, quantité estimée, unité et catégorie." }
                ]
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        name: { type: Type.STRING },
                        quantity: { type: Type.NUMBER },
                        unit: { type: Type.STRING },
                        category: { type: Type.STRING }
                    }
                }
            }
        });

        const responseText = response.text;
        if (responseText) return JSON.parse(responseText);
        return null;
    } catch (e) {
        console.error("Gemini Product ID error", e);
        return null;
    }
}

/**
 * Traite une commande en langage naturel
 */
export const processNaturalLanguageCommand = async (command: string): Promise<any[] | null> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyse cette commande : "${command}". Retourne une liste d'actions JSON (add, remove, update) avec l'item et la quantité.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            action: { type: Type.STRING, enum: ['add', 'remove', 'update'] },
                            item: { type: Type.STRING },
                            quantity: { type: Type.NUMBER },
                            unit: { type: Type.STRING }
                        },
                        required: ['action', 'item', 'quantity']
                    }
                }
            }
        });

        const responseText = response.text;
        if (responseText) return JSON.parse(responseText);
        return null;
    } catch (error) {
        console.error("Gemini NLU error:", error);
        return null;
    }
}

/**
 * Génère des conseils budgétaires
 */
export const getBudgetAdvice = async (total: number, trend: number, topCategory: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Donne un conseil budgétaire court (20 mots max). Dépense : ${total}€. Tendance : ${trend}%. Catégorie : ${topCategory}.`,
    });
    return response.text || "Suivez vos dépenses pour optimiser votre budget.";
  } catch (error) {
    return "Conseil budgétaire indisponible.";
  }
};