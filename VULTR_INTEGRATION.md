# Vultr Integration Guide for NodeLink

Vultr is a cloud infrastructure provider offering VPS instances, block storage, DNS, Kubernetes, and more. This guide shows how to integrate Vultr into your NodeLink workflow builder.

---

## Vultr API Overview

**Base URL:** `https://api.vultr.com/v2`
**Authentication:** API Key in header `Authorization: Bearer YOUR_API_KEY`
**Documentation:** https://www.vultr.com/api/

**Common Operations:**
- **Compute:** Create/manage VPS instances
- **DNS:** Manage domains and DNS records
- **Block Storage:** Attach storage volumes
- **Snapshots:** Create instance backups
- **Kubernetes:** Deploy K8s clusters
- **Load Balancers:** Configure load balancing

---

## 1. Add Vultr API Templates to Frontend

### Step 1: Import Required Icons

Add to imports section in `/frontend/src/pages/Editor.tsx` (around line 20-60):

```typescript
import {
  // ... existing imports
  Cloud,
  Server,     // ADD THIS for Vultr
  HardDrive,  // ADD THIS for Block Storage
  // ... rest of imports
} from 'lucide-react';
```

### Step 2: Add Infrastructure Category

Add to categories array in `/frontend/src/pages/Editor.tsx` (around line 1051):

```typescript
const categories = [
  // ... existing categories
  { id: 'infrastructure', name: 'Infrastructure', icon: Server }, // ADD THIS
];
```

### Step 3: Add Vultr Templates

Add these templates to the `apiTemplates` array in `/frontend/src/pages/Editor.tsx` (after Stripe around line 650):

