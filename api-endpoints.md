# API Endpoints Reference

Complete list of all backend endpoints needed for NodeLink integration.

---

## Authentication

All authenticated endpoints require `Authorization: Bearer <jwt_token>` header.

---

## 1. Workflows

### POST `/api/workflows`
Create a new workflow.

**Request Body:**
```json
{
  "name": "Order Processing Workflow",
  "description": "Complete order workflow with payment processing",
  "version": "1.0.0",
  "nodes": [...],  // Array of workflow nodes (see sample-workflow-payload.json)
  "edges": [...],  // Array of connections between nodes
  "metadata": {
    "tags": ["e-commerce", "payment"],
    "category": "sales"
  }
}
```

**Response (201 Created):**
```json
{
  "id": "wf_abc123def456",
  "name": "Order Processing Workflow",
  "status": "draft",
  "createdAt": "2026-01-10T10:30:00.000Z",
  "webhookUrl": "https://api.nodelink.com/webhook/wf_abc123def456"
}
```

**Error Responses:**
- `400 Bad Request` - Invalid workflow structure or validation failed
- `401 Unauthorized` - Missing or invalid authentication token

---

### GET `/api/workflows`
List all workflows for authenticated user.

**Query Parameters:**
- `status` (optional): Filter by status (`draft`, `active`, `inactive`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response (200 OK):**
```json
{
  "workflows": [
    {
      "id": "wf_abc123def456",
      "name": "Order Processing Workflow",
      "description": "Complete order workflow",
      "status": "active",
      "version": "1.0.0",
      "createdAt": "2026-01-10T10:30:00.000Z",
      "updatedAt": "2026-01-10T11:00:00.000Z",
      "executionCount": 42,
      "lastExecutedAt": "2026-01-10T14:30:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

### GET `/api/workflows/:id`
Get workflow details by ID.

**Response (200 OK):**
```json
{
  "id": "wf_abc123def456",
  "name": "Order Processing Workflow",
  "description": "Complete order workflow",
  "status": "active",
  "version": "1.0.0",
  "nodes": [...],  // Full node array
  "edges": [...],  // Full edge array
  "metadata": {
    "tags": ["e-commerce", "payment"],
    "category": "sales"
  },
  "createdAt": "2026-01-10T10:30:00.000Z",
  "updatedAt": "2026-01-10T11:00:00.000Z",
  "webhookUrl": "https://api.nodelink.com/webhook/wf_abc123def456"
}
```

**Error Responses:**
- `404 Not Found` - Workflow does not exist

---

### PUT `/api/workflows/:id`
Update workflow (creates new version).

**Request Body:** Same structure as POST `/api/workflows`

**Response (200 OK):**
```json
{
  "id": "wf_abc123def456",
  "version": "1.1.0",
  "updatedAt": "2026-01-10T15:00:00.000Z"
}
```

---

### DELETE `/api/workflows/:id`
Delete workflow (soft delete - sets status to inactive).

**Response (204 No Content)**

---

### POST `/api/workflows/:id/activate`
Activate workflow (enables webhook and executions).

**Response (200 OK):**
```json
{
  "id": "wf_abc123def456",
  "status": "active",
  "webhookUrl": "https://api.nodelink.com/webhook/wf_abc123def456"
}
```

---

### POST `/api/workflows/:id/deactivate`
Deactivate workflow (disables webhook and executions).

**Response (200 OK):**
```json
{
  "id": "wf_abc123def456",
  "status": "inactive"
}
```

---

## 2. Workflow Execution

### POST `/api/workflows/:id/execute`
Manually trigger workflow execution.

**Request Body:**
```json
{
  "input": {
    "orderId": "ORD-12345",
    "customerId": "CUST-789",
    "items": ["ITEM-1", "ITEM-2"],
    "totalAmount": 9999
  }
}
```

**Response (202 Accepted):**
```json
{
  "executionId": "exec_xyz789abc123",
  "workflowId": "wf_abc123def456",
  "status": "running",
  "startedAt": "2026-01-10T15:30:00.000Z"
}
```

---

### POST `/webhook/:workflowId`
Webhook endpoint for triggering workflows (no authentication required for webhooks with API key validation).

**Headers:**
- `X-Webhook-Secret` (optional): Webhook secret for verification

**Request Body:** Any JSON payload (passed to workflow as trigger data)

**Response (202 Accepted):**
```json
{
  "executionId": "exec_xyz789abc123",
  "received": true
}
```

**Error Responses:**
- `404 Not Found` - Workflow does not exist or is inactive
- `403 Forbidden` - Webhook secret validation failed

---

## 3. Executions

### GET `/api/executions/:id`
Get execution details and results.

**Response (200 OK):** See `sample-execution-result.json`

---

### GET `/api/executions`
List executions for workflows.

**Query Parameters:**
- `workflowId` (optional): Filter by workflow ID
- `status` (optional): Filter by status (`running`, `success`, `failed`)
- `from` (optional): Start date (ISO 8601)
- `to` (optional): End date (ISO 8601)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response (200 OK):**
```json
{
  "executions": [
    {
      "id": "exec_xyz789abc123",
      "workflowId": "wf_abc123def456",
      "workflowName": "Order Processing Workflow",
      "status": "success",
      "startedAt": "2026-01-10T15:30:00.000Z",
      "completedAt": "2026-01-10T15:30:45.000Z",
      "duration": 45123,
      "nodesExecuted": 8,
      "nodesFailed": 0
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 127,
    "totalPages": 7
  }
}
```

---

### POST `/api/executions/:id/cancel`
Cancel running execution.

**Response (200 OK):**
```json
{
  "executionId": "exec_xyz789abc123",
  "status": "cancelled",
  "cancelledAt": "2026-01-10T15:31:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Execution already completed or failed

---

## 4. Credentials

### POST `/api/credentials`
Store encrypted credentials for API integrations.

**Request Body:**
```json
{
  "name": "Stripe Production Key",
  "service": "stripe",
  "credentials": {
    "apiKey": "sk_live_xxxxxxxxxxxxx",
    "publishableKey": "pk_live_xxxxxxxxxxxxx"
  }
}
```

**Response (201 Created):**
```json
{
  "id": "cred_aaa111bbb222",
  "name": "Stripe Production Key",
  "service": "stripe",
  "createdAt": "2026-01-10T10:00:00.000Z",
  "lastUsed": null
}
```

**Note:** Credentials are encrypted with AES-256-GCM before storage. Raw credentials are NEVER returned in API responses.

---

### GET `/api/credentials`
List stored credentials (returns metadata only, NOT raw credentials).

**Response (200 OK):**
```json
{
  "credentials": [
    {
      "id": "cred_aaa111bbb222",
      "name": "Stripe Production Key",
      "service": "stripe",
      "createdAt": "2026-01-10T10:00:00.000Z",
      "lastUsed": "2026-01-10T15:30:00.000Z"
    }
  ]
}
```

---

### DELETE `/api/credentials/:id`
Delete credential.

**Response (204 No Content)**

---

### POST `/api/credentials/:id/test`
Test credential validity by making a test API call.

**Response (200 OK):**
```json
{
  "valid": true,
  "service": "stripe",
  "testedAt": "2026-01-10T16:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Credential test failed
```json
{
  "valid": false,
  "error": "Invalid API key",
  "errorCode": "authentication_failed"
}
```

---

## 5. Webhooks

### GET `/api/webhooks/:workflowId/logs`
Get webhook delivery logs for a workflow.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)

**Response (200 OK):**
```json
{
  "logs": [
    {
      "id": "wh_log_123",
      "workflowId": "wf_abc123def456",
      "receivedAt": "2026-01-10T15:30:00.000Z",
      "payload": { "orderId": "ORD-12345" },
      "executionId": "exec_xyz789abc123",
      "status": "success",
      "responseTime": 234
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

---

## Error Response Format

All error responses follow this structure:

```json
{
  "error": {
    "code": "validation_error",
    "message": "Workflow contains cycles",
    "details": {
      "cycle": ["node-1", "node-2", "node-3", "node-1"]
    }
  }
}
```

**Common Error Codes:**
- `validation_error` - Request validation failed
- `authentication_failed` - Invalid or missing auth token
- `not_found` - Resource does not exist
- `rate_limit_exceeded` - Too many requests
- `internal_error` - Server error (500)

---

## Rate Limits

- **Authenticated endpoints**: 1000 requests/hour per user
- **Webhook endpoints**: 10,000 requests/hour per workflow
- **Execution endpoints**: 100 concurrent executions per user

**Rate limit headers:**
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 742
X-RateLimit-Reset: 1641823200
```

---

## Environment Variables Required

Backend needs these environment variables:

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/nodelink"

# JWT Authentication
JWT_SECRET="your-secret-key-min-32-chars"
JWT_EXPIRATION="7d"

# Encryption (for credentials)
ENCRYPTION_KEY="your-aes-256-key-32-bytes"

# Server
PORT=3001
NODE_ENV="production"

# Webhook
WEBHOOK_BASE_URL="https://api.nodelink.com"

# Rate Limiting
REDIS_URL="redis://localhost:6379"
```
