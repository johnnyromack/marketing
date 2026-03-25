interface FormSelectProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  description?: string;
  'data-testid'?: string;
}

/**
 * FormSelect - Select input for social media forms
 */
export function FormSelect({
  label,
  value,
  onChange,
  options,
  description,
  'data-testid': dataTestId,
}: FormSelectProps) {
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
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-muted border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
