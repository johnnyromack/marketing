import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { 
  ArrowRight, 
  Check, 
  X, 
  Zap, 
  Shield, 
  BarChart3, 
  Clock, 
  Eye, 
  FileCheck, 
  TrendingUp,
  Target,
  Sparkles,
  ChevronDown,
  Play,
  Star,
  Users,
  Building2,
  Award,
  Lock,
  Layers,
  Bot,
  Globe,
  Gauge,
  BadgeCheck,
  ArrowUpRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ThemeLogo } from "@/components/ThemeLogo";

gsap.registerPlugin(ScrollTrigger);

const LandingPage = () => {
  const navigate = useNavigate();
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const problemRef = useRef<HTMLDivElement>(null);
  const solutionRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const comparisonRef = useRef<HTMLDivElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero animations
      gsap.from(".hero-title", {
        y: 100,
        opacity: 0,
        duration: 1.2,
        ease: "power4.out",
      });

      gsap.from(".hero-subtitle", {
        y: 50,
        opacity: 0,
        duration: 1,
        delay: 0.3,
        ease: "power3.out",
      });

      gsap.from(".hero-cta", {
        y: 30,
        opacity: 0,
        duration: 0.8,
        delay: 0.6,
        ease: "power2.out",
      });

      gsap.from(".hero-visual", {
        scale: 0.8,
        opacity: 0,
        duration: 1.5,
        delay: 0.4,
        ease: "elastic.out(1, 0.5)",
      });

      gsap.from(".scroll-indicator", {
        y: -10,
        opacity: 0,
        duration: 1,
        delay: 1.5,
        ease: "power2.out",
      });

      // Floating animation for hero visual
      gsap.to(".hero-float", {
        y: -20,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });

      // Stats section
      gsap.from(".stat-card", {
        scrollTrigger: {
          trigger: statsRef.current,
          start: "top 80%",
        },
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
      });

      // Problem section with parallax
      gsap.from(".problem-title", {
        scrollTrigger: {
          trigger: problemRef.current,
          start: "top 80%",
        },
        x: -100,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });

      gsap.from(".problem-card", {
        scrollTrigger: {
          trigger: problemRef.current,
          start: "top 70%",
        },
        scale: 0.8,
        opacity: 0,
        duration: 0.6,
        stagger: 0.2,
        ease: "back.out(1.7)",
      });

      // Solution section
      gsap.from(".solution-badge", {
        scrollTrigger: {
          trigger: solutionRef.current,
          start: "top 80%",
        },
        scale: 0,
        rotation: -180,
        duration: 1,
        ease: "elastic.out(1, 0.5)",
      });

      gsap.from(".solution-title", {
        scrollTrigger: {
          trigger: solutionRef.current,
          start: "top 75%",
        },
        y: 50,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      });

      gsap.from(".solution-feature", {
        scrollTrigger: {
          trigger: solutionRef.current,
          start: "top 60%",
        },
        x: (i) => (i % 2 === 0 ? -50 : 50),
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
      });

      // Features section with horizontal scroll effect
      gsap.from(".feature-card", {
        scrollTrigger: {
          trigger: featuresRef.current,
          start: "top 70%",
        },
        y: 100,
        opacity: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
      });

      // Comparison table animation
      gsap.from(".comparison-header", {
        scrollTrigger: {
          trigger: comparisonRef.current,
          start: "top 80%",
        },
        y: -30,
        opacity: 0,
        duration: 0.8,
        ease: "power3.out",
      });

      gsap.from(".comparison-row", {
        scrollTrigger: {
          trigger: comparisonRef.current,
          start: "top 70%",
        },
        x: -50,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power3.out",
      });

      // Benefits cards
      gsap.from(".benefit-card", {
        scrollTrigger: {
          trigger: benefitsRef.current,
          start: "top 75%",
        },
        scale: 0.9,
        opacity: 0,
        duration: 0.6,
        stagger: 0.1,
        ease: "power3.out",
      });

      // Testimonials
      gsap.from(".testimonial-card", {
        scrollTrigger: {
          trigger: testimonialsRef.current,
          start: "top 75%",
        },
        y: 60,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
      });

      // Pricing cards
      gsap.from(".pricing-card", {
        scrollTrigger: {
          trigger: pricingRef.current,
          start: "top 75%",
        },
        y: 80,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "back.out(1.4)",
      });

      // Final CTA
      gsap.from(".final-cta", {
        scrollTrigger: {
          trigger: ctaRef.current,
          start: "top 80%",
        },
        scale: 0.9,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
      });

      // Parallax backgrounds
      gsap.to(".parallax-bg", {
        scrollTrigger: {
          trigger: "body",
          start: "top top",
          end: "bottom bottom",
          scrub: 1,
        },
        y: -200,
        ease: "none",
      });

    });

    return () => ctx.revert();
  }, []);

  const features = [
    { icon: Eye, title: "Visão 360°", desc: "Dashboards unificados com todos os canais de mídia em tempo real" },
    { icon: Clock, title: "Aprovações Ágeis", desc: "Workflow digital com aprovações em minutos, não dias" },
    { icon: BarChart3, title: "Analytics Avançado", desc: "KPIs, CPL, CAC e ROI calculados automaticamente" },
    { icon: Shield, title: "Compliance Total", desc: "Auditoria completa com logs de todas as ações" },
    { icon: Bot, title: "IA Integrada", desc: "Análises inteligentes e sugestões de otimização" },
    { icon: Layers, title: "Multi-Marca", desc: "Gerencie todas as suas marcas em um só lugar" },
    { icon: Globe, title: "Mídia On + Off", desc: "Digital e offline integrados na mesma plataforma" },
    { icon: FileCheck, title: "Orçamentos Dinâmicos", desc: "Controle total de verbas com alertas automáticos" },
  ];

  const problems = [
    { icon: TrendingUp, value: "R$ 1.5 Bi", label: "desperdiçados por ano em marketing mal gerenciado" },
    { icon: Clock, value: "40%", label: "do tempo gasto em planilhas e processos manuais" },
    { icon: Target, value: "60%", label: "das empresas não sabem o ROI real de suas campanhas" },
  ];

  const comparison = [
    { feature: "Dashboard unificado multicanal", romack: true, planilhas: false, erp: false },
    { feature: "Aprovações digitais com workflow", romack: true, planilhas: false, erp: true },
    { feature: "Cálculo automático de KPIs", romack: true, planilhas: false, erp: false },
    { feature: "Integração mídia on + off", romack: true, planilhas: false, erp: false },
    { feature: "IA para análises e insights", romack: true, planilhas: false, erp: false },
    { feature: "Gestão de eventos e brindes", romack: true, planilhas: true, erp: false },
    { feature: "Mapa de pontos de mídia", romack: true, planilhas: false, erp: false },
    { feature: "Logs de auditoria completos", romack: true, planilhas: false, erp: true },
    { feature: "Implantação em dias", romack: true, planilhas: true, erp: false },
    { feature: "Custo-benefício", romack: true, planilhas: true, erp: false },
  ];

  const testimonials = [
    {
      quote: "Reduzimos 30% do desperdício de verba no primeiro trimestre de uso.",
      author: "Maria Santos",
      role: "Diretora de Marketing",
      company: "Rede Educacional ABC",
      avatar: "MS"
    },
    {
      quote: "O tempo de aprovação de campanhas caiu de 5 dias para 4 horas.",
      author: "Carlos Oliveira",
      role: "CMO",
      company: "Grupo Educação+",
      avatar: "CO"
    },
    {
      quote: "Finalmente temos visibilidade real de onde está indo cada centavo.",
      author: "Ana Paula",
      role: "Head de Performance",
      company: "Instituto Educar",
      avatar: "AP"
    },
  ];

  const pricing = [
    {
      name: "Starter",
      price: "1.990",
      desc: "Para operações menores",
      features: ["Até 3 usuários", "1 marca", "Dashboards básicos", "Suporte por email"],
      highlighted: false
    },
    {
      name: "Business",
      price: "3.500",
      desc: "Para equipes em crescimento",
      features: ["Até 10 usuários", "3 marcas", "Dashboards avançados", "IA integrada", "Suporte prioritário"],
      highlighted: true
    },
    {
      name: "Enterprise",
      price: "7.000+",
      desc: "Para grandes operações",
      features: ["Usuários ilimitados", "Marcas ilimitadas", "API completa", "Onboarding dedicado", "SLA garantido"],
      highlighted: false
    },
  ];

  const benefits = [
    { icon: Gauge, title: "3x mais rápido", desc: "Aprovações e relatórios em tempo recorde" },
    { icon: TrendingUp, title: "30% economia", desc: "Redução média no desperdício de verba" },
    { icon: BadgeCheck, title: "100% compliance", desc: "Auditoria e governança completas" },
    { icon: Users, title: "Equipe feliz", desc: "Menos trabalho manual, mais estratégia" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="parallax-bg absolute -top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-3xl" />
        <div className="parallax-bg absolute top-1/2 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-secondary/20 to-transparent blur-3xl" />
        <div className="parallax-bg absolute bottom-0 right-1/4 w-[400px] h-[400px] rounded-full bg-gradient-to-tl from-accent/20 to-transparent blur-3xl" />
      </div>

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <ThemeLogo className="h-8" />
          <div className="hidden md:flex items-center gap-8">
            <a href="#recursos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Recursos</a>
            <a href="#comparativo" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Comparativo</a>
            <a href="#precos" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Preços</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/auth")}>Entrar</Button>
            <Button onClick={() => navigate("/auth")} className="gradient-brand">
              Começar Agora
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative min-h-screen flex items-center justify-center pt-16">
        <div className="container mx-auto px-4 py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="hero-title space-y-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Plataforma #1 em Gestão de Marketing</span>
                </div>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold leading-tight">
                  Elimine o{" "}
                  <span className="gradient-brand-text">Desperdício</span>{" "}
                  Bilionário na sua Verba
                </h1>
              </div>
              
              <p className="hero-subtitle text-xl text-muted-foreground max-w-xl">
                Centralize, automatize e otimize toda a gestão de mídia da sua empresa 
                em uma única plataforma inteligente. Resultados reais em semanas.
              </p>

              <div className="hero-cta flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/auth")}
                  className="gradient-brand text-lg px-8 py-6 group"
                >
                  Agendar Demonstração
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-8 py-6 group"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Ver em Ação
                </Button>
              </div>

              <div className="hero-cta flex items-center gap-8 pt-4">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {["ED", "MK", "TL", "RG"].map((initials, i) => (
                      <div 
                        key={i}
                        className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-xs font-bold text-primary-foreground border-2 border-background"
                      >
                        {initials}
                      </div>
                    ))}
                  </div>
                  <span className="text-sm text-muted-foreground">+200 empresas</span>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                  ))}
                  <span className="text-sm text-muted-foreground ml-1">4.9/5</span>
                </div>
              </div>
            </div>

            <div className="hero-visual relative">
              <div className="hero-float relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur-2xl transform rotate-6" />
                <Card className="relative bg-card/80 backdrop-blur-sm border-2 border-primary/20 rounded-3xl overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-muted/50 px-4 py-3 border-b border-border flex items-center gap-2">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-red-500" />
                        <div className="w-3 h-3 rounded-full bg-yellow-500" />
                        <div className="w-3 h-3 rounded-full bg-green-500" />
                      </div>
                      <span className="text-xs text-muted-foreground ml-2">Mkt Vision Dashboard</span>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { label: "Investimento", value: "R$ 2.4M", change: "+12%" },
                          { label: "Leads", value: "18.432", change: "+28%" },
                          { label: "CPL", value: "R$ 45", change: "-15%" },
                        ].map((stat, i) => (
                          <div key={i} className="bg-muted/50 rounded-lg p-3 text-center">
                            <div className="text-xs text-muted-foreground">{stat.label}</div>
                            <div className="text-lg font-bold">{stat.value}</div>
                            <div className={`text-xs ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                              {stat.change}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="h-32 bg-gradient-to-t from-primary/20 to-transparent rounded-lg flex items-end justify-around px-4 pb-2">
                        {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                          <div 
                            key={i} 
                            className="w-6 rounded-t bg-gradient-to-t from-primary to-secondary"
                            style={{ height: `${h}%` }}
                          />
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <div className="scroll-indicator absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs text-muted-foreground">Role para descobrir</span>
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        </div>
      </section>

      {/* Stats Section */}
      <section ref={statsRef} className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { value: "R$ 50M+", label: "em verbas gerenciadas" },
              { value: "200+", label: "empresas confiam em nós" },
              { value: "30%", label: "de economia média" },
              { value: "4.9/5", label: "satisfação dos clientes" },
            ].map((stat, i) => (
              <Card key={i} className="stat-card text-center bg-card/50 backdrop-blur-sm border-border/50">
                <CardContent className="pt-6">
                  <div className="text-4xl font-bold gradient-brand-text">{stat.value}</div>
                  <div className="text-sm text-muted-foreground mt-1">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section ref={problemRef} className="py-24 relative">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="problem-title text-4xl md:text-5xl font-bold mb-6">
              O Problema que{" "}
              <span className="text-destructive">Ninguém Fala</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              A gestão de marketing em grandes empresas ainda vive na era das planilhas. 
              O resultado? Bilhões desperdiçados todos os anos.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {problems.map((problem, i) => (
              <Card key={i} className="problem-card bg-gradient-to-br from-destructive/10 to-destructive/5 border-destructive/20">
                <CardContent className="pt-8 pb-8 text-center">
                  <problem.icon className="w-12 h-12 mx-auto text-destructive mb-4" />
                  <div className="text-4xl font-bold text-destructive mb-2">{problem.value}</div>
                  <p className="text-muted-foreground">{problem.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section ref={solutionRef} id="recursos" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="solution-badge inline-flex items-center justify-center w-16 h-16 rounded-full gradient-brand mb-6">
              <Zap className="w-8 h-8 text-primary-foreground" />
            </div>
            <h2 className="solution-title text-4xl md:text-5xl font-bold mb-6">
              A Solução Completa
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Mkt Vision centraliza tudo que você precisa para gerenciar sua verba de marketing 
              com inteligência e eficiência.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <Card 
                key={i} 
                className="solution-feature group hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
              >
                <CardContent className="pt-6">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Deep Dive */}
      <section ref={featuresRef} className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Tudo que Você Precisa
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Uma plataforma completa para transformar a gestão de marketing da sua empresa
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "Dashboards em Tempo Real",
                desc: "Acompanhe todos os KPIs importantes em um único lugar. Leads, CPL, CAC, investimentos por canal - tudo atualizado automaticamente.",
                icon: BarChart3,
                gradient: "from-blue-500/20 to-cyan-500/20"
              },
              {
                title: "Gestão de Mídia Integrada",
                desc: "Digital e offline na mesma plataforma. Google, Meta, OOH, rádio, TV - gerencie todos os seus canais de forma unificada.",
                icon: Globe,
                gradient: "from-purple-500/20 to-pink-500/20"
              },
              {
                title: "Workflow de Aprovações",
                desc: "Chega de emails perdidos. Fluxo digital de aprovação com notificações, histórico e SLA automático.",
                icon: FileCheck,
                gradient: "from-green-500/20 to-emerald-500/20"
              },
              {
                title: "Inteligência Artificial",
                desc: "Análises automatizadas, sugestões de otimização e insights que você não encontraria sozinho.",
                icon: Bot,
                gradient: "from-orange-500/20 to-amber-500/20"
              },
            ].map((item, i) => (
              <Card key={i} className={`feature-card overflow-hidden bg-gradient-to-br ${item.gradient} border-0`}>
                <CardContent className="p-8">
                  <item.icon className="w-12 h-12 text-foreground mb-6" />
                  <h3 className="text-2xl font-bold mb-4">{item.title}</h3>
                  <p className="text-muted-foreground text-lg">{item.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section ref={comparisonRef} id="comparativo" className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="comparison-header text-4xl md:text-5xl font-bold mb-6">
              Por que Escolher{" "}
              <span className="gradient-brand-text">Mkt Vision</span>?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Veja como nos comparamos às alternativas tradicionais
            </p>
          </div>

          <Card className="max-w-4xl mx-auto overflow-hidden">
            <CardContent className="p-0">
              <div className="grid grid-cols-4 bg-muted/50 p-4 font-semibold text-center comparison-header">
                <div className="text-left pl-4">Recurso</div>
                <div className="gradient-brand-text">Mkt Vision</div>
                <div className="text-muted-foreground">Planilhas</div>
                <div className="text-muted-foreground">ERPs Tradicionais</div>
              </div>
              {comparison.map((row, i) => (
                <div 
                  key={i} 
                  className={`comparison-row grid grid-cols-4 p-4 text-center items-center ${i % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}
                >
                  <div className="text-left pl-4 text-sm">{row.feature}</div>
                  <div>
                    {row.romack ? (
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-red-500 mx-auto" />
                    )}
                  </div>
                  <div>
                    {row.planilhas ? (
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-red-500 mx-auto" />
                    )}
                  </div>
                  <div>
                    {row.erp ? (
                      <Check className="w-5 h-5 text-green-500 mx-auto" />
                    ) : (
                      <X className="w-5 h-5 text-red-500 mx-auto" />
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="text-center mt-8">
            <Button 
              size="lg" 
              onClick={() => navigate("/auth")}
              className="gradient-brand group"
            >
              Conhecer a Plataforma
              <ArrowUpRight className="w-5 h-5 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Button>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section ref={benefitsRef} className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Resultados Comprovados
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Empresas que usam Mkt Vision alcançam resultados impressionantes
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {benefits.map((benefit, i) => (
              <Card key={i} className="benefit-card text-center hover:border-primary/50 transition-colors">
                <CardContent className="pt-8">
                  <div className="w-16 h-16 rounded-full gradient-brand flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-8 h-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section ref={testimonialsRef} className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              O que Nossos Clientes Dizem
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Histórias reais de transformação na gestão de marketing
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <Card key={i} className="testimonial-card">
                <CardContent className="pt-8">
                  <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    ))}
                  </div>
                  <p className="text-lg mb-6 italic">"{testimonial.quote}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full gradient-brand flex items-center justify-center text-primary-foreground font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role} • {testimonial.company}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section ref={pricingRef} id="precos" className="py-24">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">
              Planos para Cada Necessidade
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Escolha o plano ideal para o tamanho da sua operação
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {pricing.map((plan, i) => (
              <Card 
                key={i} 
                className={`pricing-card relative ${plan.highlighted ? 'border-2 border-primary shadow-lg shadow-primary/20 scale-105' : ''}`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <div className="px-4 py-1 rounded-full gradient-brand text-sm font-medium text-primary-foreground">
                      Mais Popular
                    </div>
                  </div>
                )}
                <CardContent className="pt-8">
                  <div className="text-center mb-6">
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mb-4">{plan.desc}</p>
                    <div className="flex items-baseline justify-center gap-1">
                      <span className="text-sm text-muted-foreground">R$</span>
                      <span className="text-4xl font-bold">{plan.price}</span>
                      <span className="text-muted-foreground">/mês</span>
                    </div>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span className="text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={`w-full ${plan.highlighted ? 'gradient-brand' : ''}`}
                    variant={plan.highlighted ? 'default' : 'outline'}
                    onClick={() => navigate("/auth")}
                  >
                    Começar Agora
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16">
            {[
              { icon: Lock, label: "Dados Criptografados" },
              { icon: Shield, label: "LGPD Compliant" },
              { icon: Award, label: "ISO 27001" },
              { icon: Building2, label: "99.9% Uptime" },
            ].map((trust, i) => (
              <div key={i} className="flex items-center gap-2 text-muted-foreground">
                <trust.icon className="w-5 h-5" />
                <span className="text-sm">{trust.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section ref={ctaRef} className="py-24">
        <div className="container mx-auto px-4">
          <Card className="final-cta max-w-4xl mx-auto overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20" />
            <CardContent className="relative p-12 text-center">
              <h2 className="text-3xl md:text-5xl font-bold mb-6">
                Pronto para Transformar sua Gestão de Marketing?
              </h2>
              <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                Agende uma demonstração gratuita e descubra como economizar até 30% da sua verba de marketing.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  onClick={() => navigate("/auth")}
                  className="gradient-brand text-lg px-8 py-6 group"
                >
                  Agendar Demo Gratuita
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="text-lg px-8 py-6"
                >
                  Falar com Especialista
                </Button>
              </div>
              <p className="text-sm text-muted-foreground mt-6">
                ✓ Sem compromisso &nbsp;&nbsp; ✓ Setup em 24h &nbsp;&nbsp; ✓ Suporte dedicado
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <ThemeLogo className="h-8 mb-4" />
              <p className="text-sm text-muted-foreground">
                A plataforma #1 para gestão inteligente de marketing.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Produto</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#recursos" className="hover:text-foreground transition-colors">Recursos</a></li>
                <li><a href="#precos" className="hover:text-foreground transition-colors">Preços</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Integrações</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Carreiras</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Termos</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">LGPD</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© {new Date().getFullYear()} Mkt Vision. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
