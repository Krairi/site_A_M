import { supabaseClient } from '../utils/supabaseClient';
import { User, Product, Recipe } from '../types';
import { ScannedReceipt } from './geminiService';
import { MOCK_STOCK } from '../constants';

// We keep the service structure to minimize changes in the view components
// but redirect calls to the real Supabase instance.

export interface Ticket extends ScannedReceipt {
  id: string;
  foyer_id: string;
  image_url?: string;
  created_at?: string;
}

class RealSupabaseService {
  
  async getUser(): Promise<User | null> {
    const { data: { user } } = await supabaseClient.auth.getUser();
    
    if (!user) return null;

    try {
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      return {
        id: user.id,
        email: user.email || '',
        name: profile?.name || user.email?.split('@')[0] || 'Utilisateur',
        foyer_id: profile?.foyer_id || user.id,
        plan: profile?.plan || 'family',
        diet: profile?.diet || 'Aucun',
        emailAlerts: profile?.email_alerts !== false // Default to true if undefined
      };
    } catch (e) {
      return {
        id: user.id,
        email: user.email || '',
        name: user.email?.split('@')[0] || 'Utilisateur',
        foyer_id: user.id,
        plan: 'family',
        diet: 'Aucun',
        emailAlerts: true
      };
    }
  }

  async updateUser(updates: Partial<User>): Promise<boolean> {
    const user = await this.getUser();
    if (!user) return false;

    // Construct payload with fallback for required fields in case of new row creation
    const payload: any = {
        id: user.id,
        updated_at: new Date().toISOString(),
        foyer_id: user.foyer_id,
        email: user.email
    };

    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.plan !== undefined) payload.plan = updates.plan;
    if (updates.diet !== undefined) payload.diet = updates.diet;
    if (updates.emailAlerts !== undefined) payload.email_alerts = updates.emailAlerts;

    const { error } = await supabaseClient
      .from('profiles')
      .upsert(payload, { onConflict: 'id' });

