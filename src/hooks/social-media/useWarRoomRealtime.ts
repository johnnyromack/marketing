/**
 * War Room Real-time Hook
 *
 * Provides real-time updates for crisis management using Supabase Realtime.
 * Subscribes to:
 * - New alerts (social_media_crisis_alerts)
 * - Alert status changes
 * - New incidents (social_media_crisis_incidents)
 * - Incident updates
 *
 * Uses user_id RLS filtering (not business_unit_id).
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  RealtimeChannel,
  RealtimePostgresChangesPayload,
} from '@supabase/supabase-js';

// ============================================
// Types
// ============================================

interface Alert {
  id: string;
  type: string;
  severity: string;
  title: string;
  description: string;
  status: string;
  created_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
}

interface Incident {
  id: string;
  title: string;
  severity: string;
  status: string;
  playbook_id?: string;
  created_at: string;
  updated_at: string;
}

interface CrisisMessage {
  id: string;
  incident_id: string;
  user_id: string;
  content: string;
  created_at: string;
  user_name?: string;
}

interface WarRoomState {
  alerts: Alert[];
  incidents: Incident[];
  messages: CrisisMessage[];
  activeUsers: string[];
  isConnected: boolean;
  isRefreshing: boolean;
  lastUpdate: Date | null;
}

interface WarRoomCallbacks {
  onNewAlert?: (alert: Alert) => void;
  onAlertUpdate?: (alert: Alert) => void;
  onNewIncident?: (incident: Incident) => void;
  onIncidentUpdate?: (incident: Incident) => void;
  onNewMessage?: (message: CrisisMessage) => void;
  onConnectionChange?: (isConnected: boolean) => void;
}

interface UseWarRoomRealtimeOptions {
  businessUnitId?: string;
  incidentId?: string;
  callbacks?: WarRoomCallbacks;
  enabled?: boolean;
}

// ============================================
// Hook
// ============================================

export function useWarRoomRealtime({
  businessUnitId,
  incidentId,
  callbacks,
  enabled = true,
}: UseWarRoomRealtimeOptions) {
  const [state, setState] = useState<WarRoomState>({
    alerts: [],
    incidents: [],
    messages: [],
    activeUsers: [],
    isConnected: false,
    isRefreshing: false,
    lastUpdate: null,
  });

  const channelRef = useRef<RealtimeChannel | null>(null);

  // Handle alert changes
  const handleAlertChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Alert>) => {
      const alert = payload.new as Alert;

      setState((prev) => {
        const existingIndex = prev.alerts.findIndex((a) => a.id === alert.id);

        if (payload.eventType === 'INSERT') {
          callbacks?.onNewAlert?.(alert);
          return {
            ...prev,
            alerts: [alert, ...prev.alerts],
            lastUpdate: new Date(),
          };
        }

        if (payload.eventType === 'UPDATE') {
          callbacks?.onAlertUpdate?.(alert);
          const newAlerts = [...prev.alerts];
          if (existingIndex >= 0) {
            newAlerts[existingIndex] = alert;
          }
          return {
            ...prev,
            alerts: newAlerts,
            lastUpdate: new Date(),
          };
        }

        if (payload.eventType === 'DELETE') {
          return {
            ...prev,
            alerts: prev.alerts.filter((a) => a.id !== (payload.old as Alert).id),
            lastUpdate: new Date(),
          };
        }

        return prev;
      });
    },
    [callbacks]
  );

  // Handle incident changes
  const handleIncidentChange = useCallback(
    (payload: RealtimePostgresChangesPayload<Incident>) => {
      const incident = payload.new as Incident;

      setState((prev) => {
        const existingIndex = prev.incidents.findIndex((i) => i.id === incident.id);

        if (payload.eventType === 'INSERT') {
          callbacks?.onNewIncident?.(incident);
          return {
            ...prev,
            incidents: [incident, ...prev.incidents],
            lastUpdate: new Date(),
          };
        }

        if (payload.eventType === 'UPDATE') {
          callbacks?.onIncidentUpdate?.(incident);
          const newIncidents = [...prev.incidents];
          if (existingIndex >= 0) {
            newIncidents[existingIndex] = incident;
          }
          return {
            ...prev,
            incidents: newIncidents,
            lastUpdate: new Date(),
          };
        }

        if (payload.eventType === 'DELETE') {
          return {
            ...prev,
            incidents: prev.incidents.filter((i) => i.id !== (payload.old as Incident).id),
            lastUpdate: new Date(),
          };
        }

        return prev;
      });
    },
    [callbacks]
  );

  // Handle message changes (for incident-specific chat)
  const handleMessageChange = useCallback(
    (payload: RealtimePostgresChangesPayload<CrisisMessage>) => {
      const message = payload.new as CrisisMessage;

      if (payload.eventType === 'INSERT') {
        callbacks?.onNewMessage?.(message);
        setState((prev) => ({
          ...prev,
          messages: [...prev.messages, message],
          lastUpdate: new Date(),
        }));
      }
    },
    [callbacks]
  );

  // Subscribe to real-time updates
  useEffect(() => {
    if (!enabled) return;

    const channelName = incidentId
      ? `war-room:incident:${incidentId}`
      : businessUnitId
      ? `war-room:user:${businessUnitId}`
      : 'war-room:global';

    const channel = supabase.channel(channelName);

    // Subscribe to alerts (filter by user_id via RLS — no explicit filter needed)
    if (!incidentId) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'social_media_crisis_alerts',
        },
        handleAlertChange
      );
    }

    // Subscribe to incidents
    if (!incidentId) {
      channel.on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'social_media_crisis_incidents',
        },
        handleIncidentChange
      );
    }

    // Subscribe to timeline messages for a specific incident
    if (incidentId) {
      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'social_media_crisis_incidents',
          filter: `id=eq.${incidentId}`,
        },
        handleMessageChange
      );
    }

    // Track presence (active users in war room)
    channel.on('presence', { event: 'sync' }, () => {
      const presenceState = channel.presenceState();
      const activeUsers = Object.keys(presenceState);
      setState((prev) => ({ ...prev, activeUsers }));
    });

    channel
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setState((prev) => ({ ...prev, isConnected: true }));
          callbacks?.onConnectionChange?.(true);

          // Track presence — get current user
          const { data: { user } } = await supabase.auth.getUser();
          await channel.track({
            user_id: user?.id ?? 'anonymous',
            joined_at: new Date().toISOString(),
          });
        }
      });

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [
    enabled,
    businessUnitId,
    incidentId,
    handleAlertChange,
    handleIncidentChange,
    handleMessageChange,
    callbacks,
  ]);

  // Manual refresh — direct Supabase queries
  const refresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isRefreshing: true }));

    try {
      const { data: alertsData } = await supabase
        .from('social_media_crisis_alerts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      const { data: incidentsData } = await supabase
        .from('social_media_crisis_incidents')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

      setState((prev) => ({
        ...prev,
        alerts: (alertsData ?? []) as Alert[],
        incidents: (incidentsData ?? []) as Incident[],
        isConnected: true,
        isRefreshing: false,
        lastUpdate: new Date(),
      }));
    } catch (err) {
      console.error('[useWarRoomRealtime] Error refreshing:', err);
      setState((prev) => ({ ...prev, isRefreshing: false }));
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      refresh();
    }
  }, [enabled, refresh]);

  // Send message to incident timeline
  const sendMessage = useCallback(
    async (content: string) => {
      if (!incidentId) return;

      const { data: { user } } = await supabase.auth.getUser();

      await supabase.from('social_media_crisis_incidents').insert({
        // Note: this is a timeline message insert — adapt table/columns to your actual schema
        // This may need adjustment based on your actual incident_timeline table
        incident_id: incidentId,
        type: 'message',
        content,
        user_id: user?.id ?? null,
      });
    },
    [incidentId]
  );

  // Acknowledge alert
  const acknowledgeAlert = useCallback(async (alertId: string) => {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase
      .from('social_media_crisis_alerts')
      .update({
        acknowledged_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', alertId)
      .eq('user_id', user?.id ?? '');
  }, []);

  // Resolve alert
  const resolveAlert = useCallback(async (alertId: string, resolution?: string) => {
    const { data: { user } } = await supabase.auth.getUser();

    await supabase
      .from('social_media_crisis_alerts')
      .update({
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        resolution,
        updated_at: new Date().toISOString(),
      })
      .eq('id', alertId)
      .eq('user_id', user?.id ?? '');
  }, []);

  return {
    ...state,
    refresh,
    sendMessage,
    acknowledgeAlert,
    resolveAlert,
  };
}

export default useWarRoomRealtime;
