
import { Product, Recipe, User } from "../types";

/**
 * Appelle notre route API interne (Vercel Serverless Function)
 * pour générer une recette sans exposer les clés API.
 */
export const generateRecipeWithGemini = async (stock: Product[], user: Partial<User>, mealType: string): Promise<Recipe | null> => {
  try {
    const response = await fetch('/api/predict', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ stock, user, mealType }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Erreur serveur");
    }

    const data = await response.json();
    
    return {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      isAiGenerated: true,
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent(data.title)}/600/400`
    };
  } catch (error) {
    console.error("Frontend Recipe Fetch Error:", error);
    return null;
  }
};

/**
 * Analyse la santé de l'inventaire via le proxy API (à implémenter de la même façon si besoin)
 */
export const analyzeInventoryHealth = async (stock: Product[], householdSize: number = 2): Promise<any | null> => {
  // Par simplicité, on garde la logique client pour les démos ou on crée une autre route /api/analyze
  // Mais pour la production, il est conseillé de passer par une API Route comme pour les recettes.
  return null; 
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
    // En prod, envoyer l'image à /api/parse-receipt
    return null;
};

export const identifyProductWithVision = async (imageBase64: string, user?: Partial<User>): Promise<any | null> => {
    return null;
};

export const processNaturalLanguageCommand = async (command: string): Promise<any[] | null> => {
    return null;
};

export const getBudgetAdvice = async (total: number, trend: number, topCategory: string): Promise<string> => {
  return "Conseil budgétaire en cours de traitement...";
};