```typescript
// ============= VULTR COMPUTE =============
{
  id: 'vultr-create-instance',
  name: 'Vultr Create Instance',
  icon: Server,
  color: '#007BFC',
  category: 'infrastructure',
  description: 'Create and deploy cloud VPS instances',
  executionType: 'action',
  fields: {
    inputs: [
      { id: 'region', name: 'Region', type: 'string', required: true, description: 'Vultr region ID', example: 'ewr' },
      { id: 'plan', name: 'Plan', type: 'string', required: true, description: 'Plan ID for instance size', example: 'vc2-1c-1gb' },
      { id: 'os_id', name: 'OS ID', type: 'number', required: true, description: 'Operating system identifier', example: '387' },
      { id: 'label', name: 'Label', type: 'string', description: 'Instance label/hostname', example: 'my-web-server' },
      { id: 'hostname', name: 'Hostname', type: 'string', description: 'Fully qualified domain name', example: 'server.example.com' },
      { id: 'enable_ipv6', name: 'Enable IPv6', type: 'boolean', description: 'Enable IPv6 networking', example: 'true' },
      { id: 'backups', name: 'Auto Backups', type: 'string', description: 'Enable automatic backups', example: 'enabled' },
      { id: 'user_data', name: 'User Data', type: 'string', description: 'Cloud-init script for first boot' },
      { id: 'ssh_key_ids', name: 'SSH Keys', type: 'array', description: 'Array of SSH key IDs to install' },
      { id: 'tags', name: 'Tags', type: 'array', description: 'Array of tags for organization' },
    ],
    outputs: [
      { id: 'instance_id', name: 'Instance ID', type: 'string', description: 'Unique instance identifier' },
      { id: 'main_ip', name: 'Main IP', type: 'string', description: 'Primary IPv4 address' },
      { id: 'v6_main_ip', name: 'IPv6 Address', type: 'string', description: 'Primary IPv6 address' },
      { id: 'status', name: 'Status', type: 'string', description: 'Instance status (active/pending)' },
      { id: 'region', name: 'Region', type: 'string', description: 'Deployed region' },
      { id: 'default_password', name: 'Root Password', type: 'string', description: 'Initial root password' },
    ],
  },
  credentials: [
    { id: 'api_key', name: 'API Key', type: 'password', required: true, description: 'Vultr API key from account settings' },
  ],
  parameters: [
    { id: 'api_version', name: 'API Version', type: 'text', required: true, default: 'v2', disabled: true },
  ],
},

// ============= VULTR DNS =============
{
  id: 'vultr-dns-record',
  name: 'Vultr DNS Record',
  icon: Globe,
  color: '#007BFC',
  category: 'infrastructure',
  description: 'Create or update DNS records',
  executionType: 'action',
  fields: {
    inputs: [
      { id: 'domain', name: 'Domain', type: 'string', required: true, description: 'Domain name', example: 'example.com' },
      { id: 'name', name: 'Record Name', type: 'string', required: true, description: 'DNS record name', example: 'www' },
      { id: 'type', name: 'Record Type', type: 'string', required: true, description: 'DNS record type', example: 'A' },
      { id: 'data', name: 'Record Data', type: 'string', required: true, description: 'IP address or target', example: '192.0.2.1' },
      { id: 'ttl', name: 'TTL', type: 'number', description: 'Time to live in seconds', example: '3600' },
      { id: 'priority', name: 'Priority', type: 'number', description: 'Priority (for MX records)', example: '10' },
    ],
    outputs: [
      { id: 'record_id', name: 'Record ID', type: 'string', description: 'DNS record identifier' },
      { id: 'type', name: 'Type', type: 'string', description: 'Record type' },
      { id: 'name', name: 'Name', type: 'string', description: 'Full record name' },
      { id: 'data', name: 'Data', type: 'string', description: 'Record value' },
    ],
  },
  credentials: [
    { id: 'api_key', name: 'API Key', type: 'password', required: true, description: 'Vultr API key' },
  ],
  parameters: [],
},

// ============= VULTR SNAPSHOT =============
{
  id: 'vultr-create-snapshot',
  name: 'Vultr Create Snapshot',
  icon: Database,
  color: '#007BFC',
  category: 'infrastructure',
  description: 'Create instance snapshot backup',
  executionType: 'action',
  fields: {
    inputs: [
      { id: 'instance_id', name: 'Instance ID', type: 'string', required: true, description: 'Instance to snapshot', example: 'cb676a46-66fd-4dfb-b839-443f2e6c0b60' },
      { id: 'description', name: 'Description', type: 'string', description: 'Snapshot description', example: 'Pre-deployment backup' },
    ],
    outputs: [
      { id: 'snapshot_id', name: 'Snapshot ID', type: 'string', description: 'Created snapshot identifier' },
      { id: 'status', name: 'Status', type: 'string', description: 'Snapshot status' },
      { id: 'size', name: 'Size', type: 'number', description: 'Snapshot size in GB' },
      { id: 'date_created', name: 'Created At', type: 'string', description: 'Creation timestamp' },
    ],
  },
  credentials: [
    { id: 'api_key', name: 'API Key', type: 'password', required: true, description: 'Vultr API key' },
  ],
  parameters: [],
},

// ============= VULTR BLOCK STORAGE =============
{
  id: 'vultr-attach-storage',
  name: 'Vultr Attach Storage',
  icon: HardDrive,
  color: '#007BFC',
  category: 'infrastructure',
  description: 'Attach block storage to instance',
  executionType: 'action',
  fields: {
    inputs: [
      { id: 'block_id', name: 'Block Storage ID', type: 'string', required: true, description: 'Storage volume identifier' },
      { id: 'instance_id', name: 'Instance ID', type: 'string', required: true, description: 'Target instance' },
      { id: 'live', name: 'Live Attach', type: 'boolean', description: 'Attach without reboot', example: 'true' },
    ],
    outputs: [
      { id: 'status', name: 'Status', type: 'string', description: 'Attachment status' },
      { id: 'block_id', name: 'Block ID', type: 'string', description: 'Storage identifier' },
      { id: 'instance_id', name: 'Instance ID', type: 'string', description: 'Attached instance' },
    ],
  },
  credentials: [
    { id: 'api_key', name: 'API Key', type: 'password', required: true, description: 'Vultr API key' },
  ],
  parameters: [],
},
```

