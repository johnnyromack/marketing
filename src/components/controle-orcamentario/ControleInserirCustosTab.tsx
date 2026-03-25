import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { List, Table as TableIcon } from 'lucide-react';
import { TipoCusto, ControleFormData } from '@/hooks/useControleOrcamentario';
import { ControleSingleForm } from './ControleSingleForm';
import { ControleTableEntry } from './ControleTableEntry';

interface OrcamentoAreaInfo {
  tipo_custo: string;
  marca: string;
  ano: number;
  valor_orcado: number;
  valor_utilizado: number;
  saldo_disponivel: number;
}

interface ControleInserirCustosTabProps {
  marcas: string[];
  getUnidadesByMarca: (marca: string) => string[];
  fornecedores: { id: string; nome: string }[];
  tiposCusto: TipoCusto[];
  solicitante: string;
  onSave: (registro: ControleFormData) => Promise<boolean>;
  onSaveMultiple: (registros: ControleFormData[]) => Promise<boolean>;
  orcamentosArea?: OrcamentoAreaInfo[];
}

export const ControleInserirCustosTab = ({
  marcas,
  getUnidadesByMarca,
  fornecedores,
  tiposCusto,
  solicitante,
  onSave,
  onSaveMultiple,
  orcamentosArea = [],
}: ControleInserirCustosTabProps) => {
  const [entryMode, setEntryMode] = useState<'single' | 'table'>('single');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle>Novo Lançamento</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant={entryMode === 'single' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEntryMode('single')}
              >
                <List className="h-4 w-4 mr-2" />
                Formulário
              </Button>
              <Button
                variant={entryMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setEntryMode('table')}
              >
                <TableIcon className="h-4 w-4 mr-2" />
                Inserção em Massa
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {entryMode === 'single' ? (
            <ControleSingleForm
              marcas={marcas}
              getUnidadesByMarca={getUnidadesByMarca}
              fornecedores={fornecedores}
              tiposCusto={tiposCusto}
              solicitante={solicitante}
              onSave={onSave}
            />
          ) : (
            <ControleTableEntry
              marcas={marcas}
              getUnidadesByMarca={getUnidadesByMarca}
              fornecedores={fornecedores}
              tiposCusto={tiposCusto}
              solicitante={solicitante}
              onSave={onSaveMultiple}
              orcamentosArea={orcamentosArea}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};
