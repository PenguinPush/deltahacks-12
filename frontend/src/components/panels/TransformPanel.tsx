/**
 * Transform Panel - Data transformation with live preview
 */

import { useState, useCallback, useEffect } from 'react';
import {
  Wand2,
  Play,
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  Code,
  Hash,
  Calendar,
  Type,
  List,
  GitBranch,
  Calculator,
  FileJson,
  FileText,
} from 'lucide-react';
import type { Transformer, TransformerType, TransformerConfig, TransformationPreview } from '../../types/workflow';
import { transform, presetTransformers } from '../../services/transformationLayer';

interface TransformPanelProps {
  onTransformersChange?: (transformers: Transformer[]) => void;
  initialTransformers?: Transformer[];
}

const transformerTypeInfo: Record<TransformerType, { label: string; icon: React.ReactNode; description: string }> = {
  string_format: { label: 'String', icon: <Type className="w-4 h-4" />, description: 'Text manipulation' },
  number_format: { label: 'Number', icon: <Hash className="w-4 h-4" />, description: 'Number formatting' },
  date_format: { label: 'Date', icon: <Calendar className="w-4 h-4" />, description: 'Date/time formatting' },
  json_path: { label: 'JSON Path', icon: <FileJson className="w-4 h-4" />, description: 'Extract nested data' },
  template: { label: 'Template', icon: <FileText className="w-4 h-4" />, description: 'String templates' },
  math: { label: 'Math', icon: <Calculator className="w-4 h-4" />, description: 'Mathematical expressions' },
  conditional: { label: 'Conditional', icon: <GitBranch className="w-4 h-4" />, description: 'If/then logic' },
  array_map: { label: 'Array Map', icon: <List className="w-4 h-4" />, description: 'Transform array items' },
  array_filter: { label: 'Array Filter', icon: <List className="w-4 h-4" />, description: 'Filter array items' },
  custom_js: { label: 'Custom JS', icon: <Code className="w-4 h-4" />, description: 'Custom JavaScript' },
};

