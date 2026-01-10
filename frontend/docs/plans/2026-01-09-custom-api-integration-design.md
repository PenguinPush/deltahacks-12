# Custom API Integration Design

## Overview

Allow users to configure any REST API directly within an API node, defining request/response schemas that integrate with the visual data flow system.

## Requirements

- Per-node configuration (no template saving)
- Simple field list for schemas (name, type, required)
- Output schema fields exposed for mapping in downstream nodes
- Dropdown field picker showing available upstream fields

## UI Layout

### Enhanced NodeConfig Modal

```
┌─────────────────────────────────────────────────┐
│  Configure API Node                         [X] │
├─────────────────────────────────────────────────┤
│  ▼ Basic Settings                               │
│    Label, Method, URL, Description              │
├─────────────────────────────────────────────────┤
│  ▼ Headers                                      │
│    Key-value pairs with variable support        │
├─────────────────────────────────────────────────┤
│  ▼ Authentication                               │
│    Type selection and credentials               │
├─────────────────────────────────────────────────┤
│  ▼ Request Body Schema (NEW)                    │
│    Fields this API expects as input             │
│    [name | type | required | delete]            │
│    [+ Add Field]                                │
├─────────────────────────────────────────────────┤
│  ▼ Response Schema (NEW)                        │
│    Fields this API returns as output            │
│    [name | type | required | delete]            │
│    [+ Add Field]                                │
├─────────────────────────────────────────────────┤
│                              [Cancel]  [Save]   │
└─────────────────────────────────────────────────┘
```

### Field Mapping in Downstream Nodes

When configuring a node that receives data from an upstream node:

```
To: ┌──────────────────────────────────┐
    │ {{ email }}                   [▼]│
    ├──────────────────────────────────┤
    │ Available from "My Custom API":  │
    │   • user_id (number)             │
    │   • email (string)               │
    │   • created_at (string)          │
    ├──────────────────────────────────┤
    │ Type custom value...             │
    └──────────────────────────────────┘
```

## Data Structures

```typescript
interface SchemaField {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  required: boolean;
  description?: string;
}

interface APINodeData {
  // ... existing fields

  requestSchema: SchemaField[];
  responseSchema: SchemaField[];
  fieldMappings: Record<string, FieldMapping>;
}

interface FieldMapping {
  sourceNodeId: string;
  sourceField: string;
  staticValue?: string;
  template?: string;
}
```

## Component Architecture

### New Components

| Component | Purpose |
|-----------|---------|
| `SchemaFieldEditor.tsx` | Single field row (name, type, required, delete) |
| `SchemaFieldList.tsx` | List of fields with add/remove |
| `FieldMappingInput.tsx` | Input with upstream field picker |

### Modified Components

| Component | Changes |
|-----------|---------|
| `NodeConfig.tsx` | Add Request/Response Schema sections |
| `APINode.tsx` | Show schema indicator badge |
| `workflowStore.ts` | Helper to get upstream schemas |

## Implementation Files

### Create

- `src/components/Schema/SchemaFieldEditor.tsx`
- `src/components/Schema/SchemaFieldList.tsx`
- `src/components/Schema/FieldMappingInput.tsx`
- `src/components/Schema/index.ts`

### Modify

- `src/types/node.types.ts` - Add SchemaField, extend APINodeData
- `src/components/Nodes/NodeConfig.tsx` - Add schema sections
- `src/components/Nodes/APINode.tsx` - Add schema badge
- `src/stores/workflowStore.ts` - Add getUpstreamOutputFields helper

## Helper Functions

```typescript
function getUpstreamOutputFields(nodeId: string): {
  nodeId: string;
  nodeLabel: string;
  fields: SchemaField[];
}[] {
  // Find edges where target === nodeId
  // Return source node's responseSchema for each
}
```

## Out of Scope

- Template saving (per-node only)
- Nested object/array field editing
- Execution engine changes
- Connection validation based on types
