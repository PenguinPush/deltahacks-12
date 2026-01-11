import { useState, useCallback, useMemo } from 'react';
import { ChevronDown, Link2 } from 'lucide-react';
import type { SchemaField, APIFieldMapping } from '@/types';

interface UpstreamSource {
  nodeId: string;
  nodeLabel: string;
  fields: SchemaField[];
}

interface FieldMappingInputProps {
  value: APIFieldMapping | undefined;
  onChange: (mapping: APIFieldMapping | undefined) => void;
  upstreamSources: UpstreamSource[];
  placeholder?: string;
}

export function FieldMappingInput({
  value,
  onChange,
  upstreamSources,
  placeholder = 'Select or type a value...',
}: FieldMappingInputProps): JSX.Element {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value?.staticValue || value?.template || '');

  // Get display value for current mapping
  const displayValue = useMemo(() => {
    if (!value) return '';
    if (value.staticValue) return value.staticValue;
    if (value.template) return value.template;
    if (value.sourceNodeId && value.sourceField) {
      const source = upstreamSources.find((s) => s.nodeId === value.sourceNodeId);
      return `{{ ${source?.nodeLabel || value.sourceNodeId}.${value.sourceField} }}`;
    }
    return '';
  }, [value, upstreamSources]);

  const handleSelectField = useCallback(
    (nodeId: string, field: SchemaField) => {
      onChange({
        sourceNodeId: nodeId,
        sourceField: field.name,
      });
      setInputValue(`{{ ${upstreamSources.find((s) => s.nodeId === nodeId)?.nodeLabel || nodeId}.${field.name} }}`);
      setIsOpen(false);
    },
    [onChange, upstreamSources]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setInputValue(newValue);

      // Check if it's a template (contains {{ }})
      if (newValue.includes('{{') && newValue.includes('}}')) {
        onChange({ sourceNodeId: '', sourceField: '', template: newValue });
      } else {
        onChange({ sourceNodeId: '', sourceField: '', staticValue: newValue });
      }
    },
    [onChange]
  );

  const hasUpstreamFields = upstreamSources.some((s) => s.fields.length > 0);

  return (
    <div className="relative">
      {/* Input with dropdown trigger */}
      <div className="flex items-center">
        <input
          type="text"
          value={inputValue || displayValue}
          onChange={handleInputChange}
          placeholder={placeholder}
          className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded-l-md text-sm text-gray-200 font-mono"
        />
        {hasUpstreamFields && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="px-2 py-2 bg-gray-700 border border-l-0 border-gray-600 rounded-r-md hover:bg-gray-600 transition-colors"
          >
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && hasUpstreamFields && (
        <div className="absolute z-50 w-full mt-1 bg-gray-800 border border-gray-700 rounded-md shadow-lg max-h-60 overflow-auto">
          {upstreamSources.map((source) => (
            <div key={source.nodeId}>
              {source.fields.length > 0 && (
                <>
                  {/* Source header */}
                  <div className="px-3 py-2 text-xs font-medium text-gray-400 bg-black/50 border-b border-gray-700 flex items-center gap-2">
                    <Link2 className="w-3 h-3" />
                    {source.nodeLabel}
                  </div>
                  {/* Fields */}
                  {source.fields.map((field) => (
                    <button
                      key={field.id}
                      type="button"
                      onClick={() => handleSelectField(source.nodeId, field)}
                      className="w-full px-3 py-2 text-left text-sm text-gray-200 hover:bg-gray-700 flex items-center justify-between"
                    >
                      <span className="font-mono">{field.name}</span>
                      <span className="text-xs text-gray-500">{field.type}</span>
                    </button>
                  ))}
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FieldMappingInput;
