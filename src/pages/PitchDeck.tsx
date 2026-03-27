import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, FileDown, Sparkles, CheckCircle2, XCircle, TrendingUp, Zap, Shield, Clock, Users, DollarSign, Globe, Target } from "lucide-react";
import RomackLogo from "@/assets/RomackVision.png";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Area,
  AreaChart,
} from "recharts";

// ─── Slide types for intelligent layout detection ─────────────────────────────
type SlideType =
  | "hero"
  | "problem"
  | "solution"
  | "features"
  | "market"
  | "audience"
  | "differentials"
  | "competition"
  | "pricing"
  | "projections"
  | "traction"
  | "funding";

interface SlideData {
  type: SlideType;
  title: string;
  subtitle: string;
}

const slides: SlideData[] = [
  { type: "hero",         title: "Romack Vision",       subtitle: "A Plataforma que Elimina o Desperdício Bilionário em Marketing" },
  { type: "problem",      title: "O Problema",          subtitle: "R$ 1,5 Bilhão Desperdiçados por Ano" },
  { type: "solution",     title: "A Solução",           subtitle: "Controle Total em Tempo Real" },
  { type: "features",     title: "Funcionalidades",     subtitle: "Recursos que Transformam" },
  { type: "market",       title: "Mercado",             subtitle: "Oceano Azul de R$ 5 Bilhões" },
  { type: "audience",     title: "Público-Alvo",        subtitle: "Estratégia de Expansão em 2 Fases" },
  { type: "differentials",title: "Diferenciais",        subtitle: "Por que Romack Vision?" },
  { type: "competition",  title: "Competição",          subtitle: "Análise Competitiva" },
  { type: "pricing",      title: "Modelo de Negócio",   subtitle: "Receita Recorrente Previsível" },
  { type: "projections",  title: "Projeções",           subtitle: "Caminho para R$ 6,5M ARR" },
  { type: "traction",     title: "Tração & Roadmap",    subtitle: "O Timing é Perfeito" },
  { type: "funding",      title: "Captação",            subtitle: "Rodada Seed: R$ 3M" },
];

// ─── Chart data ───────────────────────────────────────────────────────────────
const projectionData = [
  { ano: "Ano 1", arr: 150,  clientes: 5 },
  { ano: "Ano 2", arr: 540,  clientes: 15 },
  { ano: "Ano 3", arr: 1470, clientes: 35 },
  { ano: "Ano 5", arr: 6500, clientes: 120 },
];

// ─── Slide renderers ──────────────────────────────────────────────────────────

