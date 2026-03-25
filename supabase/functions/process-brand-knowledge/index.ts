import { createClient } from "npm:@supabase/supabase-js@2";
import pdf from "npm:pdf-parse@1.1.1";
import mammoth from "npm:mammoth@1.8.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function processWithAI(content: string, title: string, url?: string): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY || content.length < 100) return content;

  try {
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um especialista em análise de marcas educacionais. Extraia e organize as informações mais relevantes para criar um perfil completo da marca.

Organize em seções:
1. **Identidade da Marca** - Nome, slogan, proposta de valor
2. **Público-Alvo** - Quem são os alunos/famílias
3. **Metodologia Pedagógica** - Abordagem de ensino, diferenciais
4. **Cursos/Séries** - O que oferecem
5. **Posicionamento** - Como se posicionam no mercado
6. **Tom de Comunicação** - Como falam com o público
7. **Diferenciais Competitivos** - O que os torna únicos
8. **Sazonalidade** - Períodos de matrícula, vestibular, eventos

Seja conciso mas completo. Use bullet points.`,
          },
          {
            role: "user",
            content: `Analise o conteúdo e extraia as informações da marca:\n\nTítulo: ${title}${url ? `\nURL: ${url}` : ""}\n\nConteúdo:\n${content.slice(0, 12000)}`,
          },
        ],
      }),
    });

    if (aiResponse.ok) {
      const aiData = await aiResponse.json();
      return aiData.choices?.[0]?.message?.content || content;
    }
  } catch (e) {
    console.error("AI processing error:", e);
  }
  return content;
}

function formatUrl(url: string): string {
  let formatted = url.trim();
  if (!formatted.startsWith("http://") && !formatted.startsWith("https://")) {
    formatted = `https://${formatted}`;
  }
  return formatted;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const contentType = req.headers.get("content-type") || "";

    // Handle file upload (multipart form data)
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      const brandId = formData.get("marca_id") as string;
      const fileTitle = formData.get("title") as string || "";

      if (!file || !brandId) {
        return new Response(JSON.stringify({ error: "file and brand_id are required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`Processing file upload: ${file.name} (${file.type}, ${file.size} bytes)`);

      // Extract text based on file type
      let textContent = "";
      const fileName = file.name.toLowerCase();
      
      if (fileName.endsWith(".pdf") || file.type === "application/pdf") {
        console.log("Parsing PDF...");
        const arrayBuf = await file.arrayBuffer();
        const pdfData = await pdf(new Uint8Array(arrayBuf));
        textContent = pdfData.text || "";
      } else if (fileName.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
        console.log("Parsing DOCX...");
        const arrayBuf = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ buffer: new Uint8Array(arrayBuf) });
        textContent = result.value || "";
      } else if (fileName.endsWith(".doc") || file.type === "application/msword") {
        return new Response(JSON.stringify({ 
          error: "Formato .doc (Word antigo) não suportado. Salve como .docx e tente novamente.",
        }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        // Text-based files (.txt, .md, .csv)
        textContent = await file.text();
      }

      if (!textContent || textContent.trim().length < 10) {
        return new Response(JSON.stringify({ error: "Arquivo vazio ou sem conteúdo extraível." }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const processedContent = await processWithAI(textContent, fileTitle || file.name);

      const { data, error } = await supabase.from("brand_knowledge").insert({
        marca_id: brandId,
        title: fileTitle || file.name,
        source_type: "document",
        content: processedContent,
        file_name: file.name,
        metadata: { original_length: textContent.length, file_type: file.type, processed_at: new Date().toISOString() },
      }).select().single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle JSON actions
    const { action, marca_id, url, title, content, knowledge_id } = await req.json();

    if (!brand_id) {
      return new Response(JSON.stringify({ error: "brand_id is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: crawl entire website using Firecrawl
    if (action === "scrape_url") {
      if (!url) {
        return new Response(JSON.stringify({ error: "url is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const formattedUrl = formatUrl(url);
      console.log(`Crawling site for brand ${brand_id}: ${formattedUrl}`);

      const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY");
      let allContent = "";
      let scrapedTitle = title || "";
      let pagesScraped = 0;

      if (FIRECRAWL_API_KEY) {
        // Step 1: Map the site to discover pages
        console.log("Mapping site URLs...");
        const mapResponse = await fetch("https://api.firecrawl.dev/v1/map", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            url: formattedUrl,
            limit: 20,
            includeSubdomains: false,
          }),
        });

        let urlsToScrape = [formattedUrl];
        if (mapResponse.ok) {
          const mapData = await mapResponse.json();
          const discoveredUrls = mapData.links || mapData.data || [];
          if (discoveredUrls.length > 0) {
            urlsToScrape = discoveredUrls.slice(0, 20);
          }
          console.log(`Discovered ${discoveredUrls.length} URLs, will scrape ${urlsToScrape.length}`);
        } else {
          console.log("Map failed, falling back to single page scrape");
        }

        // Step 2: Scrape each page (batch scrape via individual requests)
        const pageContents: string[] = [];
        for (const pageUrl of urlsToScrape) {
          try {
            const scrapeResponse = await fetch("https://api.firecrawl.dev/v1/scrape", {
              method: "POST",
              headers: {
                Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                url: pageUrl,
                formats: ["markdown"],
                onlyMainContent: true,
                waitFor: 2000,
              }),
            });

            if (scrapeResponse.ok) {
              const scrapeData = await scrapeResponse.json();
              const markdown = scrapeData.data?.markdown || scrapeData.markdown || "";
              if (markdown.trim().length > 50) {
                pageContents.push(`## Página: ${pageUrl}\n\n${markdown}`);
                pagesScraped++;
              }
              // Get title from first page
              if (!scrapedTitle && scrapeData.data?.metadata?.title) {
                scrapedTitle = scrapeData.data.metadata.title;
              }
            }
          } catch (e) {
            console.error(`Error scraping ${pageUrl}:`, e);
          }
        }

        allContent = pageContents.join("\n\n---\n\n");
        if (!scrapedTitle) {
          scrapedTitle = new URL(formattedUrl).hostname;
        }
      } else {
        // Fallback to basic single-page fetch
        console.log("Firecrawl not configured, using basic fetch");
        const response = await fetch(formattedUrl, {
          headers: {
            "User-Agent": "Mozilla/5.0 (compatible; BrandKnowledgeBot/1.0)",
            Accept: "text/html,application/xhtml+xml",
          },
        });

        if (!response.ok) {
          throw new Error(`Não foi possível acessar o site (HTTP ${response.status}). Verifique a URL.`);
        }

        const html = await response.text();
        allContent = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
          .replace(/<[^>]+>/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        scrapedTitle = new URL(formattedUrl).hostname;
        pagesScraped = 1;
      }

      if (!allContent || allContent.trim().length < 50) {
        throw new Error("Não foi possível extrair conteúdo suficiente do site. Verifique a URL.");
      }

      console.log(`Scraped ${pagesScraped} pages, total content: ${allContent.length} chars`);

      const processedContent = await processWithAI(allContent.slice(0, 30000), scrapedTitle, formattedUrl);

      const { data, error } = await supabase.from("brand_knowledge").insert({
        marca_id,
        title: scrapedTitle,
        source_type: "website",
        source_url: formattedUrl,
        content: processedContent,
        metadata: { url: formattedUrl, pages_scraped: pagesScraped, scraped_at: new Date().toISOString(), content_length: allContent.length },
      }).select().single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, data, pages_scraped: pagesScraped }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: process document text
    if (action === "save_document") {
      if (!content) {
        return new Response(JSON.stringify({ error: "content is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const processedContent = await processWithAI(content, title || "Documento");

      const { data, error } = await supabase.from("brand_knowledge").insert({
        marca_id,
        title: title || "Documento",
        source_type: "document",
        content: processedContent,
        metadata: { original_length: content.length, processed_at: new Date().toISOString() },
      }).select().single();

      if (error) throw error;

      return new Response(JSON.stringify({ success: true, data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: delete
    if (action === "delete") {
      if (!knowledge_id) {
        return new Response(JSON.stringify({ error: "knowledge_id is required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase.from("brand_knowledge").delete().eq("id", knowledge_id);
      if (error) throw error;

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
