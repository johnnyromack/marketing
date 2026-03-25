import { useState, useCallback, useEffect, useRef } from 'react';
import {
  parseDsl,
  validateDsl,
  termsToDsl,
  _getDslSyntaxHelp,
  getDslSuggestions,
  highlightDsl,
} from '@/lib/services/social-media/query-dsl.service';
import type { QueryTerm } from '@/lib/schemas/social-media.schema';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Code,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  HelpCircle,
  Eye,
  Loader2,
  Play,
} from 'lucide-react';

interface DslQueryEditorProps {
  value: QueryTerm[];
  onChange: (terms: QueryTerm[]) => void;
  onPreview?: (terms: QueryTerm[]) => void;
  isPreviewLoading?: boolean;
  previewResult?: { count: number; sample: Record<string, unknown>[] } | null;
  placeholder?: string;
  className?: string;
}

export function DslQueryEditor({
  value,
  onChange,
  onPreview,
  isPreviewLoading = false,
  previewResult,
  placeholder = 'Digite sua query... (ex: "marca" +positivo -spam)',
  className = '',
}: DslQueryEditorProps) {
  const [dslInput, setDslInput] = useState(() => termsToDsl(value));
  const [validation, setValidation] = useState(() => validateDsl(termsToDsl(value)));
  const [showHelp, setShowHelp] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Update DSL when value prop changes externally
  useEffect(() => {
    const newDsl = termsToDsl(value);
    if (newDsl !== dslInput) {
      setDslInput(newDsl);
      setValidation(validateDsl(newDsl));
    }
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  // Parse and validate on input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setDslInput(newValue);
      setCursorPosition(e.target.selectionStart || 0);

      // Validate
      const newValidation = validateDsl(newValue);
      setValidation(newValidation);

      // Parse and notify parent if valid
      if (newValidation.isValid) {
        const parsed = parseDsl(newValue);
        onChange(parsed.terms);
      }

      // Update suggestions
      const newSuggestions = getDslSuggestions(newValue, e.target.selectionStart || 0);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
    },
    [onChange]
  );

  // Handle suggestion selection
  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      if (!textareaRef.current) return;

      const beforeCursor = dslInput.slice(0, cursorPosition);
      const afterCursor = dslInput.slice(cursorPosition);

      // Find the word at cursor to replace
      const words = beforeCursor.split(/\s+/);
      const lastWord = words[words.length - 1] || '';
      const beforeLastWord = beforeCursor.slice(0, beforeCursor.length - lastWord.length);

      const newValue = `${beforeLastWord}${suggestion} ${afterCursor}`;
      setDslInput(newValue);
      setShowSuggestions(false);

      // Focus and set cursor
      textareaRef.current.focus();
      const newPosition = beforeLastWord.length + suggestion.length + 1;
      setTimeout(() => {
        textareaRef.current?.setSelectionRange(newPosition, newPosition);
      }, 0);
    },
    [dslInput, cursorPosition]
  );

  // Handle preview
  const handlePreview = useCallback(() => {
    if (onPreview && validation.isValid) {
      const parsed = parseDsl(dslInput);
      onPreview(parsed.terms);
    }
  }, [dslInput, onPreview, validation.isValid]);

  // Syntax highlighted display
  const highlighted = highlightDsl(dslInput);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Editor Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Code className="h-5 w-5 text-primary" />
          <span className="font-medium text-sm text-foreground">
            Query DSL
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setShowHelp(!showHelp)}>
            <HelpCircle className="mr-1 h-4 w-4" />
            Ajuda
          </Button>
          {onPreview && (
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreview}
              disabled={!validation.isValid || isPreviewLoading}
            >
              {isPreviewLoading ? (
                <Loader2 className="mr-1 h-4 w-4 animate-spin" />
              ) : (
                <Play className="mr-1 h-4 w-4" />
              )}
              Preview
            </Button>
          )}
        </div>
      </div>

      {/* Help Panel */}
      {showHelp && (
        <Card className="bg-muted">
          <CardContent className="p-4">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <h4 className="mb-2 font-semibold text-sm">
                Sintaxe de Query DSL
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <p className="mb-1 font-medium">Termos Básicos</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>
                      <code className="rounded bg-muted-foreground/20 px-1">palavra</code> - Termo
                      de inclusão
                    </li>
                    <li>
                      <code className="rounded bg-muted-foreground/20 px-1">
                        &quot;frase exata&quot;
                      </code>{' '}
                      - Frase exata
                    </li>
                    <li>
                      <code className="rounded bg-muted-foreground/20 px-1">+obrigatório</code> -
                      Deve aparecer
                    </li>
                    <li>
                      <code className="rounded bg-muted-foreground/20 px-1">-excluir</code> - Não
                      deve aparecer
                    </li>
                  </ul>
                </div>
                <div>
                  <p className="mb-1 font-medium">Operadores</p>
                  <ul className="space-y-1 text-muted-foreground">
                    <li>
                      <code className="rounded bg-muted-foreground/20 px-1">AND</code> - Ambos
                      termos (implícito)
                    </li>
                    <li>
                      <code className="rounded bg-muted-foreground/20 px-1">OR</code> - Qualquer
                      termo
                    </li>
                    <li>
                      <code className="rounded bg-muted-foreground/20 px-1">NEAR/5</code> -
                      Proximidade
                    </li>
                    <li>
                      <code className="rounded bg-muted-foreground/20 px-1">@user #tag</code> -
                      Especiais
                    </li>
                  </ul>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Exemplo:{' '}
                <code className="rounded bg-muted-foreground/20 px-1">
                  &quot;rAIz Educação&quot; +escola -spam @raizeducacao
                </code>
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editor Area */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={dslInput}
          onChange={handleInputChange}
          onFocus={() => {
            const newSuggestions = getDslSuggestions(dslInput, cursorPosition);
            setSuggestions(newSuggestions);
          }}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={placeholder}
          className={`focus:ring-ring/50 min-h-[100px] w-full resize-y rounded-md border border-border bg-muted p-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 ${!validation.isValid ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50' : ''} `}
          rows={4}
        />

        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 mt-1 w-full max-w-xs overflow-hidden rounded-md border border-border bg-card shadow-lg">
            {suggestions.map((suggestion, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-3 py-2 text-left text-xs transition-colors hover:bg-muted"
              >
                <code className="text-primary">{suggestion}</code>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Validation Status */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Status */}
        <div className="flex items-center gap-2">
          {validation.isValid ? (
            <>
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-xs text-green-600 dark:text-green-400">
                Query válida
              </span>
            </>
          ) : (
            <>
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="text-xs text-red-600 dark:text-red-400">
                Query inválida
              </span>
            </>
          )}
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>{validation.termCount} termos</span>
          {validation.requiredCount > 0 && (
            <span className="text-blue-500">+{validation.requiredCount} obrigatórios</span>
          )}
          {validation.excludeCount > 0 && (
            <span className="text-red-500">-{validation.excludeCount} excluídos</span>
          )}
        </div>
      </div>

      {/* Errors */}
      {validation.errors.length > 0 && (
        <div className="space-y-1">
          {validation.errors.map((error, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-xs text-red-600 dark:text-red-400"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Warnings */}
      {validation.warnings.length > 0 && (
        <div className="space-y-1">
          {validation.warnings.map((warning, i) => (
            <div
              key={i}
              className="flex items-start gap-2 text-xs text-yellow-600 dark:text-yellow-400"
            >
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{warning}</span>
            </div>
          ))}
        </div>
      )}

      {/* Preview Result */}
      {previewResult && (
        <Card className="bg-muted">
          <CardContent className="p-4">
            <div className="mb-2 flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <span className="font-medium text-sm">
                Preview
              </span>
            </div>
            <p className="mb-2 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">
                {previewResult.count.toLocaleString('pt-BR')}
              </span>{' '}
              menções encontradas
            </p>
            {previewResult.sample.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Amostra:
                </p>
                <div className="max-h-40 space-y-1 overflow-y-auto">
                  {previewResult.sample.slice(0, 5).map((item, i) => (
                    <div
                      key={i}
                      className="rounded bg-muted-foreground/10 p-2 text-xs text-muted-foreground"
                    >
                      {(item.content as string)?.slice(0, 150)}...
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Highlighted Preview (collapsed by default) */}
      {dslInput && highlighted.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
            Ver tokens parseados
          </summary>
          <div className="mt-2 flex flex-wrap gap-1 rounded bg-muted p-2 font-mono">
            {highlighted.map((part, i) => (
              <span
                key={i}
                className={`rounded px-1 ${part.type === 'phrase' ? 'bg-blue-500/20 text-blue-400' : ''} ${part.type === 'word' ? 'bg-gray-500/20 text-foreground' : ''} ${part.type === 'and' || part.type === 'or' ? 'bg-purple-500/20 font-bold text-purple-400' : ''} ${part.type === 'not' || part.type === 'minus' ? 'bg-red-500/20 text-red-400' : ''} ${part.type === 'plus' ? 'bg-green-500/20 text-green-400' : ''} ${part.type === 'near' ? 'bg-yellow-500/20 text-yellow-400' : ''} ${part.type === 'hashtag' ? 'bg-cyan-500/20 text-cyan-400' : ''} ${part.type === 'mention' ? 'bg-pink-500/20 text-pink-400' : ''} `}
              >
                {part.text}
              </span>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

export default DslQueryEditor;
