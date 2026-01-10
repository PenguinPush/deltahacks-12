# Custom API Integration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable users to configure any REST API within an API node, with request/response schemas that integrate with visual data flow.

**Architecture:** Extend the existing NodeConfig modal with schema definition sections. Create reusable SchemaFieldList and SchemaFieldEditor components. Add FieldMappingInput for downstream nodes to pick fields from upstream nodes.

**Tech Stack:** React, TypeScript, Zustand, TailwindCSS, ReactFlow

---

## Task 1: Add Schema Types

**Files:**
- Modify: `src/types/node.types.ts`

**Step 1: Add SchemaField interface after HandleDataType**

Add this after line 22 (after `HandleDataType`):

```typescript
/**
 * Schema field definition for API request/response
 */
export interface SchemaField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description?: string;
}

/**
 * Field mapping for connecting upstream outputs to inputs
 */
export interface APIFieldMapping {
  sourceNodeId: string;
  sourceField: string;
  staticValue?: string;
  template?: string;
}
```

**Step 2: Update APINodeData interface**

Replace lines 84-86 (the existing inputSchema/outputSchema) with:

```typescript
  // Schema definitions
  requestSchema: SchemaField[];
  responseSchema: SchemaField[];

  // Field mappings (how request fields get values from upstream nodes)
  fieldMappings: Record<string, APIFieldMapping>;
```

**Step 3: Commit**

```bash
git add src/types/node.types.ts
git commit -m "feat: add SchemaField and APIFieldMapping types for custom API integration"
```

---

## Task 2: Create SchemaFieldEditor Component

**Files:**
- Create: `src/components/Schema/SchemaFieldEditor.tsx`

**Step 1: Create the component**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/components/Schema/SchemaFieldEditor.tsx
git commit -m "feat: add SchemaFieldEditor component for editing schema fields"
```

---

## Task 3: Create SchemaFieldList Component

**Files:**
- Create: `src/components/Schema/SchemaFieldList.tsx`

**Step 1: Create the component**

```typescript
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
```

**Step 2: Commit**

```bash
git add src/components/Schema/SchemaFieldList.tsx
git commit -m "feat: add SchemaFieldList component for managing schema fields"
```

---

## Task 4: Create FieldMappingInput Component

**Files:**
- Create: `src/components/Schema/FieldMappingInput.tsx`

**Step 1: Create the component**

```typescript
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
                  <div className="px-3 py-2 text-xs font-medium text-gray-400 bg-gray-900/50 border-b border-gray-700 flex items-center gap-2">
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
```

**Step 2: Commit**

```bash
git add src/components/Schema/FieldMappingInput.tsx
git commit -m "feat: add FieldMappingInput component for field mapping with dropdown"
```

---

## Task 5: Create Schema Components Barrel Export

**Files:**
- Create: `src/components/Schema/index.ts`

**Step 1: Create the barrel export**

```typescript
export { SchemaFieldEditor } from './SchemaFieldEditor';
export { SchemaFieldList } from './SchemaFieldList';
export { FieldMappingInput } from './FieldMappingInput';
```

**Step 2: Commit**

```bash
git add src/components/Schema/index.ts
git commit -m "feat: add barrel export for Schema components"
```

---

## Task 6: Add Upstream Fields Helper to Store

**Files:**
- Modify: `src/stores/workflowStore.ts`

**Step 1: Add import for SchemaField**

Update the import at line 4 to include SchemaField:

```typescript
import type {
  WorkflowState,
  WorkflowStore,
  WorkflowNode,
  WorkflowEdge,
  WorkflowDefinition,
  WorkflowMetadata,
  WorkflowStatus,
  WorkflowExecutionResult,
  SchemaField,
  APINodeData,
} from '@/types';
```

**Step 2: Add the helper function after useNodeById (after line 285)**

```typescript
/**
 * Get upstream nodes and their output schemas for a given node
 */
