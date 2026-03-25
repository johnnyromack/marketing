import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Mail, MessageCircle, Eye, EyeOff, Save, CheckCircle2, XCircle, Send, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ApiConfig {
  id: string;
  config_key: string;
  config_value: string | null;
  description: string | null;
  is_configured: boolean;
}

const apiConfigInfo: Record<string, { name: string; icon: React.ReactNode; placeholder: string }> = {
  RESEND_API_KEY: {
    name: "Resend API Key",
    icon: <Mail className="h-5 w-5 text-primary" />,
    placeholder: "re_xxxxxxxxxxxxxxxxxxxx",
  },
  WHATSAPP_API_URL: {
    name: "WhatsApp API URL",
    icon: <MessageCircle className="h-5 w-5 text-success" />,
    placeholder: "https://api.z-api.io/instances/...",
  },
  WHATSAPP_API_TOKEN: {
    name: "WhatsApp API Token",
    icon: <MessageCircle className="h-5 w-5 text-success" />,
    placeholder: "seu-token-aqui",
  },
};

// Test phone input component
const WhatsAppTestSection = () => {
  const [testPhone, setTestPhone] = useState("");
  const [isTesting, setIsTesting] = useState(false);

  const handleTestWhatsApp = async () => {
    if (!testPhone.trim()) {
      toast.error("Digite um número de telefone para teste");
      return;
    }

    setIsTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-whatsapp", {
        body: {
          phone: testPhone,
          message: "🔔 Teste de integração Z-API realizado com sucesso! Sua conexão está funcionando.",
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast.success("Mensagem de teste enviada com sucesso!");
      } else {
        throw new Error(data?.error || "Erro ao enviar mensagem");
      }
    } catch (error) {
      console.error("WhatsApp test error:", error);
      toast.error("Erro ao enviar mensagem de teste. Verifique as credenciais.");
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-2 pt-4 border-t border-dashed">
      <Label>Testar Conexão</Label>
      <div className="flex gap-2">
        <Input
          type="tel"
          placeholder="11999999999"
          value={testPhone}
          onChange={(e) => setTestPhone(e.target.value)}
          className="font-mono text-xs"
        />
        <Button
          variant="outline"
          onClick={handleTestWhatsApp}
          disabled={isTesting}
          className="gap-2 min-w-[140px]"
        >
          {isTesting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <Send className="h-4 w-4" />
              Enviar Teste
            </>
          )}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Digite seu número com DDD para receber uma mensagem de teste
      </p>
    </div>
  );
};

export const ApiConfigSection = () => {
  const [configs, setConfigs] = useState<ApiConfig[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [showValues, setShowValues] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchConfigs();
  }, []);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("api_configurations")
        .select("*")
        .order("config_key");

      if (error) throw error;

      if (data) {
        setConfigs(data);
        const initialValues: Record<string, string> = {};
        data.forEach((config) => {
          initialValues[config.config_key] = config.config_value || "";
        });
        setValues(initialValues);
      }
    } catch (error) {
      console.error("Error fetching API configs:", error);
      toast.error("Erro ao carregar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (configKey: string) => {
    setSaving(configKey);
    try {
      const value = values[configKey]?.trim() || null;
      const { error } = await supabase
        .from("api_configurations")
        .update({
          config_value: value,
          is_configured: !!value,
        })
        .eq("config_key", configKey);

      if (error) throw error;

      setConfigs((prev) =>
        prev.map((c) =>
          c.config_key === configKey ? { ...c, config_value: value, is_configured: !!value } : c
        )
      );
      toast.success("Configuração salva com sucesso");
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Erro ao salvar configuração");
    } finally {
      setSaving(null);
    }
  };

  const toggleShowValue = (key: string) => {
    setShowValues((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configurações de API</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de API para Alertas</CardTitle>
        <CardDescription>
          Configure as APIs para envio de alertas por e-mail e WhatsApp
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Section */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            <h3 className="font-semibold">E-mail (Resend)</h3>
            <a
              href="https://resend.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary underline"
            >
              Obter API Key
            </a>
          </div>

          {configs
            .filter((c) => c.config_key === "RESEND_API_KEY")
            .map((config) => {
              const info = apiConfigInfo[config.config_key];
              return (
                <div key={config.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{info?.name || config.config_key}</Label>
                    <Badge
                      variant="secondary"
                      className={
                        config.is_configured
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {config.is_configured ? (
                        <>
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Configurado
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-1 h-3 w-3" />
                          Não configurado
                        </>
                      )}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type={showValues[config.config_key] ? "text" : "password"}
                      placeholder={info?.placeholder}
                      value={values[config.config_key] || ""}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [config.config_key]: e.target.value }))
                      }
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleShowValue(config.config_key)}
                    >
                      {showValues[config.config_key] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="default"
                      size="icon"
                      onClick={() => handleSave(config.config_key)}
                      disabled={saving === config.config_key}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </div>
              );
            })}
        </div>

        {/* WhatsApp Section */}
        <div className="space-y-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-success" />
            <h3 className="font-semibold">WhatsApp</h3>
            <span className="text-xs text-muted-foreground">
              (Z-API, Twilio, ou outro provedor)
            </span>
          </div>

          {configs
            .filter((c) => c.config_key.startsWith("WHATSAPP_"))
            .map((config) => {
              const info = apiConfigInfo[config.config_key];
              return (
                <div key={config.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>{info?.name || config.config_key}</Label>
                    <Badge
                      variant="secondary"
                      className={
                        config.is_configured
                          ? "bg-success/10 text-success"
                          : "bg-muted text-muted-foreground"
                      }
                    >
                      {config.is_configured ? (
                        <>
                          <CheckCircle2 className="mr-1 h-3 w-3" />
                          Configurado
                        </>
                      ) : (
                        <>
                          <XCircle className="mr-1 h-3 w-3" />
                          Não configurado
                        </>
                      )}
                    </Badge>
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type={showValues[config.config_key] ? "text" : "password"}
                      placeholder={info?.placeholder}
                      value={values[config.config_key] || ""}
                      onChange={(e) =>
                        setValues((prev) => ({ ...prev, [config.config_key]: e.target.value }))
                      }
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => toggleShowValue(config.config_key)}
                    >
                      {showValues[config.config_key] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="default"
                      size="icon"
                      onClick={() => handleSave(config.config_key)}
                      disabled={saving === config.config_key}
                    >
                      <Save className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">{config.description}</p>
                </div>
              );
            })}

          {/* WhatsApp Test Section */}
          <WhatsAppTestSection />
        </div>
      </CardContent>
    </Card>
  );
};
