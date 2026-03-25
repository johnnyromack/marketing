import { AppLayout } from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ExternalLink, Copy, CheckCircle2, AlertCircle, ArrowRight, Key, Shield, Clock, Settings } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { MetaIcon, GoogleAdsIcon, TikTokIcon } from "@/components/icons/PlatformIcons";
import { Link, useLocation } from "react-router-dom";

const CopyButton = ({ text }: { text: string }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success("Copiado para a area de transferencia");
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <Button variant="ghost" size="icon" onClick={handleCopy} className="h-6 w-6">
      {copied ? <CheckCircle2 className="h-3 w-3 text-success" /> : <Copy className="h-3 w-3" />}
    </Button>
  );
};

const CodeBlock = ({ children, copyText }: { children: string; copyText?: string }) => (
  <div className="relative group">
    <pre className="bg-muted p-3 rounded-lg text-xs font-mono overflow-x-auto">
      <code>{children}</code>
    </pre>
    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <CopyButton text={copyText || children} />
    </div>
  </div>
);

const StepCard = ({ number, title, children }: { number: number; title: string; children: React.ReactNode }) => (
  <div className="flex gap-4">
    <div className="flex-shrink-0">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-sm">{number}</div>
    </div>
    <div className="flex-1 space-y-2">
      <h4 className="font-semibold">{title}</h4>
      <div className="text-sm text-muted-foreground space-y-2">{children}</div>
    </div>
  </div>
);

const MetaDocsContent = () => (
  <div className="space-y-8">
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-500/10"><MetaIcon size={24} /></div>
          <div>
            <CardTitle>Meta Ads (Facebook/Instagram)</CardTitle>
            <CardDescription>Integracao com a Marketing API do Meta para Facebook e Instagram Ads</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-muted-foreground" /><span>Tempo estimado: 15-30 min</span></div>
          <div className="flex items-center gap-2 text-sm"><Shield className="h-4 w-4 text-muted-foreground" /><span>Permissoes: ads_read</span></div>
          <div className="flex items-center gap-2 text-sm"><Key className="h-4 w-4 text-muted-foreground" /><span>2 credenciais necessarias</span></div>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle className="text-lg">Pre-requisitos</CardTitle></CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-success mt-0.5" /><span>Conta de desenvolvedor Meta (developers.facebook.com)</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-success mt-0.5" /><span>Acesso de administrador a conta de anuncios</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-success mt-0.5" /><span>Aplicativo criado no Meta for Developers</span></li>
        </ul>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle className="text-lg">Passo a Passo</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <StepCard number={1} title="Acesse o Meta for Developers">
          <p>Va para <a href="https://developers.facebook.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">developers.facebook.com <ExternalLink className="h-3 w-3" /></a> e faca login com sua conta do Facebook.</p>
        </StepCard>
        <StepCard number={2} title="Crie ou selecione um App">
          <p>No painel de desenvolvedores, clique em "Meus Apps" e depois em "Criar App".</p>
          <p>Selecione o tipo "Negocios" e preencha as informacoes basicas.</p>
        </StepCard>
        <StepCard number={3} title="Adicione o produto Marketing API">
          <p>No seu app, va em "Adicionar Produtos" e encontre "Marketing API".</p>
          <p>Clique em "Configurar" para adicionar ao seu app.</p>
        </StepCard>
        <StepCard number={4} title="Obtenha o Ad Account ID">
          <p>Acesse o <a href="https://business.facebook.com/settings" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Gerenciador de Negocios <ExternalLink className="h-3 w-3" /></a>.</p>
          <p>Va em Configuracoes - Contas de Anuncios e copie o ID da conta (formato: act_XXXXXXXXX).</p>
          <CodeBlock>act_254700332055421</CodeBlock>
        </StepCard>
        <StepCard number={5} title="Gere o Access Token">
          <p>Acesse o <a href="https://developers.facebook.com/tools/explorer" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Graph API Explorer <ExternalLink className="h-3 w-3" /></a>.</p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>Selecione seu App no dropdown</li>
            <li>Clique em "Gerar Token de Acesso"</li>
            <li>Selecione as permissoes: <Badge variant="secondary">ads_read</Badge> e <Badge variant="secondary">ads_management</Badge></li>
            <li>Clique em "Gerar Token de Acesso"</li>
          </ol>
        </StepCard>
        <StepCard number={6} title="Estenda o Token (Recomendado)">
          <p>Tokens gerados no Explorer expiram em 1-2 horas. Para um token de longa duracao:</p>
          <ol className="list-decimal list-inside space-y-1 mt-2">
            <li>No seu App, va em Configuracoes - Basico</li>
            <li>Copie o App ID e App Secret</li>
            <li>Use o <a href="https://developers.facebook.com/tools/accesstoken" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Depurador de Token <ExternalLink className="h-3 w-3" /></a></li>
            <li>Clique em "Estender Token de Acesso"</li>
          </ol>
          <div className="mt-2 p-3 bg-warning/10 border border-warning/20 rounded-lg">
            <p className="text-warning text-sm flex items-start gap-2">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              Tokens de longa duracao duram ~60 dias. Configure um lembrete para renovar.
            </p>
          </div>
        </StepCard>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle className="text-lg">Perguntas Frequentes</CardTitle></CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1"><AccordionTrigger>O que e o formato act_ do Account ID?</AccordionTrigger><AccordionContent>O prefixo "act_" indica que e uma conta de anuncios (Ad Account). E obrigatorio incluir este prefixo ao fazer chamadas a API.</AccordionContent></AccordionItem>
          <AccordionItem value="item-2"><AccordionTrigger>Meu token expirou, o que fazer?</AccordionTrigger><AccordionContent>Gere um novo token seguindo o passo 5 e estenda-o conforme o passo 6. Atualize a credencial na pagina de Credenciais.</AccordionContent></AccordionItem>
          <AccordionItem value="item-3"><AccordionTrigger>Recebo erro de permissao, como resolver?</AccordionTrigger><AccordionContent>Verifique se o token possui as permissoes ads_read e ads_management. Tambem confirme que voce tem acesso de administrador a conta de anuncios.</AccordionContent></AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  </div>
);

