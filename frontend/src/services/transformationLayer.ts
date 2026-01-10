/**
 * Data Transformation Layer
 * Built-in transformers for data manipulation between nodes
 */

import type { Transformer, TransformerConfig, TransformationPreview } from '../types/workflow';

// ============================================
// STRING TRANSFORMERS
// ============================================

function transformString(value: unknown, config: TransformerConfig): unknown {
  if (typeof value !== 'string') {
    value = String(value ?? '');
  }
  const str = value as string;

  switch (config.stringOperation) {
    case 'uppercase':
      return str.toUpperCase();
    case 'lowercase':
      return str.toLowerCase();
    case 'trim':
      return str.trim();
    case 'replace':
      if (config.pattern && config.replacement !== undefined) {
        return str.replace(new RegExp(config.pattern, 'g'), config.replacement);
      }
      return str;
    case 'split':
      return str.split(config.pattern || ',');
    case 'join':
      if (Array.isArray(value)) {
        return value.join(config.pattern || ',');
      }
      return str;
    case 'substring': {
      const parts = (config.pattern || '0').split(',').map(Number);
      const start = parts[0] ?? 0;
      const end = parts[1];
      return str.substring(start, end !== undefined ? end : undefined);
    }
    default:
      return str;
  }
}

// ============================================
// NUMBER TRANSFORMERS
// ============================================

function transformNumber(value: unknown, config: TransformerConfig): unknown {
  let num: number;

  if (config.numberOperation === 'parse') {
    num = parseFloat(String(value));
  } else {
    num = typeof value === 'number' ? value : parseFloat(String(value));
  }

  if (isNaN(num)) return null;

  switch (config.numberOperation) {
    case 'round': {
      const decimals = config.decimals ?? 0;
      const factor = Math.pow(10, decimals);
      return Math.round(num * factor) / factor;
    }
    case 'floor':
      return Math.floor(num);
    case 'ceil':
      return Math.ceil(num);
    case 'abs':
      return Math.abs(num);
    case 'parse':
      return num;
    default:
      return num;
  }
}

// ============================================
// DATE TRANSFORMERS
// ============================================

function transformDate(value: unknown, config: TransformerConfig): unknown {
  let date: Date;

  if (value instanceof Date) {
    date = value;
  } else if (typeof value === 'number') {
    date = new Date(value);
  } else if (typeof value === 'string') {
    date = new Date(value);
  } else {
    return null;
  }

  if (isNaN(date.getTime())) return null;

  const format = config.outputFormat || 'ISO';

  switch (format) {
    case 'ISO':
      return date.toISOString();
    case 'date':
      return date.toLocaleDateString();
    case 'time':
      return date.toLocaleTimeString();
    case 'datetime':
      return date.toLocaleString();
    case 'timestamp':
      return date.getTime();
    case 'relative':
      return getRelativeTime(date);
    default:
      // Custom format
      return formatDate(date, format);
  }
}

function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
  if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
  if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
  return date.toLocaleDateString();
}

function formatDate(date: Date, format: string): string {
  const tokens: Record<string, string> = {
    'YYYY': date.getFullYear().toString(),
    'YY': date.getFullYear().toString().slice(-2),
    'MM': (date.getMonth() + 1).toString().padStart(2, '0'),
    'M': (date.getMonth() + 1).toString(),
    'DD': date.getDate().toString().padStart(2, '0'),
    'D': date.getDate().toString(),
    'HH': date.getHours().toString().padStart(2, '0'),
    'H': date.getHours().toString(),
    'mm': date.getMinutes().toString().padStart(2, '0'),
    'm': date.getMinutes().toString(),
    'ss': date.getSeconds().toString().padStart(2, '0'),
    's': date.getSeconds().toString(),
  };

  let result = format;
  for (const [token, value] of Object.entries(tokens)) {
    result = result.replace(token, value);
  }
  return result;
}

