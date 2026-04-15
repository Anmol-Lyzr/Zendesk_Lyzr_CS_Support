## Lyzr Studio — Sample Tickets (10)

This file contains 10 realistic, Lyzr Studio–specific “problem content” examples that can be used as seed tickets in demos or UI mocks.

---

### 1001 — Workflow Studio: Execute fails with TIMEOUT on ai_processor node
- **Type/Priority**: incident / high
- **Product area**: Workflow Studio (Orchestration)
- **Problem description**: In Workflow Studio, execution fails on the `ai_processor` node with a timeout. Retrying works sometimes but often fails. Error payload:

```json
{
  "status": "failed",
  "error": {
    "type": "NodeExecutionError",
    "message": "Agent API timeout",
    "node": "ai_processor",
    "code": "TIMEOUT"
  }
}
```

- **Impact**: Production workflows blocked; intermittent failures break automation.
- **Repro/notes**:
  - Happens under normal usage, started today
  - Suspected: large input/context, slow provider latency, execution timeout threshold

---

### 1002 — Workflow Studio: INVALID_CONFIG after importing exported JSON
- **Type/Priority**: problem / high
- **Product area**: Workflow Studio (Import/Export)
- **Problem description**: Workflow exported from Studio fails after import into a different workspace. Execution fails with:

```json
{
  "status": "failed",
  "error": {
    "type": "NodeExecutionError",
    "code": "INVALID_CONFIG",
    "message": "Wrong parameters",
    "node": "tool_call"
  }
}
```

- **Impact**: Teams can’t reuse workflows across workspaces; onboarding blocked.
- **Repro/notes**:
  - JSON wasn’t manually edited
  - Likely missing tool/credential binding or environment-specific IDs (credential/KB/context IDs)

---

### 1003 — Workflow execute API returns API_RATE_LIMIT during load test
- **Type/Priority**: incident / normal
- **Product area**: Workflow Execution API
- **Problem description**: Execute Workflow calls fail during load test (~30 req/min). Error:

```json
{
  "status": "failed",
  "error": {
    "type": "NodeExecutionError",
    "code": "API_RATE_LIMIT",
    "message": "Too many requests"
  }
}
```

- **Impact**: Reliability issues under expected throughput; automation backs up.
- **Repro/notes**:
  - Needs guidance on retry/backoff + safe concurrency

---

### 1004 — Workflow Studio: AUTH_ERROR after rotating API key
- **Type/Priority**: incident / high
- **Product area**: Studio credentials / authentication
- **Problem description**: API key rotated; backend env vars updated, but Studio workflow execution fails:

```json
{
  "status": "failed",
  "error": { "code": "AUTH_ERROR", "message": "Invalid credentials" }
}
```

- **Impact**: All Studio executions blocked; urgent for production.
- **Repro/notes**:
  - Likely Studio workspace uses a separate saved credential that still points to the old key

---

### 1005 — Workflow Studio: intermittent NETWORK_ERROR from WebSocket monitoring
- **Type/Priority**: problem / urgent
- **Product area**: Real-time session monitoring (WebSocket)
- **Problem description**: Studio monitoring stream drops with `NETWORK_ERROR`. Runs may still complete but UI loses trace/updates; requires refresh.
- **Impact**: Debugging is unreliable; major slowdown for engineering/support.
- **Repro/notes**:
  - Happens multiple times per day
  - Suspected: proxy/VPN idle timeouts, missing keep-alives, insufficient client reconnect/backoff

---

### 2001 — KB Studio: Parse Website completes but Retrieve returns no relevant docs
- **Type/Priority**: incident / high
- **Product area**: Knowledge Base (RAG)
- **Problem description**: Parse Website reports success, but Retrieve returns irrelevant results or empty responses. Setup uses Qdrant + `text-embedding-3-large`.
- **Impact**: KB doesn’t answer from docs; blocks chatbot/go-live.
- **Repro/notes**:
  - Suspected: crawl coverage issues (robots/auth/allowed domains), empty chunks, or querying wrong KB config

---

### 2002 — RAG: PDF ingestion succeeds but answers cite wrong sections (chunking issue?)
- **Type/Priority**: problem / normal
- **Product area**: Knowledge Base (PDF ingestion + retrieval)
- **Problem description**: Retrieval returns chunks but answers cite wrong sections or mix topics from different pages. Customer wants more precise grounding/citations.
- **Impact**: Trust/accuracy issues; reduced adoption.
- **Repro/notes**:
  - Suspected: large chunk size, poor overlap, or PDF text extraction order

---

### 2003 — KB reset/training: Retrieve still returns old content (stale index?)
- **Type/Priority**: question / low
- **Product area**: Knowledge Base lifecycle (Reset + Train)
- **Problem description**: After Reset RAG and retraining new text, Retrieve still surfaces old content.
- **Impact**: Confusing; can’t reliably roll out updated knowledge.
- **Repro/notes**:
  - Most common root cause: Reset/Train/Retrieve use different KB/RAG IDs or multiple configs exist

---

### 3001 — OpenAPI Tool: Execute fails with NotFoundError (404) for operationId
- **Type/Priority**: question / normal
- **Product area**: Tools (OpenAPI)
- **Problem description**: OpenAPI tool exists in Studio, but workflow calls fail with 404 / NotFound for operation. Spec was recently updated; operationId mapping may be stale.
- **Impact**: Tooling integration blocked.
- **Repro/notes**:
  - Likely outdated operationId reference or tool version mismatch; requires re-import/refresh + node re-bind

---

### 3002 — Workflow fails with ToolNotFoundError after renaming a tool
- **Type/Priority**: incident / high
- **Product area**: Tools + Workflows
- **Problem description**: Tool renamed; existing workflows now fail with ToolNotFoundError because nodes reference old identifier. Customer asks about alias/bulk update.
- **Impact**: Multiple workflows break at once; urgent.
- **Repro/notes**:
  - Best path is usually re-bind nodes; for many workflows export JSON → controlled replace → re-import/validate