const GoogleDocsContent = () => (
  <div className="space-y-8">
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-yellow-500/10"><GoogleAdsIcon size={24} /></div>
          <div>
            <CardTitle>Google Ads</CardTitle>
            <CardDescription>Integracao com a Google Ads API v20 para sincronizacao de campanhas e metricas</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-muted-foreground" /><span>Tempo estimado: 30-60 min</span></div>
          <div className="flex items-center gap-2 text-sm"><Shield className="h-4 w-4 text-muted-foreground" /><span>OAuth 2.0 necessario</span></div>
          <div className="flex items-center gap-2 text-sm"><Key className="h-4 w-4 text-muted-foreground" /><span>5 credenciais necessarias</span></div>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle className="text-lg">Pre-requisitos</CardTitle></CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-success mt-0.5" /><span>Conta Google Ads (de preferencia MCC - Manager Account)</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-success mt-0.5" /><span>Projeto no Google Cloud Console</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-success mt-0.5" /><span>Developer Token aprovado (pode demorar alguns dias)</span></li>
        </ul>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle className="text-lg">Passo a Passo</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <StepCard number={1} title="Acesse o Google Ads">
          <p>Va para <a href="https://ads.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">ads.google.com <ExternalLink className="h-3 w-3" /></a> e faca login.</p>
        </StepCard>
        <StepCard number={2} title="Obtenha o Developer Token">
          <p>No API Center, voce encontrara seu Developer Token.</p>
        </StepCard>
        <StepCard number={3} title="Obtenha o Customer ID (MCC)">
          <p>Seu Customer ID esta no canto superior direito do Google Ads (formato: 123-456-7890).</p>
          <CodeBlock>123-456-7890</CodeBlock>
        </StepCard>
        <StepCard number={4} title="Configure OAuth no Google Cloud">
          <p>Acesse o <a href="https://console.cloud.google.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">Google Cloud Console <ExternalLink className="h-3 w-3" /></a>.</p>
        </StepCard>
        <StepCard number={5} title="Crie Credenciais OAuth 2.0">
          <p>Em "APIs & Services" - "Credentials", crie as credenciais OAuth Client ID.</p>
        </StepCard>
        <StepCard number={6} title="Gere o Refresh Token">
          <p>Use o <a href="https://developers.google.com/oauthplayground" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">OAuth 2.0 Playground <ExternalLink className="h-3 w-3" /></a>.</p>
        </StepCard>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle className="text-lg">Perguntas Frequentes</CardTitle></CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1"><AccordionTrigger>O que e uma conta MCC?</AccordionTrigger><AccordionContent>MCC (My Client Center) ou Manager Account e uma conta que permite gerenciar multiplas contas Google Ads.</AccordionContent></AccordionItem>
          <AccordionItem value="item-2"><AccordionTrigger>Por que preciso do login-customer-id?</AccordionTrigger><AccordionContent>Para contas MCC, o cabecalho login-customer-id e obrigatorio em todas as requisicoes a API.</AccordionContent></AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  </div>
);

