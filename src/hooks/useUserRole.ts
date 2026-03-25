import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

type AppRole = 'admin' | 'gestor' | 'editor' | 'leitor';

interface UserRole {
  role: AppRole;
}

// TODO: REMOVER BYPASS ANTES DE IR PARA PRODUÇÃO
const DEV_BYPASS_AUTH = true;

export const useUserRole = () => {
  const { user } = useAuth();
  const [role, setRole] = useState<AppRole | null>(DEV_BYPASS_AUTH ? 'admin' : null);
  const [isAdmin, setIsAdmin] = useState(DEV_BYPASS_AUTH ? true : false);
  const [isGestor, setIsGestor] = useState(DEV_BYPASS_AUTH ? true : false);
  const [isEditor, setIsEditor] = useState(DEV_BYPASS_AUTH ? true : false);
  const [isLeitor, setIsLeitor] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (DEV_BYPASS_AUTH) return;

    const fetchRole = async () => {
      if (!user) {
        console.log('[useUserRole] No user, resetting role state');
        setRole(null);
        setIsAdmin(false);
        setIsGestor(false);
        setIsEditor(false);
        setIsLeitor(false);
        setLoading(false);
        return;
      }

      console.log('[useUserRole] Fetching role for user:', user.id);
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('[useUserRole] Error fetching user role:', error);
        setRole(null);
        setIsAdmin(false);
        setIsGestor(false);
        setIsEditor(false);
        setIsLeitor(false);
      } else if (data) {
        const userRole = data.role as AppRole;
        console.log('[useUserRole] Role found:', userRole);
        setRole(userRole);
        setIsAdmin(userRole === 'admin');
        setIsGestor(userRole === 'gestor' || userRole === 'admin');
        setIsEditor(userRole === 'editor' || userRole === 'gestor' || userRole === 'admin');
        setIsLeitor(userRole === 'leitor');
      } else {
        console.warn('[useUserRole] No role found for user:', user.id);
        setRole(null);
        setIsAdmin(false);
        setIsGestor(false);
        setIsEditor(false);
        setIsLeitor(false);
      }
      setLoading(false);
    };

    fetchRole();
  }, [user]);

  // Permission helpers
  const canViewDashboard = role !== null; // All roles can view dashboards
  const canEditForms = isEditor; // Admin, Gestor, Editor can edit forms
  const canApprove = isGestor; // Admin and Gestor can approve
  const canViewLogs = isGestor; // Admin and Gestor can view logs
  const canManageUsers = isGestor; // Admin and Gestor can create users
  const canAccessAdmin = isAdmin; // Only Admin can access admin panel (except Users for Gestor)
  const canExportData = role !== null; // All roles can export data

  return { 
    role, 
    isAdmin, 
    isGestor, 
    isEditor, 
    isLeitor, 
    loading,
    // Permission helpers
    canViewDashboard,
    canEditForms,
    canApprove,
    canViewLogs,
    canManageUsers,
    canAccessAdmin,
    canExportData,
  };
};
