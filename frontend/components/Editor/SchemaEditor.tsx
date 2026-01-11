import { useState, useCallback } from 'react';

/**
 * Props for SchemaEditor component
 */
interface SchemaEditorProps {
  /** Current schema value (JSON object) */
  value: Record<string, unknown>;
  /** Called when schema changes */
  onChange: (schema: Record<string, unknown>) => void;
  /** Whether the editor is read-only */
  readOnly?: boolean;
  /** Title for the editor */
  title?: string;
}

/**
 * Schema field type
 */
type SchemaFieldType = 'string' | 'number' | 'boolean' | 'object' | 'array';

/**
 * Schema field definition
 */
interface SchemaField {
  name: string;
  type: SchemaFieldType;
  required: boolean;
  description?: string;
  example?: unknown;
}

/**
 * SchemaEditor Component
 *
 * Visual editor for JSON schemas.
 * Used to define input/output schemas for API nodes.
 *
 * TODO: Implement full JSON Schema support
 * TODO: Add nested object editing
 * TODO: Add array item type editing
 * TODO: Add schema validation
 * TODO: Add schema import from JSON
 * TODO: Add schema generation from sample data
 */
export function SchemaEditor({
  value,
  onChange,
  readOnly = false,
  title = 'Schema',
}: SchemaEditorProps): JSX.Element {
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonValue, setJsonValue] = useState(() => JSON.stringify(value, null, 2));
  const [error, setError] = useState<string | null>(null);

  /**
   * Parse schema into field list
   */
  const parseSchemaToFields = useCallback((schema: Record<string, unknown>): SchemaField[] => {
    const properties = (schema.properties || {}) as Record<string, Record<string, unknown>>;
    const required = (schema.required || []) as string[];

    return Object.entries(properties).map(([name, prop]) => ({
      name,
      type: (prop.type || 'string') as SchemaFieldType,
      required: required.includes(name),
      description: prop.description as string | undefined,
      example: prop.example,
    }));
  }, []);

  /**
   * Convert fields back to schema
   */
  const fieldsToSchema = useCallback((fields: SchemaField[]): Record<string, unknown> => {
    const properties: Record<string, unknown> = {};
    const required: string[] = [];

    fields.forEach((field) => {
      properties[field.name] = {
        type: field.type,
        ...(field.description && { description: field.description }),
        ...(field.example !== undefined && { example: field.example }),
      };
      if (field.required) {
        required.push(field.name);
      }
    });

    return {
      type: 'object',
      properties,
      ...(required.length > 0 && { required }),
    };
  }, []);

  const [fields, setFields] = useState<SchemaField[]>(() => parseSchemaToFields(value));

  /**
   * Add a new field
   */
  const addField = useCallback(() => {
    const newField: SchemaField = {
      name: `field${fields.length + 1}`,
      type: 'string',
      required: false,
    };
    const newFields = [...fields, newField];
    setFields(newFields);
    onChange(fieldsToSchema(newFields));
  }, [fields, onChange, fieldsToSchema]);

  /**
   * Update a field
   */
  const updateField = useCallback(
    (index: number, updates: Partial<SchemaField>) => {
      const newFields = [...fields];
      const field = newFields[index];
      if (field) {
        newFields[index] = { ...field, ...updates };
        setFields(newFields);
        onChange(fieldsToSchema(newFields));
      }
    },
    [fields, onChange, fieldsToSchema]
  );

  /**
   * Remove a field
   */
  const removeField = useCallback(
    (index: number) => {
      const newFields = fields.filter((_, i) => i !== index);
      setFields(newFields);
      onChange(fieldsToSchema(newFields));
    },
    [fields, onChange, fieldsToSchema]
  );

  /**
   * Handle JSON mode changes
   */
  const handleJsonChange = useCallback(
    (newValue: string) => {
      setJsonValue(newValue);
      try {
        const parsed = JSON.parse(newValue) as Record<string, unknown>;
        setError(null);
        setFields(parseSchemaToFields(parsed));
        onChange(parsed);
      } catch {
        setError('Invalid JSON');
      }
    },
    [onChange, parseSchemaToFields]
  );

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-sm font-medium text-gray-300">{title}</span>
        <button
          type="button"
          onClick={() => setJsonMode(!jsonMode)}
          className="text-xs text-gray-500 hover:text-gray-300"
        >
          {jsonMode ? 'Visual' : 'JSON'}
        </button>
      </div>

      {/* Content */}
      <div className="p-3 bg-black">
        {jsonMode ? (
          <div>
            <textarea
              value={jsonValue}
              onChange={(e) => handleJsonChange(e.target.value)}
              readOnly={readOnly}
              rows={10}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-md
                         text-sm font-mono text-gray-200 resize-none"
            />
            {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
          </div>
        ) : (
          <div className="space-y-2">
            {/* Fields */}
            {fields.map((field, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-gray-800 rounded"
              >
                <input
                  type="text"
                  value={field.name}
                  onChange={(e) => updateField(index, { name: e.target.value })}
                  disabled={readOnly}
                  placeholder="name"
                  className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-gray-200"
                />
                <select
                  value={field.type}
                  onChange={(e) =>
                    updateField(index, { type: e.target.value as SchemaFieldType })
                  }
                  disabled={readOnly}
                  className="px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-gray-200"
                >
                  <option value="string">string</option>
                  <option value="number">number</option>
                  <option value="boolean">boolean</option>
                  <option value="object">object</option>
                  <option value="array">array</option>
                </select>
                <label className="flex items-center gap-1 text-xs text-gray-400">
                  <input
                    type="checkbox"
                    checked={field.required}
                    onChange={(e) => updateField(index, { required: e.target.checked })}
                    disabled={readOnly}
                    className="rounded border-gray-600"
                  />
                  Req
                </label>
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => removeField(index)}
                    className="text-gray-500 hover:text-red-400"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            {/* Add Field Button */}
            {!readOnly && (
              <button
                type="button"
                onClick={addField}
                className="w-full py-2 text-sm text-gray-500 hover:text-gray-300
                           border border-dashed border-gray-700 rounded hover:border-gray-600"
              >
                + Add Field
              </button>
            )}

            {/* Empty State */}
            {fields.length === 0 && readOnly && (
              <p className="text-center text-sm text-gray-500 py-4">No schema defined</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default SchemaEditor;
