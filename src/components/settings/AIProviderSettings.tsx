import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Brain, Eye, EyeOff, Save, Loader2, CheckCircle2, Zap } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

type AIProvider = "gemini" | "claude";

interface ConfigRow {
  id: string;
  config_key: string;
  config_value: string | null;
  is_configured: boolean;
}

const AIProviderSettings = () => {
  const [provider, setProvider] = useState<AIProvider>("gemini");
  const [anthropicKey, setAnthropicKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [configs, setConfigs] = useState<Record<string, ConfigRow>>({});

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("api_configurations")
        .select("*")
        .in("config_key", ["AI_PROVIDER", "ANTHROPIC_API_KEY"]);

      if (error) throw error;

      const configMap: Record<string, ConfigRow> = {};
      if (data) {
        data.forEach((row) => {
          configMap[row.config_key] = row as ConfigRow;
        });
      }
      setConfigs(configMap);

      if (configMap["AI_PROVIDER"]?.config_value) {
        setProvider(configMap["AI_PROVIDER"].config_value as AIProvider);
      }
      if (configMap["ANTHROPIC_API_KEY"]?.config_value) {
        setAnthropicKey(configMap["ANTHROPIC_API_KEY"].config_value);
      }
    } catch (error) {
      console.error("Error fetching AI config:", error);
    } finally {
      setLoading(false);
    }
  };

  const upsertConfig = async (key: string, value: string | null, description: string) => {
    if (configs[key]) {
      const { error } = await supabase
        .from("api_configurations")
        .update({ config_value: value, is_configured: !!value })
        .eq("config_key", key);
      if (error) throw error;
    } else {
      const { error } = await supabase
        .from("api_configurations")
        .insert({
          config_key: key,
          config_value: value,
          description,
          is_configured: !!value,
        });
      if (error) throw error;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await upsertConfig("AI_PROVIDER", provider, "Provedor de IA ativo (gemini ou claude)");

      if (provider === "claude") {
        if (!anthropicKey.trim()) {
          toast.error("Informe a API Key do Claude para usar este provedor");
          setSaving(false);
          return;
        }
        await upsertConfig("ANTHROPIC_API_KEY", anthropicKey.trim(), "Chave de API da Anthropic (Claude)");
      }

      // Refresh local state
      await fetchConfig();
      toast.success("Configuracao de IA salva com sucesso");
    } catch (error) {
      console.error("Error saving AI config:", error);
      toast.error("Erro ao salvar configuracao de IA");
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Voce precisa estar autenticado para testar");
        return;
      }

      const response = await supabase.functions.invoke("generate-campaign-insights", {
        body: {
          campaign: {
            name: "Teste de Conexao IA",
            platform: "meta",
            spend: 1000,
            impressions: 50000,
            clicks: 1500,
            conversions: 30,
            ctr: 3.0,
            roas: 2.5,
            objective: "conversions",
            type: "campaign" as const,
          },
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Erro na chamada");
      }

      if (response.data?.insights) {
        toast.success(`Conexao com ${provider === "claude" ? "Claude" : "Gemini"} funcionando corretamente!`);
      } else {
        toast.error("Resposta inesperada do provedor de IA");
      }
    } catch (error) {
      console.error("AI test error:", error);
      toast.error(`Erro ao testar conexao: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-lg">Provedor de IA</CardTitle>
              <CardDescription>
                Escolha o modelo de IA usado nas analises e chat
              </CardDescription>
            </div>
          </div>
          <Badge
            variant="secondary"
            className={
              provider === "claude" && configs["ANTHROPIC_API_KEY"]?.is_configured
                ? "bg-success/10 text-success"
                : provider === "gemini"
                ? "bg-success/10 text-success"
                : "bg-warning/10 text-warning"
            }
          >
            <CheckCircle2 className="mr-1 h-3 w-3" />
            {provider === "gemini" ? "Gemini Flash" : "Claude Sonnet"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="ai-provider">Modelo de IA</Label>
          <Select value={provider} onValueChange={(val) => setProvider(val as AIProvider)}>
            <SelectTrigger id="ai-provider">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gemini">
                Gemini Flash (padrao)
              </SelectItem>
              <SelectItem value="claude">
                Claude Sonnet
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">
            {provider === "gemini"
              ? "Google Gemini 3 Flash via gateway Lovable. Rapido e sem custo adicional."
              : "Anthropic Claude Sonnet 4. Requer API Key propria da Anthropic."}
          </p>
        </div>

        {provider === "gemini" && (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2 mb-1 font-medium text-foreground">
              <Zap className="h-4 w-4" />
              Usando gateway Lovable (padrao)
            </div>
            Nenhuma configuracao adicional necessaria. O Gemini Flash e acessado automaticamente pelo gateway integrado.
          </div>
        )}

        {provider === "claude" && (
          <div className="space-y-2">
            <Label htmlFor="anthropic-key">API Key da Anthropic</Label>
            <div className="flex gap-2">
              <Input
                id="anthropic-key"
                type={showKey ? "text" : "password"}
                placeholder="sk-ant-api03-..."
                value={anthropicKey}
                onChange={(e) => setAnthropicKey(e.target.value)}
                className="font-mono text-xs"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowKey(!showKey)}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Obtenha sua chave em{" "}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                console.anthropic.com
              </a>
            </p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Salvar
          </Button>
          <Button variant="outline" onClick={handleTest} disabled={testing}>
            {testing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Zap className="mr-2 h-4 w-4" />
            )}
            Testar conexao
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default AIProviderSettings;