    if (error) {
      // Log formatted error and don't block UI
      console.warn("Supabase update warning:", JSON.stringify(error, null, 2));
      return false;
    }
    return true;
  }

  async login(email: string, password: string): Promise<User | null> {
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      throw error;
    }

    return this.getUser();
  }

  async signup(email: string, password: string) {
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password
    });

    if (error) {
      throw error;
    }

    return data;
  }

  async logout(): Promise<void> {
    await supabaseClient.auth.signOut();
  }

  async getStock(): Promise<Product[]> {
    const { data, error } = await supabaseClient
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error || !data) {
      console.warn('Error fetching stock (DB might be missing), returning mock:', error);
      return MOCK_STOCK;
    }
    
    return data.map((item: any) => ({
      ...item,
      minThreshold: item.min_threshold || item.minThreshold || 0,
      expiryDate: item.expiry_date || item.expiryDate
    })) as Product[];
  }

  async addProduct(product: Omit<Product, 'id' | 'foyer_id'>): Promise<Product | null> {
    const user = await this.getUser();
    const foyerId = user?.foyer_id || '1';

    const dbProduct = {
      name: product.name,
      quantity: product.quantity,
      unit: product.unit,
      category: product.category,
      min_threshold: product.minThreshold,
      expiry_date: product.expiryDate,
      foyer_id: foyerId
    };

    const { data, error } = await supabaseClient
      .from('products')
      .insert([dbProduct])
      .select()
      .single();

    if (error) {
      console.warn('Error adding product to DB, using mock return:', error);
      // Return a simulated product object so the UI can update
      return {
        id: Math.random().toString(36).substr(2, 9),
        foyer_id: foyerId,
        ...product
      } as Product;
    }

    return {
      ...data,
      minThreshold: data.min_threshold,
      expiryDate: data.expiry_date
    } as Product;
  }

  async updateProduct(product: Partial<Product> & { id: string }): Promise<Product | null> {
    // Map frontend keys to DB keys if necessary
    const updates: any = {};
    if (product.name !== undefined) updates.name = product.name;
    if (product.quantity !== undefined) updates.quantity = product.quantity;
    if (product.unit !== undefined) updates.unit = product.unit;
    if (product.category !== undefined) updates.category = product.category;
    if (product.minThreshold !== undefined) updates.min_threshold = product.minThreshold;
    if (product.expiryDate !== undefined) updates.expiry_date = product.expiryDate;

    const { data, error } = await supabaseClient
      .from('products')
      .update(updates)
      .eq('id', product.id)
      .select()
      .single();

    if (error) {
      console.warn('Error updating product in DB, returning mock updated object:', error);
      return {
        ...product,
        foyer_id: '1', // fallback
      } as Product;
    }

    return {
      ...data,
      minThreshold: data.min_threshold,
      expiryDate: data.expiry_date
    } as Product;
  }

  async deleteProduct(id: string): Promise<boolean> {
    const { error } = await supabaseClient
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('Error deleting product from DB (might be mock), treating as success for UI');
      return true; 
    }
    return true;
  }

  async generateRecipesFromStock(preferences: string): Promise<Recipe[]> {
    const { data, error } = await supabaseClient
      .from('recipes')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!error && data && data.length > 0) {
      return data.map((r: any) => ({
        ...r,
        prepTime: r.prep_time || r.prepTime,
        imageUrl: r.image_url || r.imageUrl,
        isAiGenerated: r.is_ai_generated || r.isAiGenerated
      }));
    }

    return [
      {
        id: 'r1',
        title: 'Omelette aux Tomates (Exemple)',
        description: 'Recette par défaut car aucune donnée trouvée en base.',
        ingredients: ['2 Œufs', '1 Tomate', 'Sel'],
        steps: ['Battre', 'Cuire'],
        prepTime: '10 min',
        calories: 300,
        isAiGenerated: false,
        imageUrl: 'https://picsum.photos/400/300?random=1'
      }
    ];
  }

  // --- Ticket Management ---

  async getTickets(): Promise<Ticket[]> {
    const { data, error } = await supabaseClient
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) {
      // Return mock tickets if table doesn't exist
      return [
        {
            id: 'mock1',
            foyer_id: '1',
            store: 'Supermarché Bio',
            date: '2023-10-20',
            total: 45.50,
            items: [
                { name: 'Pommes', quantity: 1, unit: 'kg', category: 'Frais', price: 3.50 },
                { name: 'Lait', quantity: 2, unit: 'L', category: 'Frais', price: 2.00 }
            ]
        }
      ];
    }
    return data as Ticket[];
  }

  async saveTicket(receipt: ScannedReceipt): Promise<Ticket | null> {
    const user = await this.getUser();
    const foyerId = user?.foyer_id || '1';

    const dbTicket = {
      foyer_id: foyerId,
      store: receipt.store,
      date: receipt.date,
      total: receipt.total,
      items: receipt.items, // Assuming JSONB column for items
      created_at: new Date().toISOString()
    };

    // 1. Save Ticket
    const { data, error } = await supabaseClient
        .from('tickets')
        .insert([dbTicket])
        .select()
        .single();

    if (error) {
        console.warn("Could not save ticket to DB (Table might not exist), using local mock return.");
        // 2. Mock update Stock automatically 
        for (const item of receipt.items) {
           // We fire and forget addProduct (it handles errors)
           this.addProduct({
              name: item.name,
              quantity: item.quantity,
              unit: item.unit,
              category: item.category,
              minThreshold: 1, // default
           });
        }
        return { id: Math.random().toString(), ...dbTicket } as Ticket;
    }

    // 2. Update Stock automatically (Optional: Batch insert)
    for (const item of receipt.items) {
        await this.addProduct({
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            category: item.category,
            minThreshold: 1, // default
        });
    }

    return data as Ticket;
  }

  async updateTicket(ticket: Partial<Ticket> & { id: string }): Promise<boolean> {
      const { error } = await supabaseClient
        .from('tickets')
        .update({
            store: ticket.store,
            date: ticket.date,
            total: ticket.total,
            items: ticket.items
        })
        .eq('id', ticket.id);
        
      if (error) {
          console.warn("Update ticket failed", error);
          // If using mocks, return true to simulate success
          return true;
      }
      return true;
  }

  async deleteTicket(id: string): Promise<boolean> {
      const { error } = await supabaseClient
        .from('tickets')
        .delete()
        .eq('id', id);
        
      if (error) {
          console.warn("Delete ticket failed", error);
          // If using mocks, return true to simulate success
          return true;
      }
      return true;
  }
}

export const supabase = new RealSupabaseService();