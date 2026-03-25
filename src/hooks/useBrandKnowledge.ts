import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface BrandKnowledge {
  id: string;
  marca_id: string;
  title: string;
  source_type: string;
  source_url: string | null;
  content: string;
  file_name: string | null;
  metadata: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export function useBrandKnowledge(marcaId: string | null) {
  return useQuery({
    queryKey: ["brand-knowledge", marcaId],
    queryFn: async () => {
      if (!marcaId) return [];
      const { data, error } = await supabase
        .from("brand_knowledge")
        .select("*")
        .eq("marca_id", marcaId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BrandKnowledge[];
    },
    enabled: !!marcaId,
  });
}

export async function getBrandKnowledgeContext(marcaId: string): Promise<string> {
  const { data, error } = await supabase
    .from("brand_knowledge")
    .select("title, content, source_type")
    .eq("marca_id", marcaId);

  if (error || !data || data.length === 0) return "";

  const sections = data.map((k: any) => `### ${k.title} (${k.source_type})\n${k.content}`);
  return sections.join("\n\n---\n\n");
}
