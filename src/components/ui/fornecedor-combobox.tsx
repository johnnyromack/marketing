import * as React from 'react';
import { Check, ChevronsUpDown, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useFornecedores } from '@/hooks/useFornecedores';

interface FornecedorComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  tipo?: string;
  placeholder?: string;
  allowCustom?: boolean;
}

export function FornecedorCombobox({
  value,
  onValueChange,
  tipo,
  placeholder = 'Selecione o fornecedor...',
  allowCustom = true,
}: FornecedorComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const { fornecedores, isLoading } = useFornecedores(tipo);

  const selectedFornecedor = fornecedores.find(f => f.nome === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value || placeholder}
          {isLoading ? (
            <Loader2 className="ml-2 h-4 w-4 shrink-0 animate-spin" />
          ) : (
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command>
          <CommandInput
            placeholder="Buscar fornecedor..."
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandList>
            <CommandEmpty>
              {allowCustom && inputValue ? (
                <button
                  className="w-full px-2 py-1.5 text-sm text-left hover:bg-accent rounded cursor-pointer"
                  onClick={() => {
                    onValueChange(inputValue);
                    setOpen(false);
                    setInputValue('');
                  }}
                >
                  Usar "{inputValue}"
                </button>
              ) : (
                'Nenhum fornecedor encontrado.'
              )}
            </CommandEmpty>
            <CommandGroup>
              {fornecedores.map((fornecedor) => (
                <CommandItem
                  key={fornecedor.id}
                  value={fornecedor.nome}
                  onSelect={(currentValue) => {
                    onValueChange(currentValue === value ? '' : currentValue);
                    setOpen(false);
                    setInputValue('');
                  }}
                >
                  <Check
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === fornecedor.nome ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{fornecedor.nome}</span>
                    {fornecedor.cnpj && (
                      <span className="text-xs text-muted-foreground">{fornecedor.cnpj}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
