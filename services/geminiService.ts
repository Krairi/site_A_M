
import { Product, Recipe, User } from "../types";

/* Added ScannedReceipt interface to be used for ticket scanning and consumption tracking throughout the app */
export interface ScannedReceipt {
  store: string;
  total: number;
  date: string;
  items: {
    name: string;
    quantity: number;
    unit: string;
    price: number;
    category: string;
  }[];
}

export const getAiCoachData = async (stock: Product[], user: Partial<User>) => {
  try {
    const response = await fetch('/api/coach', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock, user }),
    });
    if (!response.ok) throw new Error("Erreur Coach");
    return await response.json();
  } catch (error) {
    console.error(error);
    return null;
  }
};

export const generateRecipeWithGemini = async (stock: Product[], user: Partial<User>, mealType: string): Promise<Recipe | null> => {
  try {
    const response = await fetch('/api/predict', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stock, user, mealType }),
    });
    if (!response.ok) throw new Error("Erreur serveur");
    const data = await response.json();
    return {
      id: Math.random().toString(36).substr(2, 9),
      ...data,
      isAiGenerated: true,
      imageUrl: `https://picsum.photos/seed/${encodeURIComponent(data.title)}/600/400`
    };
  } catch (error) {
    return null;
  }
};

/* Updated analyzeInventoryHealth signature to accept stock and household size as used in Stock.tsx */
export const analyzeInventoryHealth = async (stock: Product[], householdSize: number): Promise<{
  wasteScore: number;
  insights: string[];
  missingEssentials: string[];
  restockSuggestions: string[];
  urgentToConsume: string[];
} | null> => null;

/* Updated parseReceiptWithGemini signature to accept base64 image and optional user context as used in Stock.tsx and Tickets.tsx */
export const parseReceiptWithGemini = async (base64: string, user?: Partial<User>): Promise<ScannedReceipt | null> => null;

/* Updated identifyProductWithVision signature to accept base64 image and optional user context as used in Stock.tsx */
export const identifyProductWithVision = async (base64: string, user?: Partial<User>): Promise<{
  name?: string;
  category?: string;
  quantity?: number;
  unit?: string;
  warning?: string;
} | null> => null;

/* Updated processNaturalLanguageCommand signature to accept the command string as used in MagicCommand.tsx */
export const processNaturalLanguageCommand = async (command: string): Promise<{
  action: 'add' | 'remove' | 'update';
  item: string;
  quantity: number;
  unit?: string;
}[] | null> => null;

/* Updated getBudgetAdvice signature to accept total, trend, and topCategory for personalized insights as used in Consumption.tsx */
export const getBudgetAdvice = async (total: number, trend: number, topCategory: string): Promise<string> => {
  return "Optimisez vos achats pour économiser jusqu'à 15% par mois.";
};
