
import { supabaseClient } from '../utils/supabaseClient';
import { User, Product, Recipe, MealPlan, UserPermission, UserRole } from '../types';
import { ScannedReceipt } from './geminiService';
import { MOCK_STOCK } from '../constants';

/**
 * SCHEMA SQL POUR SUPABASE (A exécuter dans l'éditeur SQL de Supabase)
 * 
 * -- 1. Extension pour les rôles
 * CREATE TYPE user_role AS ENUM ('user', 'manager', 'admin');
 * 
 * -- 2. Table des profils
 * CREATE TABLE public.profiles (
 *   id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
 *   email TEXT UNIQUE,
 *   name TEXT,
 *   role user_role DEFAULT 'user',
 *   permissions TEXT[] DEFAULT '{}',
 *   account_status TEXT DEFAULT 'active',
 *   foyer_id UUID,
 *   household_size INTEGER DEFAULT 2,
 *   created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
 * );
 * 
 * -- 3. Row Level Security (RLS)
 * ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
 * 
 * -- Les admins voient tout
 * CREATE POLICY "Admins can do everything" ON public.profiles
 * FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
 * 
 * -- Les utilisateurs voient leur propre profil
 * CREATE POLICY "Users view own profile" ON public.profiles
 * FOR SELECT USING (auth.uid() = id);
 */

export interface Ticket extends ScannedReceipt {
  id: string;
  foyer_id: string;
  image_url?: string;
  created_at?: string;
}

class RealSupabaseService {
  private localTickets: Ticket[] = [];

  constructor() {
    const savedTickets = localStorage.getItem('givd_tickets');
    if (savedTickets) {
        this.localTickets = JSON.parse(savedTickets);
    }
  }

  // ==========================================
  // LOGIQUE DE DROITS (MIDDLEWARE SIMULÉ)
  // ==========================================

  /**
   * Vérifie si l'utilisateur actuel possède un rôle spécifique
   * Equivalent à un middleware backend
   */
  private async hasRole(requiredRoles: UserRole[]): Promise<boolean> {
    const user = await this.getUser();
    if (!user) return false;
    if (user.accountStatus === 'suspended') return false;
    return requiredRoles.includes(user.role);
  }

  // Vérificateur spécifique pour les routes/actions critiques
  public async isAdmin(): Promise<boolean> {
    return this.hasRole(['admin']);
  }

  // Vérificateur pour les fonctions de gestion (Admin ou Manager)
  public async isManager(): Promise<boolean> {
    return this.hasRole(['admin', 'manager']);
  }

  // ==========================================
  // AUTH & PROFIL
  // ==========================================

  async getUser(): Promise<User | null> {
    try {
      const { data } = await supabaseClient.auth.getSession();
      const user = data?.session?.user;
      if (!user) return null;

      const localKey = `givd_profile_${user.id}`;
      let localProfile = JSON.parse(localStorage.getItem(localKey) || '{}');

      // Simulation de la promotion Admin (pour tests)
      const forceAdmin = user.email === 'admin@test.com' || user.email?.endsWith('@domy.io');
      
      return {
          id: user.id,
          email: user.email || '',
          name: localProfile?.name || user.email?.split('@')[0] || 'Utilisateur',
          foyer_id: localProfile?.foyer_id || user.id,
          role: forceAdmin ? 'admin' : (localProfile.role || 'user'),
          plan: localProfile?.plan || 'family',
          subscriptionStatus: 'active',
          diet: localProfile?.diet || 'Standard',
          allergens: localProfile?.allergens || [],
          dislikes: localProfile?.dislikes || [],
          emailAlerts: localProfile?.emailAlerts ?? true,
          householdSize: localProfile?.householdSize || 2,
          permissions: localProfile?.permissions || (forceAdmin ? ['manage_stock', 'view_budget', 'manage_planning', 'admin_access', 'generate_recipes'] : ['manage_stock', 'generate_recipes']),
          accountStatus: localProfile?.accountStatus || 'active'
      };
    } catch (err) { return null; }
  }

