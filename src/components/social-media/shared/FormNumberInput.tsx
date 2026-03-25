interface FormNumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  description?: string;
  suffix?: string;
  'data-testid'?: string;
}

/**
 * FormNumberInput - Number input with range for social media forms
 */
export function FormNumberInput({
  label,
  value,
  onChange,
  min,
  max,
  description,
  suffix,
  'data-testid': dataTestId,
}: FormNumberInputProps) {
  return (
    <div className="space-y-1" data-testid={dataTestId}>
      <label className="block text-sm font-medium text-foreground">
        {label}
      </label>
      {description && (
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const newValue = parseInt(e.target.value, 10);
            if (!isNaN(newValue) && newValue >= min && newValue <= max) {
              onChange(newValue);
            }
          }}
          min={min}
          max={max}
          className="w-24 px-3 py-2 bg-muted border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
        />
        {suffix && (
          <span className="text-sm text-muted-foreground">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
