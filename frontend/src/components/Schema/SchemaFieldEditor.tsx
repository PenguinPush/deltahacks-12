import { useCallback } from 'react';
import { Trash2 } from 'lucide-react';
import type { SchemaField } from '@/types';

interface SchemaFieldEditorProps {
  field: SchemaField;
  onChange: (field: SchemaField) => void;
  onDelete: () => void;
}

const FIELD_TYPES: SchemaField['type'][] = ['string', 'number', 'boolean', 'object', 'array'];

export function SchemaFieldEditor({ field, onChange, onDelete }: SchemaFieldEditorProps): JSX.Element {
  const handleChange = useCallback(
    (key: keyof SchemaField, value: string | boolean) => {
      onChange({ ...field, [key]: value });
    },
    [field, onChange]
  );

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-800/50 rounded-md">
      {/* Field Name */}
      <input
        type="text"
        value={field.name}
        onChange={(e) => handleChange('name', e.target.value)}
        placeholder="field_name"
        className="flex-1 px-2 py-1 bg-gray-900 border border-gray-700 rounded text-sm text-gray-200 font-mono"
      />

      {/* Field Type */}
      <select
        value={field.type}
        onChange={(e) => handleChange('type', e.target.value)}
        className="px-2 py-1 bg-gray-900 border border-gray-700 rounded text-sm text-gray-200"
      >
        {FIELD_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>

      {/* Required Toggle */}
      <label className="flex items-center gap-1 text-xs text-gray-400 cursor-pointer">
        <input
          type="checkbox"
          checked={field.required}
          onChange={(e) => handleChange('required', e.target.checked)}
          className="rounded border-gray-600"
        />
        required
      </label>

      {/* Delete Button */}
      <button
        type="button"
        onClick={onDelete}
        className="p-1 text-gray-500 hover:text-red-400 transition-colors"
        aria-label="Delete field"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default SchemaFieldEditor;
