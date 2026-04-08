import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Eye, EyeOff, Save, CheckCircle2, XCircle, Loader2, ExternalLink, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MetaIcon, GoogleAdsIcon, TikTokIcon } from "@/components/icons/PlatformIcons";
import { Map, Linkedin } from "lucide-react";
import { Link } from "react-router-dom";
import AIProviderSettings from "@/components/settings/AIProviderSettings";

interface PlatformConfig {
  id: string;
  config_key: string;
  config_value: string | null;
  description: string | null;
  is_configured: boolean;
}

interface PlatformCredentials {
  platform: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  docLink: string;
  fields: {
    key: string;
    label: string;
    placeholder: string;
    description: string;
  }[];
}

const platformConfigs: PlatformCredentials[] = [
  {
    platform: "meta",
    name: "Meta Ads",
    icon: <MetaIcon size={24} />,
    color: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    docLink: "/documentacao#meta",
    fields: [
      {
        key: "META_APP_ID",
        label: "App ID",
        placeholder: "1234567890123456",
        description: "ID do aplicativo criado no Meta for Developers (em Configuracoes do App)",
      },
      {
        key: "META_APP_SECRET",
        label: "App Secret",
        placeholder: "abc123def456...",
        description: "Chave secreta do aplicativo (em Configuracoes do App > Seguranca)",
      },
    ],
  },
  {
    platform: "google",
    name: "Google Ads",
    icon: <GoogleAdsIcon size={24} />,
    color: "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    docLink: "/documentacao#google",
    fields: [
      {
        key: "GOOGLE_ADS_CUSTOMER_ID",
        label: "Customer ID (MCC)",
        placeholder: "123-456-7890",
        description: "ID da conta manager (MCC) do Google Ads",
      },
      {
        key: "GOOGLE_ADS_CLIENT_ID",
        label: "OAuth Client ID",
        placeholder: "xxxx.apps.googleusercontent.com",
        description: "Client ID do OAuth 2.0",
      },
      {
        key: "GOOGLE_ADS_CLIENT_SECRET",
        label: "OAuth Client Secret",
        placeholder: "GOCSPX-xxxx",
        description: "Client Secret do OAuth 2.0",
      },
      {
        key: "GOOGLE_ADS_REFRESH_TOKEN",
        label: "Refresh Token",
        placeholder: "1//0xxxx",
        description: "Token de atualizacao OAuth",
      },
      {
        key: "GOOGLE_ADS_DEVELOPER_TOKEN",
        label: "Developer Token",
        placeholder: "xxxx-xxxx-xxxx",
        description: "Token de desenvolvedor do Google Ads API",
      },
    ],
  },
  {
    platform: "mapbox",
    name: "Mapbox (Mapas)",
    icon: <Map size={24} />,
    color: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    docLink: "/documentacao#mapbox",
    fields: [
      {
        key: "MAPBOX_PUBLIC_TOKEN",
        label: "Public Token",
        placeholder: "pk.eyJ1Ijoi...",
        description: "Token público do Mapbox — usado nos mapas de mídia off. Obtenha em account.mapbox.com",
      },
    ],
  },
  {
    platform: "tiktok",
    name: "TikTok Ads",
    icon: <TikTokIcon size={24} />,
    color: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
    docLink: "/documentacao#tiktok",
    fields: [
      {
        key: "TIKTOK_APP_ID",
        label: "App ID",
        placeholder: "7604725456784343041",
        description: "ID do aplicativo no TikTok Developer Portal",
      },
      {
        key: "TIKTOK_APP_SECRET",
        label: "App Secret",
        placeholder: "0b8xxxxxxxxxxxxxxx511",
        description: "Chave secreta do aplicativo",
      },
      {
        key: "TIKTOK_ACCESS_TOKEN",
        label: "Access Token",
        placeholder: "xxxxxxxxxxxxx",
        description: "Token de acesso da Marketing API (sera renovado automaticamente)",
      },
      {
        key: "TIKTOK_ADVERTISER_ID",
        label: "Advertiser ID",
        placeholder: "7xxxxxxxxxxxxxxxxx",
        description: "ID do anunciante TikTok (19 digitos)",
      },
    ],
  },
  {
    platform: "linkedin",
    name: "LinkedIn",
    icon: <Linkedin size={24} />,
    color: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    docLink: "/documentacao#linkedin",
    fields: [
      {
        key: "LINKEDIN_CLIENT_ID",
        label: "Client ID",
        placeholder: "86xxxxxxxxxx",
        description: "Client ID do aplicativo LinkedIn Developer (em Products > Marketing Developer Platform)",
      },
      {
        key: "LINKEDIN_CLIENT_SECRET",
        label: "Client Secret",
        placeholder: "xxxxxxxxxxxxxxxx",
        description: "Client Secret do aplicativo LinkedIn Developer",
      },
    ],
  },
  {
    platform: "google_business",
    name: "Google Business Profile",
    icon: <GoogleAdsIcon size={24} />,
    color: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    docLink: "/documentacao#google",
    fields: [
      {
        key: "GOOGLE_BUSINESS_ACCOUNT_ID",
        label: "Account ID",
        placeholder: "accounts/123456789",
        description: "ID da conta Google Business Profile (formato: accounts/XXXXXXXXX)",
      },
    ],
  },
];