// ============================================
// JSON PATH TRANSFORMER
// ============================================

function transformJsonPath(value: unknown, config: TransformerConfig): unknown {
  if (!config.jsonPath) return value;

  const path = config.jsonPath.replace(/^\$\.?/, '').split('.');
  let current: unknown = value;

  for (const segment of path) {
    if (current === null || current === undefined) return null;

    // Handle array index
    const arrayMatch = segment.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const key = arrayMatch[1];
      const index = arrayMatch[2];
      if (key) {
        current = (current as Record<string, unknown>)[key];
      }
      if (Array.isArray(current) && index) {
        current = current[parseInt(index, 10)];
      } else if (!Array.isArray(current)) {
        return null;
      }
    } else {
      current = (current as Record<string, unknown>)[segment];
    }
  }

  return current;
}

// ============================================
// TEMPLATE TRANSFORMER
// ============================================

function transformTemplate(value: unknown, config: TransformerConfig): unknown {
  if (!config.template) return value;

  let result = config.template;
  const data = typeof value === 'object' && value !== null ? value : { value };

  // Replace {{key}} placeholders
  result = result.replace(/\{\{(\w+(?:\.\w+)*)\}\}/g, (_, path) => {
    const parts = path.split('.');
    let current: unknown = data;

    for (const part of parts) {
      if (current === null || current === undefined) return '';
      current = (current as Record<string, unknown>)[part];
    }

    return current !== undefined && current !== null ? String(current) : '';
  });

  // Handle {{#if}} conditionals
  result = result.replace(/\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (_, key, content) => {
    const val = (data as Record<string, unknown>)[key];
    return val ? content : '';
  });

  return result;
}

// ============================================
// MATH TRANSFORMER
// ============================================

function transformMath(value: unknown, config: TransformerConfig): unknown {
  if (!config.expression) return value;

  try {
    // Simple expression evaluator (basic math only)
    let expr = config.expression;

    // Replace variables
    if (typeof value === 'object' && value !== null) {
      for (const [key, val] of Object.entries(value)) {
        if (typeof val === 'number') {
          expr = expr.replace(new RegExp(`\\b${key}\\b`, 'g'), String(val));
        }
      }
    } else if (typeof value === 'number') {
      expr = expr.replace(/\bvalue\b/g, String(value));
    }

    // Evaluate (only allow safe math operations)
    if (!/^[\d\s+\-*/%().]+$/.test(expr)) {
      throw new Error('Invalid expression');
    }

    return Function(`"use strict"; return (${expr})`)();
  } catch {
    return null;
  }
}

// ============================================
// CONDITIONAL TRANSFORMER
// ============================================

function transformConditional(value: unknown, config: TransformerConfig): unknown {
  if (!config.condition) return value;

  try {
    let condition = config.condition;

    // Replace variables
    if (typeof value === 'object' && value !== null) {
      for (const [key, val] of Object.entries(value)) {
        const replacement = typeof val === 'string' ? `"${val}"` : String(val);
        condition = condition.replace(new RegExp(`\\b${key}\\b`, 'g'), replacement);
      }
    } else {
      const replacement = typeof value === 'string' ? `"${value}"` : String(value);
      condition = condition.replace(/\bvalue\b/g, replacement);
    }

    // Evaluate condition
    const result = Function(`"use strict"; return (${condition})`)();
    return result ? config.thenValue : config.elseValue;
  } catch {
    return config.elseValue;
  }
}

// ============================================
// ARRAY TRANSFORMERS
// ============================================

function transformArrayMap(value: unknown, config: TransformerConfig): unknown {
  if (!Array.isArray(value)) return value;

  if (config.jsonPath) {
    return value.map(item => transformJsonPath(item, config));
  }

  if (config.template) {
    return value.map(item => transformTemplate(item, config));
  }

  return value;
}

