# Backend Implementation Guide - NodeLink Workflow Builder

**Project:** NodeLink Workflow Builder Backend
**Date:** 2026-01-10
**Purpose:** Complete backend implementation guide for hackathon
**Frontend:** React app running at http://localhost:3003

---

## Table of Contents
1. [Quick Start](#quick-start)
2. [System Architecture](#system-architecture)
3. [Tech Stack](#tech-stack)
4. [Database Schema](#database-schema)
5. [API Endpoints](#api-endpoints)
6. [Execution Engine](#execution-engine)
7. [Node Executors](#node-executors)
8. [Security Implementation](#security-implementation)
9. [Error Handling](#error-handling)
10. [Testing Strategy](#testing-strategy)
11. [Deployment](#deployment)

---

## Quick Start

### What You're Building
A **workflow execution backend** that:
- Stores workflows created in the frontend visual builder
- Executes workflows when triggered (manual or webhook)
- Handles API integrations (Stripe, SendGrid, OpenAI, etc.)
- Manages credentials securely
- Provides real-time execution status
- Returns results to frontend or webhook caller

### Priority Order for Hackathon
1. **Workflow Storage** (2-3 hours) - CRUD endpoints
2. **Execution Engine Core** (3-4 hours) - Topological sort, node execution
3. **API Node Executor** (2-3 hours) - HTTP client with auth
4. **Webhook Infrastructure** (1-2 hours) - Dynamic webhook routes
5. **Transform Node Executor** (1-2 hours) - JavaScript sandbox
6. **Credential Management** (1-2 hours) - Encryption and storage
7. **Error Handling** (1 hour) - Retry logic and error strategies

**Total:** ~12-15 hours of core development

---

## System Architecture

```
┌─────────────────┐
│  React Frontend │ (http://localhost:3003)
│  (Already Built)│
└────────┬────────┘
         │ HTTP/WebSocket
         ▼
┌─────────────────────────────────────────┐
│        Node.js Backend (Express)        │
│  ┌──────────────────────────────────┐   │
│  │     REST API Layer               │   │
│  │  - Workflow CRUD                 │   │
│  │  - Execution triggers            │   │
│  │  - Credential management         │   │
│  └──────────┬───────────────────────┘   │
│             ▼                            │
│  ┌──────────────────────────────────┐   │
│  │    Execution Engine              │   │
│  │  - Workflow validator            │   │
│  │  - Topological sort              │   │
│  │  - Node execution queue          │   │
│  │  - Error handling                │   │
│  └──────────┬───────────────────────┘   │
│             ▼                            │
│  ┌──────────────────────────────────┐   │
│  │    Node Executors (Plugins)      │   │
│  │  - API Node (HTTP client)        │   │
│  │  - Transform Node (JS sandbox)   │   │
│  │  - Condition Node (evaluator)    │   │
│  │  - Input/Output Nodes            │   │
│  └──────────┬───────────────────────┘   │
│             ▼                            │
│  ┌──────────────────────────────────┐   │
│  │   External Integrations          │   │
│  │  - Stripe API                    │   │
│  │  - SendGrid API                  │   │
│  │  - OpenAI API                    │   │
│  │  - Custom APIs                   │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│   PostgreSQL    │
│   - workflows   │
│   - executions  │
│   - credentials │
│   - webhooks    │
└─────────────────┘
```

---

## Tech Stack

### Recommended Stack (Fast Setup)
```javascript
// Core
- Node.js 18+ (TypeScript)
- Express.js (REST API)
- PostgreSQL (database)

// Libraries
- Prisma (ORM - easy schema management)
- Axios (HTTP client for API nodes)
- VM2 or isolated-vm (JavaScript sandbox)
- crypto (credential encryption)
- Bull or BullMQ (job queue for async execution)
- Socket.io (optional - real-time updates)
- jsonwebtoken (auth)
- bcrypt (password hashing)
- Zod (validation)
- Winston (logging)

// Dev Tools
- tsx (TypeScript execution)
- nodemon (auto-restart)
- Jest (testing)
```

### Project Structure
```
backend/
├── src/
│   ├── controllers/        # Request handlers
│   │   ├── workflow.controller.ts
│   │   ├── execution.controller.ts
│   │   ├── credential.controller.ts
│   │   └── webhook.controller.ts
│   ├── services/           # Business logic
│   │   ├── executionEngine.ts
│   │   ├── workflowValidator.ts
│   │   ├── credentialManager.ts
│   │   └── webhookManager.ts
│   ├── executors/          # Node type executors
│   │   ├── apiExecutor.ts
│   │   ├── transformExecutor.ts
│   │   ├── conditionExecutor.ts
│   │   └── index.ts
│   ├── middleware/         # Express middleware
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── validation.ts
│   ├── models/             # Database models (Prisma)
│   │   └── schema.prisma
│   ├── types/              # TypeScript types
│   │   ├── workflow.types.ts
│   │   ├── execution.types.ts
│   │   └── node.types.ts
│   ├── utils/              # Helper functions
│   │   ├── encryption.ts
│   │   ├── topologicalSort.ts
│   │   └── logger.ts
│   ├── routes/             # API routes
│   │   ├── workflow.routes.ts
│   │   ├── execution.routes.ts
│   │   ├── credential.routes.ts
│   │   └── webhook.routes.ts
│   └── index.ts            # Entry point
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── tests/
├── .env
├── package.json
└── tsconfig.json
```

---

## Database Schema

### Prisma Schema (schema.prisma)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Users Table
model User {
  id            String       @id @default(uuid())
  email         String       @unique
  passwordHash  String
  name          String?
  createdAt     DateTime     @default(now())
  updatedAt     DateTime     @updatedAt

  workflows     Workflow[]
  credentials   Credential[]
  executions    Execution[]
}

// Workflows Table
model Workflow {
  id          String      @id @default(uuid())
  userId      String
  name        String
  description String?
  nodes       Json        // { id, type, position, data }[]
  edges       Json        // { id, source, target, sourceHandle, targetHandle }[]
  isActive    Boolean     @default(true)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  webhooks    Webhook[]
  executions  Execution[]

  @@index([userId])
}

// Credentials Table
model Credential {
  id            String   @id @default(uuid())
  userId        String
  name          String
  type          String   // 'bearer' | 'api-key' | 'basic' | 'oauth2'
  encryptedData String   // Encrypted JSON: { token, apiKey, username, password, etc. }
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user          User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

// Webhooks Table
model Webhook {
  id         String   @id @default(uuid())
  workflowId String
  path       String   @unique // e.g., "/webhook/abc123"
  method     String   // 'GET' | 'POST' | 'PUT'
  isActive   Boolean  @default(true)
  createdAt  DateTime @default(now())

  workflow   Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)

  @@index([path])
  @@index([workflowId])
}

// Executions Table
model Execution {
  id              String   @id @default(uuid())
  workflowId      String
  userId          String
  triggerType     String   // 'manual' | 'webhook' | 'schedule'
  triggerData     Json?    // Webhook payload or manual input
  status          String   // 'running' | 'completed' | 'failed' | 'partial'
  results         Json     // { nodeId: { status, output, error, executionTimeMs } }
  startedAt       DateTime @default(now())
  completedAt     DateTime?
  executionTimeMs Int?
  error           String?

  workflow        Workflow @relation(fields: [workflowId], references: [id], onDelete: Cascade)
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  logs            ExecutionLog[]

  @@index([workflowId])
  @@index([userId])
  @@index([status])
}

// Execution Logs Table
model ExecutionLog {
  id          String   @id @default(uuid())
  executionId String
  nodeId      String?
  level       String   // 'info' | 'success' | 'warning' | 'error'
  message     String
  details     Json?
  timestamp   DateTime @default(now())

  execution   Execution @relation(fields: [executionId], references: [id], onDelete: Cascade)

  @@index([executionId])
}
```

### Database Setup Commands

```bash
# Initialize Prisma
npm install prisma @prisma/client
npx prisma init

# Create database
createdb nodelink_workflows

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# Seed database (optional)
npx prisma db seed
```

---

## API Endpoints

### Base URL
```
Development: http://localhost:3001/api
Production: https://api.nodelink.com/api
```

### Authentication
All endpoints (except webhooks) require JWT token in header:
```
Authorization: Bearer <jwt_token>
```

---

### 1. Workflow Endpoints

#### POST /api/workflows
**Purpose:** Create new workflow

**Request Body:**
```json
{
  "name": "Payment Processing",
  "description": "Process Stripe payments and send confirmation",
  "nodes": [
    {
      "id": "node-1",
      "type": "input",
      "position": { "x": 100, "y": 100 },
      "data": {
        "templateId": "webhook-trigger",
        "label": "Webhook Trigger",
        "nodeType": "input",
        "executionType": "trigger"
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "node-1",
      "target": "node-2"
    }
  ]
}
```

**Response:** 201 Created
```json
{
  "id": "workflow-123",
  "name": "Payment Processing",
  "userId": "user-456",
  "createdAt": "2026-01-10T12:00:00Z",
  "webhookUrl": "https://api.nodelink.com/webhook/abc123"
}
```

---

#### GET /api/workflows/:id
**Purpose:** Get workflow by ID

**Response:** 200 OK
```json
{
  "id": "workflow-123",
  "name": "Payment Processing",
  "nodes": [...],
  "edges": [...],
  "isActive": true,
  "createdAt": "2026-01-10T12:00:00Z",
  "updatedAt": "2026-01-10T12:00:00Z"
}
```

---

#### PUT /api/workflows/:id
**Purpose:** Update workflow

**Request Body:** Same as POST (nodes and edges)

**Response:** 200 OK

---

#### DELETE /api/workflows/:id
**Purpose:** Delete workflow

**Response:** 204 No Content

---

#### GET /api/workflows
**Purpose:** List all workflows for user

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `search` (optional filter)

**Response:** 200 OK
```json
{
  "workflows": [...],
  "total": 42,
  "page": 1,
  "totalPages": 3
}
```

---

### 2. Execution Endpoints

#### POST /api/workflows/:id/execute
**Purpose:** Manually execute workflow

**Request Body:**
```json
{
  "triggerData": {
    "customerId": "cus_123",
    "amount": 5000
  }
}
```

**Response:** 202 Accepted (async execution)
```json
{
  "executionId": "exec-789",
  "status": "running",
  "startedAt": "2026-01-10T12:00:00Z"
}
```

---

#### GET /api/executions/:executionId
**Purpose:** Get execution status and results

**Response:** 200 OK
```json
{
  "id": "exec-789",
  "workflowId": "workflow-123",
  "status": "completed",
  "triggerType": "manual",
  "results": {
    "node-1": {
      "nodeId": "node-1",
      "status": "success",
      "output": { "body": {...}, "headers": {...} },
      "executionTimeMs": 234
    },
    "node-2": {
      "nodeId": "node-2",
      "status": "success",
      "output": { "payment_id": "pi_123", "amount": 5000 },
      "executionTimeMs": 1523
    }
  },
  "startedAt": "2026-01-10T12:00:00Z",
  "completedAt": "2026-01-10T12:00:02Z",
  "executionTimeMs": 2000
}
```

---

#### GET /api/workflows/:id/executions
**Purpose:** List execution history for workflow

**Query Parameters:**
- `page`, `limit`, `status`

**Response:** 200 OK
```json
{
  "executions": [
    {
      "id": "exec-789",
      "status": "completed",
      "startedAt": "2026-01-10T12:00:00Z",
      "executionTimeMs": 2000
    }
  ],
  "total": 15
}
```

---

### 3. Credential Endpoints

#### POST /api/credentials
**Purpose:** Store encrypted credential

**Request Body:**
```json
{
  "name": "Stripe Production",
  "type": "bearer",
  "data": {
    "token": "sk_live_abc123..."
  }
}
```

**Response:** 201 Created
```json
{
  "id": "cred-456",
  "name": "Stripe Production",
  "type": "bearer",
  "createdAt": "2026-01-10T12:00:00Z"
}
```

**Note:** Never return decrypted data to frontend

---

#### GET /api/credentials
**Purpose:** List user's credentials (metadata only)

**Response:** 200 OK
```json
{
  "credentials": [
    {
      "id": "cred-456",
      "name": "Stripe Production",
      "type": "bearer",
      "createdAt": "2026-01-10T12:00:00Z"
    }
  ]
}
```

---

#### DELETE /api/credentials/:id
**Purpose:** Delete credential

**Response:** 204 No Content

---

### 4. Webhook Endpoints

#### POST /webhook/:path (Public - No Auth)
**Purpose:** Trigger workflow via webhook

**Example:** `POST /webhook/abc123`

**Request Body:** Any JSON
```json
{
  "event": "payment.success",
  "customerId": "cus_123",
  "amount": 5000
}
```

**Response:** 200 OK
```json
{
  "executionId": "exec-890",
  "status": "completed",
  "output": {
    "message": "Payment processed successfully"
  }
}
```

**Error:** 404 if webhook path not found

---

## Execution Engine

### High-Level Flow

```
1. Receive execution request
   ↓
2. Load workflow from database
   ↓
3. Validate workflow (cycle check, trigger check, reachability)
   ↓
4. Topological sort (get execution layers)
   ↓
5. Create execution record (status: 'running')
   ↓
6. For each layer (can execute in parallel):
   ├─ For each node in layer:
   │  ├─ Get node executor based on type
   │  ├─ Prepare input data (from upstream nodes)
   │  ├─ Execute node
   │  ├─ Store result
   │  └─ Handle errors (retry/skip/stop based on strategy)
   ↓
7. All layers complete
   ↓
8. Update execution record (status: 'completed' | 'failed' | 'partial')
   ↓
9. Return execution result
```

### Implementation Example

```typescript
// src/services/executionEngine.ts

interface ExecutionContext {
  workflowId: string;
  executionId: string;
  triggerData: any;
  results: Record<string, NodeExecutionResult>;
  skippedNodes: Set<string>;
  startTime: number;
}

class ExecutionEngine {
  async executeWorkflow(
    workflowId: string,
    triggerData: any,
    userId: string
  ): Promise<ExecutionResult> {

    // 1. Load workflow
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId }
    });

    // 2. Validate workflow
    const validation = this.validator.validate(workflow);
    if (!validation.isValid) {
      throw new Error(`Workflow validation failed: ${validation.errors}`);
    }

    // 3. Topological sort
    const layers = this.topologicalSort(workflow.nodes, workflow.edges);

    // 4. Create execution record
    const execution = await prisma.execution.create({
      data: {
        workflowId,
        userId,
        triggerType: 'manual',
        triggerData,
        status: 'running',
        results: {}
      }
    });

    // 5. Execute nodes layer by layer
    const context: ExecutionContext = {
      workflowId,
      executionId: execution.id,
      triggerData,
      results: {},
      skippedNodes: new Set(),
      startTime: Date.now()
    };

    for (const layer of layers) {
      // Execute nodes in parallel within layer
      await Promise.all(
        layer.map(nodeId => this.executeNode(nodeId, workflow, context))
      );
    }

    // 6. Update execution record
    const status = this.determineStatus(context.results);
    await prisma.execution.update({
      where: { id: execution.id },
      data: {
        status,
        results: context.results,
        completedAt: new Date(),
        executionTimeMs: Date.now() - context.startTime
      }
    });

    return {
      executionId: execution.id,
      status,
      results: context.results,
      executionTimeMs: Date.now() - context.startTime
    };
  }

  private async executeNode(
    nodeId: string,
    workflow: Workflow,
    context: ExecutionContext
  ): Promise<void> {

    const node = workflow.nodes.find(n => n.id === nodeId);
    const executor = this.getExecutor(node.data.executionType);

    try {
      // Prepare input data from upstream nodes
      const input = this.prepareNodeInput(node, context);

      // Execute node
      const result = await executor.execute(node, input, context);

      // Store result
      context.results[nodeId] = {
        nodeId,
        status: 'success',
        output: result,
        executionTimeMs: result.executionTimeMs
      };

      // Log success
      await this.logExecution(context.executionId, nodeId, 'success', 'Node executed successfully');

    } catch (error) {
      // Handle error based on strategy
      await this.handleNodeError(nodeId, error, context);
    }
  }

  private getExecutor(executionType: string): NodeExecutor {
    const executors = {
      'trigger': new TriggerExecutor(),
      'action': new APIExecutor(),
      'transform': new TransformExecutor(),
      'control': new ConditionExecutor(),
      'output': new OutputExecutor()
    };
    return executors[executionType];
  }
}
```

---

## Node Executors

### 1. API Node Executor (Most Important)

**Handles:** All API integration nodes (Stripe, SendGrid, OpenAI, etc.)

```typescript
// src/executors/apiExecutor.ts

class APIExecutor implements NodeExecutor {
  async execute(
    node: WorkflowNode,
    input: any,
    context: ExecutionContext
  ): Promise<any> {

    const { method, url, headers, auth, body, queryParams } = node.data;

    // 1. Apply field mappings (transform input data to API request)
    const requestData = this.applyFieldMappings(node.data.fieldMappings, input, context);

    // 2. Load and decrypt credentials
    const credentials = await this.loadCredentials(auth.credentialId);

    // 3. Build headers with auth
    const requestHeaders = this.buildHeaders(headers, credentials, auth);

    // 4. Make HTTP request
    const startTime = Date.now();
    const response = await axios({
      method,
      url,
      headers: requestHeaders,
      params: queryParams,
      data: requestData,
      timeout: node.data.timeout || 30000
    });

    // 5. Parse response based on schema
    const parsedOutput = this.parseResponse(response.data, node.data.responseSchema);

    return {
      ...parsedOutput,
      executionTimeMs: Date.now() - startTime
    };
  }

  private buildHeaders(
    configuredHeaders: any[],
    credentials: any,
    auth: AuthConfig
  ): Record<string, string> {

    const headers: Record<string, string> = {};

    // Add configured headers
    configuredHeaders.forEach(h => {
      if (h.enabled) {
        headers[h.key] = h.value;
      }
    });

    // Add auth header based on type
    switch (auth.type) {
      case 'bearer':
        headers['Authorization'] = `Bearer ${credentials.token}`;
        break;
      case 'api-key':
        headers[credentials.apiKeyHeader || 'X-API-Key'] = credentials.apiKey;
        break;
      case 'basic':
        const encoded = Buffer.from(`${credentials.username}:${credentials.password}`).toString('base64');
        headers['Authorization'] = `Basic ${encoded}`;
        break;
    }

    return headers;
  }

  private applyFieldMappings(
    mappings: Record<string, FieldMapping>,
    input: any,
    context: ExecutionContext
  ): any {

    const result: any = {};

    for (const [targetField, mapping] of Object.entries(mappings)) {
      if (mapping.sourceNodeId && mapping.sourceField) {
        // Get value from upstream node result
        const sourceData = context.results[mapping.sourceNodeId]?.output;
        result[targetField] = this.getNestedValue(sourceData, mapping.sourceField);
      } else if (mapping.staticValue) {
        result[targetField] = mapping.staticValue;
      }
    }

    return result;
  }
}
```

---

### 2. Transform Node Executor

**Handles:** Map Data, Filter, Custom Transform

```typescript
// src/executors/transformExecutor.ts

import { VM } from 'vm2';

class TransformExecutor implements NodeExecutor {
  async execute(
    node: WorkflowNode,
    input: any,
    context: ExecutionContext
  ): Promise<any> {

    const { transformType } = node.data;

    switch (transformType) {
      case 'map':
        return this.executeMapTransform(node, input);
      case 'filter':
        return this.executeFilterTransform(node, input);
      case 'custom':
        return this.executeCustomTransform(node, input);
      default:
        throw new Error(`Unknown transform type: ${transformType}`);
    }
  }

  private executeMapTransform(node: WorkflowNode, input: any): any {
    const { mappings } = node.data;
    const result: any = {};

    mappings.forEach((mapping: any) => {
      result[mapping.targetField] = this.getNestedValue(input, mapping.sourceField);
    });

    return result;
  }

  private executeFilterTransform(node: WorkflowNode, input: any): any {
    const { expression } = node.data;

    if (!Array.isArray(input)) {
      throw new Error('Filter node requires array input');
    }

    // Use safe VM to evaluate filter expression
    const vm = new VM({
      timeout: 1000,
      sandbox: {}
    });

    const filtered = input.filter((item: any) => {
      try {
        return vm.run(`(function(item) { return ${expression}; })(${JSON.stringify(item)})`);
      } catch (error) {
        return false;
      }
    });

    return filtered;
  }

  private executeCustomTransform(node: WorkflowNode, input: any): any {
    const { expression } = node.data;

    // Sandbox JavaScript execution
    const vm = new VM({
      timeout: 5000,
      sandbox: {
        input,
        console: {
          log: (...args: any[]) => console.log('[Custom Transform]', ...args)
        }
      }
    });

    try {
      const result = vm.run(`
        (function() {
          ${expression}
        })()
      `);
      return result;
    } catch (error) {
      throw new Error(`Custom transform failed: ${error.message}`);
    }
  }
}
```

---

### 3. Condition Node Executor

**Handles:** If/Else branching

```typescript
// src/executors/conditionExecutor.ts

class ConditionExecutor implements NodeExecutor {
  async execute(
    node: WorkflowNode,
    input: any,
    context: ExecutionContext
  ): Promise<any> {

    const { condition } = node.data;

    // Evaluate condition
    const vm = new VM({
      timeout: 1000,
      sandbox: { input }
    });

    const conditionResult = vm.run(`
      (function(input) {
        return ${condition};
      })(${JSON.stringify(input)})
    `);

    // Mark the inactive branch nodes as skipped
    const workflow = await prisma.workflow.findUnique({
      where: { id: context.workflowId }
    });

    const inactiveBranch = conditionResult ? 'false' : 'true';
    const branchEdges = workflow.edges.filter(e =>
      e.source === node.id && e.sourceHandle === inactiveBranch
    );

    this.markBranchAsSkipped(branchEdges, workflow, context);

    return {
      conditionResult,
      branch: conditionResult ? 'true' : 'false',
      input
    };
  }

  private markBranchAsSkipped(
    branchEdges: any[],
    workflow: Workflow,
    context: ExecutionContext
  ): void {

    const visited = new Set<string>();
    const queue = branchEdges.map(e => e.target);

    while (queue.length > 0) {
      const nodeId = queue.shift();
      if (visited.has(nodeId)) continue;

      visited.add(nodeId);
      context.skippedNodes.add(nodeId);

      // Add downstream nodes
      const downstreamEdges = workflow.edges.filter(e => e.source === nodeId);
      queue.push(...downstreamEdges.map(e => e.target));
    }
  }
}
```

---

### 4. Input/Output Node Executors

```typescript
// src/executors/inputOutputExecutor.ts

class TriggerExecutor implements NodeExecutor {
  async execute(
    node: WorkflowNode,
    input: any,
    context: ExecutionContext
  ): Promise<any> {
    // Simply return trigger data
    return context.triggerData || {};
  }
}

class OutputExecutor implements NodeExecutor {
  async execute(
    node: WorkflowNode,
    input: any,
    context: ExecutionContext
  ): Promise<any> {

    const { outputType } = node.data;

    switch (outputType) {
      case 'response':
        // Return data for HTTP response
        return input;

      case 'log':
        // Just log the data
        console.log('[Workflow Output]', input);
        return { logged: true };

      case 'webhook':
        // Send to external webhook
        const webhookUrl = node.data.webhookUrl;
        await axios.post(webhookUrl, input);
        return { sent: true };

      default:
        return input;
    }
  }
}
```

---

## Security Implementation

### 1. Credential Encryption

```typescript
// src/utils/encryption.ts

import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.CREDENTIAL_ENCRYPTION_KEY!; // Must be 32 bytes
const ALGORITHM = 'aes-256-gcm';

export function encryptCredential(data: any): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // Return: iv:authTag:encryptedData
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

export function decryptCredential(encryptedData: string): any {
  const [ivHex, authTagHex, encrypted] = encryptedData.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
}
```

**Usage:**
```typescript
// Store credential
const encrypted = encryptCredential({ token: 'sk_live_abc123' });
await prisma.credential.create({
  data: {
    userId,
    name: 'Stripe Production',
    type: 'bearer',
    encryptedData: encrypted
  }
});

// Load credential during execution
const credential = await prisma.credential.findUnique({ where: { id } });
const decrypted = decryptCredential(credential.encryptedData);
// Use decrypted.token in API request
```

---

### 2. JavaScript Sandbox Security

**Never use `eval()` or `Function()` directly - always use VM2:**

```typescript
import { VM } from 'vm2';

// Safe sandbox
const vm = new VM({
  timeout: 5000,              // Max 5 seconds
  sandbox: {
    input: userInput,         // Only provide safe data
    // NO access to: require, process, fs, etc.
  }
});

const result = vm.run(userCode);
```

---

### 3. Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests from this IP'
});

app.use('/api/', apiLimiter);

const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 webhook triggers per minute
  keyGenerator: (req) => req.params.path // Rate limit per webhook
});

app.use('/webhook/', webhookLimiter);
```

---

## Error Handling

### Error Strategy Implementation

```typescript
interface NodeErrorConfig {
  strategy: 'stop' | 'skip_branch' | 'retry' | 'fallback';
  retryCount?: number;
  retryDelayMs?: number;
  retryBackoffMultiplier?: number;
  fallbackNodeId?: string;
}

async function handleNodeError(
  nodeId: string,
  error: Error,
  context: ExecutionContext
): Promise<void> {

  const node = workflow.nodes.find(n => n.id === nodeId);
  const errorConfig: NodeErrorConfig = node.data.errorConfig || { strategy: 'stop' };

  switch (errorConfig.strategy) {
    case 'stop':
      // Halt entire workflow
      throw new WorkflowExecutionError(`Node ${nodeId} failed: ${error.message}`);

    case 'skip_branch':
      // Mark this node and downstream as skipped
      context.skippedNodes.add(nodeId);
      const downstreamNodes = getDownstreamNodes(nodeId, workflow);
      downstreamNodes.forEach(id => context.skippedNodes.add(id));

      context.results[nodeId] = {
        nodeId,
        status: 'skipped',
        error: error.message,
        executionTimeMs: 0
      };
      break;

    case 'retry':
      // Retry with exponential backoff
      const maxRetries = errorConfig.retryCount || 3;
      const baseDelay = errorConfig.retryDelayMs || 1000;
      const multiplier = errorConfig.retryBackoffMultiplier || 2;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const delay = baseDelay * Math.pow(multiplier, attempt - 1);
          await sleep(delay);

          const result = await executeNode(nodeId, workflow, context);
          context.results[nodeId] = result;
          return; // Success - exit retry loop

        } catch (retryError) {
          if (attempt === maxRetries) {
            throw retryError; // All retries failed
          }
        }
      }
      break;

    case 'fallback':
      // Execute alternative node
      const fallbackNodeId = errorConfig.fallbackNodeId;
      if (fallbackNodeId) {
        await executeNode(fallbackNodeId, workflow, context);
      }
      break;
  }
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// tests/executors/apiExecutor.test.ts

describe('APIExecutor', () => {
  test('executes HTTP GET request with bearer auth', async () => {
    const executor = new APIExecutor();
    const node = {
      id: 'node-1',
      data: {
        method: 'GET',
        url: 'https://api.stripe.com/v1/charges',
        auth: { type: 'bearer', credentialId: 'cred-1' }
      }
    };

    const result = await executor.execute(node, {}, mockContext);

    expect(result).toHaveProperty('data');
    expect(mockAxios).toHaveBeenCalledWith({
      method: 'GET',
      url: 'https://api.stripe.com/v1/charges',
      headers: {
        'Authorization': 'Bearer sk_test_abc123'
      }
    });
  });
});
```

### Integration Tests

```typescript
// tests/integration/workflow.test.ts

describe('Workflow Execution', () => {
  test('executes simple webhook -> api -> output workflow', async () => {
    const workflow = await createTestWorkflow({
      nodes: [
        { id: '1', type: 'trigger' },
        { id: '2', type: 'action' },
        { id: '3', type: 'output' }
      ],
      edges: [
        { source: '1', target: '2' },
        { source: '2', target: '3' }
      ]
    });

    const result = await executionEngine.executeWorkflow(
      workflow.id,
      { amount: 5000 },
      'user-1'
    );

    expect(result.status).toBe('completed');
    expect(result.results['2'].status).toBe('success');
  });
});
```

---

## Deployment

### Environment Variables (.env)

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/nodelink_workflows

# Server
PORT=3001
NODE_ENV=production
FRONTEND_URL=http://localhost:3003

# Security
JWT_SECRET=your-super-secret-jwt-key-change-this
CREDENTIAL_ENCRYPTION_KEY=32-character-hex-string-here-64

# Webhook Base URL
WEBHOOK_BASE_URL=https://api.nodelink.com

# Execution Limits
MAX_EXECUTION_TIME_MS=300000
MAX_RETRY_COUNT=3
RETRY_BACKOFF_MULTIPLIER=2

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

### Docker Setup (Optional)

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: nodelink_workflows
      POSTGRES_USER: nodelink
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: .
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://nodelink:password@postgres:5432/nodelink_workflows
    depends_on:
      - postgres

volumes:
  postgres_data:
```

---

## Quick Setup Checklist

### Day 1 - Hackathon Setup (12 hours)

**Hour 1-2: Project Setup**
- [ ] `npm init -y`
- [ ] Install dependencies: `express prisma @prisma/client axios vm2 bcrypt jsonwebtoken zod winston`
- [ ] Install dev dependencies: `typescript tsx nodemon @types/node @types/express`
- [ ] Setup `tsconfig.json`
- [ ] Setup Prisma schema
- [ ] Create database and run migrations
- [ ] Create basic Express server

**Hour 3-4: Workflow Storage**
- [ ] Implement POST /api/workflows (create)
- [ ] Implement GET /api/workflows/:id (read)
- [ ] Implement PUT /api/workflows/:id (update)
- [ ] Implement DELETE /api/workflows/:id (delete)
- [ ] Implement GET /api/workflows (list)
- [ ] Test with Postman/curl

**Hour 5-7: Execution Engine Core**
- [ ] Port validation logic from frontend `workflowValidator.ts`
- [ ] Implement topological sort
- [ ] Create execution record structure
- [ ] Implement basic execution flow (no node executors yet)
- [ ] Add execution logging

**Hour 8-10: API Node Executor**
- [ ] Implement HTTP client with auth
- [ ] Support bearer, api-key, basic auth
- [ ] Implement field mapping
- [ ] Test with Stripe/SendGrid sandbox

**Hour 11-12: Webhook + Transform**
- [ ] Implement dynamic webhook routes
- [ ] Create webhook records
- [ ] Implement transform executor (map, filter)
- [ ] Basic custom JavaScript execution

**Hour 13-15: Polish + Testing**
- [ ] Add error handling and retries
- [ ] Implement credential encryption
- [ ] Add rate limiting
- [ ] End-to-end testing with frontend
- [ ] Documentation

---

## API Testing with curl

### Create Workflow
```bash
curl -X POST http://localhost:3001/api/workflows \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "Test Workflow",
    "nodes": [...],
    "edges": [...]
  }'
```

### Execute Workflow
```bash
curl -X POST http://localhost:3001/api/workflows/workflow-123/execute \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "triggerData": { "amount": 5000 }
  }'
```

### Trigger via Webhook
```bash
curl -X POST http://localhost:3001/webhook/abc123 \
  -H "Content-Type: application/json" \
  -d '{
    "event": "payment.success",
    "amount": 5000
  }'
```

---

## Success Criteria

By end of hackathon, you should be able to:

1. ✅ Create a workflow in the frontend visual builder
2. ✅ Save workflow to PostgreSQL database
3. ✅ Trigger workflow execution manually
4. ✅ Execute a simple workflow: Webhook → Stripe API → SendGrid → Output
5. ✅ See execution results in frontend activity panel
6. ✅ Trigger workflow via webhook URL
7. ✅ Handle errors and retry failures
8. ✅ Store and use encrypted credentials

**Minimum Viable Product:**
- Workflow CRUD
- Manual execution
- API node executor (with 2-3 working integrations)
- Basic transform node
- Webhook triggering
- Execution history

**Stretch Goals (if time permits):**
- Real-time execution updates via WebSocket
- Condition node executor
- Scheduled triggers (cron)
- Workflow templates
- Analytics dashboard

---

**Good luck with the hackathon! 🚀**

**Questions?** Review FRONTEND_ARCHITECTURE.md for exact data structures and flow.
