import { Home, Receipt, Package, ChefHat, BarChart2, User, CreditCard } from 'lucide-react';

export const APP_NAME = "GIVD";
export const TAGLINE = "Votre foyer, en pilote automatique.";

export const NAVIGATION_ITEMS = [
  { name: 'Vue d\'ensemble', path: '/', icon: Home },
  { name: 'Tickets', path: '/tickets', icon: Receipt },
  { name: 'Stock', path: '/stock', icon: Package },
  { name: 'Recettes', path: '/recettes', icon: ChefHat },
  { name: 'Consommation', path: '/consommation', icon: BarChart2 },
  { name: 'Compte', path: '/compte', icon: User },
  { name: 'Abonnements', path: '/abonnements', icon: CreditCard },
];

export const MOCK_ALERTS = [
  { id: '1', type: 'expiry', message: 'Lait demi-écrémé expire dans 2 jours', date: '2023-10-25' },
  { id: '2', type: 'stock', message: 'Plus que 2 œufs en stock', date: '2023-10-26' },
];

export const MOCK_STOCK = [
  { id: '1', name: 'Lait demi-écrémé', quantity: 1, unit: 'L', category: 'Frais', minThreshold: 2, expiryDate: '2023-10-27', foyer_id: '1' },
  { id: '2', name: 'Œufs Bio', quantity: 2, unit: 'pcs', category: 'Frais', minThreshold: 6, expiryDate: '2023-11-05', foyer_id: '1' },
  { id: '3', name: 'Pâtes Penne', quantity: 500, unit: 'g', category: 'Epicerie', minThreshold: 200, foyer_id: '1' },
  { id: '4', name: 'Tomates', quantity: 4, unit: 'pcs', category: 'Légumes', minThreshold: 3, foyer_id: '1' },
  { id: '5', name: 'Riz Basmati', quantity: 1000, unit: 'g', category: 'Epicerie', minThreshold: 500, foyer_id: '1' },
];