export const useUpstreamOutputFields = (nodeId: string | null) => {
  const nodes = useWorkflowStore((state) => state.nodes);
  const edges = useWorkflowStore((state) => state.edges);

  if (!nodeId) return [];

  // Find all edges where target is our node
  const incomingEdges = edges.filter((edge) => edge.target === nodeId);

  // Get source nodes and their output schemas
  return incomingEdges
    .map((edge) => {
      const sourceNode = nodes.find((n) => n.id === edge.source);
      if (!sourceNode) return null;

      // Get response schema from API nodes
      const responseSchema: SchemaField[] =
        sourceNode.data.nodeType === 'api'
          ? (sourceNode.data as APINodeData).responseSchema || []
          : [];

      return {
        nodeId: sourceNode.id,
        nodeLabel: sourceNode.data.label,
        fields: responseSchema,
      };
    })
    .filter((source): source is NonNullable<typeof source> => source !== null);
};
```

**Step 3: Commit**

```bash
git add src/stores/workflowStore.ts
git commit -m "feat: add useUpstreamOutputFields helper for field mapping"
```

---

## Task 7: Update NodeConfig with Schema Sections

**Files:**
- Modify: `src/components/Nodes/NodeConfig.tsx`

**Step 1: Add imports at top of file**

Add after line 2:

```typescript
import { SchemaFieldList } from '@components/Schema';
import type { SchemaField } from '@/types';
```

**Step 2: Add schema sections to APINodeConfigContent**

Find the `{/* Description */}` section (around line 207) and add the following BEFORE it:

```typescript
      {/* Request Body Schema */}
      <div className="border-t border-gray-700 pt-4">
        <SchemaFieldList
          fields={data.requestSchema || []}
          onChange={(requestSchema) => onChange({ requestSchema })}
          title="Request Body Schema"
          description="Define the fields this API expects as input"
        />
      </div>

      {/* Response Schema */}
      <div className="border-t border-gray-700 pt-4">
        <SchemaFieldList
          fields={data.responseSchema || []}
          onChange={(responseSchema) => onChange({ responseSchema })}
          title="Response Schema"
          description="Define the fields this API returns (available to downstream nodes)"
        />
      </div>
```

**Step 3: Commit**

```bash
git add src/components/Nodes/NodeConfig.tsx
git commit -m "feat: add request/response schema sections to API node config"
```

---

## Task 8: Update APINode to Show Schema Badge

**Files:**
- Modify: `src/components/Nodes/APINode.tsx`

**Step 1: Add schema indicator after headers count**

Find the headers count section (around line 89-92) and add after it:

```typescript
        {/* Schema Indicator */}
        {((data.requestSchema?.length || 0) > 0 || (data.responseSchema?.length || 0) > 0) && (
          <div className="mt-1 text-xs text-gray-500 flex items-center gap-1">
            <span className="text-primary-400">{data.requestSchema?.length || 0} in</span>
            <span>/</span>
            <span className="text-green-400">{data.responseSchema?.length || 0} out</span>
          </div>
        )}
```

**Step 2: Commit**

```bash
git add src/components/Nodes/APINode.tsx
git commit -m "feat: add schema indicator badge to API nodes"
```

---

## Task 9: Update Node Defaults

**Files:**
- Modify: `src/constants/nodeTypes.ts`

**Step 1: Find and update the API node default data**

Locate the NODE_TEMPLATES array and find any API node templates. Update their defaultData to include empty schema arrays:

```typescript
requestSchema: [],
responseSchema: [],
fieldMappings: {},
```

**Step 2: Commit**

```bash
git add src/constants/nodeTypes.ts
git commit -m "feat: add default empty schemas to API node templates"
```

---

## Task 10: Run Linter and Fix Issues

**Step 1: Run linter**

```bash
npm run lint
```

**Step 2: Fix any reported issues**

**Step 3: Commit fixes if needed**

```bash
git add -A
git commit -m "fix: resolve lint issues in schema components"
```

---

## Task 11: Manual Testing Checklist

1. Start dev server: `npm run dev`
2. Open browser and navigate to the editor
3. Drag an API node onto the canvas
4. Double-click to open config modal
5. Verify "Request Body Schema" section appears
6. Add a field: name=`user_id`, type=`number`, required=checked
7. Add a field: name=`email`, type=`string`, required=checked
8. Verify "Response Schema" section appears
9. Add response field: name=`success`, type=`boolean`
10. Save the node
11. Verify node shows "2 in / 1 out" badge
12. Connect another API node downstream
13. Open downstream node config
14. (Future: verify field picker dropdown shows upstream fields)

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Add schema types | `node.types.ts` |
| 2 | SchemaFieldEditor component | `Schema/SchemaFieldEditor.tsx` |
| 3 | SchemaFieldList component | `Schema/SchemaFieldList.tsx` |
| 4 | FieldMappingInput component | `Schema/FieldMappingInput.tsx` |
| 5 | Barrel export | `Schema/index.ts` |
| 6 | Upstream fields helper | `workflowStore.ts` |
| 7 | NodeConfig schema sections | `NodeConfig.tsx` |
| 8 | APINode schema badge | `APINode.tsx` |
| 9 | Node defaults | `nodeTypes.ts` |
| 10 | Lint fixes | Various |
| 11 | Manual testing | N/A |