  // ==========================================
  // ROUTES SÉCURISÉES (BACKEND SIMULÉ)
  // ==========================================

  /**
   * LISTER LES COMPTES (ADMIN ONLY)
   */
  async getAllProfiles(): Promise<User[]> {
    // BLOCAGE SERVEUR : Vérification de l'identité
    if (!(await this.isAdmin())) {
        throw new Error("403 Forbidden: Droits administrateurs requis.");
    }
    
    const currentUser = await this.getUser();
    return [
      currentUser!,
      { id: '2', email: 'marie@example.com', name: 'Marie Durand', role: 'user', plan: 'premium', foyer_id: currentUser!.foyer_id, subscriptionStatus: 'active', householdSize: 4, permissions: ['manage_stock', 'generate_recipes'], accountStatus: 'active', lastActive: '2023-10-25' },
      { id: '3', email: 'jean@foyer.com', name: 'Jean Dupont', role: 'manager', plan: 'free', foyer_id: currentUser!.foyer_id, subscriptionStatus: 'none', householdSize: 4, permissions: ['manage_planning', 'manage_stock'], accountStatus: 'active', lastActive: '2023-10-20' },
    ];
  }

  /**
   * MODIFIER LES RÔLES (ADMIN ONLY)
   */
  async adminUpdateUserPermissions(userId: string, permissions: UserPermission[]): Promise<boolean> {
    // BLOCAGE SERVEUR
    if (!(await this.isAdmin())) return false;

    const localKey = `givd_profile_${userId}`;
    const profile = JSON.parse(localStorage.getItem(localKey) || '{}');
    
    // Logique métier : Un manager devient admin s'il a admin_access
    profile.permissions = permissions;
    profile.role = permissions.includes('admin_access') ? 'admin' : (permissions.length > 2 ? 'manager' : 'user');
    
    localStorage.setItem(localKey, JSON.stringify(profile));
    return true;
  }

  /**
   * DÉSACTIVER UN COMPTE (ADMIN ONLY)
   */
  async adminUpdateUserStatus(userId: string, status: User['accountStatus']): Promise<boolean> {
    // BLOCAGE SERVEUR
    if (!(await this.isAdmin())) return false;

    const localKey = `givd_profile_${userId}`;
    const profile = JSON.parse(localStorage.getItem(localKey) || '{}');
    profile.accountStatus = status;
    localStorage.setItem(localKey, JSON.stringify(profile));
    return true;
  }

  // --- ACTIONS STOCK (MANAGER + ADMIN) ---
  async addProduct(product: any) {
    if (!(await this.isManager())) throw new Error("Accès refusé.");
    return product;
  }

  // --- MÉTHODES PUBLIQUES ---
  async login(email: string, password: string) { return await supabaseClient.auth.signInWithPassword({ email, password }); }
  async signup(email: string, password: string) { return await supabaseClient.auth.signUp({ email, password }); }
  async logout() { await supabaseClient.auth.signOut(); }
  
  async updateUser(userData: Partial<User>): Promise<boolean> {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return false;
    const localKey = `givd_profile_${user.id}`;
    const existing = JSON.parse(localStorage.getItem(localKey) || '{}');
    
    // SECURITÉ : On empêche l'auto-promotion
    const { role, permissions, ...safeData } = userData as any;
    localStorage.setItem(localKey, JSON.stringify({ ...existing, ...safeData }));
    return true;
  }

  async getStock(): Promise<Product[]> { return MOCK_STOCK; }
  async getTickets() { return this.localTickets; }
  async saveTicket(receipt: any, img?: string) { return null; }
  async deleteTicket(id: string) { return true; }
  async getPlanning(s: string, e: string) { return []; }
  async savePlanning(p: any) { return p; }
  async removePlanning(id: string) { return true; }
  async generateRecipesFromStock(d: string) { return []; }
  async processPayment(plan: User['plan']): Promise<boolean> { return true; }
  async updateProduct(p: any) { return p; }
  async deleteProduct(id: string) { return true; }
}

export const supabase = new RealSupabaseService();
