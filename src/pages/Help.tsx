import { useState } from 'react';
import { 
  Users, Building2, Truck, Wallet, 
  Megaphone, BarChart3, ChevronDown, ChevronRight,
  CheckCircle2, AlertCircle, Lightbulb, ArrowRight,
  MessageCircleQuestion, BookOpen, GraduationCap,
  Calculator, PieChart, Calendar, Shield, Eye,
  Settings, FileText, Map, Sparkles, Monitor,
  MousePointer, Search, Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/AppLayout';

// Images - annotated screenshots from the platform
import imgDashboardPerformance from '@/assets/help/tut-dashboard-performance.jpg';
import imgDashboardMidia from '@/assets/help/tut-dashboard-midia.jpg';
import imgDashboardGraficos from '@/assets/help/tut-dashboard-graficos.jpg';
import imgDashboardTabela from '@/assets/help/tut-dashboard-tabela.jpg';
import imgFiltros from '@/assets/help/tut-filtros.jpg';
import imgHome from '@/assets/help/tut-home.jpg';

interface TutorialStep {
  title: string;
  description: string;
  tips?: string[];
  warnings?: string[];
}

interface TutorialSection {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  order: number;
  route: string;
  image?: string;
  steps: TutorialStep[];
}

const tutorials: TutorialSection[] = [
  {
    id: 'usuarios',
    title: 'Gerenciamento de Usuários',
    description: 'Configure os usuários e seus níveis de acesso ao sistema',
    icon: <Users className="h-6 w-6" />,
    order: 1,
    route: '/admin/usuarios',
    image: imgHome,
    steps: [
      {
        title: 'Acesse a página de Usuários',
        description: 'No menu principal, clique em "Admin" → "Usuários" para acessar o gerenciamento de usuários.',
        tips: ['Apenas Admins e Gestores podem acessar esta página']
      },
      {
        title: 'Crie um novo usuário',
        description: 'Clique no botão "Criar Usuário". Preencha o nome completo, email e senha inicial. O usuário deverá trocar a senha no primeiro acesso.',
        tips: [
          'Use emails válidos para cada usuário',
          'A senha inicial é temporária e será solicitada alteração no primeiro login'
        ],
        warnings: ['Anote a senha inicial para passar ao usuário — ela não pode ser recuperada depois']
      },
      {
        title: 'Defina o perfil do usuário',
        description: 'Escolha o perfil adequado para cada usuário. Cada perfil tem permissões diferentes no sistema.',
        tips: [
          '🔴 Admin: Acesso total — gerencia usuários, marcas, orçamentos e todos os módulos',
          '🟠 Gestor: Aprova registros de sua equipe e visualiza dashboards',
          '🟢 Editor: Cadastra e edita formulários de mídia e performance',
          '🔵 Leitor: Apenas visualiza dashboards e relatórios'
        ]
      },
      {
        title: 'Vincule ao Gestor (se aplicável)',
        description: 'Para Editores e Leitores, selecione o Gestor responsável por aprovar seus registros na lista suspensa.',
        warnings: ['Sem gestor vinculado, os registros do editor não poderão ser aprovados']
      }
    ]
  },
  {
    id: 'marcas-unidades',
    title: 'Marcas e Unidades',
    description: 'Cadastre as marcas e unidades da empresa',
    icon: <Building2 className="h-6 w-6" />,
    order: 2,
    route: '/admin/marcas-unidades',
    steps: [
      {
        title: 'Cadastre as Marcas',
        description: 'Acesse "Admin" → "Marcas e Unidades". Clique em "Adicionar Marca" e informe o nome da marca.',
        tips: ['Marcas são a base para todos os outros cadastros — cadastre-as primeiro']
      },
      {
        title: 'Adicione as Unidades',
        description: 'Para cada marca, cadastre suas unidades. Clique em "Adicionar Unidade", selecione a marca e informe o nome e endereço da unidade.',
        tips: [
          'Unidades podem ter orçamento próprio ou compartilhado',
          'Adicione o endereço para a unidade aparecer no mapa de mídias'
        ]
      },
      {
        title: 'Configure Orçamento Próprio',
        description: 'Marque a opção "Orçamento Próprio" se a unidade tiver verba independente da marca. Caso contrário, ela usará o orçamento geral.',
        tips: ['Unidades sem orçamento próprio compartilham o orçamento geral da marca']
      }
    ]
  },
  {
    id: 'fornecedores',
    title: 'Fornecedores',
    description: 'Cadastre os fornecedores de mídia e serviços',
    icon: <Truck className="h-6 w-6" />,
    order: 3,
    route: '/admin/fornecedores',
    steps: [
      {
        title: 'Acesse Fornecedores',
        description: 'No menu, clique em "Admin" → "Fornecedores" para gerenciar os parceiros.',
      },
      {
        title: 'Adicione um Fornecedor',
        description: 'Clique em "Adicionar Fornecedor" e preencha: nome, tipo, CNPJ, contato, email e telefone.',
        tips: [
          'O tipo define em quais formulários o fornecedor aparecerá:',
          '• Mídia ON → formulário de Mídia Digital',
          '• Mídia OFF → formulário de Mídia Offline',
          '• Eventos → formulário de Eventos',
          '• Brindes → formulário de Brindes',
          'CNPJ e contato são opcionais mas recomendados'
        ]
      },
      {
        title: 'Ative/Desative Fornecedores',
        description: 'Use o toggle de status para ativar/desativar. Fornecedores inativos não aparecem nas opções dos formulários.',
        tips: ['Desative em vez de excluir para manter o histórico de registros']
      }
    ]
  },
  {
    id: 'orcamentos',
    title: 'Orçamentos de Mídia',
    description: 'Defina os orçamentos de mídia por marca, unidade e período',
    icon: <Wallet className="h-6 w-6" />,
    order: 4,
    route: '/admin/orcamentos',
    image: imgDashboardMidia,
    steps: [
      {
        title: 'Acesse Orçamentos',
        description: 'No menu, clique em "Admin" → "Orçamentos" para gerenciar as verbas de mídia.',
      },
      {
        title: 'Crie um Orçamento',
        description: 'Selecione marca, unidade (se aplicável), ano, mês e tipo de orçamento.',
        tips: [
          'Tipos disponíveis: Mídia ON, Mídia OFF, Eventos, Brindes',
          'Crie orçamentos separados para cada tipo de mídia'
        ]
      },
      {
        title: 'Defina os Valores',
        description: 'Informe o valor orçado para o período. Use "Verba Extra" para ajustes sem alterar o orçamento original.',
        tips: [
          'O sistema calcula automaticamente o saldo disponível',
          'Verba extra é somada ao orçamento base'
        ],
        warnings: ['Orçamentos precisam ser aprovados pelo Gestor para valer']
      },
      {
        title: 'Distribua a Verba Mensalmente',
        description: 'Clique no ícone de calendário (📅) na tabela para detalhar quanto será gasto em cada mês da campanha.',
        tips: [
          'A distribuição ajuda no controle mensal de gastos',
          'O sistema valida se o total distribuído não excede o orçamento'
        ]
      },
      {
        title: 'Envie para Aprovação',
        description: 'Altere o status para "Pendente" para enviar ao Gestor aprovar. O orçamento só vale após aprovação.',
      }
    ]
  },
  {
    id: 'orcamentos-area',
    title: 'Orçamentos de Área',
    description: 'Gerencie orçamentos por centro de custo (próprio ou compartilhado)',
    icon: <PieChart className="h-6 w-6" />,
    order: 5,
    route: '/admin/orcamentos-area',
    steps: [
      {
        title: 'Acesse Orçamentos de Área',
        description: 'No menu, clique em "Admin" → "Orç. Área" para gerenciar verbas por centro de custo.',
        tips: ['Este módulo é separado dos orçamentos de mídia — é para custos operacionais']
      },
      {
        title: 'Entenda os Centros de Custo',
        description: 'Os centros de custo podem ser de dois tipos. Apenas Admins podem criar novos centros na aba "Centros de Custo".',
        tips: [
          '📌 Próprio: verba exclusiva de uma marca/área',
          '🔗 Compartilhado: verba dividida entre múltiplas áreas'
        ]
      },
      {
        title: 'Crie um Orçamento de Área',
        description: 'Na aba "Orçamentos", selecione a marca, o centro de custo, o ano e informe o valor orçado anual.',
        tips: ['O valor é anual, mas pode ser distribuído por mês na etapa seguinte']
      },
      {
        title: 'Visualize o Resumo',
        description: 'A aba "Resumo" mostra cards com totais, gráfico comparativo e lista detalhada por centro de custo.',
        tips: [
          'Cores indicam saldo: verde = positivo, vermelho = negativo',
          'A barra de progresso mostra % de utilização'
        ]
      },
      {
        title: 'Monitore os Alertas de Utilização',
        description: 'O sistema exibe alertas automáticos coloridos conforme a utilização do orçamento.',
        tips: [
          '🟢 Disponível: menos de 50% utilizado',
          '🔵 Em uso: entre 50% e 79%',
          '🟡 Atenção: entre 80% e 99%',
          '🔴 Excedido: 100% ou mais'
        ],
        warnings: ['Orçamentos em "Atenção" ou "Excedido" são destacados na tabela com cores de alerta']
      },
      {
        title: 'Distribua Mensalmente',
        description: 'Clique no botão de calendário (📅) para abrir a distribuição mensal. Defina valores e verba extra por mês.',
        tips: [
          'Observações podem ser adicionadas em cada linha',
          'O sistema valida se o total não excede o orçamento'
        ]
      }
    ]
  },
  {
    id: 'controle-orcamentario',
    title: 'Controle Orçamentário',
    description: 'Registre e acompanhe os custos realizados por centro de custo',
    icon: <Calculator className="h-6 w-6" />,
    order: 6,
    route: '/controle-orcamentario',
    steps: [
      {
        title: 'Acesse Controle Orçamentário',
        description: 'No menu principal, clique em "Controle Orçamentário" para registrar custos realizados.',
      },
      {
        title: 'Registre um Custo na aba "Inserir Custos"',
        description: 'Preencha: marca, centro de custo, mês/ano, descrição, fornecedor, valor e tipo de pagamento.',
        tips: [
          'Use o campo "Observações" para detalhes adicionais',
          'O "Número do Chamado" ajuda a rastrear solicitações internas',
          'O "Número do Documento" serve para referência fiscal (NF, etc.)'
        ]
      },
      {
        title: 'Acompanhe o Saldo em Tempo Real',
        description: 'Ao selecionar marca e centro de custo, o indicador no topo mostra: Orçado, Utilizado e Saldo Disponível.',
        warnings: ['Custos só são contabilizados no saldo quando aprovados']
      },
      {
        title: 'Visualize o Detalhamento',
        description: 'A aba "Detalhamento" mostra todos os custos registrados com filtros por período, marca e centro de custo.',
        tips: ['Use os filtros para encontrar registros específicos']
      },
      {
        title: 'Consulte o Resumo',
        description: 'A aba "Resumo" exibe cards consolidados com totais por centro de custo e gráficos de utilização.',
      }
    ]
  },
  {
    id: 'midia',
    title: 'Formulários de Mídia',
    description: 'Cadastre campanhas de Mídia ON, Mídia OFF, Eventos e Brindes',
    icon: <Megaphone className="h-6 w-6" />,
    order: 7,
    route: '/midia',
    image: imgFiltros,
    steps: [
      {
        title: 'Acesse Cadastro de Mídia',
        description: 'No menu, clique em "Entrada de Dados" → "Cadastro de Mídia". Você verá abas para cada tipo de mídia.',
      },
      {
        title: 'Mídia ON (Digital)',
        description: 'Registre investimentos em mídia digital. Informe marca, unidade, período, fornecedor, valores orçados e realizados.',
        tips: [
          'O "Diário" (valor por dia) é calculado automaticamente',
          'O sistema compara com o orçamento definido e mostra o saldo'
        ]
      },
      {
        title: 'Mídia OFF (Tradicional)',
        description: 'Registre mídias offline como outdoor, rádio, TV, impressos. Inclua localização para visualizar no mapa.',
        tips: [
          'Use o campo de endereço para geolocalizar a mídia no mapa',
          'Informe datas de veiculação (início e fim) para controle',
          'O "Saving" registra a economia na negociação'
        ]
      },
      {
        title: 'Eventos',
        description: 'Cadastre eventos promocionais com data, local e orçamento. Adicione custos detalhados para cada item.',
        tips: [
          'Use a seção "Custos do Evento" para detalhar: estrutura, staff, materiais, etc.',
          'Cada custo pode ter valor orçado e valor realizado separados',
          'O endereço aparece no mapa de eventos do dashboard'
        ]
      },
      {
        title: 'Brindes',
        description: 'Registre aquisições de brindes. Informe quantidade e valor unitário — o total é calculado automaticamente.',
        tips: ['Categorize os brindes por tipo para análise posterior no dashboard']
      },
      {
        title: 'Envie para Aprovação',
        description: 'Após preencher qualquer formulário, altere o status para "Pendente" e envie para aprovação do Gestor.',
        warnings: ['⚠️ Registros em "Rascunho" NÃO aparecem nos dashboards e relatórios']
      }
    ]
  },
  {
    id: 'performance',
    title: 'Dados de Performance',
    description: 'Registre leads, matrículas e métricas de resultado',
    icon: <BarChart3 className="h-6 w-6" />,
    order: 8,
    route: '/entrada-dados',
    image: imgDashboardTabela,
    steps: [
      {
        title: 'Acesse Entrada de Dados',
        description: 'No menu, clique em "Entrada de Dados" → "Performance" para acessar o formulário de métricas.',
      },
      {
        title: 'Selecione o Período',
        description: 'Escolha marca, unidade, ano e mês. Se já existir registro para o período, os dados serão carregados para edição.',
      },
      {
        title: 'Preencha os Dados Orçados (Metas)',
        description: 'Informe as metas planejadas: leads orçado, leads produção orçado, matrículas orçadas, CPL e CAC orçados.',
        tips: ['Esses são os valores de referência para comparação no dashboard']
      },
      {
        title: 'Registre os Dados Reais',
        description: 'Conforme os resultados chegam, atualize: leads real, leads produção real e matrículas realizadas.',
        tips: [
          'CPL e CAC reais são calculados automaticamente pelo sistema',
          'Preencha também os dados de A-1 (ano anterior) para comparação'
        ]
      },
      {
        title: 'Informe Investimentos',
        description: 'Registre investimentos em Meta, Google, Mídia OFF e Eventos separadamente para cálculo correto dos indicadores.',
        tips: ['Esses valores alimentam os KPIs e gráficos do Dashboard de Performance']
      },
      {
        title: 'Envie para Aprovação',
        description: 'Altere o status para "Pendente" para validação do Gestor.',
      }
    ]
  }
];

const dashboardGuides = [
  {
    id: 'dashboard-performance',
    title: 'Dashboard de Performance',
    description: 'Analise leads, matrículas, CPL e CAC com filtros avançados',
    icon: <BarChart3 className="h-5 w-5" />,
    image: imgDashboardPerformance,
    route: '/dashboard',
    screenshots: [
      { image: imgDashboardPerformance, caption: 'Visão geral com KPIs e filtros — ① Filtros de período/marca/unidade ② KPIs consolidados ③ Alternância Tabela/Gráficos/Eventos' },
      { image: imgDashboardTabela, caption: 'Tabela de Performance — ① Alterne entre "Por Marca" e "Por Unidade" ② Colunas de Leads, CPL, CAC com variações ③ Botão Exportar' },
      { image: imgDashboardGraficos, caption: 'Gráficos — ① Performance por Marca ② Evolução de Leads ③ Distribuição de Investimento por canal' },
      { image: imgFiltros, caption: 'Filtros avançados — ① Selecione mês/período ② Use "+ Comparar" para comparar períodos ③ Multi-select de marcas e unidades' },
    ],
    features: [
      { icon: <Filter className="h-4 w-4" />, title: 'Filtros Multi-Select', desc: 'Selecione múltiplas marcas e unidades simultaneamente para análise comparativa.' },
      { icon: <Eye className="h-4 w-4" />, title: 'KPIs em Tempo Real', desc: 'Cards com Total de Leads, Matrículas, CAC, CPL e Investimento Total — com comparação vs Orçado e C.A. (acumulado).' },
      { icon: <BarChart3 className="h-4 w-4" />, title: 'Tabelas e Gráficos', desc: 'Alterne entre Tabela (por marca ou unidade), Gráficos (evolução mensal) e Eventos.' },
      { icon: <Search className="h-4 w-4" />, title: 'Filtro por Período', desc: 'Selecione mês específico ou intervalo de datas para análise focada.' },
      { icon: <Sparkles className="h-4 w-4" />, title: 'Análise com IA', desc: 'Clique no botão de IA (✨) para obter insights automáticos sobre os dados exibidos.' },
    ]
  },
  {
    id: 'dashboard-midia',
    title: 'Dashboard de Mídia',
    description: 'Acompanhe orçamentos, investimentos e execução de mídia',
    icon: <Megaphone className="h-5 w-5" />,
    image: imgDashboardMidia,
    route: '/midia/dashboard',
    screenshots: [
      { image: imgDashboardMidia, caption: 'Resumo de Mídia — ① Abas por tipo (ON, OFF, Eventos, Brindes) ② KPIs de orçamento vs realizado ③ Gráfico de evolução de investimentos' },
    ],
    features: [
      { icon: <PieChart className="h-4 w-4" />, title: 'Resumo Consolidado', desc: 'Veja Orçamento Total, Total Realizado, Saldo Remanescente e % Executado.' },
      { icon: <Monitor className="h-4 w-4" />, title: 'Abas por Tipo', desc: 'Navegue entre Resumo, Mídia ON, Mídia OFF, Eventos e Brindes com dados específicos.' },
      { icon: <Map className="h-4 w-4" />, title: 'Mapa de Mídias', desc: 'Na aba Mídia OFF, visualize a localização geográfica das mídias no mapa interativo.' },
      { icon: <BarChart3 className="h-4 w-4" />, title: 'Gráfico de Evolução', desc: 'Acompanhe a evolução mensal dos investimentos com gráfico de área.' },
      { icon: <Filter className="h-4 w-4" />, title: 'Filtros Avançados', desc: 'Filtre por ano, mês, ciclo, marca e unidade para análise detalhada.' },
    ]
  }
];

const workflowSteps = [
  { step: 1, title: 'Cadastro Base', desc: 'Usuários → Marcas → Unidades → Fornecedores', icon: <Settings className="h-5 w-5" /> },
  { step: 2, title: 'Orçamentos', desc: 'Orçamentos de Mídia → Orçamentos de Área', icon: <Wallet className="h-5 w-5" /> },
  { step: 3, title: 'Cadastro de Mídia', desc: 'Mídia ON, OFF, Eventos, Brindes', icon: <Megaphone className="h-5 w-5" /> },
  { step: 4, title: 'Performance', desc: 'Leads, Matrículas, Investimentos', icon: <BarChart3 className="h-5 w-5" /> },
  { step: 5, title: 'Aprovação', desc: 'Gestor aprova os registros', icon: <CheckCircle2 className="h-5 w-5" /> },
  { step: 6, title: 'Dashboards', desc: 'Visualize e analise os resultados', icon: <Eye className="h-5 w-5" /> },
];

const rolePermissions = [
  { role: 'Admin', color: 'bg-destructive/20 text-destructive', permissions: ['Acesso total ao sistema', 'Gerencia usuários e permissões', 'Cria marcas, unidades e fornecedores', 'Gerencia todos os orçamentos', 'Aprova qualquer registro', 'Acessa logs de atividade'] },
  { role: 'Gestor', color: 'bg-warning/20 text-warning', permissions: ['Aprova registros de sua equipe', 'Visualiza todos os dashboards', 'Cadastra e edita mídia e performance', 'Gerencia orçamentos (visualização)', 'Não gerencia usuários'] },
  { role: 'Editor', color: 'bg-success/20 text-success', permissions: ['Cadastra mídia e performance', 'Edita seus próprios registros', 'Visualiza dashboards', 'Envia registros para aprovação', 'Não gerencia orçamentos'] },
  { role: 'Leitor', color: 'bg-info/20 text-info', permissions: ['Apenas visualiza dashboards', 'Não cadastra ou edita dados', 'Acesso somente leitura', 'Ideal para diretoria/stakeholders'] },
];

const TutorialCard = ({ tutorial }: { tutorial: TutorialSection }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className={cn(
        "transition-all duration-200 border",
        isOpen && "border-primary/30 shadow-sm"
      )}>
        <CollapsibleTrigger className="w-full text-left">
          <CardHeader className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-xs font-medium text-muted-foreground w-5">
                  {tutorial.order}.
                </span>
                <div className="p-2 rounded-md bg-muted text-foreground">
                  {tutorial.icon}
                </div>
                <div>
                  <CardTitle className="text-base font-medium">{tutorial.title}</CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    {tutorial.description}
                  </CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs hidden sm:inline-flex">
                  {tutorial.steps.length} passos
                </Badge>
                <ChevronDown className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-200",
                  isOpen && "rotate-180"
                )} />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 pb-5">
            {/* Image preview */}
            {tutorial.image && (
              <div className="mb-5 rounded-lg overflow-hidden border border-border/50">
                <img 
                  src={tutorial.image} 
                  alt={`Interface do módulo ${tutorial.title}`}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
            )}

            <div className="space-y-4 ml-8 border-l-2 border-muted pl-6">
              {tutorial.steps.map((step, index) => (
                <div key={index} className="relative">
                  <div className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-background border-2 border-muted flex items-center justify-center">
                    <span className="text-[10px] font-medium text-muted-foreground">{index + 1}</span>
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">{step.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>

                    {step.tips && step.tips.length > 0 && (
                      <div className="mt-3 p-3 rounded-md bg-muted/50">
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <Lightbulb className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium uppercase tracking-wide">Dicas</span>
                        </div>
                        <ul className="space-y-1">
                          {step.tips.map((tip, tipIndex) => (
                            <li key={tipIndex} className="text-xs text-muted-foreground flex items-start gap-2">
                              <span className="text-muted-foreground/60 shrink-0">•</span>
                              <span>{tip}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {step.warnings && step.warnings.length > 0 && (
                      <div className="mt-3 p-3 rounded-md bg-destructive/5 border border-destructive/10">
                        <div className="flex items-center gap-2 text-destructive mb-2">
                          <AlertCircle className="h-3.5 w-3.5" />
                          <span className="text-xs font-medium uppercase tracking-wide">Atenção</span>
                        </div>
                        <ul className="space-y-1">
                          {step.warnings.map((warning, warnIndex) => (
                            <li key={warnIndex} className="text-xs text-destructive/80 flex items-start gap-2">
                              <span className="text-destructive/40 shrink-0">•</span>
                              <span>{warning}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
};

const faqItems = [
  {
    category: 'Geral',
    items: [
      { question: 'O que significa cada status (Rascunho, Pendente, Aprovado)?', answer: 'Rascunho: registro em edição, não visível nos dashboards. Pendente: enviado para aprovação do Gestor. Aprovado: validado e visível nos dashboards e relatórios.' },
      { question: 'Por que meus dados não aparecem no Dashboard?', answer: 'Apenas registros com status "Aprovado" aparecem nos dashboards. Verifique se o registro foi enviado para aprovação e se o Gestor já aprovou.' },
      { question: 'Como alterar minha senha?', answer: 'A alteração de senha é feita pelo seu Gestor ou Admin. Entre em contato com eles para solicitar uma nova senha temporária. No primeiro login, o sistema pedirá para criar uma nova senha.' },
      { question: 'Posso importar dados de uma planilha?', answer: 'Sim! Em algumas telas de cadastro existe a opção de importar CSV. O arquivo deve seguir o formato específico de cada tipo de dados. Há também importação via IA na Mídia OFF.' },
    ]
  },
  {
    category: 'Mídia',
    items: [
      { question: 'Qual a diferença entre Mídia ON e Mídia OFF?', answer: 'Mídia ON são investimentos em mídia digital (Meta, Google, redes sociais, etc). Mídia OFF são mídias tradicionais (outdoor, rádio, TV, impressos, painéis).' },
      { question: 'O que é o campo "Saving" na Mídia OFF?', answer: 'Saving é a economia obtida na negociação. É a diferença entre o valor de tabela e o valor efetivamente pago ao fornecedor.' },
      { question: 'Por que o mapa não mostra minha mídia/evento?', answer: 'O mapa exibe apenas registros com endereço válido e coordenadas. Certifique-se de preencher o campo de endereço corretamente e aguardar a geocodificação.' },
      { question: 'Como adicionar custos detalhados em um Evento?', answer: 'Ao cadastrar um evento, use a seção "Custos do Evento" para adicionar itens como estrutura, staff, materiais, etc. Cada custo pode ter valor orçado e realizado.' },
    ]
  },
  {
    category: 'Orçamentos',
    items: [
      { question: 'Qual a diferença entre Orçamento de Mídia e Orçamento de Área?', answer: 'Orçamento de Mídia é para campanhas publicitárias (ON, OFF, Eventos, Brindes). Orçamento de Área é para custos operacionais por centro de custo (próprio ou compartilhado).' },
      { question: 'Como funciona o orçamento por Unidade?', answer: 'Unidades com "Orçamento Próprio" têm verba independente. Unidades sem essa marcação compartilham o orçamento geral da marca.' },
      { question: 'O que significa "Próprio" e "Compartilhado" nos centros de custo?', answer: 'Próprio: verba exclusiva de uma marca/área. Compartilhado: verba dividida entre múltiplas áreas ou marcas.' },
      { question: 'O que significam os alertas coloridos no Orçamento de Área?', answer: '🟢 Verde (Disponível): menos de 50% usado. 🔵 Azul (Em uso): 50-79%. 🟡 Amarelo (Atenção): 80-99%. 🔴 Vermelho (Excedido): 100% ou mais.' },
      { question: 'Como distribuir o orçamento de área por mês?', answer: 'Na tabela de orçamentos, clique no ícone de calendário (📅) para abrir o modal de distribuição mensal. Defina valores e verba extra por mês.' },
      { question: 'Por que o "Valor Utilizado" mudou no orçamento de área?', answer: 'O valor utilizado é calculado automaticamente somando os custos aprovados no Controle Orçamentário para a mesma marca, centro de custo e ano.' },
      { question: 'Quem pode criar novos Centros de Custo?', answer: 'Apenas usuários com perfil Admin podem criar, editar ou excluir centros de custo na aba "Centros de Custo" do módulo Orç. Área.' },
    ]
  },
  {
    category: 'Performance',
    items: [
      { question: 'O que são CPL e CAC?', answer: 'CPL (Custo Por Lead) é o investimento total dividido pelo número de leads gerados. CAC (Custo de Aquisição de Cliente) é o investimento total dividido pelo número de matrículas efetivadas.' },
      { question: 'O que é A-1 nos campos de dados?', answer: 'A-1 significa "Ano Anterior". São os dados do mesmo período do ano passado, usados para comparação de desempenho ano contra ano.' },
      { question: 'Por que não consigo editar um registro aprovado?', answer: 'Registros aprovados são bloqueados para edição para manter a integridade dos dados. Para alterações, solicite ao Admin que reabra o registro alterando o status.' },
      { question: 'Como usar o filtro multi-select de marcas?', answer: 'No Dashboard de Performance, clique no botão "Todas marcas". Um popover aparecerá com checkboxes para selecionar múltiplas marcas. As unidades serão filtradas automaticamente conforme as marcas selecionadas.' },
    ]
  }
];

const glossaryItems = [
  { term: 'CPL', definition: 'Custo Por Lead — investimento total ÷ quantidade de leads' },
  { term: 'CAC', definition: 'Custo de Aquisição de Cliente — investimento total ÷ matrículas' },
  { term: 'A-1', definition: 'Ano Anterior — dados do mesmo período do ano passado' },
  { term: 'Saving', definition: 'Economia obtida na negociação (diferença entre tabela e pago)' },
  { term: 'C.A.', definition: 'Crescimento Acumulado — variação % do acumulado no período' },
  { term: 'Mídia ON', definition: 'Mídia digital: Meta Ads, Google Ads, redes sociais' },
  { term: 'Mídia OFF', definition: 'Mídia tradicional: outdoor, rádio, TV, impressos' },
  { term: 'Diário', definition: 'Investimento médio por dia em mídia digital' },
  { term: 'Verba Extra', definition: 'Valor adicional somado ao orçamento original' },
  { term: 'RLS', definition: 'Row Level Security — controle de acesso por linha no banco' },
  { term: 'Bonificação', definition: 'Mídia OFF cedida gratuitamente pelo fornecedor' },
  { term: 'Centro de Custo', definition: 'Categoria para agrupar despesas (próprio ou compartilhado)' },
];

const Help = () => {
  return (
    <AppLayout>
      <main className="container mx-auto py-8 px-4 max-w-5xl">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Central de Ajuda</h1>
          </div>
          <p className="text-muted-foreground ml-11">
            Guia completo para configuração e uso do sistema Mkt Vision.
          </p>
        </div>

        <Tabs defaultValue="inicio" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-5 h-auto">
            <TabsTrigger value="inicio" className="text-xs sm:text-sm">
              <GraduationCap className="h-4 w-4 mr-1.5" />
              Início
            </TabsTrigger>
            <TabsTrigger value="tutoriais" className="text-xs sm:text-sm">
              <BookOpen className="h-4 w-4 mr-1.5" />
              Tutoriais
            </TabsTrigger>
            <TabsTrigger value="dashboards" className="text-xs sm:text-sm">
              <Monitor className="h-4 w-4 mr-1.5" />
              Dashboards
            </TabsTrigger>
            <TabsTrigger value="faq" className="text-xs sm:text-sm">
              <MessageCircleQuestion className="h-4 w-4 mr-1.5" />
              FAQ
            </TabsTrigger>
            <TabsTrigger value="glossario" className="text-xs sm:text-sm">
              <FileText className="h-4 w-4 mr-1.5" />
              Glossário
            </TabsTrigger>
          </TabsList>

          {/* === TAB: INÍCIO === */}
          <TabsContent value="inicio" className="space-y-8">
            {/* Quick Start Banner */}
            <div className="p-6 rounded-xl border bg-gradient-to-r from-primary/5 via-transparent to-accent/5">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-full bg-primary/10 shrink-0">
                  <GraduationCap className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Bem-vindo ao Mkt Vision!</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                    O sistema completo de gestão de marketing e publicidade. Para configurar tudo corretamente, siga o fluxo abaixo na ordem indicada.
                  </p>
                </div>
              </div>
            </div>

            {/* Workflow Flow */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-primary rounded-full"></span>
                Fluxo de Trabalho Recomendado
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {workflowSteps.map((item) => (
                  <Card key={item.step} className="border relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full gradient-brand" />
                    <CardContent className="p-4 pl-5">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
                          {item.step}
                        </div>
                        <div className="text-muted-foreground">{item.icon}</div>
                      </div>
                      <h4 className="font-medium text-sm">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">{item.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Role Permissions */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-accent rounded-full"></span>
                Perfis e Permissões
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {rolePermissions.map((role) => (
                  <Card key={role.role} className="border">
                    <CardHeader className="pb-2 pt-4 px-4">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-muted-foreground" />
                        <Badge className={cn("text-xs", role.color)}>{role.role}</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="px-4 pb-4">
                      <ul className="space-y-1.5">
                        {role.permissions.map((perm, i) => (
                          <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                            <CheckCircle2 className="h-3 w-3 text-success shrink-0 mt-0.5" />
                            <span>{perm}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Status Workflow */}
            <section>
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <span className="w-1 h-6 bg-secondary rounded-full"></span>
                Fluxo de Status dos Registros
              </h2>
              <Card className="border">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border">
                      <div className="w-3 h-3 rounded-full bg-muted-foreground/40" />
                      <div>
                        <p className="text-sm font-medium">Rascunho</p>
                        <p className="text-xs text-muted-foreground">Em edição</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90 sm:rotate-0" />
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-warning/10 border border-warning/20">
                      <div className="w-3 h-3 rounded-full bg-warning" />
                      <div>
                        <p className="text-sm font-medium">Pendente</p>
                        <p className="text-xs text-muted-foreground">Aguardando aprovação</p>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90 sm:rotate-0" />
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/20">
                      <div className="w-3 h-3 rounded-full bg-success" />
                      <div>
                        <p className="text-sm font-medium">Aprovado</p>
                        <p className="text-xs text-muted-foreground">Visível nos dashboards</p>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-4">
                    Apenas registros <strong>Aprovados</strong> aparecem nos dashboards e relatórios.
                  </p>
                </CardContent>
              </Card>
            </section>
          </TabsContent>

          {/* === TAB: TUTORIAIS === */}
          <TabsContent value="tutoriais" className="space-y-6">
            <div className="p-4 rounded-lg border bg-muted/30">
              <p className="text-sm text-muted-foreground">
                <Lightbulb className="h-4 w-4 inline mr-1.5 text-warning" />
                Siga os tutoriais na ordem indicada para uma configuração completa: <strong>Usuários → Marcas → Fornecedores → Orçamentos → Mídia → Performance</strong>
              </p>
            </div>
            <div className="space-y-3">
              {tutorials.map((tutorial) => (
                <TutorialCard key={tutorial.id} tutorial={tutorial} />
              ))}
            </div>
          </TabsContent>

          {/* === TAB: DASHBOARDS === */}
          <TabsContent value="dashboards" className="space-y-6">
            {dashboardGuides.map((guide) => (
              <Card key={guide.id} className="border overflow-hidden">
                <div className="relative">
                  <img 
                    src={guide.image} 
                    alt={guide.title}
                    className="w-full h-48 object-cover opacity-60"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent" />
                  <div className="absolute bottom-4 left-5 right-5">
                    <div className="flex items-center gap-2 mb-1">
                      {guide.icon}
                      <h3 className="text-lg font-semibold">{guide.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{guide.description}</p>
                  </div>
                </div>
                <CardContent className="p-5 space-y-6">
                  {/* Screenshots Gallery */}
                  {'screenshots' in guide && guide.screenshots && guide.screenshots.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">Capturas de Tela</h4>
                      <div className="space-y-4">
                        {guide.screenshots.map((screenshot, i) => (
                          <div key={i} className="rounded-lg overflow-hidden border border-border/50">
                            <img 
                              src={screenshot.image} 
                              alt={screenshot.caption}
                              className="w-full h-auto object-cover"
                              loading="lazy"
                            />
                            <div className="p-3 bg-muted/30 border-t border-border/50">
                              <p className="text-xs text-muted-foreground leading-relaxed">{screenshot.caption}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Features */}
                  <div>
                    <h4 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">Funcionalidades Principais</h4>
                    <div className="space-y-3">
                      {guide.features.map((feature, i) => (
                        <div key={i} className="flex items-start gap-3">
                          <div className="p-1.5 rounded-md bg-primary/10 text-primary shrink-0 mt-0.5">
                            {feature.icon}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{feature.title}</p>
                            <p className="text-xs text-muted-foreground">{feature.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* === TAB: FAQ === */}
          <TabsContent value="faq" className="space-y-6">
            {faqItems.map((category) => (
              <Card key={category.category} className="border">
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <MessageCircleQuestion className="h-5 w-5 text-muted-foreground" />
                    <CardTitle className="text-base">{category.category}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <Accordion type="single" collapsible className="w-full">
                    {category.items.map((item, index) => (
                      <AccordionItem key={index} value={`faq-${category.category}-${index}`} className="border-b last:border-0">
                        <AccordionTrigger className="text-left text-sm hover:no-underline py-4">
                          {item.question}
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground pb-4">
                          {item.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* === TAB: GLOSSÁRIO === */}
          <TabsContent value="glossario" className="space-y-6">
            <Card className="border">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-muted-foreground" />
                  <CardTitle className="text-base">Termos e Siglas</CardTitle>
                  <CardDescription>Definições rápidas dos termos usados no sistema</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {glossaryItems.map((item) => (
                    <div key={item.term} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                      <Badge variant="outline" className="shrink-0 font-mono text-xs">
                        {item.term}
                      </Badge>
                      <p className="text-xs text-muted-foreground">{item.definition}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </AppLayout>
  );
};

export default Help;
