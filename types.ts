export interface User {
  id: string;
  email: string;
  foyer_id: string;
  name: string;
  plan: 'free' | 'premium' | 'family';
  diet?: string;
  emailAlerts?: boolean;
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
}

export interface Alert {
  id: string;
  type: 'expiry' | 'stock' | 'info';
  message: string;
  date: string;
}

export interface ChartData {
  name: string;
  value: number;
}