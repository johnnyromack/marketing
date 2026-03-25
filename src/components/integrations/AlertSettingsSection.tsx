import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Bell, Save, AlertTriangle, AlertCircle, DollarSign, TrendingDown } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AlertContact {
  id: string;
  name: string;
}

interface Brand {
  id: string;
  name: string;
}

interface AlertSetting {
  id: string;
  marca_id: string | null;
  contact_id: string | null;
  alert_low_balance: boolean;
  alert_critical_balance: boolean;
  alert_new_deposit: boolean;
  alert_projection: boolean;
  low_balance_threshold: number;
  critical_balance_threshold: number;
  projection_days: number;
}

interface AlertTemplate {
  key: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  template: string;
  variables: string[];
}

const defaultTemplates: AlertTemplate[] = [
  {
    key: "low_balance",
    name: "Saldo Baixo",
    icon: <AlertTriangle className="h-5 w-5 text-warning" />,
    description: "Enviado quando o saldo cai abaixo do limite configurado",
    template: `⚠️ *Alerta de Saldo Baixo*

Conta: {{account_name}}
Plataforma: {{platform}}
Saldo atual: R$ {{balance}}
Limite configurado: {{threshold}}%

O saldo desta conta está abaixo do limite de segurança. Considere fazer uma recarga.`,
    variables: ["account_name", "platform", "balance", "threshold"],
  },
  {
    key: "critical_balance",
    name: "Saldo Crítico",
    icon: <AlertCircle className="h-5 w-5 text-destructive" />,
    description: "Alerta urgente quando o saldo está muito baixo",
    template: `🚨 *ALERTA CRÍTICO DE SALDO*

Conta: {{account_name}}
Plataforma: {{platform}}
Saldo atual: R$ {{balance}}

⚠️ ATENÇÃO: O saldo está em nível crítico (abaixo de {{threshold}}%). 
As campanhas podem ser pausadas a qualquer momento.

Ação imediata necessária!`,
    variables: ["account_name", "platform", "balance", "threshold"],
  },
  {
    key: "new_deposit",
    name: "Novo Depósito",
    icon: <DollarSign className="h-5 w-5 text-success" />,
    description: "Notificação quando um novo crédito é detectado",
    template: `✅ *Novo Depósito Detectado*

Conta: {{account_name}}
Plataforma: {{platform}}
Saldo anterior: R$ {{previous_balance}}
Saldo atual: R$ {{new_balance}}
Valor adicionado: R$ {{deposit_amount}}

O crédito foi adicionado com sucesso.`,
    variables: ["account_name", "platform", "previous_balance", "new_balance", "deposit_amount"],
  },
  {
    key: "projection",
    name: "Projeção de Esgotamento",
    icon: <TrendingDown className="h-5 w-5 text-warning" />,
    description: "Alerta quando o saldo vai acabar em X dias",
    template: `📊 *Projeção de Esgotamento de Saldo*

Conta: {{account_name}}
Plataforma: {{platform}}
Saldo atual: R$ {{balance}}
Gasto médio diário: R$ {{daily_spend}}

⏳ Previsão: O saldo será esgotado em aproximadamente *{{days_remaining}} dias*.

Recomendamos planejar uma recarga para evitar interrupções.`,
    variables: ["account_name", "platform", "balance", "daily_spend", "days_remaining"],
  },
];

