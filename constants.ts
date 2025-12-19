
import { Home, Receipt, Package, ChefHat, BarChart2, User, CreditCard, CalendarRange, ShieldCheck, Activity, Users } from 'lucide-react';

export const APP_NAME = "Domyli";
export const TAGLINE = "Votre foyer, en pilote automatique.";

export const NAVIGATION_ITEMS = [
  { name: 'Vue d\'ensemble', path: '/', icon: Home },
  { name: 'Planning', path: '/planning', icon: CalendarRange },
  { name: 'Stock', path: '/stock', icon: Package },
  { name: 'Tickets', path: '/tickets', icon: Receipt },
  { name: 'Recettes', path: '/recettes', icon: ChefHat },
  { name: 'Consommation', path: '/consommation', icon: BarChart2 },
  { name: 'Compte', path: '/compte', icon: User },
  { name: 'Abonnements', path: '/abonnements', icon: CreditCard },
  // Éléments admin (visibles conditionnellement dans Layout)
  { name: 'Gestion Utilisateurs', path: '/admin', icon: Users, admin: true },
  { name: 'Audit Système', path: '/audit', icon: Activity, admin: true },
];

export const MOCK_STOCK = [
  { id: '1', name: 'Lait demi-écrémé', quantity: 1, unit: 'L', category: 'Produits Laitiers', minThreshold: 2, expiryDate: '2023-10-27', foyer_id: '1' },
  { id: '2', name: 'Œufs Bio', quantity: 2, unit: 'pcs', category: 'Produits Laitiers', minThreshold: 6, expiryDate: '2023-11-05', foyer_id: '1' },
  { id: '3', name: 'Pâtes Penne', quantity: 500, unit: 'g', category: 'Épicerie & Conserves', minThreshold: 200, foyer_id: '1' },
  { id: '4', name: 'Tomates', quantity: 4, unit: 'pcs', category: 'Fruits & Légumes', minThreshold: 3, foyer_id: '1' },
  { id: '5', name: 'Riz Basmati', quantity: 1000, unit: 'g', category: 'Épicerie & Conserves', minThreshold: 500, foyer_id: '1' },
];
