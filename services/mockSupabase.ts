
import { supabaseClient } from '../utils/supabaseClient';
import { User, Product, Recipe, MealPlan, UserPermission, UserRole } from '../types';
import { ScannedReceipt } from './geminiService';
import { MOCK_STOCK } from '../constants';
import { SUPER_ADMIN_EMAIL } from './authService';

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
  // LOGIQUE DE DROITS
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
      const { data: { session } } = await supabaseClient.auth.getSession();
      const authUser = session?.user;
      if (!authUser) return null;

      // Tentative de récupération du profil réel en base
      const { data: profile, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const isSystemAdmin = authUser.email === SUPER_ADMIN_EMAIL;
      
      // Merge base de données + fallback local (pour le développement)
      const localKey = `givd_profile_${authUser.id}`;
      let localProfile = JSON.parse(localStorage.getItem(localKey) || '{}');

      return {
          id: authUser.id,
          email: authUser.email || '',
          name: profile?.name || localProfile?.name || authUser.email?.split('@')[0] || 'Utilisateur',
          foyer_id: profile?.foyer_id || localProfile?.foyer_id || authUser.id,
          role: isSystemAdmin ? 'admin' : (profile?.role || localProfile.role || 'user'),
          plan: profile?.plan || localProfile?.plan || 'free',
          subscriptionStatus: profile?.subscriptionStatus || 'active',
          diet: profile?.diet || localProfile?.diet || 'Standard',
          allergens: profile?.allergens || localProfile?.allergens || [],
          dislikes: profile?.dislikes || localProfile?.dislikes || [],
          emailAlerts: profile?.emailAlerts ?? localProfile?.emailAlerts ?? true,
          householdSize: profile?.householdSize || localProfile?.householdSize || 2,
          permissions: profile?.permissions || (isSystemAdmin ? ['manage_stock', 'view_budget', 'manage_planning', 'admin_access', 'generate_recipes'] : ['manage_stock', 'generate_recipes']),
          accountStatus: profile?.accountStatus || localProfile?.accountStatus || 'active'
      };
    } catch (err) { return null; }
  }

  // ==========================================
  // ROUTES RÉELLES ADMIN (SUPABASE)
  // ==========================================

  async getAllProfiles(): Promise<User[]> {
    if (!(await this.isSuperAdminSession())) {
        throw new Error("Accès interdit : Seul le Super Admin peut lister les comptes.");
    }
    
    // Tentative de lecture réelle
    const { data, error } = await supabaseClient
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.warn("Erreur Supabase (table profiles possiblement absente), passage au mock local.");
        // Mock fallback si la table n'existe pas encore
        return [
            { id: '1', email: 'admin@givd.com', name: 'admin', role: 'admin', plan: 'family', foyer_id: 'f-0', subscriptionStatus: 'active', householdSize: 2, permissions: ['manage_stock', 'view_budget', 'manage_planning', 'admin_access'], accountStatus: 'active' },
            { id: '2', email: 'jean.dupont@test.com', name: 'Jean Dupont', role: 'user', plan: 'free', foyer_id: 'f-1', subscriptionStatus: 'none', householdSize: 2, permissions: ['manage_stock'], accountStatus: 'active', lastActive: '2023-11-01' },
            { id: '3', email: 'sophie.martin@test.com', name: 'Sophie Martin', role: 'manager', plan: 'premium', foyer_id: 'f-1', subscriptionStatus: 'active', householdSize: 3, permissions: ['manage_stock', 'manage_planning'], accountStatus: 'active', lastActive: '2023-11-02' },
            { id: '4', email: 'compte.suspendu@test.com', name: 'Ancien Utilisateur', role: 'user', plan: 'free', foyer_id: 'f-2', subscriptionStatus: 'none', householdSize: 1, permissions: [], accountStatus: 'suspended', lastActive: '2023-09-15' },
        ];
    }
    
    return data as User[];
  }

  async adminUpdateUserPermissions(userId: string, permissions: UserPermission[]): Promise<boolean> {
    if (!(await this.isSuperAdminSession())) return false;

    const role = permissions.includes('admin_access') ? 'admin' : (permissions.length > 2 ? 'manager' : 'user');

    const { error } = await supabaseClient
        .from('profiles')
        .update({ permissions, role })
        .eq('id', userId);

    if (error) {
        // Fallback local
        const localKey = `givd_profile_${userId}`;
        const profile = JSON.parse(localStorage.getItem(localKey) || '{}');
        profile.permissions = permissions;
        profile.role = role;
        localStorage.setItem(localKey, JSON.stringify(profile));
    }
    return true;
  }

  async adminUpdateUserStatus(userId: string, status: User['accountStatus']): Promise<boolean> {
    if (!(await this.isSuperAdminSession())) return false;

    const { error } = await supabaseClient
        .from('profiles')
        .update({ accountStatus: status })
        .eq('id', userId);

    if (error) {
        // Fallback local
        const localKey = `givd_profile_${userId}`;
        const profile = JSON.parse(localStorage.getItem(localKey) || '{}');
        profile.accountStatus = status;
        localStorage.setItem(localKey, JSON.stringify(profile));
    }
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

    const { error } = await supabaseClient
        .from('profiles')
        .update(userData)
        .eq('id', user.id);

    // Fallback local
    const localKey = `givd_profile_${user.id}`;
    const existing = JSON.parse(localStorage.getItem(localKey) || '{}');
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