export function TransformPanel({ onTransformersChange, initialTransformers }: TransformPanelProps) {
  const [transformers, setTransformers] = useState<Transformer[]>(initialTransformers || []);
  const [sampleInput, setSampleInput] = useState('{\n  "name": "John Doe",\n  "email": "john@example.com",\n  "amount": 1234.567,\n  "date": "2024-01-15T10:30:00Z"\n}');
  const [preview, setPreview] = useState<TransformationPreview | null>(null);
  const [expandedTransformers, setExpandedTransformers] = useState<Set<string>>(new Set());
  const [showPresetPicker, setShowPresetPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  // Run transformations on sample input
  const runPreview = useCallback(() => {
    try {
      const input = JSON.parse(sampleInput);
      let current: unknown = input;

      for (const t of transformers) {
        const result = transform(current, t);
        if (!result.success) {
          setPreview({ input, output: null, success: false, error: result.error });
          return;
        }
        current = result.output;
      }

      setPreview({ input, output: current, success: true });
    } catch (e) {
      setPreview({ input: sampleInput, output: null, success: false, error: 'Invalid JSON input' });
    }
  }, [sampleInput, transformers]);

  // Auto-preview on changes
  useEffect(() => {
    const timer = setTimeout(runPreview, 300);
    return () => clearTimeout(timer);
  }, [runPreview]);

  // Notify parent of changes
  useEffect(() => {
    onTransformersChange?.(transformers);
  }, [transformers, onTransformersChange]);

  const addTransformer = (type: TransformerType) => {
    const id = `transform_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTransformer: Transformer = {
      id,
      type,
      name: transformerTypeInfo[type].label,
      config: getDefaultConfig(type),
    };
    setTransformers(prev => [...prev, newTransformer]);
    setExpandedTransformers(prev => new Set(prev).add(id));
    setShowTypePicker(false);
  };

  const addPreset = (preset: Transformer) => {
    const id = `transform_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newTransformer = { ...preset, id };
    setTransformers(prev => [...prev, newTransformer]);
    setShowPresetPicker(false);
  };

  const updateTransformer = (id: string, updates: Partial<Transformer>) => {
    setTransformers(prev => prev.map(t =>
      t.id === id ? { ...t, ...updates } : t
    ));
  };

  const removeTransformer = (id: string) => {
    setTransformers(prev => prev.filter(t => t.id !== id));
  };

  const moveTransformer = (id: string, direction: 'up' | 'down') => {
    const index = transformers.findIndex(t => t.id === id);
    if (index === -1) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= transformers.length) return;

    const newTransformers = [...transformers];
    const temp = newTransformers[index];
    newTransformers[index] = newTransformers[newIndex]!;
    newTransformers[newIndex] = temp!;
    setTransformers(newTransformers);
  };

  const toggleExpanded = (id: string) => {
    setExpandedTransformers(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const getDefaultConfig = (type: TransformerType): TransformerConfig => {
    switch (type) {
      case 'string_format':
        return { stringOperation: 'trim' };
      case 'number_format':
        return { numberOperation: 'round', decimals: 2 };
      case 'date_format':
        return { outputFormat: 'ISO' };
      case 'json_path':
        return { jsonPath: '$.name' };
      case 'template':
        return { template: 'Hello, {{name}}!' };
      case 'math':
        return { expression: 'value * 2' };
      case 'conditional':
        return { condition: 'value > 0', thenValue: 'positive', elseValue: 'negative' };
      case 'array_map':
        return { jsonPath: '$.name' };
      case 'array_filter':
        return { condition: 'value > 0' };
      case 'custom_js':
        return { code: 'return input;' };
      default:
        return {};
    }
  };

  return (
    <div className="h-full flex flex-col bg-app-panel">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Wand2 className="w-5 h-5 text-purple-400" />
            Transform
          </h3>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPresetPicker(!showPresetPicker)}
              className="px-3 py-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm font-medium transition-colors"
            >
              Presets
            </button>
            <button
              onClick={() => setShowTypePicker(!showTypePicker)}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 hover:bg-purple-500 rounded-lg text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add
            </button>
          </div>
        </div>

        {/* Type Picker */}
        {showTypePicker && (
          <div className="absolute right-4 mt-1 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10">
            <div className="p-2 grid grid-cols-2 gap-1">
              {Object.entries(transformerTypeInfo).map(([type, info]) => (
                <button
                  key={type}
                  onClick={() => addTransformer(type as TransformerType)}
                  className="flex items-center gap-2 p-2 rounded hover:bg-gray-700 text-left transition-colors"
                >
                  <span className="text-purple-400">{info.icon}</span>
                  <div>
                    <div className="text-sm text-white">{info.label}</div>
                    <div className="text-xs text-gray-500">{info.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Preset Picker */}
        {showPresetPicker && (
          <div className="absolute right-4 mt-1 w-64 bg-gray-800 border border-gray-700 rounded-lg shadow-xl z-10 max-h-64 overflow-y-auto">
            <div className="p-2 space-y-1">
              {presetTransformers.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => addPreset(preset)}
                  className="w-full flex items-center gap-2 p-2 rounded hover:bg-gray-700 text-left transition-colors"
                >
                  <span className="text-purple-400">
                    {transformerTypeInfo[preset.type].icon}
                  </span>
                  <span className="text-sm text-white">{preset.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Sample Input */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-gray-300">Sample Input</label>
            <button
              onClick={runPreview}
              className="flex items-center gap-1 px-2 py-1 bg-purple-600 hover:bg-purple-500 rounded text-white text-xs transition-colors"
            >
              <Play className="w-3 h-3" />
              Run
            </button>
          </div>
          <textarea
            value={sampleInput}
            onChange={(e) => setSampleInput(e.target.value)}
            className="w-full h-24 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white font-mono text-sm resize-none focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Transformers Chain */}
        <div className="p-4">
          {transformers.length > 0 ? (
            <div className="space-y-2">
              {transformers.map((t, index) => (
                <TransformerItem
                  key={t.id}
                  transformer={t}
                  index={index}
                  total={transformers.length}
                  isExpanded={expandedTransformers.has(t.id)}
                  onToggle={() => toggleExpanded(t.id)}
                  onUpdate={(updates) => updateTransformer(t.id, updates)}
                  onRemove={() => removeTransformer(t.id)}
                  onMoveUp={() => moveTransformer(t.id, 'up')}
                  onMoveDown={() => moveTransformer(t.id, 'down')}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Wand2 className="w-10 h-10 mb-3 opacity-50" />
              <p className="text-center">No transformers added</p>
              <p className="text-sm text-gray-600 mt-1">Add transformers to modify your data</p>
            </div>
          )}
        </div>

        {/* Preview */}
        {preview && (
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2 mb-2">
              {preview.success ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400" />
              )}
              <span className={`text-sm font-medium ${preview.success ? 'text-green-400' : 'text-red-400'}`}>
                {preview.success ? 'Preview' : 'Error'}
              </span>
            </div>

            {preview.error ? (
              <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-sm text-red-400">{preview.error}</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div>
                  <label className="text-xs text-gray-500">Output:</label>
                  <pre className="mt-1 p-3 bg-gray-900 rounded-lg text-sm text-gray-300 overflow-x-auto max-h-40">
                    {JSON.stringify(preview.output, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface TransformerItemProps {
  transformer: Transformer;
  index: number;
  total: number;
  isExpanded: boolean;
  onToggle: () => void;
  onUpdate: (updates: Partial<Transformer>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function TransformerItem({
  transformer,
  index,
  total,
  isExpanded,
  onToggle,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
}: TransformerItemProps) {
  const info = transformerTypeInfo[transformer.type];

  return (
    <div className="rounded-lg border border-gray-700 bg-gray-800/50 overflow-hidden">
      <div className="flex items-center gap-3 p-3">
        <div className="flex flex-col gap-0.5">
          <button
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-0.5 text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronDown className="w-3 h-3 rotate-180" />
          </button>
          <button
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="p-0.5 text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ChevronDown className="w-3 h-3" />
          </button>
        </div>

        <span className="text-purple-400">{info.icon}</span>

        <button onClick={onToggle} className="flex-1 flex items-center gap-2 text-left">
          <span className="font-medium text-white">{transformer.name}</span>
          <span className="text-xs text-gray-500 px-2 py-0.5 bg-gray-700 rounded">{info.label}</span>
        </button>

        <div className="flex items-center gap-1">
          {isExpanded ? (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-500" />
          )}
          <button
            onClick={onRemove}
            className="p-1 rounded hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 border-t border-gray-700/50 pt-3">
          <TransformerConfig
            transformer={transformer}
            onUpdate={onUpdate}
          />
        </div>
      )}
    </div>
  );
}

interface TransformerConfigProps {
  transformer: Transformer;
  onUpdate: (updates: Partial<Transformer>) => void;
}

function TransformerConfig({ transformer, onUpdate }: TransformerConfigProps) {
  const updateConfig = (configUpdates: Partial<TransformerConfig>) => {
    onUpdate({ config: { ...transformer.config, ...configUpdates } });
  };

  switch (transformer.type) {
    case 'string_format':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Operation</label>
            <select
              value={transformer.config.stringOperation || 'trim'}
              onChange={(e) => updateConfig({ stringOperation: e.target.value as TransformerConfig['stringOperation'] })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="uppercase">Uppercase</option>
              <option value="lowercase">Lowercase</option>
              <option value="trim">Trim</option>
              <option value="replace">Replace</option>
              <option value="split">Split</option>
              <option value="join">Join</option>
              <option value="substring">Substring</option>
            </select>
          </div>
          {(transformer.config.stringOperation === 'replace' || transformer.config.stringOperation === 'split') && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Pattern</label>
              <input
                type="text"
                value={transformer.config.pattern || ''}
                onChange={(e) => updateConfig({ pattern: e.target.value })}
                placeholder="Pattern (regex)"
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
          )}
          {transformer.config.stringOperation === 'replace' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Replacement</label>
              <input
                type="text"
                value={transformer.config.replacement || ''}
                onChange={(e) => updateConfig({ replacement: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
          )}
        </div>
      );

    case 'number_format':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Operation</label>
            <select
              value={transformer.config.numberOperation || 'round'}
              onChange={(e) => updateConfig({ numberOperation: e.target.value as TransformerConfig['numberOperation'] })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="round">Round</option>
              <option value="floor">Floor</option>
              <option value="ceil">Ceiling</option>
              <option value="abs">Absolute</option>
              <option value="parse">Parse</option>
            </select>
          </div>
          {transformer.config.numberOperation === 'round' && (
            <div>
              <label className="block text-xs text-gray-500 mb-1">Decimal Places</label>
              <input
                type="number"
                value={transformer.config.decimals ?? 2}
                onChange={(e) => updateConfig({ decimals: Number(e.target.value) })}
                min={0}
                max={10}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
          )}
        </div>
      );

    case 'date_format':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Output Format</label>
            <select
              value={transformer.config.outputFormat || 'ISO'}
              onChange={(e) => updateConfig({ outputFormat: e.target.value })}
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="ISO">ISO 8601</option>
              <option value="date">Local Date</option>
              <option value="time">Local Time</option>
              <option value="datetime">Local Date/Time</option>
              <option value="timestamp">Unix Timestamp</option>
              <option value="relative">Relative Time</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            </select>
          </div>
        </div>
      );

    case 'json_path':
      return (
        <div>
          <label className="block text-xs text-gray-500 mb-1">JSON Path</label>
          <input
            type="text"
            value={transformer.config.jsonPath || ''}
            onChange={(e) => updateConfig({ jsonPath: e.target.value })}
            placeholder="$.data.items[0].name"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-purple-500"
          />
          <p className="text-xs text-gray-500 mt-1">Use $ to reference root, . for properties, [n] for arrays</p>
        </div>
      );

    case 'template':
      return (
        <div>
          <label className="block text-xs text-gray-500 mb-1">Template</label>
          <textarea
            value={transformer.config.template || ''}
            onChange={(e) => updateConfig({ template: e.target.value })}
            placeholder="Hello, {{name}}! Your order #{{orderId}} is ready."
            className="w-full h-20 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm font-mono resize-none focus:outline-none focus:border-purple-500"
          />
          <p className="text-xs text-gray-500 mt-1">Use {`{{field}}`} for placeholders, {`{{#if field}}...{{/if}}`} for conditionals</p>
        </div>
      );

    case 'math':
      return (
        <div>
          <label className="block text-xs text-gray-500 mb-1">Expression</label>
          <input
            type="text"
            value={transformer.config.expression || ''}
            onChange={(e) => updateConfig({ expression: e.target.value })}
            placeholder="price * quantity * (1 - discount)"
            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-purple-500"
          />
          <p className="text-xs text-gray-500 mt-1">Use field names as variables. Supports +, -, *, /, %, ()</p>
        </div>
      );

    case 'conditional':
      return (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Condition</label>
            <input
              type="text"
              value={transformer.config.condition || ''}
              onChange={(e) => updateConfig({ condition: e.target.value })}
              placeholder='status === "active"'
              className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm font-mono focus:outline-none focus:border-purple-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Then Value</label>
              <input
                type="text"
                value={String(transformer.config.thenValue ?? '')}
                onChange={(e) => updateConfig({ thenValue: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Else Value</label>
              <input
                type="text"
                value={String(transformer.config.elseValue ?? '')}
                onChange={(e) => updateConfig({ elseValue: e.target.value })}
                className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>
        </div>
      );

    case 'custom_js':
      return (
        <div>
          <label className="block text-xs text-gray-500 mb-1">Code</label>
          <textarea
            value={transformer.config.code || ''}
            onChange={(e) => updateConfig({ code: e.target.value })}
            placeholder="// 'input' contains the incoming data\nreturn input.toUpperCase();"
            className="w-full h-32 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-sm font-mono resize-none focus:outline-none focus:border-purple-500"
          />
          <p className="text-xs text-gray-500 mt-1">Input is available as 'input' variable. Return the transformed value.</p>
        </div>
      );

    default:
      return (
        <p className="text-sm text-gray-500">No configuration available</p>
      );
  }
}

export default TransformPanel;
