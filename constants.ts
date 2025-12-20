
import { Home, Receipt, Package, ChefHat, BarChart2, User, CreditCard, CalendarRange, ShieldCheck, Activity, Users } from 'lucide-react';
import { PlanLimits, PlanType } from './types';

export const APP_NAME = "Domyli";
export const TAGLINE = "Votre foyer, en pilote automatique.";

export const PLAN_CONFIG: Record<PlanType, PlanLimits> = {
  free: {
    maxProducts: 10,
    maxRecipesPerMonth: 3,
    hasAdvancedStats: false,
    hasAiAssistant: false,
    hasMultiUser: false,
    hasExport: false
  },
  premium: {
    maxProducts: 1000,
    maxRecipesPerMonth: 100,
    hasAdvancedStats: true,
    hasAiAssistant: true,
    hasMultiUser: false,
    hasExport: true
  },
  family: {
    maxProducts: 9999,
    maxRecipesPerMonth: 9999,
    hasAdvancedStats: true,
    hasAiAssistant: true,
    hasMultiUser: true,
    hasExport: true
  }
};

export const NAVIGATION_ITEMS = [
  { name: 'nav.overview', path: '/', icon: Home },
  { name: 'nav.planning', path: '/planning', icon: CalendarRange },
  { name: 'nav.stock', path: '/stock', icon: Package },
  { name: 'nav.tickets', path: '/tickets', icon: Receipt },
  { name: 'nav.recipes', path: '/recettes', icon: ChefHat },
  { name: 'nav.consumption', path: '/consommation', icon: BarChart2 },
  { name: 'nav.account', path: '/compte', icon: User },
  { name: 'nav.subscriptions', path: '/abonnements', icon: CreditCard },
  { name: 'nav.user_mgmt', path: '/admin', icon: Users, admin: true },
  { name: 'nav.system_audit', path: '/audit', icon: Activity, admin: true },
];

export const MOCK_STOCK = [
  { id: '1', name: 'Lait demi-écrémé', quantity: 1, unit: 'L', category: 'Produits Laitiers', minThreshold: 2, expiryDate: '2023-10-27', foyer_id: '1' },
  { id: '2', name: 'Œufs Bio', quantity: 2, unit: 'pcs', category: 'Produits Laitiers', minThreshold: 6, expiryDate: '2023-11-05', foyer_id: '1' },
  { id: '3', name: 'Pâtes Penne', quantity: 500, unit: 'g', category: 'Épicerie & Conserves', minThreshold: 200, foyer_id: '1' },
  { id: '4', name: 'Tomates', quantity: 4, unit: 'pcs', category: 'Fruits & Légumes', minThreshold: 3, foyer_id: '1' },
  { id: '5', name: 'Riz Basmati', quantity: 1000, unit: 'g', category: 'Épicerie & Conserves', minThreshold: 500, foyer_id: '1' },
];
