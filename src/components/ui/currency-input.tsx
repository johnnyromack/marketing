import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface CurrencyInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (value: number) => void;
  required?: boolean;
}

// Format number to Brazilian currency format (1.234,56)
const formatToCurrency = (value: number): string => {
  if (value === 0) return '';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Parse currency string to number
const parseCurrency = (str: string): number => {
  if (!str || str === '') return 0;
  // Remove everything except digits and comma
  const cleanStr = str.replace(/[^\\d,]/g, '');
  // Replace comma with dot for parsing
  const normalized = cleanStr.replace(',', '.');
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
};

// Format input as user types (live masking)
const formatLiveInput = (rawValue: string): { formatted: string; numericValue: number } => {
  // Remove everything except digits
  const digitsOnly = rawValue.replace(/\D/g, '');
  
  if (digitsOnly === '') {
    return { formatted: '', numericValue: 0 };
  }
  
  // Convert to cents (last 2 digits are cents)
  const numericValue = parseInt(digitsOnly, 10) / 100;
  
  // Format with thousand separators and decimal
  const formatted = numericValue.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  
  return { formatted, numericValue };
};

const CurrencyInput = React.forwardRef<HTMLInputElement, CurrencyInputProps>(
  ({ className, value, onChange, required = false, placeholder = "0,00", ...props }, ref) => {
    const [displayValue, setDisplayValue] = React.useState<string>('');
    const [isFocused, setIsFocused] = React.useState(false);

    // Sync display value with external value when not focused
    React.useEffect(() => {
      if (!isFocused) {
        setDisplayValue(value > 0 ? formatToCurrency(value) : '');
      }
    }, [value, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value;
      const { formatted, numericValue } = formatLiveInput(rawValue);
      
      setDisplayValue(formatted);
      onChange(numericValue);
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // Keep formatted value on focus for better UX
      if (value > 0) {
        setDisplayValue(formatToCurrency(value));
      }
      // Select all for easy replacement
      setTimeout(() => e.target.select(), 0);
    };

    const handleBlur = () => {
      setIsFocused(false);
      // Re-format on blur
      setDisplayValue(value > 0 ? formatToCurrency(value) : '');
    };

    return (
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
          R$
        </span>
        <Input
          ref={ref}
          type="text"
          inputMode="numeric"
          className={cn("pl-9", className)}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          {...props}
        />
      </div>
    );
  }
);

CurrencyInput.displayName = "CurrencyInput";

export { CurrencyInput };
