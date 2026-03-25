import * as React from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface NumericInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  value: number;
  onChange: (value: number) => void;
  allowDecimals?: boolean;
  decimalPlaces?: number;
  required?: boolean;
  min?: number;
}

// Format number to Brazilian locale (1.500,50)
const formatNumber = (num: number, decimalPlaces: number): string => {
  return num.toLocaleString('pt-BR', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  });
};

// Parse Brazilian formatted string to number
const parseNumber = (str: string): number => {
  // Remove thousand separators (dots) and replace comma with dot for decimal
  const normalized = str.replace(/\./g, '').replace(',', '.');
  return parseFloat(normalized);
};

const NumericInput = React.forwardRef<HTMLInputElement, NumericInputProps>(
  ({ className, value, onChange, allowDecimals = false, decimalPlaces = 1, required = true, min = 0, ...props }, ref) => {
    const [inputValue, setInputValue] = React.useState<string>('');
    const [error, setError] = React.useState<string | null>(null);
    const [isFocused, setIsFocused] = React.useState(false);

    // Format display value when not focused
    React.useEffect(() => {
      if (!isFocused) {
        if (allowDecimals) {
          setInputValue(formatNumber(value, decimalPlaces));
        } else {
          setInputValue(value.toLocaleString('pt-BR'));
        }
      }
    }, [value, allowDecimals, decimalPlaces, isFocused]);

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      setIsFocused(true);
      // Show raw number for easier editing (without thousand separators)
      if (value === 0) {
        setInputValue('');
      } else if (allowDecimals) {
        // Use comma for decimal
        setInputValue(value.toString().replace('.', ','));
      } else {
        setInputValue(value.toString());
      }
      // Select all text on focus for easy replacement
      setTimeout(() => e.target.select(), 0);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;
      
      // Allow empty string while typing
      if (newValue === '') {
        setInputValue('');
        setError(required ? 'Campo obrigatório' : null);
        return;
      }

      // Allow only digits and comma (decimal)
      const validChars = allowDecimals ? /^[\d,]*$/ : /^[\d]*$/;
      if (!validChars.test(newValue)) {
        return;
      }

      // Count commas - only one allowed
      const commaCount = (newValue.match(/,/g) || []).length;
      if (commaCount > 1) {
        return;
      }

      // Check decimal places limit
      if (allowDecimals && newValue.includes(',')) {
        const parts = newValue.split(',');
        if (parts[1] && parts[1].length > decimalPlaces) {
          return;
        }
      }

      setInputValue(newValue);
      setError(null);
      
      // Parse and update value
      const numValue = parseNumber(newValue);
      if (!isNaN(numValue)) {
        onChange(numValue);
      }
    };

    const handleBlur = () => {
      setIsFocused(false);
      
      if (inputValue === '' || inputValue === '-') {
        if (required) {
          setError('Campo obrigatório');
          onChange(min);
        } else {
          onChange(0);
        }
        return;
      }

      const numValue = parseNumber(inputValue);
      
      if (!isNaN(numValue)) {
        onChange(allowDecimals ? numValue : Math.round(numValue));
      }
    };

    return (
      <div className="relative">
        <Input
          ref={ref}
          type="text"
          inputMode="decimal"
          className={cn(
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          value={inputValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          {...props}
        />
        {error && (
          <span className="text-xs text-destructive absolute -bottom-5 left-0">
            {error}
          </span>
        )}
      </div>
    );
  }
);

NumericInput.displayName = "NumericInput";

export { NumericInput };
