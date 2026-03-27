import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Target, Users, TrendingUp, DollarSign, Rocket, Lightbulb, Award, Phone, FileDown, LucideIcon } from "lucide-react";
import RomackLogo from "@/assets/RomackVision.png";
import { toast } from "sonner";

interface Slide {
  id: number;
  title: string;
  subtitle: string;
  icon: LucideIcon;
  bullets: string[];
}

const slides: Slide[] = [
  { id: 1, title: "Romack Vision", subtitle: "A Plataforma que Elimina o Desperdício Bilionário em Marketing", icon: Target, bullets: ["Plataforma SaaS que centraliza e governa toda a verba de marketing", "Visão 360° instantânea de todos os investimentos", "Gestão multi-marca unificada em um só lugar", "O mercado de gestão de marketing é fragmentado. Quem resolver isso primeiro, domina."] },
  { id: 2, title: "O Problema", subtitle: "R$ 1,5 Bilhão Desperdiçados por Ano", icon: Lightbulb, bullets: ["❌ Planilhas fragmentadas = decisões cegas", "❌ Aprovações por email = semanas de atraso", "❌ Zero rastreabilidade = auditoria impossível", "❌ Dados espalhados = oportunidades perdidas", "O resultado? CMOs demitidos, campanhas fracassadas e milhões evaporando."] },
  { id: 3, title: "A Solução", subtitle: "Controle Total em Tempo Real", icon: Rocket, bullets: ["✅ Visão 360° instantânea de toda a verba", "✅ Aprovações em minutos, não semanas", "✅ Auditoria e compliance automáticos", "✅ Gestão multi-marca unificada", "Uma única plataforma para governar todo o marketing"] },
  { id: 4, title: "Funcionalidades", subtitle: "Recursos que Transformam", icon: Award, bullets: ["Dashboards em tempo real com KPIs estratégicos", "Fluxo de aprovação configurável por alçada", "Logs de auditoria completos para compliance", "Comparativo orçado vs realizado automático", "Gestão de fornecedores integrada"] },
  { id: 5, title: "Mercado", subtitle: "Oceano Azul de R$ 5 Bilhões", icon: TrendingUp, bullets: ["TAM: R$ 5B+ (empresas com verba estruturada)", "SAM: R$ 800M (multi-marca e multi-unidade)", "SOM: R$ 80M (meta 5 anos)", "🎯 Go-to-Market: Médias empresas → escala para enterprise"] },
  { id: 6, title: "Público-Alvo", subtitle: "Estratégia de Expansão em 2 Fases", icon: Users, bullets: ["Fase 1 - Médias Empresas: R$ 500K-2M/ano em marketing", "Fase 2 - Grandes Empresas: R$ 2M+/ano", "Foco em empresas com estrutura de marketing madura", "Todos os setores com verba de marketing a partir de R$ 500K/ano"] },
  { id: 7, title: "Diferenciais", subtitle: "Por que Romack Vision?", icon: Award, bullets: ["Especialização 100% em gestão de marketing", "Implementação em apenas 1 semana", "Usuários ilimitados em todos os planos", "Governança e compliance nativos incluídos"] },
  { id: 8, title: "Competição", subtitle: "Análise Competitiva", icon: Target, bullets: ["vs Planilhas: Automação, dashboards, auditoria em tempo real", "vs ERPs: Especialização, implementação rápida, custo previsível", "Mercado fragmentado sem líder claro = oportunidade única"] },
  { id: 9, title: "Modelo de Negócio", subtitle: "Receita Recorrente Previsível", icon: DollarSign, bullets: ["Starter: R$ 1.500/mês (1 módulo, 3 marcas)", "Business: R$ 3.500/mês (2 módulos, 10 marcas, IA)", "Enterprise: R$ 7.000+/mês (completo, APIs, IA própria)", "💼 Taxa de implantação: R$ 3.000 (setup e onboarding)", "🔥 Diferencial: usuários ilimitados em todos os planos"] },
  { id: 10, title: "Projeções", subtitle: "Caminho para R$ 6,5M ARR", icon: TrendingUp, bullets: ["Ano 1: 5 clientes → ARR R$ 150K", "Ano 2: 15 clientes → ARR R$ 540K", "Ano 3: 35 clientes → ARR R$ 1.47M", "Ano 5: 120 clientes → ARR R$ 6.5M"] },
  { id: 11, title: "Tração & Roadmap", subtitle: "O Timing é Perfeito", icon: Rocket, bullets: ["✅ MVP funcional e validado", "🎯 5 clientes piloto pagantes em captação", "🔜 Integrações Meta/Google + Romack.AI", "🔮 Expansão LATAM no horizonte"] },
  { id: 12, title: "Captação", subtitle: "Rodada Seed: R$ 3M", icon: DollarSign, bullets: ["Objetivo: acelerar produto, IA e vendas", "Escalar nacionalmente com time comercial", "Desenvolver Romack.AI para insights automáticos", "A oportunidade é agora. A solução está pronta."] },
];

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
  const Icon = slide.icon;

  return (
    <div className="min-h-screen bg-background flex flex-col print:bg-white">
      <div className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10 print:hidden">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src={RomackLogo} alt="Romack Vision" className="h-8 w-auto" />
            <span className="text-muted-foreground text-sm ml-2">Pitch Deck</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
              <FileDown className="w-4 h-4" />
              Salvar PDF
            </Button>
            <div className="text-sm text-muted-foreground">{currentSlide + 1} / {slides.length}</div>
          </div>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-4 py-8 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardContent className="flex-1 p-8 flex flex-col">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                <Icon className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-3xl font-bold mb-2">{slide.title}</h1>
              <p className="text-lg text-muted-foreground">{slide.subtitle}</p>
            </div>
            <div className="flex-1 flex items-center justify-center">
              <div className="w-full max-w-2xl space-y-4">
                {slide.bullets.map((bullet, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 shrink-0" />
                    <p className="text-foreground">{bullet}</p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 flex items-center justify-between print:hidden">
          <Button variant="outline" onClick={prevSlide} disabled={currentSlide === 0} className="gap-2">
            <ChevronLeft className="w-4 h-4" />Anterior
          </Button>
          <div className="flex gap-2 flex-wrap justify-center max-w-md">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${index === currentSlide ? "bg-primary" : "bg-muted hover:bg-muted-foreground/50"}`}
              />
            ))}
          </div>
          <Button onClick={nextSlide} disabled={currentSlide === slides.length - 1} className="gap-2">
            Próximo<ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PitchDeck;
