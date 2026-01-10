import type { FieldMapping } from '@/types';

/**
 * Variable reference regex (e.g., {{nodeName.field}})
 */
const VARIABLE_REGEX = /\{\{([^}]+)\}\}/g;

/**
 * Get a nested value from an object using dot notation path
 */
export function getValueByPath(obj: unknown, path: string): unknown {
  if (!path || obj === null || obj === undefined) return undefined;

  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) return undefined;

    // Handle array indexing (e.g., "items[0]")
    const arrayMatch = part.match(/^(\w+)\[(\d+)\]$/);
    if (arrayMatch) {
      const [, key, index] = arrayMatch;
      current = (current as Record<string, unknown>)[key ?? ''];
      if (Array.isArray(current)) {
        current = current[parseInt(index ?? '0', 10)];
      } else {
        return undefined;
      }
    } else {
      current = (current as Record<string, unknown>)[part];
    }
  }

  return current;
}

/**
 * Set a nested value in an object using dot notation path
 */
export function setValueByPath(
  obj: Record<string, unknown>,
  path: string,
  value: unknown
): Record<string, unknown> {
  if (!path) return obj;

  const parts = path.split('.');
  const result = { ...obj };
  let current: Record<string, unknown> = result;

  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!part) continue;

    if (!(part in current) || current[part] === null || typeof current[part] !== 'object') {
      current[part] = {};
    } else {
      current[part] = { ...(current[part] as Record<string, unknown>) };
    }
    current = current[part] as Record<string, unknown>;
  }

  const lastPart = parts[parts.length - 1];
  if (lastPart) {
    current[lastPart] = value;
  }

  return result;
}

/**
 * Resolve variable references in a string
 *
 * @param template String containing {{nodeId.path}} references
 * @param context Map of node IDs to their output data
 */
export function resolveVariables(
  template: string,
  context: Record<string, unknown>
): string {
  return template.replace(VARIABLE_REGEX, (match, path) => {
    const value = getValueByPath(context, path);

    if (value === undefined || value === null) {
      return match; // Keep original reference if not found
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  });
}

/**
 * Apply field mappings to transform data
 */
export function applyFieldMappings(
  source: Record<string, unknown>,
  mappings: FieldMapping[]
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  mappings.forEach((mapping) => {
    const sourceValue = getValueByPath(source, mapping.sourceField);

    if (sourceValue !== undefined) {
      let transformedValue: unknown = sourceValue;

      // Apply transform expression if provided
      if (mapping.transform) {
        try {
          // Simple transform expressions
          // TODO: Implement safe expression evaluation
          transformedValue = evaluateTransform(sourceValue, mapping.transform);
        } catch (error) {
          console.error(`Transform error for ${mapping.id}:`, error);
        }
      }

      setValueByPath(result, mapping.targetField, transformedValue);
    }
  });

  return result;
}

/**
 * Evaluate a simple transform expression
 *
 * Supports basic operations:
 * - .toUpperCase()
 * - .toLowerCase()
 * - .trim()
 * - .toString()
 * - .length
 * - Math operations
 */
function evaluateTransform(value: unknown, expression: string): unknown {
  const expr = expression.trim();

  // String methods
  if (typeof value === 'string') {
    if (expr === '.toUpperCase()') return value.toUpperCase();
    if (expr === '.toLowerCase()') return value.toLowerCase();
    if (expr === '.trim()') return value.trim();
    if (expr === '.length') return value.length;
  }

  // Array methods
  if (Array.isArray(value)) {
    if (expr === '.length') return value.length;
    if (expr === '.first') return value[0];
    if (expr === '.last') return value[value.length - 1];
    if (expr === '.reverse()') return [...value].reverse();
  }

  // Number operations
  if (typeof value === 'number') {
    if (expr === '.toString()') return String(value);
    if (expr.startsWith('+ ')) {
      const num = parseFloat(expr.slice(2));
      return value + num;
    }
    if (expr.startsWith('* ')) {
      const num = parseFloat(expr.slice(2));
      return value * num;
    }
  }

  // Type conversion
  if (expr === '.toString()') return String(value);
  if (expr === '.toNumber()' && typeof value === 'string') {
    return parseFloat(value) || 0;
  }
  if (expr === '.toBoolean()') return Boolean(value);

  // Default - return original value
  return value;
}

/**
 * Flatten a nested object into dot notation paths
 */
export function flattenObject(
  obj: Record<string, unknown>,
  prefix = ''
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(result, flattenObject(value as Record<string, unknown>, path));
    } else {
      result[path] = value;
    }
  }

  return result;
}

/**
 * Unflatten dot notation paths back to nested object
 */
export function unflattenObject(
  flattened: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [path, value] of Object.entries(flattened)) {
    setValueByPath(result, path, value);
  }

  return result;
}

/**
 * Extract all field paths from an object
 */
export function extractFieldPaths(obj: unknown, prefix = ''): string[] {
  const paths: string[] = [];

  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return paths;
  }

  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    paths.push(path);

    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      paths.push(...extractFieldPaths(value, path));
    }
  }

  return paths;
}

export default {
  getValueByPath,
  setValueByPath,
  resolveVariables,
  applyFieldMappings,
  flattenObject,
  unflattenObject,
  extractFieldPaths,
};
