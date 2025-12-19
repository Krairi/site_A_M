
import { User, UserRole } from '../types';

/**
 * Utilitaires de vérification de droits (Frontend)
 */

export const isAdmin = (user: User | null): boolean => {
    return user?.role === 'admin';
};

export const isManager = (user: User | null): boolean => {
    return user?.role === 'admin' || user?.role === 'manager';
};

export const canManageStock = (user: User | null): boolean => {
    return user?.permissions.includes('manage_stock') || isAdmin(user);
};

export const canViewBudget = (user: User | null): boolean => {
    return user?.permissions.includes('view_budget') || isAdmin(user);
};

export const isAccountActive = (user: User | null): boolean => {
    return user?.accountStatus === 'active';
};
