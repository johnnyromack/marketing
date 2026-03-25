import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUnifiedBrands } from "@/hooks/useUnifiedBrands";
import { Building2, Loader2 } from "lucide-react";

interface BrandFilterProps {
  value: string;
  onChange: (value: string) => void;
}

export function BrandFilter({ value, onChange }: BrandFilterProps) {
  const { data: unifiedBrands, isLoading } = useUnifiedBrands();

  return (
    <div className="flex items-center gap-2">
      <Building2 className="h-4 w-4 text-muted-foreground" />
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[200px]">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <SelectValue placeholder="Todas as marcas" />
          )}
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Todas as marcas</SelectItem>
          {unifiedBrands.map((brand) => (
            <SelectItem key={brand.filterValue} value={brand.filterValue}>
              {brand.displayName}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