const PlatformCredentialCard = ({ platform }: { platform: PlatformCredentials }) => {
  const [configs, setConfigs] = useState<Record<string, PlatformConfig>>({});
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
      const keys = platform.fields.map((f) => f.key);
      const { data, error } = await supabase
        .from("api_configurations")
        .select("*")
        .in("config_key", keys);

      if (error) throw error;

      if (data) {
        const configMap: Record<string, PlatformConfig> = {};
        const valueMap: Record<string, string> = {};
        data.forEach((config) => {
          configMap[config.config_key] = config;
          valueMap[config.config_key] = config.config_value || "";
        });
        setConfigs(configMap);
        setValues(valueMap);
      }
    } catch (error) {
      console.error("Error fetching configs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (configKey: string) => {
    setSaving(configKey);
    try {
      const value = values[configKey]?.trim() || null;

      if (configs[configKey]) {
        const { error } = await supabase
          .from("api_configurations")
          .update({ config_value: value, is_configured: !!value })
          .eq("config_key", configKey);
        if (error) throw error;
      } else {
        const field = platform.fields.find((f) => f.key === configKey);
        const { error } = await supabase
          .from("api_configurations")
          .insert({ config_key: configKey, config_value: value, description: field?.description || null, is_configured: !!value });
        if (error) throw error;
      }

      setConfigs((prev) => ({
        ...prev,
        [configKey]: { ...prev[configKey], config_value: value, is_configured: !!value } as PlatformConfig,
      }));
      toast.success("Credencial salva com sucesso");
    } catch (error) {
      console.error("Error saving config:", error);
      toast.error("Erro ao salvar credencial");
    } finally {
      setSaving(null);
    }
  };

  const toggleShowValue = (key: string) => {
    setShowValues((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const isConfigured = platform.fields.every((f) => configs[f.key]?.is_configured);
  const partiallyConfigured = platform.fields.some((f) => configs[f.key]?.is_configured);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${platform.color}`}>{platform.icon}</div>
            <div>
              <CardTitle className="text-lg">{platform.name}</CardTitle>
              <CardDescription>Configure as credenciais para integracao</CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant="secondary"
              className={
                isConfigured
                  ? "bg-success/10 text-success"
                  : partiallyConfigured
                  ? "bg-warning/10 text-warning"
                  : "bg-muted text-muted-foreground"
              }
            >
              {isConfigured ? (
                <><CheckCircle2 className="mr-1 h-3 w-3" />Configurado</>
              ) : partiallyConfigured ? (
                <><XCircle className="mr-1 h-3 w-3" />Parcial</>
              ) : (
                <><XCircle className="mr-1 h-3 w-3" />Nao configurado</>
              )}
            </Badge>
            <Button variant="outline" size="sm" asChild>
              <Link to={platform.docLink} className="gap-1">
                <BookOpen className="h-4 w-4" />
                Docs
              </Link>
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          platform.fields.map((field) => {
            const config = configs[field.key];
            return (
              <div key={field.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor={field.key}>{field.label}</Label>
                  {config && (
                    <Badge variant="outline" className={config.is_configured ? "text-success border-success/30" : "text-muted-foreground"}>
                      {config.is_configured ? "Salvo" : "Vazio"}
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2">
                  <Input
                    id={field.key}
                    type={showValues[field.key] ? "text" : "password"}
                    placeholder={field.placeholder}
                    value={values[field.key] || ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [field.key]: e.target.value }))}
                    className="font-mono text-xs"
                  />
                  <Button variant="outline" size="icon" onClick={() => toggleShowValue(field.key)}>
                    {showValues[field.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                  <Button variant="default" size="icon" onClick={() => handleSave(field.key)} disabled={saving === field.key}>
                    {saving === field.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{field.description}</p>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
};

const Credenciais = () => {
  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Credenciais</h1>
            <p className="text-muted-foreground">
              Gerencie as chaves de API e tokens de acesso das plataformas de anuncios
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/documentacao" className="gap-2">
              <BookOpen className="h-4 w-4" />
              Ver Documentacao
            </Link>
          </Button>
        </div>

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex items-start gap-4 py-4">
            <div className="p-2 rounded-full bg-primary/10">
              <ExternalLink className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">Precisa de ajuda para obter as credenciais?</p>
              <p className="text-sm text-muted-foreground">
                Acesse nossa{" "}
                <Link to="/documentacao" className="text-primary hover:underline font-medium">
                  documentacao completa
                </Link>{" "}
                com guias passo a passo para cada plataforma.
              </p>
            </div>
          </CardContent>
        </Card>

        <AIProviderSettings />

        <div className="grid gap-6">
          {platformConfigs.map((platform) => (
            <PlatformCredentialCard key={platform.platform} platform={platform} />
          ))}
        </div>
      </div>
    </AppLayout>
  );
};

export default Credenciais;
