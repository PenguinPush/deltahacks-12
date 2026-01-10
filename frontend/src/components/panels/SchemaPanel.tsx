/**
 * Schema Panel - Schema detection and field mapping UI
 */

import { useState, useCallback } from 'react';
import {
  FileJson,
  Wand2,
  ArrowRight,
  CheckCircle,
  AlertCircle,
  Copy,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Link2,
  Unlink2,
  RefreshCw,
} from 'lucide-react';
import type { SchemaField, APISchema, FieldMappingSuggestion, SchemaFieldType } from '../../types/workflow';

interface SchemaPanelProps {
  sourceSchema?: APISchema;
  targetSchema?: APISchema;
  onMappingChange?: (mappings: FieldMapping[]) => void;
}

interface FieldMapping {
  sourceField: string;
  targetField: string;
  transformation?: string;
  confidence?: number;
}

const typeColors: Record<SchemaFieldType, string> = {
  string: 'text-green-400',
  number: 'text-blue-400',
  boolean: 'text-purple-400',
  object: 'text-yellow-400',
  array: 'text-orange-400',
  null: 'text-gray-400',
  date: 'text-cyan-400',
  email: 'text-pink-400',
  url: 'text-indigo-400',
  uuid: 'text-teal-400',
};

const typeBadgeColors: Record<SchemaFieldType, string> = {
  string: 'bg-green-500/20 text-green-400',
  number: 'bg-blue-500/20 text-blue-400',
  boolean: 'bg-purple-500/20 text-purple-400',
  object: 'bg-yellow-500/20 text-yellow-400',
  array: 'bg-orange-500/20 text-orange-400',
  null: 'bg-gray-500/20 text-gray-400',
  date: 'bg-cyan-500/20 text-cyan-400',
  email: 'bg-pink-500/20 text-pink-400',
  url: 'bg-indigo-500/20 text-indigo-400',
  uuid: 'bg-teal-500/20 text-teal-400',
};