---

## 2. Backend Implementation

### Step 1: Create Vultr Executor File

Create `/backend/src/executors/vultr.ts`:

```typescript
// src/executors/vultr.ts

import axios from 'axios';
import type { ExecutionContext, NodeExecutionResult } from '../types/execution';

const VULTR_BASE_URL = 'https://api.vultr.com/v2';

interface VultrConfig {
  apiKey: string;
}

// ============= CREATE INSTANCE =============
export async function executeVultrCreateInstance(
  nodeData: any,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  const config: VultrConfig = {
    apiKey: nodeData.credentials.api_key,
  };

  const payload = {
    region: nodeData.inputs.region,
    plan: nodeData.inputs.plan,
    os_id: parseInt(nodeData.inputs.os_id),
    label: nodeData.inputs.label,
    hostname: nodeData.inputs.hostname,
    enable_ipv6: nodeData.inputs.enable_ipv6 || false,
    backups: nodeData.inputs.backups || 'disabled',
    user_data: nodeData.inputs.user_data,
    sshkey_id: nodeData.inputs.ssh_key_ids || [],
    tags: nodeData.inputs.tags || [],
  };

  try {
    const response = await axios.post(
      `${VULTR_BASE_URL}/instances`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );

    const instance = response.data.instance;

    return {
      success: true,
      output: {
        instance_id: instance.id,
        main_ip: instance.main_ip,
        v6_main_ip: instance.v6_main_ip,
        status: instance.status,
        region: instance.region,
        default_password: instance.default_password,
      },
      metadata: {
        apiResponse: response.data,
        statusCode: response.status,
      },
    };
  } catch (error: any) {
    throw new Error(
      `Vultr instance creation failed: ${error.response?.data?.error || error.message}`
    );
  }
}

// ============= CREATE DNS RECORD =============
export async function executeVultrDNSRecord(
  nodeData: any,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  const config: VultrConfig = {
    apiKey: nodeData.credentials.api_key,
  };

  // First, get domain info to get domain ID
  const domainsResponse = await axios.get(
    `${VULTR_BASE_URL}/domains`,
    {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
      },
    }
  );

  const domain = domainsResponse.data.domains.find(
    (d: any) => d.domain === nodeData.inputs.domain
  );

  if (!domain) {
    throw new Error(`Domain ${nodeData.inputs.domain} not found in Vultr account`);
  }

  // Create DNS record
  const payload = {
    name: nodeData.inputs.name,
    type: nodeData.inputs.type,
    data: nodeData.inputs.data,
    ttl: nodeData.inputs.ttl || 3600,
    priority: nodeData.inputs.priority,
  };

  const response = await axios.post(
    `${VULTR_BASE_URL}/domains/${nodeData.inputs.domain}/records`,
    payload,
    {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const record = response.data.record;

  return {
    success: true,
    output: {
      record_id: record.id,
      type: record.type,
      name: record.name,
      data: record.data,
    },
    metadata: {
      apiResponse: response.data,
    },
  };
}

// ============= CREATE SNAPSHOT =============
export async function executeVultrCreateSnapshot(
  nodeData: any,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  const config: VultrConfig = {
    apiKey: nodeData.credentials.api_key,
  };

  const payload = {
    instance_id: nodeData.inputs.instance_id,
    description: nodeData.inputs.description || `Snapshot ${new Date().toISOString()}`,
  };

  const response = await axios.post(
    `${VULTR_BASE_URL}/snapshots`,
    payload,
    {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  const snapshot = response.data.snapshot;

  return {
    success: true,
    output: {
      snapshot_id: snapshot.id,
      status: snapshot.status,
      size: snapshot.size,
      date_created: snapshot.date_created,
    },
    metadata: {
      apiResponse: response.data,
    },
  };
}

// ============= ATTACH BLOCK STORAGE =============
export async function executeVultrAttachStorage(
  nodeData: any,
  context: ExecutionContext
): Promise<NodeExecutionResult> {
  const config: VultrConfig = {
    apiKey: nodeData.credentials.api_key,
  };

  const payload = {
    instance_id: nodeData.inputs.instance_id,
    live: nodeData.inputs.live || false,
  };

  const response = await axios.post(
    `${VULTR_BASE_URL}/blocks/${nodeData.inputs.block_id}/attach`,
    payload,
    {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
    }
  );

  return {
    success: true,
    output: {
      status: 'attached',
      block_id: nodeData.inputs.block_id,
      instance_id: nodeData.inputs.instance_id,
    },
    metadata: {
      apiResponse: response.data,
    },
  };
}
```

