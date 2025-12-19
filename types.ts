
export type UserRole = 'user' | 'admin' | 'manager';
export type UserPermission = 'manage_stock' | 'view_budget' | 'manage_planning' | 'admin_access' | 'generate_recipes';

export interface User {
  id: string;
  email: string;
  foyer_id: string;
  name: string;
  role: UserRole;
  plan: 'free' | 'premium' | 'family';
  subscriptionStatus: 'active' | 'past_due' | 'canceled' | 'none';
  diet?: string;
  allergens?: string[];
  dislikes?: string[];
  emailAlerts?: boolean;
  householdSize: number;
  permissions: UserPermission[];
  accountStatus: 'active' | 'suspended' | 'pending';
  lastActive?: string;
}

export interface Product {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiryDate?: string;
  minThreshold: number;
  foyer_id: string;
  lastUpdated?: string;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  steps: string[];
  prepTime: string;
  calories?: number;
  imageUrl?: string;
  isAiGenerated: boolean;
  servings?: number;
}

export interface MealPlan {
  id: string;
  date: string;
  type: 'breakfast' | 'lunch' | 'snack' | 'dinner';
  recipeId: string;
  recipeTitle: string; 
}