function transformArrayFilter(value: unknown, config: TransformerConfig): unknown {
  if (!Array.isArray(value)) return value;

  if (!config.condition) return value;

  return value.filter(item => {
    try {
      let condition = config.condition!;
      if (typeof item === 'object' && item !== null) {
        for (const [key, val] of Object.entries(item)) {
          const replacement = typeof val === 'string' ? `"${val}"` : String(val);
          condition = condition.replace(new RegExp(`\\b${key}\\b`, 'g'), replacement);
        }
      }
      return Function(`"use strict"; return (${condition})`)();
    } catch {
      return false;
    }
  });
}

// ============================================
// CUSTOM JS TRANSFORMER
// ============================================

function transformCustomJs(value: unknown, config: TransformerConfig): unknown {
  if (!config.code) return value;

  try {
    // Create a sandboxed function
    const fn = new Function('input', `"use strict"; ${config.code}`);
    return fn(value);
  } catch (e) {
    console.error('Custom JS transform error:', e);
    return null;
  }
}

// ============================================
// MAIN TRANSFORM FUNCTION
// ============================================

export function transform(
  value: unknown,
  transformer: Transformer
): TransformationPreview {
  try {
    let output: unknown;

    switch (transformer.type) {
      case 'string_format':
        output = transformString(value, transformer.config);
        break;
      case 'number_format':
        output = transformNumber(value, transformer.config);
        break;
      case 'date_format':
        output = transformDate(value, transformer.config);
        break;
      case 'json_path':
        output = transformJsonPath(value, transformer.config);
        break;
      case 'template':
        output = transformTemplate(value, transformer.config);
        break;
      case 'math':
        output = transformMath(value, transformer.config);
        break;
      case 'conditional':
        output = transformConditional(value, transformer.config);
        break;
      case 'array_map':
        output = transformArrayMap(value, transformer.config);
        break;
      case 'array_filter':
        output = transformArrayFilter(value, transformer.config);
        break;
      case 'custom_js':
        output = transformCustomJs(value, transformer.config);
        break;
      default:
        output = value;
    }

    return {
      input: value,
      output,
      success: true,
    };
  } catch (e) {
    return {
      input: value,
      output: null,
      success: false,
      error: (e as Error).message,
    };
  }
}

// ============================================
// PRESET TRANSFORMERS
// ============================================

export const presetTransformers: Transformer[] = [
  {
    id: 'uppercase',
    type: 'string_format',
    name: 'Uppercase',
    config: { stringOperation: 'uppercase' },
  },
  {
    id: 'lowercase',
    type: 'string_format',
    name: 'Lowercase',
    config: { stringOperation: 'lowercase' },
  },
  {
    id: 'trim',
    type: 'string_format',
    name: 'Trim Whitespace',
    config: { stringOperation: 'trim' },
  },
  {
    id: 'round',
    type: 'number_format',
    name: 'Round Number',
    config: { numberOperation: 'round', decimals: 0 },
  },
  {
    id: 'round2',
    type: 'number_format',
    name: 'Round to 2 Decimals',
    config: { numberOperation: 'round', decimals: 2 },
  },
  {
    id: 'parse_number',
    type: 'number_format',
    name: 'Parse Number',
    config: { numberOperation: 'parse' },
  },
  {
    id: 'iso_date',
    type: 'date_format',
    name: 'ISO Date',
    config: { outputFormat: 'ISO' },
  },
  {
    id: 'readable_date',
    type: 'date_format',
    name: 'Readable Date',
    config: { outputFormat: 'datetime' },
  },
  {
    id: 'relative_date',
    type: 'date_format',
    name: 'Relative Time',
    config: { outputFormat: 'relative' },
  },
  {
    id: 'timestamp',
    type: 'date_format',
    name: 'Unix Timestamp',
    config: { outputFormat: 'timestamp' },
  },
];

export function getPresetTransformer(id: string): Transformer | undefined {
  return presetTransformers.find(t => t.id === id);
}