### Step 2: Register Executors

Add to `/backend/src/executors/index.ts`:

```typescript
import {
  executeVultrCreateInstance,
  executeVultrDNSRecord,
  executeVultrCreateSnapshot,
  executeVultrAttachStorage,
} from './vultr';

export const NODE_EXECUTORS: Record<string, NodeExecutor> = {
  // ... existing executors
  'vultr-create-instance': executeVultrCreateInstance,
  'vultr-dns-record': executeVultrDNSRecord,
  'vultr-create-snapshot': executeVultrCreateSnapshot,
  'vultr-attach-storage': executeVultrAttachStorage,
};
```

### Step 3: Install Dependencies

```bash
cd backend
npm install axios
```

---

## 3. Example Use Cases

### Use Case 1: Auto-Scale Infrastructure
**Scenario:** Automatically provision new servers when traffic spikes

```
Webhook (monitoring alert: high CPU)
  ↓
Vultr Create Instance (region: ewr, plan: vc2-2c-4gb)
  ↓
Vultr Attach Storage (attach data volume)
  ↓
Vultr DNS Record (add to load balancer pool)
  ↓
Slack Notification (new server deployed)
```

### Use Case 2: Scheduled Backups
**Scenario:** Daily automated snapshots with email reports

```
Workflow Input (schedule: daily at 2 AM)
  ↓
Vultr Create Snapshot (all production instances)
  ↓
Map Data (format snapshot details)
  ↓
MongoDB Update (log backup to database)
  ↓
SendGrid Email (backup report to admins)
```

### Use Case 3: CI/CD Deployment Pipeline
**Scenario:** Deploy to new instance on git push

```
GitHub Webhook (push to main branch)
  ↓
Vultr Create Instance (Ubuntu 22.04, deploy keys)
  ↓
Custom Transform (run deployment script via SSH)
  ↓
Condition (deployment success?)
  ├─ True → Vultr DNS Record (update production DNS)
  └─ False → Slack Alert (deployment failed)
```

### Use Case 4: Disaster Recovery
**Scenario:** Automatic failover on instance failure

```
Workflow Input (health check failed)
  ↓
Condition (check instance status)
  ↓
Vultr Create Instance (restore from latest snapshot)
  ↓
Vultr DNS Record (switch DNS to new instance)
  ↓
Twilio SMS (alert DevOps team)
  ↓
Workflow Output (return new instance IP)
```

### Use Case 5: Development Environment Provisioning
**Scenario:** Spin up dev environments on-demand

```
Webhook Trigger (developer requests environment)
  ↓
Vultr Create Instance (label: dev-{{username}})
  ↓
Vultr DNS Record (dev-{{username}}.example.com)
  ↓
Map Data (format access credentials)
  ↓
SendGrid Email (send login details to developer)
```

---

## 4. Getting Your Vultr API Key

1. **Sign up/Login** to Vultr: https://my.vultr.com
2. Navigate to **Account** → **API**
3. Click **Enable API** (if not already enabled)
4. Copy the generated API key
5. In NodeLink, go to **Credentials** panel
6. Add new credential:
   - Name: `Vultr Production`
   - Service: `vultr`
   - API Key: `paste your key`

**Security Note:** API keys have full account access. Never commit them to git or expose in frontend code.

---

## 5. Common Vultr API Reference Values

### Regions (use region ID)