function HeroSlide() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      <div className="relative z-10 text-center space-y-8 max-w-3xl mx-auto px-8">
        <img src={RomackLogo} alt="Romack Vision" className="h-20 w-auto mx-auto drop-shadow-lg" />
        <div>
          <h1 className="text-5xl font-black tracking-tight mb-4 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
            Romack Vision
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            A Plataforma que Elimina o Desperdício Bilionário em Marketing
          </p>
        </div>
        <div className="flex items-center justify-center gap-8 pt-4">
          {[
            { label: "Plataforma SaaS", icon: Globe },
            { label: "Visão 360°", icon: Target },
            { label: "Multi-marca", icon: Users },
          ].map(({ label, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                <Icon className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProblemSlide() {
  const problems = [
    { text: "Planilhas fragmentadas = decisões cegas", impact: "Semanas de atraso" },
    { text: "Aprovações por email = burocracia", impact: "Oportunidades perdidas" },
    { text: "Zero rastreabilidade = auditoria impossível", impact: "Risco de compliance" },
    { text: "Dados espalhados = visão distorcida", impact: "ROI invisível" },
  ];
  return (
    <div className="flex-1 flex flex-col justify-center gap-6 max-w-3xl mx-auto w-full px-4">
      <div className="text-center mb-2">
        <div className="inline-flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
          <XCircle className="w-4 h-4" /> R$ 1,5 Bilhão Desperdiçados por Ano
        </div>
        <p className="text-muted-foreground">CMOs demitidos, campanhas fracassadas e milhões evaporando.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {problems.map(({ text, impact }) => (
          <div key={text} className="flex gap-4 p-5 rounded-xl border border-destructive/20 bg-destructive/5 hover:bg-destructive/10 transition-colors">
            <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-foreground text-sm">{text}</p>
              <p className="text-xs text-destructive mt-1 font-semibold">{impact}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center p-4 bg-muted/50 rounded-xl border">
        <p className="text-sm font-medium text-muted-foreground">
          O mercado de gestão de marketing é fragmentado. <span className="text-foreground font-bold">Quem resolver isso primeiro, domina.</span>
        </p>
      </div>
    </div>
  );
}

function SolutionSlide() {
  const solutions = [
    { text: "Visão 360° instantânea de toda a verba", detail: "Dashboards em tempo real" },
    { text: "Aprovações em minutos, não semanas", detail: "Fluxo configurável por alçada" },
    { text: "Auditoria e compliance automáticos", detail: "Logs completos e rastreáveis" },
    { text: "Gestão multi-marca unificada", detail: "Uma única plataforma" },
  ];
  return (
    <div className="flex-1 flex flex-col justify-center gap-6 max-w-3xl mx-auto w-full px-4">
      <div className="text-center mb-2">
        <div className="inline-flex items-center gap-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
          <CheckCircle2 className="w-4 h-4" /> Controle Total em Tempo Real
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {solutions.map(({ text, detail }) => (
          <div key={text} className="flex gap-4 p-5 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors">
            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-foreground text-sm">{text}</p>
              <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">{detail}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center p-4 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
          Uma única plataforma para governar todo o marketing
        </p>
      </div>
    </div>
  );
}

function FeaturesSlide() {
  const features = [
    { icon: TrendingUp, title: "Dashboards em Tempo Real", desc: "KPIs estratégicos sempre atualizados" },
    { icon: CheckCircle2, title: "Fluxo de Aprovação", desc: "Configurável por alçada e hierarquia" },
    { icon: Shield, title: "Auditoria Completa", desc: "Logs automáticos para compliance" },
    { icon: Target, title: "Orçado vs Realizado", desc: "Comparativo automático instantâneo" },
    { icon: Users, title: "Gestão de Fornecedores", desc: "Cadastro e contratos integrados" },
    { icon: Zap, title: "Alertas Inteligentes", desc: "Notificações por desvio de verba" },
  ];
  return (
    <div className="flex-1 flex flex-col justify-center gap-4 max-w-3xl mx-auto w-full px-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {features.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="p-4 rounded-xl border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all group">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
              <Icon className="w-5 h-5 text-primary" />
            </div>
            <p className="font-semibold text-sm text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground mt-1">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function MarketSlide() {
  const metrics = [
    { label: "TAM", value: "R$ 5B+", desc: "Empresas com verba estruturada", color: "from-blue-500 to-blue-600" },
    { label: "SAM", value: "R$ 800M", desc: "Multi-marca e multi-unidade", color: "from-primary to-primary/80" },
    { label: "SOM", value: "R$ 80M", desc: "Meta 5 anos", color: "from-emerald-500 to-emerald-600" },
  ];
  return (
    <div className="flex-1 flex flex-col justify-center gap-8 max-w-3xl mx-auto w-full px-4">
      <div className="grid grid-cols-3 gap-4">
        {metrics.map(({ label, value, desc, color }) => (
          <div key={label} className="text-center p-6 rounded-2xl border bg-gradient-to-br from-card to-muted/30 hover:shadow-lg transition-shadow">
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${color} mb-3`}>
              <span className="text-white font-bold text-sm">{label}</span>
            </div>
            <p className="text-2xl font-black text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{desc}</p>
          </div>
        ))}
      </div>
      <div className="p-5 rounded-xl bg-primary/5 border border-primary/20 text-center">
        <p className="font-semibold text-foreground">🎯 Go-to-Market</p>
        <p className="text-sm text-muted-foreground mt-1">Médias empresas → escala para enterprise</p>
      </div>
    </div>
  );
}

function AudienceSlide() {
  return (
    <div className="flex-1 flex flex-col justify-center gap-6 max-w-3xl mx-auto w-full px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl border-2 border-primary/30 bg-primary/5">
          <div className="inline-flex items-center gap-2 bg-primary/20 text-primary px-3 py-1 rounded-full text-xs font-bold mb-4">
            FASE 1
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Médias Empresas</h3>
          <p className="text-sm text-muted-foreground mb-4">R$ 500K–2M/ano em marketing</p>
          <ul className="space-y-2">
            {["Implementação rápida", "ROI imediato", "Menor ciclo de venda"].map(item => (
              <li key={item} className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div className="p-6 rounded-2xl border-2 border-muted bg-muted/20">
          <div className="inline-flex items-center gap-2 bg-muted text-muted-foreground px-3 py-1 rounded-full text-xs font-bold mb-4">
            FASE 2
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">Grandes Empresas</h3>
          <p className="text-sm text-muted-foreground mb-4">R$ 2M+/ano em marketing</p>
          <ul className="space-y-2">
            {["Contratos maiores", "APIs e integrações custom", "Expansão LATAM"].map(item => (
              <li key={item} className="flex items-center gap-2 text-sm">
                <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <p className="text-center text-sm text-muted-foreground">
        Todos os setores com verba de marketing a partir de <span className="font-bold text-foreground">R$ 500K/ano</span>
      </p>
    </div>
  );
}

function DifferentialsSlide() {
  const items = [
    { icon: Target, title: "100% especializado", desc: "Gestão de marketing, sem distrações" },
    { icon: Clock, title: "1 semana de setup", desc: "Implementação mais rápida do mercado" },
    { icon: Users, title: "Usuários ilimitados", desc: "Em todos os planos, sem surpresas" },
    { icon: Shield, title: "Governança nativa", desc: "Compliance incluído de fábrica" },
  ];
  return (
    <div className="flex-1 flex flex-col justify-center gap-6 max-w-3xl mx-auto w-full px-4">
      <div className="grid grid-cols-2 gap-5">
        {items.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex gap-4 p-5 rounded-2xl border bg-card hover:border-primary/40 hover:shadow-md transition-all">
            <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center shrink-0">
              <Icon className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-bold text-foreground">{title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CompetitionSlide() {
  const comparisons = [
    { competitor: "Planilhas", us: ["Automação completa", "Dashboards em tempo real", "Auditoria automática"], them: ["Manual e lento", "Sem visibilidade", "Impossível de auditar"] },
    { competitor: "ERPs", us: ["Especializado em marketing", "Setup em 1 semana", "Custo previsível"], them: ["Genérico e complexo", "Meses de implementação", "Custo por usuário"] },
  ];
  return (
    <div className="flex-1 flex flex-col justify-center gap-5 max-w-3xl mx-auto w-full px-4">
      {comparisons.map(({ competitor, us, them }) => (
        <div key={competitor} className="rounded-xl border overflow-hidden">
          <div className="bg-muted/50 px-5 py-3 font-bold text-sm text-muted-foreground">
            vs {competitor}
          </div>
          <div className="grid grid-cols-2">
            <div className="p-4 border-r">
              <p className="text-xs font-bold text-destructive mb-2">{competitor}</p>
              {them.map(t => (
                <div key={t} className="flex items-center gap-2 text-sm text-muted-foreground mb-1.5">
                  <XCircle className="w-3.5 h-3.5 text-destructive shrink-0" />{t}
                </div>
              ))}
            </div>
            <div className="p-4 bg-emerald-500/5">
              <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-2">Romack Vision</p>
              {us.map(u => (
                <div key={u} className="flex items-center gap-2 text-sm text-foreground mb-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />{u}
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}
      <p className="text-center text-sm font-semibold text-primary">
        Mercado fragmentado sem líder claro = oportunidade única
      </p>
    </div>
  );
}

function PricingSlide() {
  const plans = [
    { name: "Starter", price: "R$ 1.500", period: "/mês", highlight: false, features: ["1 módulo", "3 marcas", "Usuários ilimitados", "Suporte padrão"] },
    { name: "Business", price: "R$ 3.500", period: "/mês", highlight: true, features: ["2 módulos", "10 marcas", "IA incluída", "Suporte prioritário"] },
    { name: "Enterprise", price: "R$ 7.000+", period: "/mês", highlight: false, features: ["Completo", "Marcas ilimitadas", "IA própria + APIs", "Suporte dedicado"] },
  ];
  return (
    <div className="flex-1 flex flex-col justify-center gap-4 max-w-3xl mx-auto w-full px-4">
      <div className="grid grid-cols-3 gap-4">
        {plans.map(({ name, price, period, highlight, features }) => (
          <div key={name} className={`p-5 rounded-2xl border-2 relative ${highlight ? "border-primary bg-primary/5 shadow-lg" : "border-border bg-card"}`}>
            {highlight && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full">
                POPULAR
              </div>
            )}
            <p className="font-bold text-foreground mb-1">{name}</p>
            <div className="flex items-baseline gap-0.5 mb-4">
              <span className="text-2xl font-black text-foreground">{price}</span>
              <span className="text-xs text-muted-foreground">{period}</span>
            </div>
            <ul className="space-y-2">
              {features.map(f => (
                <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <div className={`w-1.5 h-1.5 rounded-full ${highlight ? "bg-primary" : "bg-muted-foreground"}`} />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="text-center p-3 bg-muted/50 rounded-xl border">
        <p className="text-sm text-muted-foreground">
          💼 Taxa de implantação: <span className="font-bold text-foreground">R$ 3.000</span> (setup e onboarding) &nbsp;•&nbsp;
          🔥 Usuários ilimitados em todos os planos
        </p>
      </div>
    </div>
  );
}

function ProjectionsSlide() {
  return (
    <div className="flex-1 flex flex-col justify-center gap-6 max-w-3xl mx-auto w-full px-4">
      <div className="grid grid-cols-4 gap-3">
        {projectionData.map(({ ano, arr, clientes }) => (
          <div key={ano} className="text-center p-3 rounded-xl border bg-card">
            <p className="text-xs text-muted-foreground font-medium">{ano}</p>
            <p className="text-xl font-black text-primary mt-1">R$ {arr < 1000 ? arr + "K" : (arr/1000).toFixed(1) + "M"}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{clientes} clientes</p>
          </div>
        ))}
      </div>
      <div className="h-48 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={projectionData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="arrGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="ano" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${v}K`} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
              formatter={(value: number) => [`R$ ${value < 1000 ? value + "K" : (value/1000).toFixed(1) + "M"}`, "ARR"]}
            />
            <Area type="monotone" dataKey="arr" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#arrGradient)" dot={{ r: 5, fill: "hsl(var(--primary))", strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function TractionSlide() {
  const items = [
    { status: "done", label: "MVP funcional e validado", icon: "✅" },
    { status: "active", label: "5 clientes piloto pagantes em captação", icon: "🎯" },
    { status: "next", label: "Integrações Meta/Google + Romack.AI", icon: "🔜" },
    { status: "future", label: "Expansão LATAM no horizonte", icon: "🔮" },
  ];
  const barData = [
    { etapa: "MVP", progresso: 100 },
    { etapa: "Pilotos", progresso: 60 },
    { etapa: "Integrações", progresso: 20 },
    { etapa: "LATAM", progresso: 5 },
  ];
  return (
    <div className="flex-1 flex flex-col justify-center gap-5 max-w-3xl mx-auto w-full px-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {items.map(({ label, icon, status }) => (
          <div key={label} className={`flex items-center gap-3 p-4 rounded-xl border ${status === "done" ? "border-emerald-500/30 bg-emerald-500/5" : status === "active" ? "border-primary/30 bg-primary/5" : "border-border bg-muted/20"}`}>
            <span className="text-xl">{icon}</span>
            <p className={`text-sm font-medium ${status === "done" ? "text-emerald-600 dark:text-emerald-400" : status === "active" ? "text-primary" : "text-muted-foreground"}`}>{label}</p>
          </div>
        ))}
      </div>
      <div className="h-32 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 20, left: 60, bottom: 0 }}>
            <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
            <YAxis type="category" dataKey="etapa" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} formatter={(v: number) => [`${v}%`, "Progresso"]} />
            <Bar dataKey="progresso" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function FundingSlide() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-8 max-w-3xl mx-auto w-full px-4 text-center">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl scale-150" />
        <div className="relative inline-flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-primary to-primary/60 shadow-2xl">
          <DollarSign className="w-14 h-14 text-primary-foreground" />
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-widest mb-2">Rodada Seed</p>
        <h2 className="text-6xl font-black text-foreground">R$ 3M</h2>
      </div>
      <div className="grid grid-cols-3 gap-4 w-full">
        {[
          { label: "Produto & IA", value: "40%" },
          { label: "Vendas", value: "35%" },
          { label: "Expansão", value: "25%" },
        ].map(({ label, value }) => (
          <div key={label} className="p-4 rounded-xl border bg-card">
            <p className="text-2xl font-black text-primary">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>
      <div className="p-5 rounded-xl bg-primary/10 border border-primary/20 max-w-md">
        <p className="text-foreground font-bold">A oportunidade é agora. A solução está pronta.</p>
        <p className="text-sm text-muted-foreground mt-1">Desenvolver Romack.AI • Escala nacional • Expansão LATAM</p>
      </div>
    </div>
  );
}

// ─── Slide title bar ──────────────────────────────────────────────────────────
function SlideHeader({ slide }: { slide: SlideData }) {
  if (slide.type === "hero") return null;
  return (
    <div className="text-center pb-4 border-b mb-6">
      <h2 className="text-2xl font-bold text-foreground">{slide.title}</h2>
      <p className="text-sm text-muted-foreground mt-1">{slide.subtitle}</p>
    </div>
  );
}

// ─── Render switch ────────────────────────────────────────────────────────────
function renderSlide(type: SlideType) {
  switch (type) {
    case "hero":         return <HeroSlide />;
    case "problem":      return <ProblemSlide />;
    case "solution":     return <SolutionSlide />;
    case "features":     return <FeaturesSlide />;
    case "market":       return <MarketSlide />;
    case "audience":     return <AudienceSlide />;
    case "differentials":return <DifferentialsSlide />;
    case "competition":  return <CompetitionSlide />;
    case "pricing":      return <PricingSlide />;
    case "projections":  return <ProjectionsSlide />;
    case "traction":     return <TractionSlide />;
    case "funding":      return <FundingSlide />;
  }
}

// ─── Main component ───────────────────────────────────────────────────────────
const PitchDeck = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  const goToSlide = (index: number) => setCurrentSlide(index);

  const handlePrint = () => {
    toast.info("Use Ctrl+P ou Cmd+P para salvar como PDF");
    window.print();
  };

  const slide = slides[currentSlide];

  return (
    <div className="min-h-screen bg-background flex flex-col print:bg-white">
      {/* Top bar */}
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 print:hidden">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={RomackLogo} alt="Romack Vision" className="h-7 w-auto" />
            <div className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs font-semibold ml-2">
              <Sparkles className="w-3 h-3" /> Pitch Deck
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground font-medium">{slide.title}</span>
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
              <FileDown className="w-4 h-4" /> Salvar PDF
            </Button>
            <div className="text-sm text-muted-foreground tabular-nums">{currentSlide + 1} / {slides.length}</div>
          </div>
        </div>
      </div>

      {/* Slide area */}
      <div className="flex-1 container mx-auto px-4 py-8 flex flex-col max-w-4xl">
        <div className="flex-1 flex flex-col bg-card rounded-2xl border shadow-sm overflow-hidden p-8">
          <SlideHeader slide={slide} />
          {renderSlide(slide.type)}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between print:hidden">
          <Button variant="outline" onClick={prevSlide} disabled={currentSlide === 0} className="gap-2">
            <ChevronLeft className="w-4 h-4" /> Anterior
          </Button>
          <div className="flex gap-1.5 flex-wrap justify-center max-w-md">
            {slides.map((s, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                title={s.title}
                className={`transition-all rounded-full ${
                  index === currentSlide
                    ? "w-6 h-2.5 bg-primary"
                    : "w-2.5 h-2.5 bg-muted hover:bg-muted-foreground/40"
                }`}
              />
            ))}
          </div>
          <Button onClick={nextSlide} disabled={currentSlide === slides.length - 1} className="gap-2">
            Próximo <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PitchDeck;
