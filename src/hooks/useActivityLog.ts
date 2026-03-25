import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface LogDetails {
  [key: string]: unknown;
}

export type ActivityAction = 
  | 'insert' 
  | 'update' 
  | 'delete' 
  | 'status_change' 
  | 'approve' 
  | 'reject' 
  | 'view'
  | 'create_user'
  | 'reset_password'
  | 'update_role'
  | 'delete_user';

export type ActivityCategory = 
  | 'cadastros' 
  | 'orcamentos' 
  | 'aprovacoes' 
  | 'visualizacoes' 
  | 'usuarios';

// Map table names to categories
export const getActivityCategory = (tableName: string, action: ActivityAction): ActivityCategory => {
  if (action === 'view') return 'visualizacoes';
  if (action === 'approve' || action === 'reject') return 'aprovacoes';
  if (action === 'create_user' || action === 'reset_password' || action === 'update_role' || action === 'delete_user') return 'usuarios';
  if (tableName === 'orcamentos') return 'orcamentos';
  return 'cadastros';
};

export const useActivityLog = () => {
  const { user } = useAuth();

  const logActivity = async (
    action: ActivityAction,
    tableName: string,
    recordId: string | null,
    details?: LogDetails
  ) => {
    if (!user) {
      console.warn('useActivityLog: No user found, skipping log');
      return;
    }

    try {
      const category = getActivityCategory(tableName, action);
      const logDetails = details ? { ...details, category } : { category };
      
      const { error } = await supabase.from('activity_logs' as any).insert({
        user_id: user.id,
        action,
        table_name: tableName,
        record_id: recordId,
        details: logDetails,
      } as any);

      if (error) {
        console.error('Error logging activity:', error);
      } else {
        console.log('Activity logged:', { action, tableName, recordId, category });
      }
    } catch (err) {
      console.error('Failed to log activity:', err);
    }
  };

  return { logActivity };
};