| Region Code | Location | Description |
|-------------|----------|-------------|
| `ewr` | New Jersey | US East Coast |
| `ord` | Chicago | US Central |
| `dfw` | Dallas | US Central |
| `sea` | Seattle | US West Coast |
| `lax` | Los Angeles | US West Coast |
| `atl` | Atlanta | US Southeast |
| `sjc` | Silicon Valley | US West Coast |
| `ams` | Amsterdam | Europe |
| `lhr` | London | Europe |
| `fra` | Frankfurt | Europe |
| `syd` | Sydney | Asia Pacific |
| `sgp` | Singapore | Asia Pacific |
| `nrt` | Tokyo | Asia Pacific |

### Plan IDs (instance sizes)

| Plan ID | vCPU | RAM | Storage | Bandwidth | Price/mo |
|---------|------|-----|---------|-----------|----------|
| `vc2-1c-1gb` | 1 | 1 GB | 25 GB SSD | 1 TB | $5 |
| `vc2-1c-2gb` | 1 | 2 GB | 55 GB SSD | 2 TB | $10 |
| `vc2-2c-4gb` | 2 | 4 GB | 80 GB SSD | 3 TB | $18 |
| `vc2-4c-8gb` | 4 | 8 GB | 160 GB SSD | 4 TB | $36 |
| `vc2-6c-16gb` | 6 | 16 GB | 320 GB SSD | 5 TB | $72 |
| `vc2-8c-32gb` | 8 | 32 GB | 640 GB SSD | 6 TB | $144 |

### OS IDs (operating systems)

| OS ID | Operating System |
|-------|------------------|
| `387` | Ubuntu 22.04 LTS (Jammy) |
| `1743` | Ubuntu 20.04 LTS (Focal) |
| `477` | Debian 11 (Bullseye) |
| `362` | CentOS 7 |
| `401` | Fedora 36 |
| `230` | FreeBSD 13 |
| `456` | Windows Server 2019 |
| `159` | Custom ISO |

### DNS Record Types

| Type | Description | Example Data |
|------|-------------|--------------|
| `A` | IPv4 address | `192.0.2.1` |
| `AAAA` | IPv6 address | `2001:db8::1` |
| `CNAME` | Canonical name | `example.com` |
| `MX` | Mail exchange | `mail.example.com` |
| `TXT` | Text record | `v=spf1 include:_spf.google.com ~all` |
| `SRV` | Service record | `10 5 5060 sipserver.example.com` |
| `NS` | Name server | `ns1.example.com` |

---

## 6. Testing Your Integration

### Test Workflow: Create Instance

1. **Open NodeLink Editor**
2. **Add Vultr Create Instance node**
3. **Configure inputs:**
   ```json
   {
     "region": "ewr",
     "plan": "vc2-1c-1gb",
     "os_id": 387,
     "label": "test-nodelink-server",
     "hostname": "test.example.com",
     "enable_ipv6": true
   }
   ```
4. **Add Credentials:**
   - Select your Vultr API key credential
5. **Add Workflow Output node**
6. **Connect:** Vultr Create Instance → Workflow Output
7. **Execute Workflow**
8. **Expected Output:**
   ```json
   {
     "instance_id": "cb676a46-66fd-4dfb-b839-443f2e6c0b60",
     "main_ip": "45.76.123.45",
     "v6_main_ip": "2001:19f0:5:123::1",
     "status": "active",
     "region": "ewr",
     "default_password": "aBcD1234!@#$"
   }
   ```

### Test Workflow: DNS Record

1. **Add Vultr DNS Record node**
2. **Configure inputs:**
   ```json
   {
     "domain": "example.com",
     "name": "test",
     "type": "A",
     "data": "192.0.2.1",
     "ttl": 3600
   }
   ```
3. **Execute Workflow**
4. **Verify:** `test.example.com` points to `192.0.2.1`

---

## 7. Troubleshooting

### Error: "Invalid API Key"

**Cause:** API key is incorrect or not enabled

