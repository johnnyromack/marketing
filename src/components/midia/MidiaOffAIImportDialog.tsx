import { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, Loader2, Sparkles, MapPin, Pencil, X, Search } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface MidiaOffAIImportDialogProps {
  onImportSuccess: () => void;
  marcas: string[];
  getUnidadesByMarca: (marca: string) => string[];
}

interface ParsedItem {
  mes: string;
  mes_numero: number;
  ano: number;
  marca: string;
  unidade: string;
  localizacao: string;
  tipo_midia: string;
  fornecedor: string;
  valor_midia: number;
  valor_realizado: number;
  saving_midia: number;
  valor_producao: number;
  realizado_producao: number;
  saving_producao: number;
  observacoes: string;
  data_veiculacao_inicio: string | null;
  data_veiculacao_fim: string | null;
  bonificacao: boolean;
  orcamento_off: number;
  selected?: boolean;
  hasCoordinates?: boolean;
  latitude?: number | null;
  longitude?: number | null;
}

type EditableField = 'marca' | 'unidade' | 'localizacao' | 'tipo_midia' | 'fornecedor' | 'valor_midia' | 'mes' | 'ano';

interface AddressSuggestion {
  id: string;
  place_name: string;
  center: [number, number];
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

const parseCurrencyInput = (value: string): number => {
  // Remove currency symbols and spaces, replace comma with dot
  const cleaned = value.replace(/[R$\s.]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const MidiaOffAIImportDialog = ({ onImportSuccess, marcas, getUnidadesByMarca }: MidiaOffAIImportDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [open, setOpen] = useState(false);
  const [importMode, setImportMode] = useState<'fixed' | 'from-file'>('fixed');
  const [selectedMarca, setSelectedMarca] = useState('');
  const [selectedUnidade, setSelectedUnidade] = useState('Geral');
  const [parsedItems, setParsedItems] = useState<ParsedItem[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [fileName, setFileName] = useState('');
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState('');
  
  // Editing state
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; field: EditableField } | null>(null);
  const [editValue, setEditValue] = useState('');
  
  // Address autocomplete state
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unidadesDisponiveis = selectedMarca ? getUnidadesByMarca(selectedMarca) : ['Geral'];

  const resetState = () => {
    setParsedItems([]);
    setErrors([]);
    setWarnings([]);
    setFileName('');
    setIsProcessing(false);
    setIsImporting(false);
    setIsGeocoding(false);
    setProgress(0);
    setProgressMessage('');
    setImportMode('fixed');
    setSelectedMarca('');
    setSelectedUnidade('Geral');
    setEditingCell(null);
    setEditValue('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      resetState();
    }
  };

  const parseFileContent = async (file: File): Promise<{ headers: string[]; rows: string[][] }> => {
    const content = await file.text();
    const lines = content.split('\n').filter(line => line.trim());
    
    if (lines.length < 2) {
      throw new Error('Arquivo vazio ou sem dados suficientes');
    }

    const delimiter = lines[0].includes('\t') ? '\t' : (lines[0].includes(';') ? ';' : ',');
    
    const headers = lines[0].split(delimiter).map(h => h.trim().replace(/"/g, ''));
    const rows = lines.slice(1).map(line => 
      line.split(delimiter).map(v => v.trim().replace(/"/g, ''))
    ).filter(row => row.some(cell => cell.length > 0));

    return { headers, rows };
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In fixed mode, marca is required
    if (importMode === 'fixed' && !selectedMarca) {
      toast({ title: 'Atenção', description: 'Selecione uma marca primeiro', variant: 'destructive' });
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setFileName(file.name);
    setIsProcessing(true);
    setParsedItems([]);
    setErrors([]);
    setWarnings([]);
    setProgress(10);
    setProgressMessage('Lendo arquivo...');

    try {
      const { headers, rows } = await parseFileContent(file);
      
      if (rows.length === 0) {
        setErrors(['Nenhuma linha de dados encontrada no arquivo']);
        setIsProcessing(false);
        return;
      }

      setProgress(30);
      setProgressMessage(`Enviando ${rows.length} linhas para análise com IA...`);

      const BATCH_SIZE = 10;
      const batches = [];
      for (let i = 0; i < rows.length; i += BATCH_SIZE) {
        batches.push(rows.slice(i, i + BATCH_SIZE));
      }

      const allItems: ParsedItem[] = [];
      const allWarnings: string[] = [];

      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        const progressPercent = 30 + ((batchIndex + 1) / batches.length) * 50;
        setProgress(progressPercent);
        setProgressMessage(`Processando lote ${batchIndex + 1} de ${batches.length}...`);

        const { data, error } = await supabase.functions.invoke('midia-off-ai-import', {
          body: { 
            rows: batch,
            headers,
            marca: importMode === 'fixed' ? selectedMarca : null,
            unidade: importMode === 'fixed' && selectedUnidade ? selectedUnidade : null,
            extractFromFile: importMode === 'from-file'
          }
        });

        if (error) {
          console.error('Edge function error:', error);
          throw new Error(error.message || 'Erro ao processar com IA');
        }

        if (data?.error) {
          if (data.error.includes('Rate limit')) {
            await new Promise(resolve => setTimeout(resolve, 2000));
            batchIndex--;
            continue;
          }
          throw new Error(data.error);
        }

        if (data?.items) {
          allItems.push(...data.items.map((item: ParsedItem) => ({ ...item, selected: true })));
        }
        if (data?.warnings) {
          allWarnings.push(...data.warnings);
        }

        if (batchIndex < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }

      setProgress(80);
      setProgressMessage('Finalizando...');
      
      setParsedItems(allItems);
      setWarnings(allWarnings);
      setProgress(100);
      setProgressMessage('Concluído!');

      if (allItems.length === 0) {
        setErrors(['Nenhum item válido foi extraído da planilha']);
      }

    } catch (error) {
      console.error('Error processing file:', error);
      setErrors([error instanceof Error ? error.message : 'Erro ao processar arquivo']);
    } finally {
      setIsProcessing(false);
    }
  };

  const geocodeAddresses = async () => {
    const itemsToGeocode = parsedItems.filter(item => item.selected && item.localizacao && !item.hasCoordinates);
    
    if (itemsToGeocode.length === 0) {
      toast({ title: 'Info', description: 'Todos os endereços já possuem coordenadas ou nenhum item selecionado' });
      return;
    }

    setIsGeocoding(true);
    setProgress(0);
    setProgressMessage(`Geocodificando ${itemsToGeocode.length} endereços...`);

    try {
      for (let i = 0; i < itemsToGeocode.length; i++) {
        const item = itemsToGeocode[i];
        const progressPercent = ((i + 1) / itemsToGeocode.length) * 100;
        setProgress(progressPercent);
        setProgressMessage(`Geocodificando ${i + 1} de ${itemsToGeocode.length}...`);

        try {
          const { data } = await supabase.functions.invoke('mapbox-geocode', {
            body: { query: item.localizacao }
          });

          if (data?.features?.[0]?.center) {
            const [lng, lat] = data.features[0].center;
            const itemIndex = parsedItems.findIndex(p => p === item);
            if (itemIndex !== -1) {
              setParsedItems(prev => prev.map((p, idx) => 
                idx === itemIndex 
                  ? { ...p, latitude: lat, longitude: lng, hasCoordinates: true }
                  : p
              ));
            }
          }
        } catch (geoError) {
          console.warn(`Failed to geocode: ${item.localizacao}`, geoError);
        }

        await new Promise(resolve => setTimeout(resolve, 200));
      }

      toast({ title: 'Sucesso', description: 'Geocodificação concluída!' });
    } catch (error) {
      console.error('Geocoding error:', error);
      toast({ title: 'Erro', description: 'Erro durante geocodificação', variant: 'destructive' });
    } finally {
      setIsGeocoding(false);
      setProgress(0);
      setProgressMessage('');
    }
  };

  const toggleItemSelection = (index: number) => {
    setParsedItems(prev => prev.map((item, idx) => 
      idx === index ? { ...item, selected: !item.selected } : item
    ));
  };

  const toggleAllSelection = (selected: boolean) => {
    setParsedItems(prev => prev.map(item => ({ ...item, selected })));
  };

  // Cell editing functions
  const startEditing = (rowIndex: number, field: EditableField) => {
    const item = parsedItems[rowIndex];
    let value = '';
    
    switch (field) {
      case 'valor_midia':
        value = item.valor_midia.toString();
        break;
      case 'ano':
        value = item.ano.toString();
        break;
      default:
        value = String(item[field] || '');
    }
    
    setEditingCell({ rowIndex, field });
    setEditValue(value);
  };

  const saveEdit = () => {
    if (!editingCell) return;
    
    const { rowIndex, field } = editingCell;
    
    setParsedItems(prev => prev.map((item, idx) => {
      if (idx !== rowIndex) return item;
      
      const updated = { ...item };
      
      switch (field) {
        case 'valor_midia':
          const numValue = parseCurrencyInput(editValue);
          updated.valor_midia = numValue;
          updated.valor_realizado = item.bonificacao ? 0 : numValue;
          updated.orcamento_off = numValue;
          break;
        case 'ano':
          updated.ano = parseInt(editValue) || new Date().getFullYear();
          break;
        case 'mes':
          updated.mes = editValue;
          const mesIndex = MESES.findIndex(m => m.toLowerCase() === editValue.toLowerCase());
          if (mesIndex !== -1) {
            updated.mes_numero = mesIndex + 1;
          }
          break;
        case 'marca':
        case 'unidade':
        case 'localizacao':
        case 'tipo_midia':
        case 'fornecedor':
          (updated as any)[field] = editValue;
          break;
      }
      
      return updated;
    }));
    
    setEditingCell(null);
    setEditValue('');
  };

  const cancelEdit = () => {
    setEditingCell(null);
    setEditValue('');
    setAddressSuggestions([]);
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
  };

  // Search address with Mapbox
  const searchAddress = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(async () => {
      setIsSearchingAddress(true);
      try {
        const { data } = await supabase.functions.invoke('mapbox-geocode', {
          body: { query }
        });

        if (data?.features) {
          setAddressSuggestions(data.features.slice(0, 5).map((f: any) => ({
            id: f.id,
            place_name: f.place_name,
            center: f.center
          })));
        }
      } catch (error) {
        console.error('Address search error:', error);
      } finally {
        setIsSearchingAddress(false);
      }
    }, 300);
  };

  // Select address from suggestions
  const selectAddress = (suggestion: AddressSuggestion, rowIndex: number) => {
    setParsedItems(prev => prev.map((item, idx) => {
      if (idx !== rowIndex) return item;
      return {
        ...item,
        localizacao: suggestion.place_name,
        longitude: suggestion.center[0],
        latitude: suggestion.center[1],
        hasCoordinates: true
      };
    }));
    
    cancelEdit();
  };

  // Clear coordinates for an item
  const clearCoordinates = (rowIndex: number) => {
    setParsedItems(prev => prev.map((item, idx) => {
      if (idx !== rowIndex) return item;
      return {
        ...item,
        latitude: null,
        longitude: null,
        hasCoordinates: false
      };
    }));
  };

  // Geocode single address
  const geocodeSingleAddress = async (rowIndex: number) => {
    const item = parsedItems[rowIndex];
    if (!item.localizacao) return;

    setIsSearchingAddress(true);
    try {
      const { data } = await supabase.functions.invoke('mapbox-geocode', {
        body: { query: item.localizacao }
      });

      if (data?.features?.[0]?.center) {
        const [lng, lat] = data.features[0].center;
        setParsedItems(prev => prev.map((p, idx) => 
          idx === rowIndex 
            ? { ...p, latitude: lat, longitude: lng, hasCoordinates: true, localizacao: data.features[0].place_name }
            : p
        ));
        toast({ title: 'Sucesso', description: 'Endereço geocodificado!' });
      } else {
        toast({ title: 'Aviso', description: 'Endereço não encontrado. Edite para corrigir.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Geocode error:', error);
      toast({ title: 'Erro', description: 'Erro ao geocodificar', variant: 'destructive' });
    } finally {
      setIsSearchingAddress(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEdit();
    } else if (e.key === 'Escape') {
      cancelEdit();
    }
  };

  const renderEditableCell = (
    rowIndex: number, 
    field: EditableField, 
    displayValue: React.ReactNode,
    className?: string
  ) => {
    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.field === field;
    
    if (isEditing) {
      if (field === 'mes') {
        return (
          <Select value={editValue} onValueChange={(v) => { setEditValue(v); }}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MESES.map(mes => (
                <SelectItem key={mes} value={mes}>{mes}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
      
      if (field === 'marca') {
        return (
          <Select value={editValue} onValueChange={(v) => { setEditValue(v); setTimeout(saveEdit, 0); }}>
            <SelectTrigger className="h-7 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {marcas.map(marca => (
                <SelectItem key={marca} value={marca}>{marca}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }

      // Special handling for address field with autocomplete
      if (field === 'localizacao') {
        return (
          <div className="relative">
            <div className="flex items-center gap-1">
              <Input
                value={editValue}
                onChange={(e) => {
                  setEditValue(e.target.value);
                  searchAddress(e.target.value);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') cancelEdit();
                }}
                autoFocus
                className="h-7 text-xs pr-6"
                placeholder="Digite o endereço..."
              />
              {isSearchingAddress && (
                <Loader2 className="h-3 w-3 animate-spin absolute right-2" />
              )}
            </div>
            {addressSuggestions.length > 0 && (
              <div className="absolute z-50 top-8 left-0 right-0 bg-popover border rounded-md shadow-lg max-h-[200px] overflow-auto">
                {addressSuggestions.map((suggestion) => (
                  <div
                    key={suggestion.id}
                    className="px-3 py-2 text-xs hover:bg-muted cursor-pointer flex items-start gap-2"
                    onClick={() => selectAddress(suggestion, rowIndex)}
                  >
                    <MapPin className="h-3 w-3 mt-0.5 flex-shrink-0 text-green-500" />
                    <span>{suggestion.place_name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }
      
      return (
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={saveEdit}
          onKeyDown={handleKeyDown}
          autoFocus
          className="h-7 text-xs"
        />
      );
    }
    
    return (
      <div 
        className={`cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded flex items-center gap-1 group ${className || ''}`}
        onClick={() => startEditing(rowIndex, field)}
        title="Clique para editar"
      >
        {displayValue}
        <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 flex-shrink-0" />
      </div>
    );
  };

  // Render address cell with geocode status
  const renderAddressCell = (item: ParsedItem, rowIndex: number) => {
    const isEditing = editingCell?.rowIndex === rowIndex && editingCell?.field === 'localizacao';
    
    if (isEditing) {
      return renderEditableCell(rowIndex, 'localizacao', null);
    }

    return (
      <div className="flex items-center gap-1 group">
        <div 
          className="flex-1 cursor-pointer hover:bg-muted/50 px-1 py-0.5 rounded flex items-center gap-1"
          onClick={() => startEditing(rowIndex, 'localizacao')}
          title="Clique para editar"
        >
          <span className="text-sm max-w-[150px] truncate block" title={item.localizacao}>
            {item.localizacao || 'Não definido'}
          </span>
          <Pencil className="h-3 w-3 opacity-0 group-hover:opacity-50 flex-shrink-0" />
        </div>
        
        {/* Geocode status/action */}
        {item.hasCoordinates ? (
          <div className="flex items-center gap-1" title="Coordenadas confirmadas">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <button
              onClick={() => clearCoordinates(rowIndex)}
              className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-destructive/20 rounded"
              title="Remover coordenadas"
            >
              <X className="h-3 w-3 text-destructive" />
            </button>
          </div>
        ) : item.localizacao ? (
          <button
            onClick={() => geocodeSingleAddress(rowIndex)}
            disabled={isSearchingAddress}
            className="flex items-center gap-1 px-1.5 py-0.5 text-xs bg-primary/10 hover:bg-primary/20 text-primary rounded"
            title="Buscar coordenadas"
          >
            {isSearchingAddress ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Search className="h-3 w-3" />
            )}
          </button>
        ) : null}
      </div>
    );
  };

  const handleImport = async () => {
    if (!user) return;

    const selectedItems = parsedItems.filter(item => item.selected);
    if (selectedItems.length === 0) {
      toast({ title: 'Atenção', description: 'Selecione ao menos um item para importar', variant: 'destructive' });
      return;
    }

    // Validate all items have marca
    const itemsWithoutMarca = selectedItems.filter(item => !item.marca || item.marca === 'Marca não identificada');
    if (itemsWithoutMarca.length > 0) {
      toast({ 
        title: 'Atenção', 
        description: `${itemsWithoutMarca.length} item(s) sem marca definida. Edite antes de importar.`, 
        variant: 'destructive' 
      });
      return;
    }

    setIsImporting(true);
    setProgress(0);
    setProgressMessage('Salvando registros...');

    try {
      const dataToInsert = selectedItems.map(item => ({
        mes: item.mes,
        mes_numero: item.mes_numero,
        ano: item.ano,
        marca: item.marca,
        unidade: item.unidade || 'Geral',
        localizacao: item.localizacao,
        latitude: item.latitude || null,
        longitude: item.longitude || null,
        tipo_midia: item.tipo_midia,
        fornecedor: item.fornecedor || null,
        orcamento_off: item.orcamento_off,
        valor_midia: item.valor_midia,
        valor_realizado: item.valor_realizado,
        saving_midia: item.saving_midia,
        valor_producao: item.valor_producao,
        realizado_producao: item.realizado_producao,
        saving_producao: item.saving_producao,
        observacoes: item.observacoes ? `[Importado via IA] ${item.observacoes}` : '[Importado via IA]',
        data_veiculacao_inicio: item.data_veiculacao_inicio,
        data_veiculacao_fim: item.data_veiculacao_fim,
        bonificacao: item.bonificacao,
        user_id: user.id,
        status: 'rascunho',
      }));

      const { error } = await supabase.from('midia_off').insert(dataToInsert);

      if (error) {
        toast({ title: 'Erro', description: error.message, variant: 'destructive' });
      } else {
        toast({ 
          title: 'Sucesso', 
          description: `${selectedItems.length} registro(s) de mídia off importado(s)!` 
        });
        onImportSuccess();
        handleOpenChange(false);
      }
    } catch (error) {
      console.error('Error importing:', error);
      toast({ title: 'Erro', description: 'Erro ao importar dados', variant: 'destructive' });
    } finally {
      setIsImporting(false);
    }
  };

  const selectedCount = parsedItems.filter(item => item.selected).length;
  const geocodedCount = parsedItems.filter(item => item.hasCoordinates).length;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Importação em massa com IA
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Importação Inteligente de Mídia Off
          </DialogTitle>
          <DialogDescription>
            Faça upload de qualquer planilha (CSV/Excel) e a IA interpretará os dados automaticamente. Você poderá editar os dados antes de confirmar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-auto space-y-4">
          {/* Import Mode Selection */}
          <div className="space-y-3">
            <Label>Modo de importação</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                onClick={() => {
                  setImportMode('from-file');
                  setSelectedMarca('');
                  setSelectedUnidade('Geral');
                  setParsedItems([]);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                  setFileName('');
                }}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  importMode === 'from-file' 
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-2 font-medium">
                  <FileSpreadsheet className="h-4 w-4" />
                  Extrair marca/unidade da planilha
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  A IA identificará a marca e unidade de cada linha automaticamente
                </p>
              </div>
              <div
                onClick={() => {
                  setImportMode('fixed');
                  setParsedItems([]);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                  setFileName('');
                }}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  importMode === 'fixed' 
                    ? 'border-primary bg-primary/5 ring-2 ring-primary/20' 
                    : 'border-border hover:border-muted-foreground'
                }`}
              >
                <div className="flex items-center gap-2 font-medium">
                  <CheckCircle2 className="h-4 w-4" />
                  Definir marca/unidade fixos
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Todos os itens serão importados com a marca e unidade selecionados
                </p>
              </div>
            </div>
          </div>

          {/* Configuration - only show if fixed mode */}
          {importMode === 'fixed' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Marca *</Label>
                <Select value={selectedMarca} onValueChange={(v) => {
                  setSelectedMarca(v);
                  setSelectedUnidade('Geral');
                  setParsedItems([]);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                  setFileName('');
                }}>
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
                <Label>Unidade (opcional)</Label>
                <Select 
                  value={selectedUnidade} 
                  onValueChange={setSelectedUnidade}
                  disabled={!selectedMarca}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {unidadesDisponiveis.map(unidade => (
                      <SelectItem key={unidade} value={unidade}>{unidade}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* File Upload */}
          <div className="space-y-2">
            <Label>Arquivo (CSV ou Excel exportado como CSV)</Label>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="hidden"
                disabled={(importMode === 'fixed' && !selectedMarca) || isProcessing}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={(importMode === 'fixed' && !selectedMarca) || isProcessing}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                {fileName || 'Selecionar arquivo'}
              </Button>
            </div>
            {importMode === 'fixed' && !selectedMarca && (
              <p className="text-sm text-muted-foreground">Selecione uma marca para habilitar o upload</p>
            )}
          </div>

          {/* Progress */}
          {(isProcessing || isGeocoding) && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">{progressMessage}</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Errors */}
          {errors.length > 0 && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {errors.map((error, i) => <li key={i}>{error}</li>)}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Warnings */}
          {warnings.length > 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <ul className="list-disc list-inside">
                  {warnings.map((warning, i) => <li key={i}>{warning}</li>)}
                </ul>
              </AlertDescription>
            </Alert>
          )}

          {/* Results with Editable Table */}
          {parsedItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-4">
                  <span className="text-sm font-medium">
                    {parsedItems.length} item(s) encontrado(s) • {selectedCount} selecionado(s)
                  </span>
                  {geocodedCount > 0 && (
                    <Badge variant="secondary" className="gap-1">
                      <MapPin className="h-3 w-3" />
                      {geocodedCount} geocodificado(s)
                    </Badge>
                  )}
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAllSelection(true)}
                  >
                    Selecionar todos
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAllSelection(false)}
                  >
                    Desmarcar todos
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={geocodeAddresses}
                    disabled={isGeocoding || selectedCount === 0}
                  >
                    {isGeocoding ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <MapPin className="h-4 w-4 mr-1" />
                    )}
                    Geocodificar
                  </Button>
                </div>
              </div>

              <Alert className="bg-muted/50">
                <Pencil className="h-4 w-4" />
                <AlertDescription>
                  <strong>Dica:</strong> Clique em qualquer célula para editar os dados antes de importar.
                </AlertDescription>
              </Alert>

              <ScrollArea className="h-[350px] border rounded-md">
                <div className="min-w-[1100px]">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-10 sticky left-0 bg-background z-10">
                          <Checkbox 
                            checked={selectedCount === parsedItems.length && parsedItems.length > 0}
                            onCheckedChange={(checked) => toggleAllSelection(checked === true)}
                          />
                        </TableHead>
                        <TableHead className="w-[120px]">Marca</TableHead>
                        <TableHead className="w-[120px]">Unidade</TableHead>
                        <TableHead className="w-[100px]">Mês/Ano</TableHead>
                        <TableHead className="w-[120px]">Tipo</TableHead>
                        <TableHead className="w-[280px]">Localização</TableHead>
                        <TableHead className="w-[140px]">Fornecedor</TableHead>
                        <TableHead className="text-right w-[120px]">Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedItems.map((item, index) => (
                        <TableRow 
                          key={index}
                          className={`${!item.selected ? 'opacity-50' : ''} ${
                            !item.marca || item.marca === 'Marca não identificada' ? 'bg-destructive/10' : ''
                          }`}
                        >
                          <TableCell className="sticky left-0 bg-background z-10">
                            <Checkbox 
                              checked={item.selected}
                              onCheckedChange={() => toggleItemSelection(index)}
                            />
                          </TableCell>
                          <TableCell>
                            {renderEditableCell(index, 'marca', 
                              <Badge 
                                variant={!item.marca || item.marca === 'Marca não identificada' ? 'destructive' : 'outline'}
                                className="text-xs"
                              >
                                {item.marca || 'Não definida'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {renderEditableCell(index, 'unidade', 
                              <span className="text-sm">{item.unidade || 'Geral'}</span>
                            )}
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              {renderEditableCell(index, 'mes', 
                                <span className="text-sm">{item.mes}</span>
                              )}
                              <span>/</span>
                              {renderEditableCell(index, 'ano', 
                                <span className="text-sm">{item.ano}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {renderEditableCell(index, 'tipo_midia', 
                              <Badge variant="outline" className="text-xs">{item.tipo_midia}</Badge>
                            )}
                          </TableCell>
                          <TableCell className="w-[280px]">
                            {renderAddressCell(item, index)}
                          </TableCell>
                          <TableCell>
                            {renderEditableCell(index, 'fornecedor', 
                              <span className="text-sm">{item.fornecedor || '-'}</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {renderEditableCell(index, 'valor_midia', 
                              <span className="font-mono text-sm">
                                {formatCurrency(item.valor_midia)}
                                {item.bonificacao && (
                                  <Badge variant="secondary" className="ml-1 text-xs">Bônus</Badge>
                                )}
                              </span>,
                              'justify-end'
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>

              <Alert>
                <FileSpreadsheet className="h-4 w-4" />
                <AlertDescription>
                  Total selecionado: <strong>{formatCurrency(parsedItems.filter(i => i.selected).reduce((sum, i) => sum + i.valor_midia, 0))}</strong>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={isImporting || selectedCount === 0}
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Importando...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Importar {selectedCount} item(s)
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