const TikTokDocsContent = () => (
  <div className="space-y-8">
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-pink-500/10"><TikTokIcon size={24} /></div>
          <div>
            <CardTitle>TikTok Ads</CardTitle>
            <CardDescription>Integracao com a TikTok Marketing API para campanhas e metricas</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4 text-muted-foreground" /><span>Tempo estimado: 20-40 min</span></div>
          <div className="flex items-center gap-2 text-sm"><Shield className="h-4 w-4 text-muted-foreground" /><span>Aprovacao necessaria</span></div>
          <div className="flex items-center gap-2 text-sm"><Key className="h-4 w-4 text-muted-foreground" /><span>4 credenciais necessarias</span></div>
        </div>
      </CardContent>
    </Card>
    <Card className="border-warning/20 bg-warning/5">
      <CardContent className="flex items-start gap-4 py-4">
        <div className="p-2 rounded-full bg-warning/10"><Clock className="h-5 w-5 text-warning" /></div>
        <div className="space-y-1">
          <p className="font-medium">Aprovacao em andamento</p>
          <p className="text-sm text-muted-foreground">A integracao com TikTok requer aprovacao no Developer Portal. Tempo estimado: 1-10 dias uteis.</p>
        </div>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle className="text-lg">Pre-requisitos</CardTitle></CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-success mt-0.5" /><span>Conta TikTok For Business</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-success mt-0.5" /><span>Conta no TikTok Developer Portal</span></li>
          <li className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-success mt-0.5" /><span>Aplicativo aprovado no Developer Portal</span></li>
        </ul>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle className="text-lg">Passo a Passo</CardTitle></CardHeader>
      <CardContent className="space-y-6">
        <StepCard number={1} title="Crie uma conta de desenvolvedor">
          <p>Acesse o <a href="https://business-api.tiktok.com/portal/apps" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">TikTok for Developers <ExternalLink className="h-3 w-3" /></a>.</p>
        </StepCard>
        <StepCard number={2} title="Crie um novo aplicativo">
          <p>No portal de desenvolvedores, clique em "Create an App".</p>
        </StepCard>
        <StepCard number={3} title="Solicite as permissoes necessarias">
          <p>No seu app, va em "Manage" - "Permissions" e solicite Ads Management e Reporting.</p>
        </StepCard>
        <StepCard number={4} title="Aguarde a aprovacao">
          <p>O TikTok revisara seu aplicativo. Standard Access: 1-3 dias uteis.</p>
        </StepCard>
        <StepCard number={5} title="Copie o App ID e App Secret">
          <p>No seu aplicativo aprovado, copie o App ID e App Secret.</p>
        </StepCard>
        <StepCard number={6} title="Obtenha o Advertiser ID">
          <p>Acesse o <a href="https://ads.tiktok.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">TikTok Ads Manager <ExternalLink className="h-3 w-3" /></a>.</p>
        </StepCard>
        <StepCard number={7} title="Gere o Access Token">
          <p>Apos aprovacao, no seu app va em "Manage" - "Authorization".</p>
        </StepCard>
      </CardContent>
    </Card>
    <Card>
      <CardHeader><CardTitle className="text-lg">Perguntas Frequentes</CardTitle></CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="item-1"><AccordionTrigger>Qual a diferenca entre Standard e Advanced Access?</AccordionTrigger><AccordionContent>Standard Access permite operacoes basicas de leitura. Advanced Access permite escrita e operacoes mais avancadas.</AccordionContent></AccordionItem>
          <AccordionItem value="item-2"><AccordionTrigger>Meu app foi rejeitado, o que fazer?</AccordionTrigger><AccordionContent>Verifique os motivos da rejeicao no e-mail recebido. Ajuste e reenvie para revisao.</AccordionContent></AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  </div>
);

const Documentacao = () => {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("meta");

  useEffect(() => {
    if (location.hash) {
      const hash = location.hash.slice(1);
      if (["meta", "google", "tiktok"].includes(hash)) {
        setActiveTab(hash);
      }
    }
  }, [location.hash]);

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Documentacao</h1>
            <p className="text-muted-foreground">Guias passo a passo para integracao com cada plataforma de anuncios</p>
          </div>
          <Button asChild>
            <Link to="/credenciais" className="gap-2">
              <Settings className="h-4 w-4" />
              Configurar Credenciais
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="meta" className="gap-2"><MetaIcon size={16} />Meta Ads</TabsTrigger>
            <TabsTrigger value="google" className="gap-2"><GoogleAdsIcon size={16} />Google Ads</TabsTrigger>
            <TabsTrigger value="tiktok" className="gap-2"><TikTokIcon size={16} />TikTok Ads</TabsTrigger>
          </TabsList>
          <TabsContent value="meta" className="mt-0"><MetaDocsContent /></TabsContent>
          <TabsContent value="google" className="mt-0"><GoogleDocsContent /></TabsContent>
          <TabsContent value="tiktok" className="mt-0"><TikTokDocsContent /></TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Documentacao;