**Fix:**
1. Verify API is enabled in Vultr dashboard
2. Copy the correct API key (no extra spaces)
3. Update credential in NodeLink

### Error: "Region not available"

**Cause:** Selected region doesn't support the chosen plan

**Fix:**
1. Check region availability: `GET /v2/plans`
2. Use a different region or plan combination

### Error: "Insufficient funds"

**Cause:** Vultr account has insufficient balance

**Fix:**
1. Add payment method in Vultr dashboard
2. Ensure account has positive balance

### Error: "Rate limit exceeded"

**Cause:** Too many API requests in short time

**Fix:**
1. Add retry logic with exponential backoff
2. Use workflow error handling: `strategy: "retry"`
3. Space out requests in workflow

### Error: "Domain not found"

**Cause:** DNS domain doesn't exist in Vultr account

**Fix:**
1. Add domain in Vultr DNS dashboard first
2. Verify domain name spelling matches exactly

---

## 8. Advanced Features

### SSH Key Management

Upload SSH keys to Vultr and reference them in instance creation:

```json
{
  "ssh_key_ids": ["abc123", "def456"]
}
```

### Cloud-Init User Data

Automate instance setup with cloud-init scripts:

```json
{
  "user_data": "IyEvYmluL2Jhc2gKYXB0IHVwZGF0ZQphcHQgaW5zdGFsbCAteSBuZ2lueA=="
}
```

(Base64 encoded bash script)

### Instance Tags

Organize instances with tags for better management:

```json
{
  "tags": ["production", "web-server", "nodelink-managed"]
}
```

### Auto Backups

Enable automatic weekly backups:

```json
{
  "backups": "enabled"
}
```

**Cost:** Adds 20% to instance price

---

## 9. Cost Estimation

**Instance Costs:**
- Billed hourly (monthly price / 720 hours)
- Auto-scales to monthly cap
- Destroyed instances: charged for used time only

**Example Workflow Cost:**
```
Create Instance ($5/mo plan) for 2 hours
  = $5 / 720 hours * 2 hours
  = $0.014

Snapshot (10 GB) for 1 month
  = 10 GB * $0.05/GB
  = $0.50

Total: $0.514
```

---

## 10. Security Best Practices

1. **API Key Rotation:**
   - Rotate keys every 90 days
   - Use separate keys for dev/prod

2. **Least Privilege:**
   - Create sub-accounts with limited permissions (future Vultr feature)
   - Monitor API usage logs

3. **Credential Storage:**
   - Never hardcode API keys
   - Use NodeLink credential encryption (AES-256-GCM)

4. **Firewall Rules:**
   - Configure firewall groups in Vultr
   - Restrict instance access by IP

5. **Backup Strategy:**
   - Automate snapshots via workflows
   - Store critical snapshots off-instance

---

## 11. Monitoring & Alerts

**Create monitoring workflows:**

```
Scheduled Trigger (every 5 minutes)
  ↓
Custom Transform (check instance health via Vultr API)
  ↓
Condition (status !== "active"?)
  ↓
Twilio SMS (alert DevOps)
```

**Vultr Monitoring Endpoints:**
- `GET /v2/instances/{instance-id}` - Instance status
- `GET /v2/instances/{instance-id}/bandwidth` - Bandwidth usage
- `GET /v2/instances/{instance-id}/ipv4` - IP addresses

---

## Resources

- **Vultr API Docs:** https://www.vultr.com/api/
- **API Changelog:** https://www.vultr.com/api/#section/Changelog
- **Status Page:** https://status.vultr.com/
- **Support:** https://my.vultr.com/support/

---

## Summary

You now have complete Vultr integration in NodeLink:

✅ **4 Vultr node types** (Create Instance, DNS Record, Snapshot, Attach Storage)
✅ **Complete backend executors** with error handling
✅ **Production-ready workflows** for common use cases
✅ **Security best practices** for API key management
✅ **Cost optimization** strategies

Your team can now automate infrastructure provisioning, DNS management, backups, and disaster recovery directly from NodeLink workflows!
