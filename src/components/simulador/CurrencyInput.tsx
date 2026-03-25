import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  id?: string;
  className?: string;
}

export function CurrencyInput({ value, onChange, id, className }: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState("");

  useEffect(() => {
    setDisplayValue(formatForDisplay(value));
  }, [value]);

  const formatForDisplay = (num: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  };

  const parseValue = (str: string): number => {
    const cleaned = str.replace(/[^\d]/g, "");
    const num = parseInt(cleaned, 10) || 0;
    return num / 100;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const numericValue = parseValue(rawValue);
    onChange(numericValue);
  };

  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        R$
      </span>
      <Input
        id={id}
        type="text"
        value={displayValue}
        onChange={handleChange}
        className={`pl-10 text-right ${className || ""}`}
        inputMode="numeric"
      />
    </div>
  );
}
