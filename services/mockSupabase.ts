
import { supabaseClient } from '../utils/supabaseClient';
import { User, Product, Recipe, MealPlan, UserPermission, UserRole } from '../types';
import { ScannedReceipt } from './geminiService';
import { MOCK_STOCK } from '../constants';
import { SUPER_ADMIN_EMAIL } from './authService';

/**
 * SCHEMA SQL & RLS POUR SUPABASE
 * 
 * -- 1. Politique pour empêcher tout le monde sauf le super admin de modifier les rôles
 * CREATE POLICY "SuperAdmin can update roles" ON profiles
 * FOR UPDATE USING (auth.jwt() ->> 'email' = 'admin@givd.com')
 * WITH CHECK (auth.jwt() ->> 'email' = 'admin@givd.com');
 * 
 * -- 2. Politique pour permettre aux utilisateurs de lire leur propre profil
 * CREATE POLICY "Users can see own profile" ON profiles
 * FOR SELECT USING (auth.uid() = id);
 * 
 * -- 3. Politique pour permettre au super admin de tout lire
 * CREATE POLICY "SuperAdmin can see all" ON profiles
 * FOR SELECT USING (auth.jwt() ->> 'email' = 'admin@givd.com');
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

  private async isSuperAdminSession(): Promise<boolean> {
    const user = await this.getUser();
    return user?.email === SUPER_ADMIN_EMAIL && user?.role === 'admin';
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

      // Forçage du rôle admin pour l'email spécifique
      const isSystemAdmin = user.email === SUPER_ADMIN_EMAIL;
      
      return {
          id: user.id,
          email: user.email || '',
          name: localProfile?.name || user.email?.split('@')[0] || 'Utilisateur',
          foyer_id: localProfile?.foyer_id || user.id,
          role: isSystemAdmin ? 'admin' : (localProfile.role || 'user'),
          plan: localProfile?.plan || 'family',
          subscriptionStatus: 'active',
          diet: localProfile?.diet || 'Standard',
          allergens: localProfile?.allergens || [],
          dislikes: localProfile?.dislikes || [],
          emailAlerts: localProfile?.emailAlerts ?? true,
          householdSize: localProfile?.householdSize || 2,
          permissions: localProfile?.permissions || (isSystemAdmin ? ['manage_stock', 'view_budget', 'manage_planning', 'admin_access', 'generate_recipes'] : ['manage_stock', 'generate_recipes']),
          accountStatus: localProfile?.accountStatus || 'active'
      };
    } catch (err) { return null; }
  }

  // ==========================================
  // ROUTES SÉCURISÉES ADMIN
  // ==========================================

  async getAllProfiles(): Promise<User[]> {
    if (!(await this.isSuperAdminSession())) {
        throw new Error("Accès interdit : Seul le Super Admin peut lister les comptes.");
    }
    
    const currentUser = await this.getUser();
    // Simule une liste complète
    return [
      currentUser!,
      { id: '2', email: 'jean.dupont@test.com', name: 'Jean Dupont', role: 'user', plan: 'free', foyer_id: 'f-1', subscriptionStatus: 'none', householdSize: 2, permissions: ['manage_stock'], accountStatus: 'active', lastActive: '2023-11-01' },
      { id: '3', email: 'sophie.martin@test.com', name: 'Sophie Martin', role: 'manager', plan: 'premium', foyer_id: 'f-1', subscriptionStatus: 'active', householdSize: 3, permissions: ['manage_stock', 'manage_planning'], accountStatus: 'active', lastActive: '2023-11-02' },
      { id: '4', email: 'compte.suspendu@test.com', name: 'Ancien Utilisateur', role: 'user', plan: 'free', foyer_id: 'f-2', subscriptionStatus: 'none', householdSize: 1, permissions: [], accountStatus: 'suspended', lastActive: '2023-09-15' },
    ];
  }

  async adminUpdateUserPermissions(userId: string, permissions: UserPermission[]): Promise<boolean> {
    if (!(await this.isSuperAdminSession())) return false;

    const localKey = `givd_profile_${userId}`;
    const profile = JSON.parse(localStorage.getItem(localKey) || '{}');
    profile.permissions = permissions;
    profile.role = permissions.includes('admin_access') ? 'admin' : (permissions.length > 2 ? 'manager' : 'user');
    localStorage.setItem(localKey, JSON.stringify(profile));
    return true;
  }

  async adminUpdateUserStatus(userId: string, status: User['accountStatus']): Promise<boolean> {
    if (!(await this.isSuperAdminSession())) return false;

    const localKey = `givd_profile_${userId}`;
    const profile = JSON.parse(localStorage.getItem(localKey) || '{}');
    profile.accountStatus = status;
    localStorage.setItem(localKey, JSON.stringify(profile));
    return true;
  }

  // ==========================================
  // MÉTHODES PUBLIQUES
  // ==========================================
  async login(email: string, password: string) { return await supabaseClient.auth.signInWithPassword({ email, password }); }
  async signup(email: string, password: string) { return await supabaseClient.auth.signUp({ email, password }); }
  async logout() { await supabaseClient.auth.signOut(); }
  
  async updateUser(userData: Partial<User>): Promise<boolean> {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return false;
    const localKey = `givd_profile_${user.id}`;
    const existing = JSON.parse(localStorage.getItem(localKey) || '{}');
    // Sécurité : Impossible de s'auto-promouvoir admin par cette route
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
  async addProduct(p: any) { return p; }
  async updateProduct(p: any) { return p; }
  async deleteProduct(id: string) { return true; }
}

export const supabase = new RealSupabaseService();
