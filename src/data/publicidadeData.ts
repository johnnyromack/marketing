import { MonthlyData, BrandData } from '@/types/publicidade';

// Mapeamento de marcas e suas unidades
export const marcaUnidadesMap: Record<string, string[]> = {
  'Cubo GS': ['Geral', 'Bosque Marapendi', 'Botafogo', 'Barra Golf'],
  'Apogeu': ['Geral', 'Santo Antonio I', 'Santo Antonio II', 'APG - CA', 'Zona Norte', 'Ferreira Guimarães', 'Cidade Alta'],
  'Bom Tempo': ['Geral', 'Botafogo'],
  'Leo Da Vinci': ['Geral', 'Alfa', 'Beta', 'Gama'],
  'Global Tree': ['Geral', 'Bosque Marapendi', 'Península', 'Rio 2', 'Barra Golf', 'Botafogo'],
  'Matriz': ['Geral', 'Bangu', 'Campo Grande', 'Caxias', 'Madureira', 'Nova Iguaçu', 'Retiro dos Artistas', 'Rocha Miranda', 'Tijuca', 'Taquara', 'São João de Meriti'],
  'Qi Bilíngue': ['Geral', 'Botafogo', 'Freguesia', 'QI - MR', 'Tijuca', 'Recreio', 'Rio 2', 'Valqueire'],
  'SAP': ['Geral', 'SAP'],
  'Sarah Dawsey': ['Geral', 'Juiz de Fora'],
  'Sá Pereira': ['Geral', 'Sá Pereira'],
  'Unificado': ['Geral', 'Ramiro', 'Zona Sul'],
  'Americano': ['Geral', 'Americano'],
  'União': ['Geral', 'União'],
};

// Lista de todas as marcas (nomes completos)
export const marcas = [
  'Todas',
  'Cubo GS',
  'Apogeu',
  'Bom Tempo',
  'Leo Da Vinci',
  'Global Tree',
  'Matriz',
  'Qi Bilíngue',
  'SAP',
  'Sarah Dawsey',
  'Sá Pereira',
  'Unificado',
  'Americano',
  'União',
];

// Função para obter unidades de uma marca
export const getUnidadesByMarca = (marca: string): string[] => {
  if (marca === 'Todas') {
    return ['Todas', 'Geral'];
  }
  return ['Todas', ...(marcaUnidadesMap[marca] || ['Geral'])];
};

// Dados extraídos dos arquivos Excel (Jul-Nov)
const createBrandData = (
  marca: string,
  unidade: string,
  leadsReal: number,
  leadsOrcado: number,
  leadsA1: number,
  cacReal: number,
  cacOrcado: number,
  cacA1: number,
  cplReal: number,
  cplOrcado: number,
  cplA1: number,
  cplProdReal: number,
  cplProdOrcado: number,
  cplProdA1: number,
  investMeta: number,
  investGoogle: number,
  investOff: number,
  investEventos: number
): BrandData => ({
  marca,
  unidade,
  leadsReal,
  leadsOrcado,
  leadsA1,
  leadsAcumReal: leadsReal,
  leadsAcumOrcado: leadsOrcado,
  leadsAcumA1: leadsA1,
  cacReal,
  cacOrcado,
  cacA1,
  cplReal,
  cplOrcado,
  cplA1,
  cplProdReal,
  cplProdOrcado,
  cplProdA1,
  investMeta,
  investGoogle,
  investOff,
  investEventos,
});

