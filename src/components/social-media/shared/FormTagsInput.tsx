import { useState } from 'react';
import { X, Plus } from 'lucide-react';

interface FormTagsInputProps {
  label: string;
  tags: string[];
  onChange: (tags: string[]) => void;
  description?: string;
  placeholder?: string;
  'data-testid'?: string;
}

/**
 * FormTagsInput - Tags/keywords input for social media forms
 */
export function FormTagsInput({
  label,
  tags,
  onChange,
  description,
  placeholder,
  'data-testid': dataTestId,
}: FormTagsInputProps) {
  const [inputValue, setInputValue] = useState('');

  const addTag = () => {
    const trimmed = inputValue.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
      setInputValue('');
    }
  };

  const removeTag = (tag: string) => {
    onChange(tags.filter((t) => t !== tag));
  };

  return (
    <div className="space-y-2" data-testid={dataTestId}>
      {label && (
        <label className="block text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      {description && (
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      )}
      <div className="flex flex-wrap gap-2 p-2 min-h-[44px] bg-muted border border-border rounded-md">
        {tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-full text-xs"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="p-0.5 rounded-full hover:bg-primary/20"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <div className="flex items-center gap-1 flex-1 min-w-[120px]">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag();
              }
            }}
            placeholder={placeholder}
            className="flex-1 bg-transparent border-none outline-none text-sm text-foreground placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={addTag}
            disabled={!inputValue.trim()}
            className="p-1 text-muted-foreground hover:text-primary disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
