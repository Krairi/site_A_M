
import { GoogleGenAI, Type } from "@google/genai";
import { Product, Recipe, User } from "../types";

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
      2. Donne des insights stratégiques : note que pour ${householdSize} personnes, la vitesse de consommation est spécifique. 
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

    if (response.text) {
      return JSON.parse(response.text);
    }
    return null;
  } catch (error) {
    console.error("Inventory analysis error:", error);
    return null;
  }
};

export const generateRecipeWithGemini = async (stock: Product[], user: Partial<User>, mealType: string): Promise<Recipe | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const householdSize = user.householdSize || 2;
    
    const sortedStock = [...stock].sort((a, b) => {
        if (!a.expiryDate) return 1;
        if (!b.expiryDate) return -1;
        return new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();
    });

    const stockList = sortedStock.map(p => {
        const exp = p.expiryDate ? ` (Périme le ${p.expiryDate})` : "";
        return `${p.quantity} ${p.unit} of ${p.name}${exp}`;
    }).join(', ');

    const themes: Record<string, string> = {
        'breakfast': "Thème: Énergie matinale. Couleurs: Ambrées/Dorées. Focus: Boost métabolique.",
        'lunch': "Thème: Clarté et efficacité. Couleurs: Bleutées/Fraîches. Focus: Concentration et légèreté.",
        'snack': "Thème: Douceur de l'après-midi. Couleurs: Miel/Chaudes. Focus: Réconfort sain.",
        'dinner': "Thème: Calme et digestion. Couleurs: Ardoise/Indigo/Sombres. Focus: Sommeil et relaxation."
    };

    const selectedTheme = themes[mealType.toLowerCase()] || themes['lunch'];

    const prompt = `
      Tu es un Chef IA spécialisé.
      MOMENT : ${mealType}.
      TAILLE DU FOYER : ${householdSize} personnes.
      DIRECTIVE : ${selectedTheme}.
      STOCK DISPONIBLE : ${stockList}.
      PROFIL : Régime ${user.diet || 'Standard'}, Allergies: ${user.allergens?.join(', ') || 'Aucune'}.

      CONSIGNES CRITIQUES :
      - Calcule les QUANTITÉS d'ingrédients spécifiquement pour ${householdSize} personnes.
      - Précise "servings: ${householdSize}" dans le JSON.
      - Utilise les ingrédients du stock en priorité.

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

    if (response.text) {
      const data = JSON.parse(response.text);
      return {
        id: Math.random().toString(36).substr(2, 9),
        ...data,
        isAiGenerated: true,
        imageUrl: `https://picsum.photos/seed/${encodeURIComponent(data.title)}/600/400`
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
    warning?: string;
  }>;
}

export const parseReceiptWithGemini = async (imageBase64: string, user?: Partial<User>): Promise<ScannedReceipt | null> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
          { text: "Analyse ce ticket de caisse. Extrais magasin, date (YYYY-MM-DD), total, et items avec catégorie, prix, quantité, unité." }
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
                  price: { type: Type.NUMBER },
                  warning: { type: Type.STRING, nullable: true }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) return JSON.parse(response.text);
    return null;
  } catch (error) {
    console.error("Gemini Vision API error:", error);
    return null;
  }
};

export const identifyProductWithVision = async (imageBase64: string, user?: Partial<User>): Promise<Partial<Product> & { warning?: string } | null> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        let cleanBase64 = imageBase64.includes(',') ? imageBase64.split(',')[1] : imageBase64;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
                parts: [
                    { inlineData: { mimeType: 'image/jpeg', data: cleanBase64 } },
                    { text: "Identifie cet aliment. Nom, quantité estimée, unité, catégorie." }
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
                        category: { type: Type.STRING },
                        warning: { type: Type.STRING, nullable: true }
                    }
                }
            }
        });

        if (response.text) return JSON.parse(response.text);
        return null;
    } catch (e) {
        console.error("Gemini Product ID error", e);
        return null;
    }
}

export interface NLUAction {
  action: 'add' | 'remove' | 'update';
  item: string;
  quantity: number;
  unit?: string;
}

export const processNaturalLanguageCommand = async (command: string): Promise<NLUAction[] | null> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Analyse cette commande : "${command}". Retourne une liste d'actions (add, remove, update) avec item, quantity, unit.`,
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

        if (response.text) return JSON.parse(response.text);
        return null;
    } catch (error) {
        console.error("Gemini NLU error:", error);
        return null;
    }
}

export const getBudgetAdvice = async (total: number, trend: number, topCategory: string): Promise<string> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Conseil budget court (25 mots). Total: ${total}€. Tendance: ${trend}%. Top: ${topCategory}.`,
    });
    return response.text || "Continuez vos efforts !";
  } catch (error) {
    return "Analyse indisponible.";
  }
};
