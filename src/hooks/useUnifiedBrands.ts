import { useMemo } from "react";
import { useBrands, getBrandDisplayName } from "@/hooks/usePlatformData";

export interface UnifiedBrand {
  displayName: string;
  brandIds: string[]; // all marca IDs that share this display name
  /** comma-separated IDs for use as filter value */
  filterValue: string;
}

export function useUnifiedBrands() {
  const { data: marcas = [], isLoading } = useBrands();

  const unifiedBrands = useMemo(() => {
    const groupMap = new Map<string, string[]>();

    marcas.forEach((marca) => {
      const displayName = getBrandDisplayName(marca);
      const existing = groupMap.get(displayName) || [];
      existing.push(marca.id);
      groupMap.set(displayName, existing);
    });

    const result: UnifiedBrand[] = [];
    groupMap.forEach((ids, displayName) => {
      result.push({
        displayName,
        brandIds: ids,
        filterValue: ids.join(","),
      });
    });

    // Sort alphabetically
    result.sort((a, b) => a.displayName.localeCompare(b.displayName));
    return result;
  }, [marcas]);

  return { data: unifiedBrands, isLoading };
}

/** Given a comma-separated brand filter value, return array of IDs */
export function parseBrandFilter(value: string): string[] {
  if (!value || value === "all") return [];
  return value.split(",");
}
