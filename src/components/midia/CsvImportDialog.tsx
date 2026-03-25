import { useState, useRef } from 'react';
import { FileUp, Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';

interface CsvImportDialogProps {
  onImportSuccess: () => void;
  marcas: string[];
}

interface ParsedRow {
  mes: string;
  mes_numero: number;
  ano: number;
  marca: string;
  unidade: string;
  fornecedor: string;
  orcamento_on: number;
  valor_realizado: number;
  valor_midia: number;
  diario: number;
  observacoes: string;
}

interface ValidationResult {
  isValid: boolean;
  platform: 'google_ads' | 'meta_ads' | 'unknown';
  errors: string[];
  warnings: string[];
  detectedColumns: string[];
}

const MONTH_MAP: Record<string, { mes: string; mes_numero: number }> = {
  'jan': { mes: 'Janeiro', mes_numero: 1 },
  'janeiro': { mes: 'Janeiro', mes_numero: 1 },
  'january': { mes: 'Janeiro', mes_numero: 1 },
  'fev': { mes: 'Fevereiro', mes_numero: 2 },
  'fevereiro': { mes: 'Fevereiro', mes_numero: 2 },
  'february': { mes: 'Fevereiro', mes_numero: 2 },
  'mar': { mes: 'Março', mes_numero: 3 },
  'março': { mes: 'Março', mes_numero: 3 },
  'marco': { mes: 'Março', mes_numero: 3 },
  'march': { mes: 'Março', mes_numero: 3 },
  'abr': { mes: 'Abril', mes_numero: 4 },
  'abril': { mes: 'Abril', mes_numero: 4 },
  'april': { mes: 'Abril', mes_numero: 4 },
  'mai': { mes: 'Maio', mes_numero: 5 },
  'maio': { mes: 'Maio', mes_numero: 5 },
  'may': { mes: 'Maio', mes_numero: 5 },
  'jun': { mes: 'Junho', mes_numero: 6 },
  'junho': { mes: 'Junho', mes_numero: 6 },
  'june': { mes: 'Junho', mes_numero: 6 },
  'jul': { mes: 'Julho', mes_numero: 7 },
  'julho': { mes: 'Julho', mes_numero: 7 },
  'july': { mes: 'Julho', mes_numero: 7 },
  'ago': { mes: 'Agosto', mes_numero: 8 },
  'agosto': { mes: 'Agosto', mes_numero: 8 },
  'august': { mes: 'Agosto', mes_numero: 8 },
  'set': { mes: 'Setembro', mes_numero: 9 },
  'setembro': { mes: 'Setembro', mes_numero: 9 },
  'september': { mes: 'Setembro', mes_numero: 9 },
  'out': { mes: 'Outubro', mes_numero: 10 },
  'outubro': { mes: 'Outubro', mes_numero: 10 },
  'october': { mes: 'Outubro', mes_numero: 10 },
  'nov': { mes: 'Novembro', mes_numero: 11 },
  'novembro': { mes: 'Novembro', mes_numero: 11 },
  'november': { mes: 'Novembro', mes_numero: 11 },
  'dez': { mes: 'Dezembro', mes_numero: 12 },
  'dezembro': { mes: 'Dezembro', mes_numero: 12 },
  'december': { mes: 'Dezembro', mes_numero: 12 },
  '01': { mes: 'Janeiro', mes_numero: 1 },
  '02': { mes: 'Fevereiro', mes_numero: 2 },
  '03': { mes: 'Março', mes_numero: 3 },
  '04': { mes: 'Abril', mes_numero: 4 },
  '05': { mes: 'Maio', mes_numero: 5 },
  '06': { mes: 'Junho', mes_numero: 6 },
  '07': { mes: 'Julho', mes_numero: 7 },
  '08': { mes: 'Agosto', mes_numero: 8 },
  '09': { mes: 'Setembro', mes_numero: 9 },
  '10': { mes: 'Outubro', mes_numero: 10 },
  '11': { mes: 'Novembro', mes_numero: 11 },
  '12': { mes: 'Dezembro', mes_numero: 12 },
};

// Google Ads expected columns
const GOOGLE_ADS_COLUMNS = {
  required: ['cost', 'custo', 'spend', 'gasto'],
  date: ['day', 'date', 'data', 'dia', 'período', 'period'],
  campaign: ['campaign', 'campanha', 'campaign name', 'nome da campanha'],
};

// Meta Ads expected columns  
const META_ADS_COLUMNS = {
  required: ['amount spent', 'valor gasto', 'spend', 'custo', 'cost'],
  date: ['date', 'data', 'reporting starts', 'início do relatório', 'day'],
  campaign: ['campaign name', 'nome da campanha', 'campaign', 'campanha'],
};

const parseMonthFromDate = (dateStr: string): { mes: string; mes_numero: number; ano: number } | null => {
  if (!dateStr || typeof dateStr !== 'string') return null;
  
  const formats = [
    /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
    /(\d{4})-(\d{1,2})-(\d{1,2})/,
    /(\w+)\s+(\d{4})/,
    /(\d{4})\/(\d{1,2})/,
    /(\d{1,2})-(\w+)-(\d{4})/,
  ];

  for (const regex of formats) {
    const match = dateStr.match(regex);
    if (match) {
      if (regex === formats[0]) {
        const month = parseInt(match[2]);
        const year = parseInt(match[3]);
        const monthData = Object.values(MONTH_MAP).find(m => m.mes_numero === month);
        if (monthData && year > 2000 && year < 2100) return { ...monthData, ano: year };
      } else if (regex === formats[1]) {
        const month = parseInt(match[2]);
        const year = parseInt(match[1]);
        const monthData = Object.values(MONTH_MAP).find(m => m.mes_numero === month);
        if (monthData && year > 2000 && year < 2100) return { ...monthData, ano: year };
      } else if (regex === formats[2]) {
        const monthName = match[1].toLowerCase();
        const year = parseInt(match[2]);
        const monthData = MONTH_MAP[monthName];
        if (monthData && year > 2000 && year < 2100) return { ...monthData, ano: year };
      } else if (regex === formats[3]) {
        const year = parseInt(match[1]);
        const month = parseInt(match[2]);
        const monthData = Object.values(MONTH_MAP).find(m => m.mes_numero === month);
        if (monthData && year > 2000 && year < 2100) return { ...monthData, ano: year };
      }
    }
  }
  return null;
};

const parseCurrency = (value: string): number => {
  if (!value || typeof value !== 'string') return 0;
  const cleaned = value
    .replace(/[R$€$£BRL]/gi, '')
    .replace(/\s/g, '')
    .replace(/\./g, '')
    .replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

const validateCsvFormat = (headers: string[], platformHint?: 'google_ads' | 'meta_ads' | 'auto'): ValidationResult => {
  const headerStr = headers.join(' ').toLowerCase();
  const errors: string[] = [];
  const warnings: string[] = [];
  const detectedColumns: string[] = [];
  
  // Detect platform
  let platform: 'google_ads' | 'meta_ads' | 'unknown' = 'unknown';
  
  if (platformHint && platformHint !== 'auto') {
    platform = platformHint;
  } else {
    // Auto-detect based on column patterns
    const hasMetaColumns = META_ADS_COLUMNS.required.some(col => headerStr.includes(col)) ||
      headerStr.includes('ad set') || headerStr.includes('conjunto de anúncios') || headerStr.includes('reach');
    const hasGoogleColumns = GOOGLE_ADS_COLUMNS.required.some(col => headerStr.includes(col)) ||
      headerStr.includes('clicks') || headerStr.includes('impressions') || headerStr.includes('cpc');
    
    if (hasMetaColumns && !hasGoogleColumns) platform = 'meta_ads';
    else if (hasGoogleColumns) platform = 'google_ads';
  }
  
  // Validate required columns based on platform
  const requiredCols = platform === 'meta_ads' ? META_ADS_COLUMNS : GOOGLE_ADS_COLUMNS;
  
  const hasCostColumn = requiredCols.required.some(col => headerStr.includes(col));
  if (!hasCostColumn) {
    errors.push('Coluna de custo/investimento não encontrada. Esperado: "Cost", "Custo", "Spend" ou "Amount Spent"');
  } else {
    detectedColumns.push('Custo/Investimento ✓');
  }
  
  const hasDateColumn = requiredCols.date.some(col => headerStr.includes(col));
  if (!hasDateColumn) {
    warnings.push('Coluna de data não encontrada. Os dados serão agrupados no mês atual.');
  } else {
    detectedColumns.push('Data ✓');
  }
  
  const hasCampaignColumn = requiredCols.campaign.some(col => headerStr.includes(col));
  if (hasCampaignColumn) {
    detectedColumns.push('Campanha ✓');
  }
  
  return {
    isValid: errors.length === 0,
    platform,
    errors,
    warnings,
    detectedColumns,
  };
};

const generateTemplate = (platform: 'google_ads' | 'meta_ads'): string => {
  if (platform === 'google_ads') {
    return `Day,Campaign,Cost,Impressions,Clicks
2025-01-15,Campanha Institucional,1500.50,25000,450
2025-01-15,Campanha Leads,2300.00,35000,680
2025-02-10,Campanha Institucional,1800.75,28000,520
2025-02-10,Campanha Leads,2100.25,32000,610`;
  }
  return `Date,Campaign Name,Amount Spent (BRL),Reach,Impressions
15/01/2025,Campanha Awareness,1200.00,45000,85000
15/01/2025,Campanha Conversão,1800.50,32000,62000
10/02/2025,Campanha Awareness,1350.25,48000,92000
10/02/2025,Campanha Conversão,2000.00,35000,68000`;
};

const downloadTemplate = (platform: 'google_ads' | 'meta_ads') => {
  const content = generateTemplate(platform);
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `template_${platform}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
};

export const CsvImportDialog = ({ onImportSuccess, marcas }: CsvImportDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [open, setOpen] = useState(false);
  const [selectedMarca, setSelectedMarca] = useState('');
  const [selectedUnidade, setSelectedUnidade] = useState('Geral');
  const [platform, setPlatform] = useState<'google_ads' | 'meta_ads' | 'auto'>('auto');
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [detectedColumns, setDetectedColumns] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [fileName, setFileName] = useState('');
  const [detectedPlatform, setDetectedPlatform] = useState<'google_ads' | 'meta_ads' | 'unknown'>('unknown');

  const resetState = () => {
    setParsedData([]);
    setErrors([]);
    setWarnings([]);
    setDetectedColumns([]);
    setFileName('');
    setDetectedPlatform('unknown');
    setIsLoading(false);
    setIsImporting(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetState();
    }
  };

  const parseCSV = (content: string, platformToUse: 'google_ads' | 'meta_ads' | 'unknown'): { rows: ParsedRow[]; errors: string[] } => {
    const lines = content.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      return { rows: [], errors: ['Arquivo vazio ou sem dados'] };
    }

    const delimiter = lines[0].includes('\t') ? '\t' : (lines[0].includes(';') ? ';' : ',');
    const headers = lines[0].split(delimiter).map(h => h.trim().toLowerCase().replace(/"/g, ''));
    const rows: ParsedRow[] = [];
    const parseErrors: string[] = [];

    const findColumn = (...names: string[]): number => {
      return headers.findIndex(h => names.some(n => h.includes(n)));
    };

    const dateCol = findColumn('data', 'date', 'day', 'dia', 'período', 'period', 'mês', 'month', 'reporting');
    const costCol = findColumn('custo', 'cost', 'spend', 'gasto', 'valor gasto', 'amount spent', 'investimento');
    const campaignCol = findColumn('campanha', 'campaign', 'nome da campanha', 'campaign name');

    if (costCol === -1) {
      parseErrors.push('Coluna de custo/investimento não encontrada');
      return { rows: [], errors: parseErrors };
    }

    const monthlyData: Record<string, { total: number; campaigns: string[] }> = {};
    let skippedRows = 0;

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(delimiter).map(v => v.trim().replace(/"/g, ''));
      if (values.length < 2 || values.every(v => !v)) continue;

      const cost = parseCurrency(values[costCol] || '0');
      if (cost <= 0) {
        skippedRows++;
        continue;
      }

      let monthInfo: { mes: string; mes_numero: number; ano: number } | null = null;

      if (dateCol !== -1 && values[dateCol]) {
        monthInfo = parseMonthFromDate(values[dateCol]);
      }

      if (!monthInfo) {
        const now = new Date();
        monthInfo = {
          mes: Object.values(MONTH_MAP).find(m => m.mes_numero === now.getMonth() + 1)?.mes || 'Janeiro',
          mes_numero: now.getMonth() + 1,
          ano: now.getFullYear(),
        };
      }

      const key = `${monthInfo.ano}-${monthInfo.mes_numero}`;
      if (!monthlyData[key]) {
        monthlyData[key] = { total: 0, campaigns: [] };
      }
      monthlyData[key].total += cost;

      if (campaignCol !== -1 && values[campaignCol]) {
        const campaign = values[campaignCol];
        if (!monthlyData[key].campaigns.includes(campaign)) {
          monthlyData[key].campaigns.push(campaign);
        }
      }
    }

    if (skippedRows > 0) {
      parseErrors.push(`${skippedRows} linhas ignoradas (sem valor de custo válido)`);
    }

    const fornecedor = platformToUse === 'meta_ads' ? 'Meta Ads' : 
                       platformToUse === 'google_ads' ? 'Google Ads' : 'Importado CSV';

    Object.entries(monthlyData).forEach(([key, data]) => {
      const [ano, mes_numero] = key.split('-').map(Number);
      const monthData = Object.values(MONTH_MAP).find(m => m.mes_numero === mes_numero);
      
      if (monthData) {
        rows.push({
          mes: monthData.mes,
          mes_numero,
          ano,
          marca: selectedMarca,
          unidade: selectedUnidade,
          fornecedor,
          orcamento_on: data.total,
          valor_realizado: data.total,
          valor_midia: data.total,
          diario: Math.round((data.total / 30) * 100) / 100,
          observacoes: data.campaigns.length > 0 
            ? `Importado via CSV - ${data.campaigns.length} campanha(s): ${data.campaigns.slice(0, 3).join(', ')}${data.campaigns.length > 3 ? '...' : ''}`
            : 'Importado via CSV',
        });
      }
    });

    if (rows.length === 0 && parseErrors.length === 0) {
      parseErrors.push('Nenhum dado válido encontrado no arquivo');
    }

    return { rows, errors: parseErrors };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!selectedMarca) {
      toast({ title: 'Atenção', description: 'Selecione uma marca primeiro', variant: 'destructive' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFileName(file.name);
    setIsLoading(true);
    setParsedData([]);
    setErrors([]);
    setWarnings([]);
    setDetectedColumns([]);

    try {
      const content = await file.text();
      const lines = content.split('\n');
      const delimiter = lines[0]?.includes('\t') ? '\t' : (lines[0]?.includes(';') ? ';' : ',');
      const headers = lines[0]?.split(delimiter).map(h => h.trim()) || [];
      
      const platformHint = platform === 'auto' ? undefined : platform;
      const validation = validateCsvFormat(headers, platformHint as 'google_ads' | 'meta_ads' | undefined);
      
      setDetectedPlatform(validation.platform);
      setDetectedColumns(validation.detectedColumns);
      setWarnings(validation.warnings);

      if (!validation.isValid) {
        setErrors(validation.errors);
        setIsLoading(false);
        return;
      }

      const { rows, errors: parseErrors } = parseCSV(content, validation.platform);
      
      setParsedData(rows);
      if (parseErrors.length > 0) {
        setWarnings(prev => [...prev, ...parseErrors]);
      }
    } catch (error) {
      console.error('Error parsing CSV:', error);
      setErrors(['Erro ao ler o arquivo CSV. Verifique o formato do arquivo.']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async () => {
    if (!user || parsedData.length === 0) return;

    setIsImporting(true);
    try {
      const dataToInsert = parsedData.map(row => ({
        ...row,
        user_id: user.id,
        status: 'rascunho',
      }));

      const { error } = await supabase.from('midia_on').insert(dataToInsert);

      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
        setIsImporting(false);
      } else {
        toast({ 
          title: 'Sucesso', 
          description: `${parsedData.length} registro(s) importado(s) com sucesso!` 
        });
        onImportSuccess();
        handleOpenChange(false);
      }
    } catch (error) {
      console.error('Error importing data:', error);
      toast({ title: 'Erro', description: 'Erro ao importar dados', variant: 'destructive' });
      setIsImporting(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <FileUp className="h-4 w-4" />
          Importar CSV (Google/Meta Ads)
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Relatório CSV
          </DialogTitle>
          <DialogDescription>
            Importe relatórios do Google Ads ou Meta Ads para preencher automaticamente os dados de mídia
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="import" className="flex-1 flex flex-col min-h-0">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">Importar Dados</TabsTrigger>
            <TabsTrigger value="templates">Templates & Ajuda</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="flex-1 flex flex-col min-h-0 space-y-4 overflow-auto">
            {/* Configuration */}
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Marca *</Label>
                <Select value={selectedMarca} onValueChange={setSelectedMarca}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {marcas.map(marca => (
                      <SelectItem key={marca} value={marca}>{marca}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Unidade</Label>
                <Select value={selectedUnidade} onValueChange={setSelectedUnidade}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Geral">Geral</SelectItem>
                    <SelectItem value="Matriz">Matriz</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Plataforma</Label>
                <Select value={platform} onValueChange={(v) => setPlatform(v as typeof platform)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="auto">Detectar automaticamente</SelectItem>
                    <SelectItem value="google_ads">Google Ads</SelectItem>
                    <SelectItem value="meta_ads">Meta Ads</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* File Input */}
            <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.tsv"
                onChange={handleFileChange}
                className="hidden"
                id="csv-file-input"
                disabled={isLoading || isImporting}
              />
              <label htmlFor="csv-file-input" className={`cursor-pointer ${isLoading || isImporting ? 'pointer-events-none opacity-50' : ''}`}>
                <div className="flex flex-col items-center gap-2">
                  <Upload className="h-8 w-8 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {fileName ? fileName : 'Clique para selecionar um arquivo CSV'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Formatos aceitos: .csv, .tsv
                  </span>
                </div>
              </label>
            </div>

            {/* Loading */}
            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <span>Processando arquivo...</span>
              </div>
            )}

            {/* Detected Columns */}
            {detectedColumns.length > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-muted-foreground">Colunas detectadas:</span>
                {detectedColumns.map((col, i) => (
                  <span key={i} className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded">
                    {col}
                  </span>
                ))}
                {detectedPlatform !== 'unknown' && (
                  <span className="text-xs bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300 px-2 py-1 rounded">
                    Plataforma: {detectedPlatform === 'google_ads' ? 'Google Ads' : 'Meta Ads'}
                  </span>
                )}
              </div>
            )}

            {/* Errors */}
            {errors.length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside">
                    {errors.map((error, i) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Warnings */}
            {warnings.length > 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <ul className="list-disc list-inside text-sm">
                    {warnings.map((warning, i) => (
                      <li key={i}>{warning}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Preview */}
            {parsedData.length > 0 && (
              <div className="space-y-2 flex-1 min-h-0">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="text-sm font-medium">{parsedData.length} registro(s) encontrado(s)</span>
                </div>

                <ScrollArea className="h-[180px] border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mês/Ano</TableHead>
                        <TableHead>Marca</TableHead>
                        <TableHead>Fornecedor</TableHead>
                        <TableHead className="text-right">Valor Investido</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.map((row, i) => (
                        <TableRow key={i}>
                          <TableCell>{row.mes}/{row.ano}</TableCell>
                          <TableCell>{row.marca}</TableCell>
                          <TableCell>{row.fornecedor}</TableCell>
                          <TableCell className="text-right">{formatCurrency(row.valor_realizado)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isImporting}>
                Cancelar
              </Button>
              <Button 
                onClick={handleImport} 
                disabled={parsedData.length === 0 || isLoading || isImporting}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Importar {parsedData.length} registro(s)
                  </>
                )}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="templates" className="space-y-4 overflow-auto">
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Baixe os templates abaixo para garantir que seu arquivo CSV esteja no formato correto.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              {/* Google Ads Template */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-xs">G</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Google Ads</h4>
                    <p className="text-xs text-muted-foreground">Formato padrão de exportação</p>
                  </div>
                </div>
                <div className="text-xs bg-muted p-2 rounded font-mono">
                  Day, Campaign, Cost, Impressions, Clicks
                </div>
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => downloadTemplate('google_ads')}>
                  <Download className="h-4 w-4" />
                  Baixar Template
                </Button>
              </div>

              {/* Meta Ads Template */}
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-xs">M</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Meta Ads</h4>
                    <p className="text-xs text-muted-foreground">Formato padrão de exportação</p>
                  </div>
                </div>
                <div className="text-xs bg-muted p-2 rounded font-mono">
                  Date, Campaign Name, Amount Spent, Reach
                </div>
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => downloadTemplate('meta_ads')}>
                  <Download className="h-4 w-4" />
                  Baixar Template
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-medium">Como exportar seus dados:</h4>
              <div className="space-y-3 text-sm">
                <div className="border-l-2 border-blue-500 pl-3">
                  <p className="font-medium">Google Ads:</p>
                  <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                    <li>Acesse o Google Ads → Relatórios</li>
                    <li>Crie um relatório com: Dia, Campanha, Custo</li>
                    <li>Exporte como CSV</li>
                  </ol>
                </div>
                <div className="border-l-2 border-blue-500 pl-3">
                  <p className="font-medium">Meta Ads:</p>
                  <ol className="list-decimal list-inside text-muted-foreground space-y-1">
                    <li>Acesse o Gerenciador de Anúncios</li>
                    <li>Selecione o período e campanhas</li>
                    <li>Clique em "Exportar" → "Exportar dados da tabela"</li>
                  </ol>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
