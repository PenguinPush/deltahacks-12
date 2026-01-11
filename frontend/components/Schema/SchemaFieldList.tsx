import { useCallback } from 'react';
import { Plus } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import type { SchemaField } from '@/types';
import { SchemaFieldEditor } from './SchemaFieldEditor';

interface SchemaFieldListProps {
  fields: SchemaField[];
  onChange: (fields: SchemaField[]) => void;
  title: string;
  description?: string;
}

export function SchemaFieldList({ fields, onChange, title, description }: SchemaFieldListProps): JSX.Element {
  const addField = useCallback(() => {
    const newField: SchemaField = {
      id: uuidv4(),
      name: '',
      type: 'string',
      required: false,
    };
    onChange([...fields, newField]);
  }, [fields, onChange]);

  const updateField = useCallback(
    (index: number, updatedField: SchemaField) => {
      const newFields = [...fields];
      newFields[index] = updatedField;
      onChange(newFields);
    },
    [fields, onChange]
  );

  const deleteField = useCallback(
    (index: number) => {
      const newFields = [...fields];
      newFields.splice(index, 1);
      onChange(newFields);
    },
    [fields, onChange]
  );

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h4 className="text-sm font-medium text-gray-300">{title}</h4>
          {description && (
            <p className="text-xs text-gray-500">{description}</p>
          )}
        </div>
        <button
          type="button"
          onClick={addField}
          className="flex items-center gap-1 px-2 py-1 text-xs text-primary-400 hover:text-primary-300 transition-colors"
        >
          <Plus className="w-3 h-3" />
          Add Field
        </button>
      </div>

      {/* Field List */}
      <div className="space-y-2">
        {fields.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500 bg-gray-800/30 rounded-md border border-dashed border-gray-700">
            No fields defined. Click "Add Field" to start.
          </div>
        ) : (
          fields.map((field, index) => (
            <SchemaFieldEditor
              key={field.id}
              field={field}
              onChange={(updated) => updateField(index, updated)}
              onDelete={() => deleteField(index)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default SchemaFieldList;
