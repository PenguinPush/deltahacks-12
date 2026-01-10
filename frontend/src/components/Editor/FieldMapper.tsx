import { useState, useCallback } from 'react';
import type { FieldMapping } from '@/types';

/**
 * Props for FieldMapper component
 */
interface FieldMapperProps {
  /** Current field mappings */
  mappings: FieldMapping[];
  /** Called when mappings change */
  onChange: (mappings: FieldMapping[]) => void;
  /** Source schema fields */
  sourceFields: string[];
  /** Target schema fields */
  targetFields: string[];
  /** Whether the mapper is read-only */
  readOnly?: boolean;
}

/**
 * FieldMapper Component
 *
 * Visual field mapping editor for transform nodes.
 * Allows users to map fields from source to target with optional transformations.
 *
 * TODO: Add drag-and-drop connection interface
 * TODO: Add visual line connections between fields
 * TODO: Add expression editor for transformations
 * TODO: Add type validation between fields
 * TODO: Add auto-mapping suggestions
 * TODO: Add preview of mapped data
 */
export function FieldMapper({
  mappings,
  onChange,
  sourceFields,
  targetFields,
  readOnly = false,
}: FieldMapperProps): JSX.Element {
  const [showAddForm, setShowAddForm] = useState(false);

  /**
   * Add a new mapping
   */
  const addMapping = useCallback(
    (sourceField: string, targetField: string) => {
      const newMapping: FieldMapping = {
        id: `mapping-${Date.now()}`,
        sourceField,
        targetField,
      };
      onChange([...mappings, newMapping]);
      setShowAddForm(false);
    },
    [mappings, onChange]
  );

  /**
   * Update a mapping
   */
  const updateMapping = useCallback(
    (id: string, updates: Partial<FieldMapping>) => {
      const newMappings = mappings.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      );
      onChange(newMappings);
    },
    [mappings, onChange]
  );

  /**
   * Remove a mapping
   */
  const removeMapping = useCallback(
    (id: string) => {
      onChange(mappings.filter((m) => m.id !== id));
    },
    [mappings, onChange]
  );

  /**
   * Get unmapped source fields
   */
  const getUnmappedSourceFields = useCallback((): string[] => {
    const mappedSources = new Set(mappings.map((m) => m.sourceField));
    return sourceFields.filter((f) => !mappedSources.has(f));
  }, [sourceFields, mappings]);

  /**
   * Get unmapped target fields
   */
  const getUnmappedTargetFields = useCallback((): string[] => {
    const mappedTargets = new Set(mappings.map((m) => m.targetField));
    return targetFields.filter((f) => !mappedTargets.has(f));
  }, [targetFields, mappings]);

  return (
    <div className="border border-gray-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 border-b border-gray-700">
        <span className="text-sm font-medium text-gray-300">Field Mappings</span>
        {!readOnly && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="text-xs text-primary-400 hover:text-primary-300"
          >
            + Add Mapping
          </button>
        )}
      </div>

      {/* Content */}
      <div className="p-3 bg-gray-900 space-y-2">
        {/* Existing Mappings */}
        {mappings.map((mapping) => (
          <div
            key={mapping.id}
            className="flex items-center gap-2 p-2 bg-gray-800 rounded"
          >
            {/* Source Field */}
            <select
              value={mapping.sourceField}
              onChange={(e) => updateMapping(mapping.id, { sourceField: e.target.value })}
              disabled={readOnly}
              className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-gray-200"
            >
              <option value={mapping.sourceField}>{mapping.sourceField}</option>
              {getUnmappedSourceFields().map((field) => (
                <option key={field} value={field}>
                  {field}
                </option>
              ))}
            </select>

            {/* Arrow */}
            <span className="text-gray-500">→</span>

            {/* Target Field */}
            <select
              value={mapping.targetField}
              onChange={(e) => updateMapping(mapping.id, { targetField: e.target.value })}
              disabled={readOnly}
              className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-gray-200"
            >
              <option value={mapping.targetField}>{mapping.targetField}</option>
              {getUnmappedTargetFields().map((field) => (
                <option key={field} value={field}>
                  {field}
                </option>
              ))}
            </select>

            {/* Transform Expression */}
            {mapping.transform && (
              <input
                type="text"
                value={mapping.transform}
                onChange={(e) => updateMapping(mapping.id, { transform: e.target.value })}
                disabled={readOnly}
                placeholder="transform"
                className="w-24 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-xs font-mono text-gray-300"
              />
            )}

            {/* Remove Button */}
            {!readOnly && (
              <button
                type="button"
                onClick={() => removeMapping(mapping.id)}
                className="text-gray-500 hover:text-red-400"
              >
                ×
              </button>
            )}
          </div>
        ))}

        {/* Add Mapping Form */}
        {showAddForm && (
          <AddMappingForm
            sourceFields={getUnmappedSourceFields()}
            targetFields={getUnmappedTargetFields()}
            onAdd={addMapping}
            onCancel={() => setShowAddForm(false)}
          />
        )}

        {/* Empty State */}
        {mappings.length === 0 && !showAddForm && (
          <p className="text-center text-sm text-gray-500 py-4">
            No mappings defined. Click "Add Mapping" to create one.
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Add Mapping Form Component
 */
function AddMappingForm({
  sourceFields,
  targetFields,
  onAdd,
  onCancel,
}: {
  sourceFields: string[];
  targetFields: string[];
  onAdd: (source: string, target: string) => void;
  onCancel: () => void;
}): JSX.Element {
  const [source, setSource] = useState(sourceFields[0] || '');
  const [target, setTarget] = useState(targetFields[0] || '');

  return (
    <div className="flex items-center gap-2 p-2 bg-gray-800 rounded border border-primary-500/50">
      <select
        value={source}
        onChange={(e) => setSource(e.target.value)}
        className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-gray-200"
      >
        {sourceFields.map((field) => (
          <option key={field} value={field}>
            {field}
          </option>
        ))}
      </select>
      <span className="text-gray-500">→</span>
      <select
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        className="flex-1 px-2 py-1 bg-gray-700 border border-gray-600 rounded text-sm text-gray-200"
      >
        {targetFields.map((field) => (
          <option key={field} value={field}>
            {field}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => source && target && onAdd(source, target)}
        disabled={!source || !target}
        className="px-2 py-1 bg-primary-600 text-white rounded text-xs hover:bg-primary-500 disabled:opacity-50"
      >
        Add
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="text-gray-500 hover:text-gray-300"
      >
        ×
      </button>
    </div>
  );
}

export default FieldMapper;
