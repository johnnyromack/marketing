import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { query, type } = await req.json();

    const MAPBOX_TOKEN = Deno.env.get('MAPBOX_PUBLIC_TOKEN');
    if (!MAPBOX_TOKEN) {
      console.error('MAPBOX_PUBLIC_TOKEN not configured');
      return new Response(
        JSON.stringify({ success: false, error: 'Mapbox token not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If type is 'get-token', return the public token for map initialization
    if (type === 'get-token') {
      return new Response(
        JSON.stringify({ success: true, token: MAPBOX_TOKEN }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For geocoding, query is required
    if (!query) {
      return new Response(
        JSON.stringify({ success: false, error: 'Query is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Search for places in Brazil
    const encodedQuery = encodeURIComponent(query);
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedQuery}.json?access_token=${MAPBOX_TOKEN}&country=br&language=pt&limit=5&types=address,place,locality,neighborhood`;

    console.log('Geocoding query:', query);

    const response = await fetch(url);
    const data = await response.json();

    if (!response.ok) {
      console.error('Mapbox API error:', data);
      return new Response(
        JSON.stringify({ success: false, error: data.message || 'Mapbox API error' }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Format results
    const results = data.features?.map((feature: any) => ({
      id: feature.id,
      place_name: feature.place_name,
      text: feature.text,
      center: feature.center, // [longitude, latitude]
      context: feature.context,
    })) || [];

    console.log(`Found ${results.length} results`);

    return new Response(
      JSON.stringify({ success: true, results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Geocoding error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to geocode';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