export function SchemaPanel({ sourceSchema, targetSchema, onMappingChange }: SchemaPanelProps) {
  const [sampleInput, setSampleInput] = useState('');
  const [detectedSchema, setDetectedSchema] = useState<APISchema | null>(null);
  const [mappings, setMappings] = useState<FieldMapping[]>([]);
  const [suggestions, setSuggestions] = useState<FieldMappingSuggestion[]>([]);
  const [isDetecting, setIsDetecting] = useState(false);
  const [expandedFields, setExpandedFields] = useState<Set<string>>(new Set());

  // Detect schema from sample data
  const detectSchema = useCallback(async () => {
    if (!sampleInput.trim()) return;

    setIsDetecting(true);
    try {
      const parsed = JSON.parse(sampleInput);
      const fields = analyzeObject(parsed, '');

      const schema: APISchema = {
        id: `schema_${Date.now()}`,
        name: 'Detected Schema',
        fields,
        sampleData: parsed,
        detectedFrom: 'sample',
        confidence: 95,
      };

      setDetectedSchema(schema);

      // Generate mapping suggestions if we have a target schema
      if (targetSchema) {
        const newSuggestions = generateMappingSuggestions(schema.fields, targetSchema.fields);
        setSuggestions(newSuggestions);
      }
    } catch (e) {
      alert('Invalid JSON. Please check your input.');
    } finally {
      setIsDetecting(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sampleInput, targetSchema]);

  // Analyze object to extract schema
  function analyzeObject(obj: unknown, prefix: string): SchemaField[] {
    const fields: SchemaField[] = [];

    if (obj === null) {
      return [{ name: prefix || 'value', type: 'null', required: false }];
    }

    if (Array.isArray(obj)) {
      const itemType = obj.length > 0 ? analyzeObject(obj[0], '') : [];
      return [{
        name: prefix || 'items',
        type: 'array',
        required: true,
        items: itemType[0],
        example: obj.slice(0, 3),
      }];
    }

    if (typeof obj === 'object') {
      for (const [key, value] of Object.entries(obj)) {
        const field = analyzeValue(key, value);
        fields.push(field);
      }
    }

    return fields;
  }

  function analyzeValue(name: string, value: unknown): SchemaField {
    if (value === null) {
      return { name, type: 'null', required: false, nullable: true };
    }

    if (Array.isArray(value)) {
      const itemSchema = value.length > 0 ? analyzeValue('item', value[0]) : undefined;
      return {
        name,
        type: 'array',
        required: true,
        items: itemSchema,
        example: value.slice(0, 3),
      };
    }

    if (typeof value === 'object') {
      const properties = analyzeObject(value, '');
      return {
        name,
        type: 'object',
        required: true,
        properties,
        example: value,
      };
    }

    if (typeof value === 'number') {
      return { name, type: 'number', required: true, example: value };
    }

    if (typeof value === 'boolean') {
      return { name, type: 'boolean', required: true, example: value };
    }

    // String type detection
    const str = String(value);
    if (isEmail(str)) {
      return { name, type: 'email', required: true, example: str, format: 'email' };
    }
    if (isUrl(str)) {
      return { name, type: 'url', required: true, example: str, format: 'url' };
    }
    if (isUuid(str)) {
      return { name, type: 'uuid', required: true, example: str, format: 'uuid' };
    }
    if (isDate(str)) {
      return { name, type: 'date', required: true, example: str, format: 'date-time' };
    }

    return { name, type: 'string', required: true, example: str };
  }

  function isEmail(str: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
  }

  function isUrl(str: string): boolean {
    return /^https?:\/\/.+/.test(str);
  }

  function isUuid(str: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
  }

  function isDate(str: string): boolean {
    const d = new Date(str);
    return !isNaN(d.getTime()) && str.length > 8;
  }

  // Generate mapping suggestions using fuzzy matching
  function generateMappingSuggestions(source: SchemaField[], target: SchemaField[]): FieldMappingSuggestion[] {
    const suggestions: FieldMappingSuggestion[] = [];

    for (const sourceField of source) {
      let bestMatch: { field: SchemaField; confidence: number; reason: string } | null = null;

      for (const targetField of target) {
        const confidence = calculateMatchConfidence(sourceField, targetField);
        if (confidence > 50 && (!bestMatch || confidence > bestMatch.confidence)) {
          bestMatch = {
            field: targetField,
            confidence,
            reason: getMatchReason(sourceField, targetField),
          };
        }
      }

      if (bestMatch) {
        suggestions.push({
          sourceField: sourceField.name,
          targetField: bestMatch.field.name,
          confidence: bestMatch.confidence,
          reason: bestMatch.reason,
          transformation: sourceField.type !== bestMatch.field.type ? 'Type conversion needed' : undefined,
        });
      }
    }

    return suggestions.sort((a, b) => b.confidence - a.confidence);
  }

  function calculateMatchConfidence(source: SchemaField, target: SchemaField): number {
    let confidence = 0;

    // Exact name match
    if (source.name.toLowerCase() === target.name.toLowerCase()) {
      confidence += 50;
    } else {
      // Partial match
      const sourceWords = source.name.toLowerCase().split(/[_\s]+/);
      const targetWords = target.name.toLowerCase().split(/[_\s]+/);
      const commonWords = sourceWords.filter(w => targetWords.includes(w));
      confidence += (commonWords.length / Math.max(sourceWords.length, targetWords.length)) * 30;
    }

    // Type match
    if (source.type === target.type) {
      confidence += 30;
    } else if (
      (source.type === 'email' && target.type === 'string') ||
      (source.type === 'string' && target.type === 'email') ||
      (source.type === 'url' && target.type === 'string') ||
      (source.type === 'date' && target.type === 'string')
    ) {
      confidence += 15;
    }

    // Format match
    if (source.format && source.format === target.format) {
      confidence += 20;
    }

    return Math.min(confidence, 100);
  }

  function getMatchReason(source: SchemaField, target: SchemaField): string {
    if (source.name.toLowerCase() === target.name.toLowerCase()) {
      return 'Exact name match';
    }
    if (source.type === target.type) {
      return 'Same type, similar name';
    }
    return 'Similar structure';
  }

  const toggleFieldExpanded = (fieldName: string) => {
    setExpandedFields(prev => {
      const next = new Set(prev);
      if (next.has(fieldName)) {
        next.delete(fieldName);
      } else {
        next.add(fieldName);
      }
      return next;
    });
  };

  const applyMapping = (suggestion: FieldMappingSuggestion) => {
    const newMapping: FieldMapping = {
      sourceField: suggestion.sourceField,
      targetField: suggestion.targetField,
      confidence: suggestion.confidence,
      transformation: suggestion.transformation,
    };
    const updated = [...mappings.filter(m => m.sourceField !== suggestion.sourceField), newMapping];
    setMappings(updated);
    onMappingChange?.(updated);
  };

  const removeMapping = (sourceField: string) => {
    const updated = mappings.filter(m => m.sourceField !== sourceField);
    setMappings(updated);
    onMappingChange?.(updated);
  };

  const applyAllSuggestions = () => {
    const newMappings: FieldMapping[] = suggestions.map(s => ({
      sourceField: s.sourceField,
      targetField: s.targetField,
      confidence: s.confidence,
      transformation: s.transformation,
    }));
    setMappings(newMappings);
    onMappingChange?.(newMappings);
  };

  const displaySchema = sourceSchema || detectedSchema;

  return (
    <div className="h-full flex flex-col bg-app-panel">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <FileJson className="w-5 h-5 text-purple-400" />
          Schema Detection
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Sample Input */}
        {!sourceSchema && (
          <div className="p-4 border-b border-border">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Paste Sample JSON
            </label>
            <textarea
              value={sampleInput}
              onChange={(e) => setSampleInput(e.target.value)}
              placeholder='{"id": 1, "name": "John", "email": "john@example.com"}'
              className="w-full h-32 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500 font-mono text-sm resize-none"
            />
            <button
              onClick={detectSchema}
              disabled={isDetecting || !sampleInput.trim()}
              className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-medium transition-colors"
            >
              {isDetecting ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
              Detect Schema
            </button>
          </div>
        )}

        {/* Detected Schema */}
        {displaySchema && (
          <div className="p-4 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-white">{displaySchema.name}</h4>
                {displaySchema.confidence && (
                  <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">
                    {displaySchema.confidence}% confidence
                  </span>
                )}
              </div>
              <button
                onClick={() => navigator.clipboard.writeText(JSON.stringify(displaySchema.fields, null, 2))}
                className="p-1.5 rounded hover:bg-gray-700 text-gray-400 transition-colors"
                title="Copy schema"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              {displaySchema.fields.map((field) => (
                <SchemaFieldItem
                  key={field.name}
                  field={field}
                  depth={0}
                  isExpanded={expandedFields.has(field.name)}
                  onToggle={() => toggleFieldExpanded(field.name)}
                  mapping={mappings.find(m => m.sourceField === field.name)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Mapping Suggestions */}
        {suggestions.length > 0 && (
          <div className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-400" />
                Mapping Suggestions
              </h4>
              <button
                onClick={applyAllSuggestions}
                className="px-3 py-1 text-sm bg-yellow-600 hover:bg-yellow-500 rounded-lg text-white transition-colors"
              >
                Apply All
              </button>
            </div>

            <div className="space-y-2">
              {suggestions.map((suggestion) => {
                const isApplied = mappings.some(m => m.sourceField === suggestion.sourceField);
                return (
                  <div
                    key={`${suggestion.sourceField}-${suggestion.targetField}`}
                    className={`p-3 rounded-lg border transition-all ${
                      isApplied
                        ? 'border-green-500/50 bg-green-500/10'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="font-mono text-sm text-white truncate">
                          {suggestion.sourceField}
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <span className="font-mono text-sm text-blue-400 truncate">
                          {suggestion.targetField}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-2">
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full ${
                            suggestion.confidence >= 80
                              ? 'bg-green-500/20 text-green-400'
                              : suggestion.confidence >= 60
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-orange-500/20 text-orange-400'
                          }`}
                        >
                          {suggestion.confidence}%
                        </span>
                        {isApplied ? (
                          <button
                            onClick={() => removeMapping(suggestion.sourceField)}
                            className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                          >
                            <Unlink2 className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => applyMapping(suggestion)}
                            className="p-1 rounded hover:bg-green-500/20 text-green-400 transition-colors"
                          >
                            <Link2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{suggestion.reason}</p>
                    {suggestion.transformation && (
                      <p className="text-xs text-orange-400 mt-1 flex items-center gap-1">
                        <AlertCircle className="w-3 h-3" />
                        {suggestion.transformation}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Mappings */}
        {mappings.length > 0 && (
          <div className="p-4 border-t border-border">
            <h4 className="font-medium text-white mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-400" />
              Active Mappings ({mappings.length})
            </h4>
            <div className="space-y-2">
              {mappings.map((mapping) => (
                <div
                  key={mapping.sourceField}
                  className="flex items-center justify-between p-2 rounded bg-gray-800/50"
                >
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-mono text-white">{mapping.sourceField}</span>
                    <ArrowRight className="w-3 h-3 text-gray-500" />
                    <span className="font-mono text-blue-400">{mapping.targetField}</span>
                  </div>
                  <button
                    onClick={() => removeMapping(mapping.sourceField)}
                    className="p-1 rounded hover:bg-red-500/20 text-red-400 transition-colors"
                  >
                    <Unlink2 className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

interface SchemaFieldItemProps {
  field: SchemaField;
  depth: number;
  isExpanded: boolean;
  onToggle: () => void;
  mapping?: FieldMapping;
}

function SchemaFieldItem({ field, depth, isExpanded, onToggle, mapping }: SchemaFieldItemProps) {
  const hasChildren = field.type === 'object' && field.properties && field.properties.length > 0;

  return (
    <div style={{ marginLeft: depth * 12 }}>
      <div
        className={`flex items-center gap-2 py-1.5 px-2 rounded text-sm ${
          mapping ? 'bg-green-500/10' : 'hover:bg-gray-800/50'
        } ${hasChildren ? 'cursor-pointer' : ''}`}
        onClick={hasChildren ? onToggle : undefined}
      >
        {hasChildren ? (
          isExpanded ? (
            <ChevronDown className="w-3 h-3 text-gray-500 flex-shrink-0" />
          ) : (
            <ChevronRight className="w-3 h-3 text-gray-500 flex-shrink-0" />
          )
        ) : (
          <span className="w-3" />
        )}
        <span className={`font-mono ${typeColors[field.type]}`}>{field.name}</span>
        <span className={`px-1.5 py-0.5 text-xs rounded ${typeBadgeColors[field.type]}`}>
          {field.type}
        </span>
        {field.required && <span className="text-red-400 text-xs">*</span>}
        {field.nullable && <span className="text-gray-500 text-xs">?</span>}
        {mapping && (
          <span className="ml-auto text-xs text-green-400 flex items-center gap-1">
            <ArrowRight className="w-3 h-3" />
            {mapping.targetField}
          </span>
        )}
      </div>

      {hasChildren && isExpanded && field.properties && (
        <div className="border-l border-gray-700 ml-3">
          {field.properties.map((prop) => (
            <SchemaFieldItem
              key={prop.name}
              field={prop}
              depth={depth + 1}
              isExpanded={false}
              onToggle={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default SchemaPanel;
