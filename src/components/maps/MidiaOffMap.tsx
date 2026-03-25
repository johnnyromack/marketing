import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, MapPin, AlertCircle } from 'lucide-react';
import DOMPurify from 'dompurify';

// Escape HTML entities to prevent XSS
const escapeHtml = (text: string | null | undefined): string => {
  if (!text) return '';
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
};

interface MidiaOffPoint {
  id: string;
  localizacao: string;
  latitude: number | null;
  longitude: number | null;
  marca: string;
  tipo_midia: string;
  valor_realizado: number;
  data_veiculacao_fim: string | null;
}

interface UnidadePoint {
  id: string;
  nome: string;
  endereco: string | null;
  latitude: number | null;
  longitude: number | null;
  marca_nome: string;
}

interface EventoPoint {
  id: string;
  nome_evento: string;
  endereco: string | null;
  latitude: number | null;
  longitude: number | null;
  marca: string;
  data_evento: string;
}

interface MidiaOffMapProps {
  marcas?: string[];
  unidades?: string[];
  className?: string;
}

// Dynamic brand colors for markers
const BRAND_COLORS = [
  '#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

const getBrandColor = (brand: string, allBrands: string[]): string => {
  const index = allBrands.indexOf(brand);
  return index >= 0 ? BRAND_COLORS[index % BRAND_COLORS.length] : BRAND_COLORS[0];
};

export const MidiaOffMap = ({ marcas = [], unidades = [], className }: MidiaOffMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const isInitializing = useRef(false);
  
  const [points, setPoints] = useState<MidiaOffPoint[]>([]);
  const [unidadePoints, setUnidadePoints] = useState<UnidadePoint[]>([]);
  const [eventoPoints, setEventoPoints] = useState<EventoPoint[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error' | 'no-token'>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Memoize filter strings to prevent unnecessary re-fetches
  const marcasKey = useMemo(() => marcas.sort().join(','), [marcas]);
  const unidadesKey = useMemo(() => unidades.sort().join(','), [unidades]);

  // Fetch points from database
  const fetchPoints = useCallback(async () => {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      // Fetch midia_off points - only active ones
      let midiaQuery = supabase
        .from('midia_off')
        .select('id, localizacao, latitude, longitude, marca, tipo_midia, valor_realizado, data_veiculacao_fim')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (marcas.length > 0) {
        midiaQuery = midiaQuery.in('marca', marcas);
      }

      if (unidades.length > 0) {
        midiaQuery = midiaQuery.in('unidade', unidades);
      }

      const { data: midiaData, error: midiaError } = await midiaQuery;

      if (midiaError) {
        console.error('Error fetching midia points:', midiaError);
      } else {
        // Filter out expired media points
        const activePoints = (midiaData || []).filter(p => {
          if (!p.data_veiculacao_fim) return true;
          return p.data_veiculacao_fim >= today;
        });
        setPoints(activePoints);
      }

      // Fetch unidade points
      const { data: unidadeData, error: unidadeError } = await supabase
        .from('unidades')
        .select('id, nome, endereco, latitude, longitude, marca:marcas(nome)')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null)
        .eq('ativo', true);

      if (unidadeError) {
        console.error('Error fetching unidade points:', unidadeError);
      } else {
        const unidadesFiltered = (unidadeData || [])
          .filter(u => {
            const marcaNome = u.marca?.nome;
            if (marcas.length > 0 && marcaNome && !marcas.includes(marcaNome)) {
              return false;
            }
            if (unidades.length > 0 && !unidades.includes(u.nome)) {
              return false;
            }
            return true;
          })
          .map(u => ({
            id: u.id,
            nome: u.nome,
            endereco: u.endereco,
            latitude: u.latitude,
            longitude: u.longitude,
            marca_nome: u.marca?.nome || 'Sem marca',
          }));
        setUnidadePoints(unidadesFiltered);
      }

      // Fetch evento points
      let eventoQuery = supabase
        .from('eventos')
        .select('id, nome_evento, endereco, latitude, longitude, marca, data_evento')
        .not('latitude', 'is', null)
        .not('longitude', 'is', null);

      if (marcas.length > 0) {
        eventoQuery = eventoQuery.in('marca', marcas);
      }

      if (unidades.length > 0) {
        eventoQuery = eventoQuery.in('unidade', unidades);
      }

      const { data: eventoData, error: eventoError } = await eventoQuery;

      if (eventoError) {
        console.error('Error fetching evento points:', eventoError);
      } else {
        setEventoPoints(eventoData || []);
      }
    } catch (err) {
      console.error('Error in fetchPoints:', err);
    }
  }, [marcasKey, unidadesKey]);

  // Initialize map - only once
  useEffect(() => {
    if (!mapContainer.current || map.current || isInitializing.current) {
      return;
    }

    isInitializing.current = true;

    const initMap = async () => {
      try {
        // Fetch token from edge function
        const { data, error: fnError } = await supabase.functions.invoke('mapbox-geocode', {
          body: { type: 'get-token' },
        });

        if (fnError || !data?.success || !data?.token) {
          console.error('Token fetch error:', fnError || data?.error);
          setStatus('no-token');
          setErrorMessage('Token do Mapbox não configurado');
          isInitializing.current = false;
          return;
        }

        const token = data.token;

        // Set the access token
        mapboxgl.accessToken = token;

        // Create the map
        const newMap = new mapboxgl.Map({
          container: mapContainer.current!,
          style: 'mapbox://styles/mapbox/streets-v12',
          center: [-43.1729, -22.9068], // Rio de Janeiro
          zoom: 10,
          attributionControl: false,
        });

        map.current = newMap;

        // Add navigation control
        newMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
        newMap.addControl(new mapboxgl.AttributionControl({ compact: true }));

        // Set ready when map loads
        newMap.once('load', () => {
          setStatus('ready');
          isInitializing.current = false;
        });

        // Fallback timeout
        setTimeout(() => {
          if (isInitializing.current) {
            setStatus('ready');
            isInitializing.current = false;
          }
        }, 3000);

      } catch (err) {
        console.error('Error initializing map:', err);
        setStatus('error');
        setErrorMessage('Erro ao inicializar o mapa');
        isInitializing.current = false;
      }
    };

    initMap();

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
      isInitializing.current = false;
    };
  }, []);

  // Fetch points on mount and when filters change
  useEffect(() => {
    fetchPoints();
  }, [fetchPoints]);

  // Get unique brands from all points
  const brandsInPoints = useMemo(() => {
    const brands = new Set([
      ...points.map(p => p.marca),
      ...unidadePoints.map(p => p.marca_nome),
      ...eventoPoints.map(p => p.marca),
    ]);
    return Array.from(brands).sort();
  }, [points, unidadePoints, eventoPoints]);

  // Update markers when points or status changes
  useEffect(() => {
    if (!map.current || status !== 'ready') return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    const totalPoints = points.length + unidadePoints.length + eventoPoints.length;
    if (totalPoints === 0) return;

    // Add new markers
    const bounds = new mapboxgl.LngLatBounds();

    // Add midia_off markers (pin icon)
    points.forEach((point) => {
      if (point.longitude && point.latitude) {
        const color = getBrandColor(point.marca, brandsInPoints);
        
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px;">
            <h3 style="font-weight: 600; font-size: 14px; margin: 0 0 4px 0;">📍 ${escapeHtml(point.localizacao)}</h3>
            <p style="font-size: 12px; color: #666; margin: 0 0 4px 0;">${escapeHtml(point.marca)} - ${escapeHtml(point.tipo_midia)}</p>
            <p style="font-size: 12px; font-weight: 500; margin: 0;">R$ ${point.valor_realizado.toLocaleString('pt-BR')}</p>
          </div>
        `);

        const marker = new mapboxgl.Marker({ color })
          .setLngLat([point.longitude, point.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.push(marker);
        bounds.extend([point.longitude, point.latitude]);
      }
    });

    // Add unidade markers (building emoji)
    unidadePoints.forEach((point) => {
      if (point.longitude && point.latitude) {
        const el = document.createElement('div');
        el.innerHTML = '🏢';
        el.style.fontSize = '24px';
        el.style.cursor = 'pointer';
        
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px;">
            <h3 style="font-weight: 600; font-size: 14px; margin: 0 0 4px 0;">🏢 ${escapeHtml(point.nome)}</h3>
            <p style="font-size: 12px; color: #666; margin: 0 0 4px 0;">${escapeHtml(point.marca_nome)}</p>
            <p style="font-size: 11px; color: #888; margin: 0;">${escapeHtml(point.endereco) || 'Sem endereço'}</p>
          </div>
        `);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([point.longitude, point.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.push(marker);
        bounds.extend([point.longitude, point.latitude]);
      }
    });

    // Add evento markers (orange pin)
    eventoPoints.forEach((point) => {
      if (point.longitude && point.latitude) {
        const el = document.createElement('div');
        el.innerHTML = '📌';
        el.style.fontSize = '22px';
        el.style.cursor = 'pointer';
        
        const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
          <div style="padding: 8px;">
            <h3 style="font-weight: 600; font-size: 14px; margin: 0 0 4px 0;">📌 ${escapeHtml(point.nome_evento)}</h3>
            <p style="font-size: 12px; color: #666; margin: 0 0 4px 0;">${escapeHtml(point.marca)}</p>
            <p style="font-size: 11px; color: #888; margin: 0;">${escapeHtml(point.data_evento)}</p>
            <p style="font-size: 11px; color: #888; margin: 0;">${escapeHtml(point.endereco) || 'Sem endereço'}</p>
          </div>
        `);

        const marker = new mapboxgl.Marker({ element: el })
          .setLngLat([point.longitude, point.latitude])
          .setPopup(popup)
          .addTo(map.current!);

        markersRef.current.push(marker);
        bounds.extend([point.longitude, point.latitude]);
      }
    });

    // Fit map to show all markers
    if (markersRef.current.length > 0) {
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 14,
      });
    }
  }, [points, unidadePoints, eventoPoints, status, brandsInPoints]);

  // Error state
  if (status === 'error' || status === 'no-token') {
    return (
      <div className={`flex flex-col items-center justify-center bg-muted rounded-lg p-8 ${className}`} style={{ minHeight: 400 }}>
        <AlertCircle className="h-8 w-8 text-muted-foreground mb-2" />
        <p className="text-muted-foreground text-sm text-center">{errorMessage}</p>
      </div>
    );
  }

  const totalPoints = points.length + unidadePoints.length + eventoPoints.length;

  return (
    <div className={`relative rounded-lg overflow-hidden bg-muted ${className}`} style={{ minHeight: 400 }}>
      {/* Map container - always rendered */}
      <div 
        ref={mapContainer} 
        className="absolute inset-0"
        style={{ visibility: status === 'ready' ? 'visible' : 'hidden' }}
      />
      
      {/* Loading overlay */}
      {status === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Carregando mapa...</span>
          </div>
        </div>
      )}
      
      {/* No points message */}
      {status === 'ready' && totalPoints === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/80 pointer-events-none z-10">
          <div className="flex flex-col items-center gap-2 px-4">
            <MapPin className="h-8 w-8 text-muted-foreground" />
            <p className="text-muted-foreground text-sm text-center">
              Nenhum ponto com coordenadas cadastrado.
            </p>
            <p className="text-muted-foreground text-xs text-center">
              Cadastre pontos de mídia, unidades ou eventos com endereço para visualizá-los no mapa.
            </p>
          </div>
        </div>
      )}

      {/* Legend */}
      {status === 'ready' && totalPoints > 0 && (
        <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm rounded-lg p-3 shadow-lg z-20">
          <p className="text-xs font-medium mb-2">Legenda</p>
          <div className="space-y-1.5">
            {/* Marcas with midia_off */}
            {points.length > 0 && (
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Mídia Off:</p>
                {brandsInPoints.filter(b => points.some(p => p.marca === b)).map((brand) => (
                  <div key={brand} className="flex items-center gap-2 pl-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: getBrandColor(brand, brandsInPoints) }}
                    />
                    <span className="text-xs">{brand}</span>
                  </div>
                ))}
              </div>
            )}
            {unidadePoints.length > 0 && (
              <div className="flex items-center gap-2 pt-1 border-t">
                <span className="text-sm">🏢</span>
                <span className="text-xs">Unidades</span>
              </div>
            )}
            {eventoPoints.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm">📌</span>
                <span className="text-xs">Eventos</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};