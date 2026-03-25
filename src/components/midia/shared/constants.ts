// DEPRECATED: Use useMarcasUnidadesData hook instead for dynamic data
// These constants are kept for backward compatibility but will be replaced

export const MONTHS = [
  { value: 1, label: 'Janeiro', numero: 1 },
  { value: 2, label: 'Fevereiro', numero: 2 },
  { value: 3, label: 'Março', numero: 3 },
  { value: 4, label: 'Abril', numero: 4 },
  { value: 5, label: 'Maio', numero: 5 },
  { value: 6, label: 'Junho', numero: 6 },
  { value: 7, label: 'Julho', numero: 7 },
  { value: 8, label: 'Agosto', numero: 8 },
  { value: 9, label: 'Setembro', numero: 9 },
  { value: 10, label: 'Outubro', numero: 10 },
  { value: 11, label: 'Novembro', numero: 11 },
  { value: 12, label: 'Dezembro', numero: 12 },
];

// DEPRECATED: Use useMarcasUnidadesData hook instead
export const MARCAS: string[] = [];
export const YEARS = [2024, 2025, 2026, 2027, 2028, 2029, 2030, 2031];

export const TIPOS_MIDIA = [
  { value: 'midia_on', label: 'Mídia On' },
  { value: 'midia_off', label: 'Mídia Off' },
  { value: 'eventos', label: 'Eventos' },
  { value: 'brindes', label: 'Brindes' }
];

export const STATUS_OPTIONS = [
  { value: 'previsto', label: 'Previsto' },
  { value: 'aprovado', label: 'Aprovado' },
  { value: 'realizado', label: 'Realizado' },
  { value: 'cancelado', label: 'Cancelado' },
];

// DEPRECATED: Use useMarcasUnidadesData hook instead
export const getUnidadesByMarca = (_marca: string): string[] => ['Geral'];

export const FORNECEDORES_ON = ['Meta', 'Google', 'TikTok', 'LinkedIn', 'Pinterest', 'Outro'];

export const TIPOS_MIDIA_OFF = [
  'Outdoor',
  'Busdoor',
  'Rádio',
  'TV',
  'Jornal',
  'Revista',
  'Painel LED',
  'Backbus',
  'Frontlight',
  'Outro'
];

export const CATEGORIAS_EVENTO = [
  'Feira',
  'Workshop',
  'Palestra',
  'Open House',
  'Patrocínio',
  'Ação Promocional',
  'Outro'
];

export const TIPOS_CUSTO_EVENTO = [
  'Contratação de Pessoal',
  'Locação de Material',
  'Alimentação',
  'Transporte',
  'Decoração',
  'Brindes',
  'Mídia',
  'Outros'
];

export const CATEGORIAS_BRINDE = [
  'Material Escolar',
  'Vestuário',
  'Eletrônicos',
  'Escritório',
  'Alimentação',
  'Promocional',
  'Outro'
];
