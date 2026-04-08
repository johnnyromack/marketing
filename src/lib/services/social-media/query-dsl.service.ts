import type { QueryTerm } from '@/lib/schemas/social-media.schema';

// ── Token types for highlighting ─────────────────────────────────────────────
export type DslTokenType =
  | 'word'
  | 'phrase'
  | 'plus'
  | 'minus'
  | 'and'
  | 'or'
  | 'not'
  | 'near'
  | 'hashtag'
  | 'mention'
  | 'whitespace';

export interface DslToken {
  type: DslTokenType;
  text: string;
}

// ── Validation result ────────────────────────────────────────────────────────
export interface DslValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  termCount: number;
  requiredCount: number;
  excludeCount: number;
}

// ── Parse result ─────────────────────────────────────────────────────────────
export interface DslParseResult {
  terms: QueryTerm[];
  tokens: DslToken[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal tokenizer
// ─────────────────────────────────────────────────────────────────────────────
function tokenize(dsl: string): DslToken[] {
  const tokens: DslToken[] = [];
  let i = 0;

  while (i < dsl.length) {
    const ch = dsl[i];

    // Whitespace
    if (/\s/.test(ch)) {
      let ws = '';
      while (i < dsl.length && /\s/.test(dsl[i])) ws += dsl[i++];
      tokens.push({ type: 'whitespace', text: ws });
      continue;
    }

    // Quoted phrase
    if (ch === '"') {
      let phrase = '"';
      i++;
      while (i < dsl.length && dsl[i] !== '"') phrase += dsl[i++];
      phrase += '"';
      if (i < dsl.length) i++; // consume closing quote
      tokens.push({ type: 'phrase', text: phrase });
      continue;
    }

    // Plus (required)
    if (ch === '+') {
      i++;
      let word = '';
      while (i < dsl.length && !/\s/.test(dsl[i])) word += dsl[i++];
      tokens.push({ type: 'plus', text: `+${word}` });
      continue;
    }

    // Minus (exclude)
    if (ch === '-') {
      i++;
      let word = '';
      while (i < dsl.length && !/\s/.test(dsl[i])) word += dsl[i++];
      tokens.push({ type: 'minus', text: `-${word}` });
      continue;
    }

    // Hashtag
    if (ch === '#') {
      let tag = '#';
      i++;
      while (i < dsl.length && !/\s/.test(dsl[i])) tag += dsl[i++];
      tokens.push({ type: 'hashtag', text: tag });
      continue;
    }

    // Mention
    if (ch === '@') {
      let mention = '@';
      i++;
      while (i < dsl.length && !/\s/.test(dsl[i])) mention += dsl[i++];
      tokens.push({ type: 'mention', text: mention });
      continue;
    }

    // Word / keyword
    let word = '';
    while (i < dsl.length && !/\s/.test(dsl[i])) word += dsl[i++];

    if (word.toUpperCase() === 'AND') {
      tokens.push({ type: 'and', text: word });
    } else if (word.toUpperCase() === 'OR') {
      tokens.push({ type: 'or', text: word });
    } else if (word.toUpperCase() === 'NOT') {
      tokens.push({ type: 'not', text: word });
    } else if (/^NEAR\/\d+$/i.test(word)) {
      tokens.push({ type: 'near', text: word });
    } else {
      tokens.push({ type: 'word', text: word });
    }
  }

  return tokens;
}

// ─────────────────────────────────────────────────────────────────────────────
// parseDsl — convert DSL string → QueryTerm[]
// ─────────────────────────────────────────────────────────────────────────────
export function parseDsl(dsl: string): DslParseResult {
  const tokens = tokenize(dsl.trim());
  const terms: QueryTerm[] = [];

  for (const token of tokens) {
    if (token.type === 'whitespace') continue;

    if (token.type === 'plus') {
      const term = token.text.slice(1).trim();
      if (term) terms.push({ term, type: 'required' });
    } else if (token.type === 'minus') {
      const term = token.text.slice(1).trim();
      if (term) terms.push({ term, type: 'exclude' });
    } else if (token.type === 'not') {
      // NOT followed by next word — handled implicitly (next loop will get the exclude word)
    } else if (token.type === 'phrase') {
      const term = token.text.replace(/^"|"$/g, '');
      if (term) terms.push({ term, type: 'include' });
    } else if (
      token.type === 'word' ||
      token.type === 'hashtag' ||
      token.type === 'mention'
    ) {
      if (token.text) terms.push({ term: token.text, type: 'include' });
    }
    // 'and', 'or', 'near' are structural — skip
  }

  return { terms, tokens };
}

// ─────────────────────────────────────────────────────────────────────────────
// termsToDsl — convert QueryTerm[] → DSL string
// ─────────────────────────────────────────────────────────────────────────────
export function termsToDsl(terms: QueryTerm[]): string {
  return terms
    .map((t) => {
      const needsQuotes = t.term.includes(' ');
      const text = needsQuotes ? `"${t.term}"` : t.term;
      if (t.type === 'required') return `+${text}`;
      if (t.type === 'exclude') return `-${text}`;
      return text;
    })
    .join(' ');
}

// ─────────────────────────────────────────────────────────────────────────────
// validateDsl
// ─────────────────────────────────────────────────────────────────────────────
export function validateDsl(dsl: string): DslValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!dsl.trim()) {
    return { isValid: false, errors: ['Query não pode estar vazia'], warnings, termCount: 0, requiredCount: 0, excludeCount: 0 };
  }