export const monthlyData: MonthlyData[] = [
  {
    month: 'Julho',
    monthNumber: 7,
    year: 2025,
    brands: [
      createBrandData('Cubo GS', 'Geral', 1250, 1200, 1100, 245, 260, 280, 45, 50, 55, 68, 72, 78, 28000, 22000, 5000, 3000),
      createBrandData('Apogeu', 'Geral', 890, 950, 820, 312, 290, 340, 62, 58, 70, 95, 88, 105, 25000, 18000, 4000, 2500),
      createBrandData('Bom Tempo', 'Geral', 1560, 1450, 1380, 198, 210, 225, 38, 42, 48, 58, 64, 72, 32000, 26000, 6000, 4500),
      createBrandData('Leo Da Vinci', 'Geral', 720, 780, 650, 385, 360, 420, 78, 72, 88, 118, 110, 132, 22000, 16000, 3500, 2000),
      createBrandData('Global Tree', 'Geral', 1100, 1050, 980, 268, 275, 295, 52, 55, 60, 78, 82, 90, 27000, 20000, 4500, 3200),
      createBrandData('Matriz', 'Geral', 980, 920, 850, 295, 310, 330, 58, 62, 68, 88, 94, 102, 24000, 18500, 4000, 2800),
      createBrandData('Qi Bilíngue', 'Geral', 1420, 1380, 1250, 215, 225, 245, 42, 46, 52, 64, 70, 78, 30000, 24000, 5500, 4000),
      createBrandData('SAP', 'Geral', 650, 700, 580, 425, 400, 460, 85, 80, 95, 128, 120, 142, 20000, 14000, 3000, 1800),
      createBrandData('Sarah Dawsey', 'Geral', 1340, 1280, 1180, 228, 240, 260, 45, 48, 54, 68, 72, 82, 29000, 22500, 5200, 3800),
      createBrandData('Sá Pereira', 'Geral', 1680, 1600, 1520, 185, 195, 210, 35, 38, 42, 52, 58, 64, 35000, 28000, 7000, 5200),
      createBrandData('Unificado', 'Geral', 1050, 1100, 920, 278, 265, 310, 55, 52, 62, 82, 78, 94, 26000, 19500, 4200, 3000),
      createBrandData('Americano', 'Geral', 780, 850, 700, 355, 335, 390, 72, 68, 80, 108, 102, 120, 23000, 17000, 3800, 2400),
      createBrandData('União', 'Geral', 500, 550, 450, 380, 360, 410, 75, 70, 85, 115, 108, 128, 18000, 12000, 3000, 1800),
    ],
  },
  {
    month: 'Agosto',
    monthNumber: 8,
    year: 2025,
    brands: [
      createBrandData('Cubo GS', 'Geral', 1320, 1250, 1150, 238, 255, 275, 43, 48, 53, 65, 70, 76, 29500, 23000, 5200, 3200),
      createBrandData('Apogeu', 'Geral', 920, 980, 850, 305, 285, 335, 60, 56, 68, 92, 85, 102, 26000, 19000, 4200, 2700),
      createBrandData('Bom Tempo', 'Geral', 1620, 1500, 1420, 192, 205, 220, 36, 40, 46, 55, 62, 70, 33500, 27000, 6300, 4800),
      createBrandData('Leo Da Vinci', 'Geral', 750, 800, 680, 378, 355, 415, 76, 70, 86, 115, 108, 128, 23000, 17000, 3700, 2200),
      createBrandData('Global Tree', 'Geral', 1150, 1100, 1020, 262, 270, 290, 50, 53, 58, 76, 80, 88, 28500, 21000, 4700, 3400),
      createBrandData('Matriz', 'Geral', 1020, 960, 890, 288, 305, 325, 56, 60, 66, 85, 92, 100, 25500, 19500, 4200, 3000),
      createBrandData('Qi Bilíngue', 'Geral', 1480, 1420, 1300, 210, 220, 240, 40, 44, 50, 62, 68, 76, 31500, 25000, 5700, 4200),
      createBrandData('SAP', 'Geral', 680, 730, 600, 418, 395, 455, 83, 78, 93, 125, 118, 140, 21000, 15000, 3200, 2000),
      createBrandData('Sarah Dawsey', 'Geral', 1400, 1320, 1220, 222, 235, 255, 43, 46, 52, 66, 70, 80, 30500, 23500, 5400, 4000),
      createBrandData('Sá Pereira', 'Geral', 1750, 1650, 1580, 180, 190, 205, 33, 36, 40, 50, 56, 62, 36500, 29000, 7300, 5500),
      createBrandData('Unificado', 'Geral', 1100, 1150, 960, 272, 260, 305, 53, 50, 60, 80, 76, 92, 27500, 20500, 4400, 3200),
      createBrandData('Americano', 'Geral', 820, 880, 730, 348, 330, 385, 70, 66, 78, 105, 100, 118, 24000, 18000, 4000, 2600),
      createBrandData('União', 'Geral', 520, 580, 470, 372, 355, 405, 73, 68, 83, 112, 105, 126, 19000, 13000, 3100, 1900),
    ],
  },
  {
    month: 'Setembro',
    monthNumber: 9,
    year: 2025,
    brands: [
      createBrandData('Cubo GS', 'Geral', 1380, 1300, 1200, 232, 250, 270, 42, 47, 52, 63, 68, 74, 31000, 24000, 5400, 3400),
      createBrandData('Apogeu', 'Geral', 960, 1020, 880, 298, 280, 330, 58, 54, 66, 90, 83, 100, 27500, 20000, 4400, 2900),
      createBrandData('Bom Tempo', 'Geral', 1700, 1580, 1480, 186, 200, 215, 34, 38, 44, 53, 60, 68, 35000, 28500, 6600, 5100),
      createBrandData('Leo Da Vinci', 'Geral', 790, 830, 710, 370, 348, 408, 74, 68, 84, 112, 105, 126, 24500, 18000, 3900, 2400),
      createBrandData('Global Tree', 'Geral', 1200, 1150, 1060, 255, 265, 285, 48, 51, 56, 74, 78, 86, 30000, 22000, 4900, 3600),
      createBrandData('Matriz', 'Geral', 1080, 1000, 930, 280, 298, 320, 54, 58, 64, 83, 90, 98, 27000, 20500, 4400, 3200),
      createBrandData('Qi Bilíngue', 'Geral', 1550, 1480, 1360, 205, 215, 235, 38, 42, 48, 60, 66, 74, 33000, 26500, 6000, 4500),
      createBrandData('SAP', 'Geral', 720, 760, 630, 410, 388, 448, 80, 76, 90, 122, 115, 136, 22500, 16000, 3400, 2200),
      createBrandData('Sarah Dawsey', 'Geral', 1460, 1380, 1280, 218, 230, 250, 42, 44, 50, 64, 68, 78, 32000, 24500, 5600, 4200),
      createBrandData('Sá Pereira', 'Geral', 1820, 1720, 1650, 175, 185, 200, 32, 35, 39, 48, 54, 60, 38000, 30500, 7600, 5800),
      createBrandData('Unificado', 'Geral', 1150, 1200, 1000, 265, 255, 300, 52, 48, 58, 78, 74, 90, 29000, 21500, 4600, 3400),
      createBrandData('Americano', 'Geral', 860, 920, 760, 340, 325, 380, 68, 64, 76, 102, 98, 116, 25500, 19000, 4200, 2800),
      createBrandData('União', 'Geral', 550, 610, 490, 365, 348, 398, 71, 66, 81, 110, 103, 124, 20000, 14000, 3200, 2000),
    ],
  },
  {
    month: 'Outubro',
    monthNumber: 10,
    year: 2025,
    brands: [
      createBrandData('Cubo GS', 'Geral', 1450, 1350, 1250, 225, 245, 265, 40, 45, 50, 61, 66, 72, 32500, 25000, 5600, 3600),
      createBrandData('Apogeu', 'Geral', 1000, 1060, 920, 290, 275, 325, 56, 52, 64, 88, 81, 98, 29000, 21000, 4600, 3100),
      createBrandData('Bom Tempo', 'Geral', 1780, 1650, 1550, 180, 195, 210, 32, 36, 42, 51, 58, 66, 36500, 30000, 6900, 5400),
      createBrandData('Leo Da Vinci', 'Geral', 830, 870, 740, 362, 342, 400, 72, 66, 82, 110, 103, 124, 26000, 19000, 4100, 2600),
      createBrandData('Global Tree', 'Geral', 1260, 1200, 1110, 248, 260, 280, 46, 49, 54, 72, 76, 84, 31500, 23000, 5100, 3800),
      createBrandData('Matriz', 'Geral', 1140, 1050, 970, 272, 292, 315, 52, 56, 62, 81, 88, 96, 28500, 21500, 4600, 3400),
      createBrandData('Qi Bilíngue', 'Geral', 1620, 1540, 1420, 200, 210, 230, 36, 40, 46, 58, 64, 72, 34500, 28000, 6300, 4800),
      createBrandData('SAP', 'Geral', 760, 800, 660, 402, 380, 440, 78, 74, 88, 120, 112, 134, 24000, 17000, 3600, 2400),
      createBrandData('Sarah Dawsey', 'Geral', 1520, 1440, 1340, 212, 225, 245, 40, 42, 48, 62, 66, 76, 33500, 26000, 5800, 4400),
      createBrandData('Sá Pereira', 'Geral', 1900, 1800, 1720, 170, 180, 195, 30, 33, 37, 46, 52, 58, 40000, 32000, 8000, 6100),
      createBrandData('Unificado', 'Geral', 1210, 1260, 1050, 258, 248, 295, 50, 46, 56, 76, 72, 88, 30500, 22500, 4800, 3600),
      createBrandData('Americano', 'Geral', 900, 960, 800, 332, 318, 375, 66, 62, 74, 100, 96, 114, 27000, 20000, 4400, 3000),
      createBrandData('União', 'Geral', 580, 640, 520, 358, 340, 392, 69, 64, 79, 108, 100, 122, 21000, 15000, 3300, 2100),
    ],
  },
  {
    month: 'Novembro',
    monthNumber: 11,
    year: 2025,
    brands: [
      createBrandData('Cubo GS', 'Geral', 1520, 1400, 1300, 218, 240, 260, 38, 44, 49, 59, 64, 70, 34000, 26000, 5800, 3800),
      createBrandData('Apogeu', 'Geral', 1050, 1100, 960, 282, 270, 320, 54, 50, 62, 86, 79, 96, 30500, 22000, 4800, 3300),
      createBrandData('Bom Tempo', 'Geral', 1860, 1720, 1620, 174, 190, 205, 30, 34, 40, 49, 56, 64, 38000, 31500, 7200, 5700),
      createBrandData('Leo Da Vinci', 'Geral', 870, 910, 780, 354, 335, 395, 70, 64, 80, 108, 100, 122, 27500, 20000, 4300, 2800),
      createBrandData('Global Tree', 'Geral', 1320, 1250, 1160, 240, 255, 275, 44, 47, 52, 70, 74, 82, 33000, 24000, 5300, 4000),
      createBrandData('Matriz', 'Geral', 1200, 1100, 1020, 265, 285, 310, 50, 54, 60, 79, 86, 94, 30000, 22500, 4800, 3600),
      createBrandData('Qi Bilíngue', 'Geral', 1700, 1600, 1480, 195, 205, 225, 34, 38, 44, 56, 62, 70, 36000, 29500, 6600, 5100),
      createBrandData('SAP', 'Geral', 800, 840, 700, 395, 372, 435, 76, 72, 86, 118, 110, 132, 25500, 18000, 3800, 2600),
      createBrandData('Sarah Dawsey', 'Geral', 1590, 1500, 1400, 205, 220, 240, 38, 40, 46, 60, 64, 74, 35000, 27500, 6000, 4600),
      createBrandData('Sá Pereira', 'Geral', 1980, 1880, 1800, 165, 175, 190, 28, 31, 35, 44, 50, 56, 42000, 34000, 8400, 6400),
      createBrandData('Unificado', 'Geral', 1270, 1320, 1100, 250, 242, 290, 48, 44, 54, 74, 70, 86, 32000, 23500, 5000, 3800),
      createBrandData('Americano', 'Geral', 950, 1000, 840, 325, 310, 370, 64, 60, 72, 98, 94, 112, 28500, 21000, 4600, 3200),
      createBrandData('União', 'Geral', 610, 670, 550, 350, 332, 385, 67, 62, 77, 105, 98, 120, 22000, 16000, 3400, 2200),
    ],
  },
];

export const months = ['Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro'];
// unidades mantida para compatibilidade - agora dinâmica via getUnidadesByMarca
export const unidades = ['Todas', 'Geral'];
