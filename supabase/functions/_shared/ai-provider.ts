import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type AIProvider = "gemini" | "claude";

interface AIConfig {
  provider: AIProvider;
  anthropicApiKey: string | null;
  geminiApiKey: string | null;
}

async function getAIConfig(): Promise<AIConfig> {
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from("api_configurations")
    .select("config_key, config_value")
    .in("config_key", ["AI_PROVIDER", "ANTHROPIC_API_KEY", "GEMINI_API_KEY"]);

  if (error) {
    console.error("Error fetching AI config:", error);
  }

  const configMap: Record<string, string | null> = {};
  if (data) {
    data.forEach((row: { config_key: string; config_value: string | null }) => {
      configMap[row.config_key] = row.config_value;
    });
  }

  return {
    provider: (configMap["AI_PROVIDER"] as AIProvider) || "gemini",
    anthropicApiKey: configMap["ANTHROPIC_API_KEY"] || null,
    geminiApiKey: configMap["GEMINI_API_KEY"] || null,
  };
}

async function callGemini(
  systemPrompt: string,
  userMessage: string,
  lovableApiKey: string,
): Promise<string> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

async function callGeminiStream(
  messages: Array<{ role: string; content: string }>,
  lovableApiKey: string,
): Promise<Response> {
  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  return response;
}

async function callClaude(
  systemPrompt: string,
  userMessage: string,
  apiKey: string,
): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || "";
}

async function callClaudeStream(
  messages: Array<{ role: string; content: string }>,
  apiKey: string,
): Promise<Response> {
  // Separate system message from conversation messages
  const systemMessage = messages.find((m) => m.role === "system");
  const conversationMessages = messages.filter((m) => m.role !== "system");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      stream: true,
      system: systemMessage?.content || "",
      messages: conversationMessages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error (${response.status}): ${errorText}`);
  }

  // Transform Claude SSE format to OpenAI-compatible SSE format
  const claudeReader = response.body!.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let buffer = "";
      try {
        while (true) {
          const { done, value } = await claudeReader.read();
          if (done) {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;

            try {
              const event = JSON.parse(jsonStr);
              if (event.type === "content_block_delta" && event.delta?.text) {
                const openAIChunk = {
                  choices: [{
                    delta: { content: event.delta.text },
                    index: 0,
                    finish_reason: null,
                  }],
                };
                controller.enqueue(encoder.encode(`data: ${JSON.stringify(openAIChunk)}\n\n`));
              } else if (event.type === "message_stop") {
                controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              }
            } catch {
              // Skip unparseable lines
            }
          }
        }
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream" },
  });
}

/**
 * Creates a callAI function configured with the active provider from api_configurations.
 * Returns a simple function: (systemPrompt, userMessage) => Promise<string>
 */
export async function createAIClient(): Promise<{
  callAI: (systemPrompt: string, userMessage: string) => Promise<string>;
  callAIStream: (messages: Array<{ role: string; content: string }>) => Promise<Response>;
  provider: AIProvider;
}> {
  const config = await getAIConfig();
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY") || "";

  const callAI = async (systemPrompt: string, userMessage: string): Promise<string> => {
    if (config.provider === "claude" && config.anthropicApiKey) {
      console.log("Using Claude (claude-sonnet-4-20250514)");
      return callClaude(systemPrompt, userMessage, config.anthropicApiKey);
    }

    // Default: Gemini via Lovable gateway
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured and no alternative provider available");
    }
    console.log("Using Gemini (google/gemini-3-flash-preview) via Lovable gateway");
    return callGemini(systemPrompt, userMessage, lovableApiKey);
  };

  const callAIStream = async (
    messages: Array<{ role: string; content: string }>,
  ): Promise<Response> => {
    if (config.provider === "claude" && config.anthropicApiKey) {
      console.log("Using Claude stream (claude-sonnet-4-20250514)");
      return callClaudeStream(messages, config.anthropicApiKey);
    }

    // Default: Gemini via Lovable gateway
    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY not configured and no alternative provider available");
    }
    console.log("Using Gemini stream (google/gemini-3-flash-preview) via Lovable gateway");
    return callGeminiStream(messages, lovableApiKey);
  };

  return { callAI, callAIStream, provider: config.provider };
}