  // Unclosed quotes
  const quoteCount = (dsl.match(/"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    errors.push('Aspas não fechadas na query');
  }

  const { terms } = parseDsl(dsl);
  const termCount = terms.length;
  const requiredCount = terms.filter((t) => t.type === 'required').length;
  const excludeCount = terms.filter((t) => t.type === 'exclude').length;

  if (termCount === 0) {
    errors.push('Nenhum termo encontrado na query');
  }

  if (excludeCount > 0 && termCount === excludeCount) {
    errors.push('A query não pode conter apenas termos de exclusão');
  }

  if (termCount > 50) {
    warnings.push('Queries com muitos termos podem ser lentas');
  }

  if (dsl.length > 500) {
    warnings.push('Query muito longa — considere simplificar');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    termCount,
    requiredCount,
    excludeCount,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// highlightDsl — tokenize for coloured display
// ─────────────────────────────────────────────────────────────────────────────
export function highlightDsl(dsl: string): DslToken[] {
  return tokenize(dsl).filter((t) => t.type !== 'whitespace');
}

// ─────────────────────────────────────────────────────────────────────────────
// getDslSuggestions
// ─────────────────────────────────────────────────────────────────────────────
const OPERATOR_SUGGESTIONS = ['AND', 'OR', 'NOT', 'NEAR/5'];

export function getDslSuggestions(dsl: string, cursorPos: number): string[] {
  const beforeCursor = dsl.slice(0, cursorPos);
  const words = beforeCursor.split(/\s+/);
  const currentWord = words[words.length - 1] ?? '';

  if (!currentWord) return [];

  // Suggest operators
  const upper = currentWord.toUpperCase();
  if (upper.length >= 2) {
    return OPERATOR_SUGGESTIONS.filter((op) => op.startsWith(upper) && op !== upper);
  }

  return [];
}

// ─────────────────────────────────────────────────────────────────────────────
// _getDslSyntaxHelp — reference text (used by help panel)
// ─────────────────────────────────────────────────────────────────────────────
export function _getDslSyntaxHelp(): string {
  return `
DSL Syntax Reference
====================
palavra          → termo de inclusão simples
"frase exata"    → frase com espaços
+obrigatório     → deve estar presente
-excluir         → não deve aparecer
AND              → ambos (comportamento padrão)
OR               → qualquer um dos termos
NOT palavra      → equivale a -palavra
NEAR/N           → proximidade de N palavras
@usuario         → menção a usuário
#hashtag         → hashtag
  `.trim();
}
