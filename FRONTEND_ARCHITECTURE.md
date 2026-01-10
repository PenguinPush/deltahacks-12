# Frontend Architecture Documentation

**Project:** NodeLink Workflow Builder
**Last Updated:** 2026-01-10
**Purpose:** Hackathon preparation - Backend implementation guide

---

## Table of Contents
1. [Overview](#overview)
2. [File Structure & Purpose](#file-structure--purpose)
3. [Implemented Features](#implemented-features)
4. [What Backend Needs to Support](#what-backend-needs-to-support)

---

## Overview

NodeLink is a visual workflow automation builder (similar to n8n/Zapier) that allows users to create API integration workflows by dragging and connecting nodes on a canvas. The frontend is a React + TypeScript application using React Flow for the visual canvas.

**Tech Stack:**
- React 18
- TypeScript
- React Flow (visual workflow canvas)
- Zustand (state management)
- TailwindCSS (styling)
- Vite (build tool)

---

## File Structure & Purpose

### `/src/pages/Editor.tsx`
**Purpose:** Main workflow editor page - the core of the application

**Contains:**
- **EditorContent Component**: Main editor with React Flow canvas
- **TemplatePalette Component**: Left sidebar showing draggable API/workflow node templates
- **Toolbar Component**: Top navigation with save, run, home buttons
- **ExecutionPanel Component**: Bottom activity log panel showing workflow events
- **NodeConfigModal Component**: Modal for configuring node parameters and credentials
- **FieldMapperModal Component**: Modal for mapping data between connected nodes
- **APITemplate Interface**: Defines structure for API integration templates
- **Node Templates**: 18 pre-built API integrations (Stripe, SendGrid, OpenAI, MongoDB, etc.) + 7 workflow nodes

**Note:** Right sidebar with debug panel was removed to simplify the UI.

**State Management:**
- Nodes and edges (workflow graph)
- Panel states (open/closed)
- Modal states
- Activity log
- Workflow validation results
- Save status

---

### `/src/types/execution.types.ts`
**Purpose:** Type definitions for the workflow execution engine

**Defines:**
- **NodeExecutionType**: 5 types (trigger, action, transform, control, output)
- **ErrorStrategy**: 4 strategies (stop, skip_branch, retry, fallback)
- **ValidationErrorCode**: 8 error types for workflow validation
- **WorkflowValidation**: Structure for validation results
- **ExecutionContext**: Runtime data during workflow execution
- **NodeExecutionResult**: Result from individual node execution
- **WorkflowExecutionResult**: Complete workflow run result
- **NODE_EXECUTION_RULES**: Lookup table defining what each node type can/can't do

---

### `/src/types/node.types.ts`
**Purpose:** Type definitions for workflow nodes

**Defines:**
- **NodeType**: 5 base types (api, transform, condition, input, output)
- **APINodeData**: Data structure for API call nodes
- **TransformNodeData**: Data structure for data transformation nodes
- **ConditionNodeData**: Data structure for conditional branching nodes
- **InputNodeData**: Data structure for workflow trigger nodes
- **OutputNodeData**: Data structure for workflow output nodes
- **WorkflowNodeData**: Union type of all node data types
- **SchemaField**: Field definition for API request/response schemas
- **APIFieldMapping**: How to map data from upstream nodes to API inputs
- **HeaderConfig, QueryParamConfig, AuthConfig**: API request configuration

---

### `/src/types/index.ts`
**Purpose:** Central export point for all type definitions

**Exports:**
- All types from node.types.ts
- All types from execution.types.ts
- Common shared types

---

### `/src/services/workflowValidator.ts`
**Purpose:** Workflow validation engine - ensures workflows are valid DAGs

**Implements:**
- **hasCycle()**: DFS algorithm to detect cycles in workflow graph
- **getReachableNodes()**: BFS algorithm to find all nodes reachable from trigger
- **validateWorkflow()**: Comprehensive validation with 6 validation passes
  1. Cycle detection (workflows must be DAGs)
  2. Trigger node validation (exactly 1 required)
  3. Trigger cannot have incoming edges
  4. All nodes must be reachable from trigger
  5. Node placement rules (first/middle/last based on type)
  6. At least one terminal/output node
- **topologicalSort()**: Kahn's algorithm for execution ordering and parallelization
- **getNodeExecutionType()**: Infers execution type from node data

**Validation Rules:**
- Enforces DAG structure (no infinite loops)
- Single trigger node requirement
- Trigger isolation (must be first)
- Orphan node detection
- Node placement constraints based on execution type

---

### `/src/constants/nodeTypes.ts`
**Purpose:** Default node templates for the palette (not used in current implementation)

**Contains:**
- **NODE_CATEGORIES**: 4 categories (API Calls, Transform, Logic, Input/Output)
- **DEFAULT_HANDLES**: Default input/output handles for each node type
- **NODE_TEMPLATES**: 11 basic node templates
  - HTTP GET/POST/PUT/DELETE
  - Map Data, Filter, Custom Transform
  - If/Else condition
  - Workflow Input, Webhook Trigger, Workflow Output
- **NODE_TYPE_MAP**: React Flow node type mappings
- **NODE_COLORS**: Color scheme by node type
- **HTTP_METHOD_COLORS**: Color scheme for HTTP methods

**Note:** Currently not imported in Editor.tsx - templates are defined inline in Editor.tsx instead

---

### `/src/components/Nodes/APINode.tsx`
**Purpose:** Custom React Flow node component for API nodes

**Features:**
- Displays HTTP method badge with color coding
- Shows node label and truncated URL
- Execution status indicators (executing/success/error)
- Auth and header count indicators
- Request/response schema counts
- Input and output handles for connections

**Visual States:**
- Selected state with border highlight
- Executing state with pulsing animation
- Success state with green indicator
- Error state with red indicator

---

### `/src/components/panels/DebugPanel.tsx`
**Purpose:** Debug panel component for the right sidebar

**Features:**
- Displays workflow execution state
- Shows node execution order
- Allows breakpoint setting
- Variable watching during execution

**Note:** Currently placeholder implementation - debug functionality not fully built

---

### `/src/components/Schema/SchemaFieldList.tsx`
**Purpose:** Component for editing custom API input/output schemas

**Features:**
- Add/remove schema fields dynamically
- Configure field properties (name, type, required, description, example)
- Validation rules (min, max, pattern, enum)
- Drag-to-reorder fields
- Used in "Custom API" template configuration

**Field Types Supported:**
- string
- number
- boolean
- object
- array

---

### `/src/App.tsx`
**Purpose:** Main application entry point and routing

**Routes:**
- `/` - Home/dashboard page
- `/editor/:id` - Workflow editor (id can be "new" or workflow ID)

**Features:**
- React Router setup
- Global app structure

---

### `/src/main.tsx`
**Purpose:** Vite entry point - renders React app to DOM

---

### `/src/index.css`
**Purpose:** Global styles and Tailwind directives

**Includes:**
- Tailwind CSS imports
- Custom CSS variables for theming
- Global component styles (buttons, inputs, modals, panels)
- Color scheme (dark theme optimized)
- Typography scales
- Spacing system

---

### `/tailwind.config.js`
**Purpose:** Tailwind CSS configuration

**Customizations:**
- Extended color palette with semantic naming
- Custom spacing scale
- Typography customization
- Dark theme as default
- Component-specific utilities

---

### `/tsconfig.json`
**Purpose:** TypeScript compiler configuration

**Settings:**
- Strict type checking enabled
- Path aliases (@/ = src/)
- React JSX support
- ES module target

---

### `/vite.config.ts`
**Purpose:** Vite build configuration

**Features:**
- React plugin
- Path alias resolution
- Development server settings
- Build optimization

---

### `/package.json`
**Purpose:** Project dependencies and scripts

**Key Dependencies:**
- react, react-dom
- react-router-dom (routing)
- reactflow (visual workflow canvas)
- zustand (state management)
- lucide-react (icons)
- clsx (className utilities)

**Scripts:**
- `dev` - Start development server
- `build` - Production build
- `lint` - ESLint checks
- `type-check` - TypeScript validation

---

## Implemented Features

### 1. **Visual Workflow Builder**
- Drag-and-drop node placement on canvas
- Visual connections between nodes
- Node configuration via double-click
- Mini-map for large workflows
- Zoom/pan controls
- Grid background
- Auto-layout (not yet implemented)

### 2. **Node Templates (25 Total)**

**Workflow Nodes (7):**
- Workflow Input - Manual/scheduled trigger
- Webhook Trigger - HTTP endpoint trigger
- Workflow Output - Final destination
- Map Data - Field transformation
- Filter - Array filtering
- Custom Transform - JavaScript transformation
- If/Else - Conditional branching

**API Integration Nodes (18):**
- **Payments:** Stripe
- **Email:** SendGrid
- **Database:** Airtable, Google Sheets, MongoDB Atlas
- **AI:** OpenAI, Moorcheh.ai
- **Communication:** Twilio
- **Integration:** Webhook, Custom API
- **Compute:** AWS Lambda

### 3. **Node Configuration**
- Parameter configuration (URL, method, headers, etc.)
- Credential management (API keys, tokens, basic auth)
- Custom schema definition for Custom API
- Field visibility based on selected options
- Test connection button (for nodes with credentials)
- Schema preview for pre-built APIs

### 4. **Field Mapping**
- Visual drag-and-drop field mapping between nodes
- Transformation types:
  - Direct mapping
  - Template strings
  - Compose (multiple fields)
  - Conditional mapping
  - Format date
  - Format currency
- Auto-mapping suggestions
- Connection handles with visual feedback
- Empty state with instructions

### 5. **Workflow Validation**
- Real-time validation on every change
- Validation errors displayed in status bar
- Activity log integration
- Error types:
  - NO_TRIGGER - Missing trigger node
  - MULTIPLE_TRIGGERS - More than one trigger
  - TRIGGER_HAS_INPUT - Trigger with incoming edges
  - CYCLE_DETECTED - Circular dependencies
  - ORPHAN_NODE - Disconnected nodes
  - INVALID_CONNECTION - Wrong node placement
  - NO_OUTPUT - Missing terminal node
  - MISSING_INPUT - Required inputs not connected

### 6. **Activity Panel**
- Execution log with timestamps
- Event types: info, success, warning, error
- Expandable/collapsible
- Event details expansion
- Clear all functionality

### 7. **Template Palette**
- Category-based filtering (9 categories)
- Search functionality
- Expandable/collapsible sidebar
- Template cards with icons and descriptions
- Drag-to-canvas interaction

### 8. **Workflow Persistence**
- Save to localStorage (workflow-{id})
- Auto-save on changes
- Load existing workflows
- Save status indicator
- Keyboard shortcut (Cmd/Ctrl+S)

### 9. **UI/UX Features**
- Dark theme optimized
- Responsive panels
- Modal overlays
- Loading states
- Error states
- Success feedback
- Keyboard shortcuts
- Context-sensitive tooltips

### 10. **Validation Engine**
- Graph algorithms:
  - DFS cycle detection
  - BFS reachability analysis
  - Topological sort (Kahn's algorithm)
- Node type constraints enforcement
- Execution order calculation
- Parallel execution layer identification

---

## What Backend Needs to Support

### 1. **Workflow Storage**
**Endpoints Needed:**
- `POST /api/workflows` - Create new workflow
- `GET /api/workflows/:id` - Get workflow by ID
- `PUT /api/workflows/:id` - Update workflow
- `DELETE /api/workflows/:id` - Delete workflow
- `GET /api/workflows` - List all workflows (with pagination)

**Data Structure:**
```
{
  id: string
  name: string
  nodes: Node[]
  edges: Edge[]
  createdAt: timestamp
  updatedAt: timestamp
  owner: userId
}
```

### 2. **Workflow Execution**
**Endpoints Needed:**
- `POST /api/workflows/:id/execute` - Manual execution
- `POST /api/webhooks/:workflowId/:path` - Webhook trigger
- `GET /api/workflows/:id/executions` - Execution history
- `GET /api/executions/:executionId` - Execution details

**Execution Engine Must:**
- Validate workflow before execution (use frontend validation logic)
- Execute nodes in topological order
- Support parallel execution of independent nodes
- Handle node-specific execution:
  - API nodes: Make HTTP requests with auth
  - Transform nodes: Run JavaScript transformations
  - Condition nodes: Evaluate conditions and route data
  - Filter nodes: Filter arrays based on expressions
- Track execution state per node
- Handle errors based on error strategy (stop, retry, skip_branch, fallback)
- Store execution logs and results

### 3. **Credential Management**
**Endpoints Needed:**
- `POST /api/credentials` - Store encrypted credentials
- `GET /api/credentials/:id` - Retrieve credential
- `PUT /api/credentials/:id` - Update credential
- `DELETE /api/credentials/:id` - Delete credential
- `GET /api/credentials` - List user's credentials

**Security Requirements:**
- Encrypt credentials at rest
- Never return decrypted credentials to frontend
- Use credentials server-side only during execution
- Support credential types: bearer, api-key, basic, oauth2

### 4. **Webhook Infrastructure**
**Requirements:**
- Generate unique webhook URLs per workflow
- Accept incoming HTTP requests (GET, POST, PUT)
- Parse request body, headers, query params
- Trigger workflow execution with webhook data
- Return execution result as HTTP response
- Handle webhook authentication (optional)

### 5. **Node Execution Handlers**

**API Node Execution:**
- Make HTTP requests with configured method, URL, headers, query params
- Support all auth types (bearer, api-key, basic, oauth2)
- Apply field mappings from upstream node data
- Handle timeouts and retries
- Parse and validate response against schema

**Transform Node Execution:**
- Map Data: Transform object structure based on mappings
- Filter: Evaluate JavaScript expression against array items
- Custom Transform: Execute sandboxed JavaScript code
- Return transformed data to downstream nodes

**Condition Node Execution:**
- Evaluate condition expression
- Route data to "true" or "false" branch
- Mark skipped branch nodes
- Continue execution on active branch only

**Input Node Execution:**
- Workflow Input: Accept manual trigger data
- Webhook Trigger: Parse incoming HTTP request
- Return trigger data to downstream nodes

**Output Node Execution:**
- HTTP Response: Return data to webhook caller
- Log: Store execution result
- Webhook: POST data to external URL

### 6. **Data Flow Between Nodes**
- Maintain execution context with all node results
- Pass upstream node outputs to downstream node inputs
- Support field mapping transformations:
  - Direct mapping: `source.field → target.field`
  - Template strings: `"Hello {{source.name}}"`
  - Compose: Combine multiple fields
  - Conditional: Map based on condition
  - Format date: Parse and format dates
  - Format currency: Format numbers as currency

### 7. **Error Handling**
**Error Strategies:**
- **stop**: Halt workflow immediately, mark as failed
- **skip_branch**: Skip downstream nodes on this branch, continue parallel branches
- **retry**: Retry node N times with exponential backoff
- **fallback**: Execute alternative fallback node

**Error Logging:**
- Capture error message and stack trace
- Store node ID, execution ID, timestamp
- Mark node execution as failed
- Continue or stop based on strategy

### 8. **Real-time Execution Updates** (Optional)
- WebSocket connection for live execution status
- Stream node execution events to frontend
- Update UI as nodes execute
- Show execution progress in real-time

### 9. **API Template Testing**
- `POST /api/templates/:templateId/test` - Test API connection
- Validate credentials without saving
- Make test request to API
- Return success/failure with error details

### 10. **User Management** (Future)
- User authentication
- Workflow ownership
- Sharing and permissions
- Usage quotas

---

## Architecture Decisions

### Why React Flow?
- Industry standard for visual workflow builders
- Handles canvas rendering, panning, zooming
- Built-in node/edge state management
- Extensible with custom nodes
- Performance optimized for large graphs

### Why Zustand? (Not currently used)
- Lightweight state management
- Better TypeScript support than Redux
- No boilerplate
- Can be added later for global state

### Why Client-Side Validation?
- Immediate feedback to users
- Prevents invalid workflows from being saved
- Backend can trust frontend validation
- Backend should still validate for security

### Why localStorage for Persistence?
- Temporary solution for hackathon
- No backend required for demo
- Easy to migrate to API calls
- Data structure already matches what backend needs

---

## Frontend → Backend Data Contract

### Workflow Save Format
```
{
  nodes: [
    {
      id: "node-123",
      type: "api",
      position: { x: 100, y: 200 },
      data: {
        templateId: "stripe",
        label: "Charge Payment",
        nodeType: "api",
        executionType: "action",
        method: "POST",
        url: "https://api.stripe.com/v1/charges",
        headers: [...],
        auth: { type: "bearer", credentialId: "cred-456" },
        requestSchema: [...],
        responseSchema: [...],
        fieldMappings: { amount: { sourceNodeId: "node-122", sourceField: "total" } }
      }
    }
  ],
  edges: [
    {
      id: "edge-123",
      source: "node-122",
      target: "node-123",
      sourceHandle: "output",
      targetHandle: "input"
    }
  ]
}
```

### Execution Request Format
```
{
  workflowId: "workflow-123",
  triggerData?: { ... },  // For manual triggers
  webhookData?: {         // For webhook triggers
    body: { ... },
    headers: { ... },
    query: { ... }
  }
}
```

### Execution Response Format
```
{
  executionId: "exec-456",
  status: "completed" | "failed" | "partial",
  results: {
    "node-123": {
      nodeId: "node-123",
      status: "success" | "error" | "skipped",
      output: { ... },
      error?: Error,
      executionTimeMs: 1234,
      retryCount?: 2
    }
  },
  totalExecutionTimeMs: 5678,
  error?: Error
}
```

---

## Next Steps for Backend

1. **Set up Node.js/Express server** with TypeScript
2. **Implement workflow CRUD endpoints** (save, load, list, delete)
3. **Build execution engine core**:
   - Workflow validator (port frontend validation)
   - Topological sort for execution order
   - Node executor with plugin architecture
4. **Implement node type handlers**:
   - API node executor (HTTP client with auth)
   - Transform node executor (safe JavaScript sandbox)
   - Condition node executor (expression evaluator)
5. **Add webhook infrastructure**:
   - Dynamic route registration
   - Incoming request parser
   - Workflow trigger mechanism
6. **Credential management**:
   - Encryption at rest (AES-256)
   - Secure storage (database)
   - Runtime decryption for execution
7. **Error handling and retries**:
   - Exponential backoff
   - Error strategy implementation
   - Execution logging
8. **Testing**:
   - Unit tests for each node executor
   - Integration tests for full workflows
   - E2E tests with frontend

---

## Database Schema Suggestions

**workflows table:**
- id (UUID primary key)
- user_id (UUID foreign key)
- name (VARCHAR)
- nodes (JSON)
- edges (JSON)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
- is_active (BOOLEAN)

**credentials table:**
- id (UUID primary key)
- user_id (UUID foreign key)
- name (VARCHAR)
- type (ENUM: bearer, api-key, basic, oauth2)
- encrypted_data (TEXT)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

**executions table:**
- id (UUID primary key)
- workflow_id (UUID foreign key)
- trigger_type (ENUM: manual, webhook, schedule)
- trigger_data (JSON)
- status (ENUM: running, completed, failed, partial)
- results (JSON)
- started_at (TIMESTAMP)
- completed_at (TIMESTAMP)
- execution_time_ms (INTEGER)

**execution_logs table:**
- id (UUID primary key)
- execution_id (UUID foreign key)
- node_id (VARCHAR)
- log_level (ENUM: info, success, warning, error)
- message (TEXT)
- details (JSON)
- timestamp (TIMESTAMP)

**webhooks table:**
- id (UUID primary key)
- workflow_id (UUID foreign key)
- path (VARCHAR unique)
- method (ENUM: GET, POST, PUT)
- is_active (BOOLEAN)
- created_at (TIMESTAMP)

---

## Environment Variables Needed

```
# Database
DATABASE_URL=postgresql://...
DATABASE_ENCRYPT_KEY=...

# Server
PORT=3000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3003

# Webhook Base URL
WEBHOOK_BASE_URL=https://yourdomain.com

# Execution
MAX_EXECUTION_TIME_MS=300000
MAX_RETRY_COUNT=3
RETRY_BACKOFF_MULTIPLIER=2

# Security
JWT_SECRET=...
CREDENTIAL_ENCRYPTION_KEY=...
```

---

## Performance Considerations

1. **Parallel Execution**: Use topological sort layers to execute independent nodes concurrently
2. **Timeout Handling**: Enforce max execution time per node and per workflow
3. **Resource Limits**: Limit concurrent workflow executions
4. **Caching**: Cache credential decryption, API responses where appropriate
5. **Queue System**: Use job queue (Bull/BullMQ) for async workflow execution
6. **Rate Limiting**: Protect webhook endpoints from abuse

---

## Security Considerations

1. **Credential Encryption**: Use AES-256-GCM for credentials at rest
2. **Input Validation**: Validate all workflow data before execution
3. **JavaScript Sandboxing**: Use VM2 or isolated-vm for custom transforms
4. **Webhook Authentication**: Optional webhook secret validation
5. **Rate Limiting**: Prevent API abuse
6. **CORS**: Strict CORS policy for API endpoints
7. **SQL Injection**: Use parameterized queries
8. **XSS Prevention**: Sanitize user inputs

---

## Testing Strategy

1. **Unit Tests**: Each node executor, validator functions
2. **Integration Tests**: Full workflow execution scenarios
3. **E2E Tests**: Frontend → Backend → Execution → Response
4. **Load Tests**: Multiple concurrent workflow executions
5. **Security Tests**: Credential handling, injection attempts

---

**End of Documentation**

Ready for backend implementation! 🚀

---

## Additional Frontend Files (Complete Reference)

### Components Directory

#### `/src/components/Canvas/`
**WorkflowCanvas.tsx** - Alternative canvas implementation (not currently used in Editor)
**NodePalette.tsx** - Alternative node palette component (not currently used)
**ConnectionLine.tsx** - Custom connection line styling for React Flow
**index.ts** - Barrel export for canvas components

#### `/src/components/common/`
**Button.tsx** - Reusable button component with variants
**Input.tsx** - Styled text input component
**Select.tsx** - Dropdown select component
**Modal.tsx** - Modal dialog wrapper component
**Loader.tsx** - Loading spinner component
**index.ts** - Barrel export for common UI components

#### `/src/components/Dashboard/`
**ProjectCard.tsx** - Card component displaying workflow project summary
**ProjectSearch.tsx** - Search/filter component for project list
**NewProjectModal.tsx** - Modal for creating new workflow projects
**index.ts** - Barrel export for dashboard components

#### `/src/components/Editor/`
**FieldMapper.tsx** - Field mapping component (alternative to inline modal)
**SchemaEditor.tsx** - Schema editing component
**ExecutionLogs.tsx** - Execution log viewer component
**TestRunner.tsx** - Component for testing workflow execution
**index.ts** - Barrel export for editor components

#### `/src/components/History/`
**VersionHistory.tsx** - Workflow version history and rollback
**index.ts** - Barrel export

#### `/src/components/Layout/`
**AppLayout.tsx** - Main application layout wrapper
**Toolbar.tsx** - Top navigation toolbar component
**CollapsiblePanel.tsx** - Reusable collapsible sidebar panel
**PropertiesPanel.tsx** - Right panel for node properties
**index.ts** - Barrel export

#### `/src/components/Nodes/`
**APINode.tsx** - Custom React Flow node for API calls (documented above)
**NodeConfig.tsx** - Node configuration component
**NodeHandle.tsx** - Custom handle component for node connections
**index.ts** - Barrel export

#### `/src/components/panels/`
**ExecutionPanel.tsx** - Bottom panel showing activity logs (used in Editor)
**CredentialPanel.tsx** - Credential management panel (removed from UI)
**SchemaPanel.tsx** - API schema viewing panel (removed from UI)
**MockApiPanel.tsx** - Mock API testing panel (removed from UI)
**TransformPanel.tsx** - Data transformation preview (removed from UI)
**WebhookPanel.tsx** - Webhook configuration panel (removed from UI)
**index.ts** - Barrel export (DebugPanel removed)

**Note:** Most panels were removed from the UI to simplify the interface. Only ExecutionPanel is actively used.

#### `/src/components/Schema/`
**SchemaFieldList.tsx** - List component for editing API schemas (documented above)
**SchemaFieldEditor.tsx** - Individual field editor
**FieldMappingInput.tsx** - Input component for field mapping configuration
**index.ts** - Barrel export

#### `/src/components/Templates/`
**TemplateLibrary.tsx** - Template browsing library
**TemplateCard.tsx** - Individual template card component
**index.ts** - Barrel export

---

### Services Directory

#### `/src/services/workflowValidator.ts` (Documented above)
Workflow validation engine with graph algorithms

#### `/src/services/api.ts`
**Purpose:** Base API client configuration
**Contains:**
- Axios instance configuration
- Request/response interceptors
- Error handling middleware
- Base URL configuration
- Authentication token injection

#### `/src/services/workflowApi.ts`
**Purpose:** Workflow CRUD operations
**Contains:**
- `createWorkflow()` - POST /api/workflows
- `getWorkflow(id)` - GET /api/workflows/:id
- `updateWorkflow(id, data)` - PUT /api/workflows/:id
- `deleteWorkflow(id)` - DELETE /api/workflows/:id
- `listWorkflows()` - GET /api/workflows

**Current Implementation:** Placeholder functions that will call backend API

#### `/src/services/projectApi.ts`
**Purpose:** Project management operations
**Contains:**
- Project creation, retrieval, update, deletion
- Project listing with filters
- Project sharing and permissions

**Current Implementation:** Placeholder - not yet connected to backend

#### `/src/services/credentialApi.ts`
**Purpose:** Credential management API calls
**Contains:**
- `saveCredential()` - Store encrypted credentials
- `getCredential(id)` - Retrieve credential metadata
- `listCredentials()` - List user's credentials
- `deleteCredential(id)` - Remove credential

**Current Implementation:** Placeholder - credentials currently stored in node data

#### `/src/services/credentialManager.ts`
**Purpose:** Client-side credential handling
**Contains:**
- Credential encryption before sending to backend
- Credential validation
- Credential type handling (bearer, api-key, basic, oauth2)

**Current Implementation:** Not fully implemented - credentials stored in plain text

#### `/src/services/executionEngine.ts`
**Purpose:** Client-side execution orchestration
**Contains:**
- Workflow execution coordination
- Node execution sequencing
- Error handling and retry logic
- Execution state management

**Current Implementation:** Placeholder - actual execution will be backend-only

#### `/src/services/templateApi.ts`
**Purpose:** Template management
**Contains:**
- Template fetching
- Template search and filtering
- Template versioning

**Current Implementation:** Templates are hardcoded in Editor.tsx, not API-driven

#### `/src/services/historyApi.ts`
**Purpose:** Version history management
**Contains:**
- Workflow version tracking
- Version comparison
- Rollback functionality

**Current Implementation:** Not implemented

#### `/src/services/shareApi.ts`
**Purpose:** Workflow sharing
**Contains:**
- Share workflow with users
- Permission management
- Public link generation

**Current Implementation:** Not implemented

#### `/src/services/transformationLayer.ts`
**Purpose:** Data transformation utilities
**Contains:**
- Field mapping transformations
- Data type conversions
- Template string interpolation
- Expression evaluation

**Current Implementation:** Partial implementation

#### `/src/services/index.ts`
**Purpose:** Barrel export for all services

---

### Hooks Directory

#### `/src/hooks/useWorkflow.ts`
**Purpose:** Workflow state management hook
**Contains:**
- Workflow loading/saving logic
- Node and edge state management
- Validation trigger
- Auto-save integration

**Current Implementation:** Partially implemented

#### `/src/hooks/useAutoSave.ts`
**Purpose:** Auto-save functionality
**Contains:**
- Debounced save trigger
- Save status tracking
- Conflict detection

**Current Implementation:** Partially implemented

#### `/src/hooks/useAPIExecution.ts`
**Purpose:** API node execution hook
**Contains:**
- Execute single API node
- Handle authentication
- Parse response
- Error handling

**Current Implementation:** Mock implementation

#### `/src/hooks/useKeyboardShortcuts.ts`
**Purpose:** Global keyboard shortcuts
**Contains:**
- Cmd/Ctrl+S for save
- Cmd/Ctrl+Z for undo
- Cmd/Ctrl+Shift+Z for redo
- Delete key for node removal

**Current Implementation:** Save shortcut implemented in Editor.tsx

#### `/src/hooks/useUndoRedo.ts`
**Purpose:** Undo/redo functionality
**Contains:**
- History stack management
- Undo/redo operations
- State snapshots

**Current Implementation:** Not implemented

#### `/src/hooks/useTemplates.ts`
**Purpose:** Template management hook
**Contains:**
- Template loading
- Template filtering
- Template caching

**Current Implementation:** Not used (templates hardcoded)

#### `/src/hooks/index.ts`
**Purpose:** Barrel export for all hooks

---

### Types Directory

#### `/src/types/execution.types.ts` (Documented above)
Execution engine type definitions

#### `/src/types/node.types.ts` (Documented above)
Node type definitions

#### `/src/types/api.types.ts`
**Purpose:** API-related type definitions
**Contains:**
- HTTP method types
- Request/response types
- Error response types
- Pagination types

#### `/src/types/project.types.ts`
**Purpose:** Project-related types
**Contains:**
- Project metadata structure
- Project settings
- Sharing permissions
- Project statistics

#### `/src/types/template.types.ts`
**Purpose:** Template type definitions
**Contains:**
- Template structure
- Template category
- Template metadata
- Template versioning

#### `/src/types/workflow.ts` and `/src/types/workflow.types.ts`
**Purpose:** Workflow-specific types
**Contains:**
- Workflow structure
- Workflow metadata
- Execution history
- Workflow settings

**Note:** Appears to have duplicate definitions - may need consolidation

#### `/src/types/index.ts` (Documented above)
Central type export

---

### Stores Directory (Zustand)

#### `/src/stores/workflowStore.ts`
**Purpose:** Global workflow state management
**Contains:**
- Workflow state (nodes, edges)
- Actions (addNode, removeNode, updateNode, etc.)
- Selectors for derived state
- Persistence configuration

**Current Implementation:** Not currently used - state managed in Editor.tsx with useState

#### `/src/stores/index.ts`
**Purpose:** Barrel export for all stores

---

### Utils Directory

#### `/src/utils/nodeHelpers.ts`
**Purpose:** Node manipulation utilities
**Contains:**
- Node creation helpers
- Node validation
- Node position calculation
- Handle position calculation

#### `/src/utils/dataMapper.ts`
**Purpose:** Data mapping utilities
**Contains:**
- Field mapping execution
- Template string interpolation
- Data transformation
- Type coercion

#### `/src/utils/validation.ts`
**Purpose:** General validation utilities
**Contains:**
- Email validation
- URL validation
- JSON validation
- Schema validation

#### `/src/utils/exportCanvas.ts`
**Purpose:** Canvas export functionality
**Contains:**
- Export workflow as image
- Export workflow as JSON
- Export workflow as SVG

**Current Implementation:** Not implemented

#### `/src/utils/index.ts`
**Purpose:** Barrel export for utilities

---

### Constants Directory

#### `/src/constants/nodeTypes.ts` (Documented above)
Default node templates

#### `/src/constants/apiCategories.ts`
**Purpose:** API category definitions
**Contains:**
- Category IDs and labels
- Category icons
- Category descriptions
- Category ordering

#### `/src/constants/index.ts`
**Purpose:** Barrel export for constants

---

### Pages Directory

#### `/src/pages/Editor.tsx` (Documented above)
Main workflow editor

#### `/src/pages/Dashboard.tsx`
**Purpose:** Dashboard/home page
**Contains:**
- Project list view
- Search and filtering
- New project creation
- Recent projects
- Project statistics

**Current Implementation:** Basic implementation with localStorage

#### `/src/pages/index.ts`
**Purpose:** Barrel export for pages

---

## File Organization Summary

```
src/
├── components/          (UI components organized by feature)
│   ├── Canvas/         (Alternative canvas implementations)
│   ├── common/         (Reusable UI primitives)
│   ├── Dashboard/      (Dashboard-specific components)
│   ├── Editor/         (Editor-specific components)
│   ├── History/        (Version control components)
│   ├── Layout/         (Layout and navigation)
│   ├── Nodes/          (Custom React Flow nodes)
│   ├── panels/         (Sidebar panels - mostly unused)
│   ├── Schema/         (Schema editing components)
│   └── Templates/      (Template library components)
├── constants/          (Static data and configuration)
├── hooks/              (Custom React hooks)
├── pages/              (Top-level page components)
├── services/           (API clients and business logic)
├── stores/             (Zustand state management)
├── types/              (TypeScript type definitions)
└── utils/              (Helper functions and utilities)
```

---

## Implementation Status

### ✅ Fully Implemented
- Main Editor.tsx with all inline components
- Workflow validation engine
- Node configuration modals
- Field mapping UI
- Activity logging
- Local storage persistence
- 25 node templates (7 workflow + 18 API)

### 🟡 Partially Implemented
- Dashboard page (basic functionality)
- Common UI components (Button, Input, Modal)
- Some services (workflowValidator)
- Some hooks (keyboard shortcuts in Editor)

### ❌ Not Implemented
- Most panel components (removed from UI)
- Backend API integration (placeholder functions)
- Zustand store (not used)
- Credential encryption
- Undo/redo functionality
- Version history
- Workflow sharing
- Canvas export
- Most hooks (useAutoSave, useUndoRedo, etc.)
- Alternative Canvas/NodePalette components

---

## Key Architecture Decisions

### Why So Many Unused Files?
This appears to be a boilerplate/starter template that included many components and services that were never implemented or were later replaced with simpler inline implementations in Editor.tsx.

### Current Active Files (Critical for Backend)
1. **pages/Editor.tsx** - Main application (2600+ lines)
2. **services/workflowValidator.ts** - Validation logic
3. **types/execution.types.ts** - Execution engine types
4. **types/node.types.ts** - Node data types
5. **components/Nodes/APINode.tsx** - Node rendering
6. **components/Schema/SchemaFieldList.tsx** - Schema editing

### Files That Need Backend Integration
1. **services/workflowApi.ts** - Replace placeholder with real API calls
2. **services/credentialApi.ts** - Connect to credential storage backend
3. **services/executionEngine.ts** - Remove (execution happens backend-only)
4. **services/api.ts** - Configure with real backend URL

---

## Recommendations for Teammates

### If Working on Frontend:
- **Focus on Editor.tsx** - this is where everything happens
- **Ignore most component files** - they're not used
- **Use workflowValidator.ts** as reference for validation logic
- **Check types/** for data structures

### If Working on Backend:
- **Read execution.types.ts** - defines workflow execution model
- **Read node.types.ts** - defines node data structures
- **Study Editor.tsx lines 450-880** - all 25 node templates defined here
- **Review workflowValidator.ts** - port this logic to backend

### If Adding Features:
- **Add to Editor.tsx** - don't create new files unless absolutely necessary
- **Follow existing patterns** - inline components, useState for state
- **Update FRONTEND_ARCHITECTURE.md** - document any new features

---

**Last Updated:** 2026-01-10 after debug panel removal and comprehensive file documentation