export const AlertSettingsSection = () => {
  const [contacts, setContacts] = useState<AlertContact[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [settings, setSettings] = useState<AlertSetting | null>(null);
  const [selectedContact, setSelectedContact] = useState<string>("");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [templates, setTemplates] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (selectedContact) {
      fetchSettings();
    }
  }, [selectedContact, selectedBrand]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [contactsRes, brandsRes] = await Promise.all([
        supabase.from("alert_contacts").select("id, name").eq("is_active", true).order("name"),
        supabase.from("marcas").select("id, name").order("name"),
      ]);

      if (contactsRes.data) setContacts(contactsRes.data);
      if (brandsRes.data) setBrands(brandsRes.data);

      // Initialize templates
      const initialTemplates: Record<string, string> = {};
      defaultTemplates.forEach((t) => {
        initialTemplates[t.key] = t.template;
      });
      setTemplates(initialTemplates);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const query = supabase
        .from("alert_settings")
        .select("*")
        .eq("contact_id", selectedContact);

      if (selectedBrand === "all") {
        query.is("marca_id", null);
      } else {
        query.eq("marca_id", selectedBrand);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
      } else {
        // Default settings
        setSettings({
          id: "",
          marca_id: selectedBrand === "all" ? null : selectedBrand,
          contact_id: selectedContact,
          alert_low_balance: true,
          alert_critical_balance: true,
          alert_new_deposit: true,
          alert_projection: true,
          low_balance_threshold: 20,
          critical_balance_threshold: 10,
          projection_days: 7,
        });
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    }
  };

  const handleSaveSettings = async () => {
    if (!selectedContact || !settings) {
      toast.error("Selecione um contato");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        contact_id: selectedContact,
        marca_id: selectedBrand === "all" ? null : selectedBrand,
        alert_low_balance: settings.alert_low_balance,
        alert_critical_balance: settings.alert_critical_balance,
        alert_new_deposit: settings.alert_new_deposit,
        alert_projection: settings.alert_projection,
        low_balance_threshold: settings.low_balance_threshold,
        critical_balance_threshold: settings.critical_balance_threshold,
        projection_days: settings.projection_days,
      };

      if (settings.id) {
        const { error } = await supabase
          .from("alert_settings")
          .update(payload)
          .eq("id", settings.id);

        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("alert_settings")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        if (data) setSettings(data);
      }

      toast.success("Configurações salvas com sucesso");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Configuração de Alertas</CardTitle>
          <CardDescription>Carregando...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Configuração de Alertas
          </CardTitle>
          <CardDescription>
            Defina os limites e tipos de alertas para cada contato
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Contact and Brand Selection */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Contato</Label>
              <Select value={selectedContact} onValueChange={setSelectedContact}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um contato" />
                </SelectTrigger>
                <SelectContent>
                  {contacts.map((contact) => (
                    <SelectItem key={contact.id} value={contact.id}>
                      {contact.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Marca (opcional)</Label>
              <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as marcas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as marcas</SelectItem>
                  {brands.map((brand) => (
                    <SelectItem key={brand.id} value={brand.id}>
                      {brand.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedContact && settings && (
            <>
              {/* Alert Types */}
              <div className="space-y-4">
                <h3 className="font-medium">Tipos de Alerta</h3>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className="h-5 w-5 text-warning" />
                      <div>
                        <p className="font-medium">Saldo Baixo</p>
                        <p className="text-sm text-muted-foreground">
                          Quando saldo cai abaixo de {settings.low_balance_threshold}%
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.alert_low_balance}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => prev ? { ...prev, alert_low_balance: checked } : prev)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="h-5 w-5 text-destructive" />
                      <div>
                        <p className="font-medium">Saldo Crítico</p>
                        <p className="text-sm text-muted-foreground">
                          Quando saldo cai abaixo de {settings.critical_balance_threshold}%
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.alert_critical_balance}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => prev ? { ...prev, alert_critical_balance: checked } : prev)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <DollarSign className="h-5 w-5 text-success" />
                      <div>
                        <p className="font-medium">Novo Depósito</p>
                        <p className="text-sm text-muted-foreground">
                          Quando novo crédito é detectado
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.alert_new_deposit}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => prev ? { ...prev, alert_new_deposit: checked } : prev)
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center gap-3">
                      <TrendingDown className="h-5 w-5 text-warning" />
                      <div>
                        <p className="font-medium">Projeção de Esgotamento</p>
                        <p className="text-sm text-muted-foreground">
                          Quando saldo vai acabar em {settings.projection_days} dias
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.alert_projection}
                      onCheckedChange={(checked) =>
                        setSettings((prev) => prev ? { ...prev, alert_projection: checked } : prev)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Thresholds */}
              <div className="space-y-4">
                <h3 className="font-medium">Limites</h3>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Limite Saldo Baixo (%)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      value={settings.low_balance_threshold}
                      onChange={(e) =>
                        setSettings((prev) =>
                          prev ? { ...prev, low_balance_threshold: parseInt(e.target.value) || 20 } : prev
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Limite Saldo Crítico (%)</Label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={settings.critical_balance_threshold}
                      onChange={(e) =>
                        setSettings((prev) =>
                          prev ? { ...prev, critical_balance_threshold: parseInt(e.target.value) || 10 } : prev
                        )
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Dias para Projeção</Label>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      value={settings.projection_days}
                      onChange={(e) =>
                        setSettings((prev) =>
                          prev ? { ...prev, projection_days: parseInt(e.target.value) || 7 } : prev
                        )
                      }
                    />
                  </div>
                </div>
              </div>

              <Button onClick={handleSaveSettings} disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </>
          )}

          {!selectedContact && (
            <p className="text-center py-8 text-muted-foreground">
              Selecione um contato para configurar os alertas
            </p>
          )}
        </CardContent>
      </Card>

      {/* Message Templates */}
      <Card>
        <CardHeader>
          <CardTitle>Modelos de Mensagem</CardTitle>
          <CardDescription>
            Visualize os textos que serão enviados em cada tipo de alerta
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {defaultTemplates.map((template) => (
            <div key={template.key} className="space-y-2">
              <div className="flex items-center gap-2">
                {template.icon}
                <Label className="text-base">{template.name}</Label>
              </div>
              <p className="text-sm text-muted-foreground">{template.description}</p>
              <Textarea
                value={templates[template.key] || template.template}
                onChange={(e) =>
                  setTemplates((prev) => ({ ...prev, [template.key]: e.target.value }))
                }
                rows={8}
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Variáveis disponíveis: {template.variables.map((v) => `{{${v}}}`).join(", ")}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
};
