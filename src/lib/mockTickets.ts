export type TicketId = string;

export type SimilarityGroup = "A" | "B" | "C";

export type TicketPriority = "low" | "normal" | "high" | "urgent";

export type TicketType = "question" | "incident" | "problem" | "task";

export type SentimentLabel = "neutral" | "negative" | "positive";
export type SatisfactionLevel = "Low" | "Neutral" | "High";
export type ConfusionLevel = "Low" | "Medium" | "High";
export type UrgencyLevel = "Low" | "Medium" | "High";

export type TicketSentiment = {
  satisfactionLevel: SatisfactionLevel;
  confusionLevel: ConfusionLevel;
  urgencyLevel: UrgencyLevel;
  sentimentScore: number; // 1-10
  sentimentLabel: SentimentLabel;
};

export type Customer = {
  id: string;
  name: string;
  orgName: string;
  email: string;
};

export type Message = {
  id: string;
  authorName: string;
  authorType: "customer" | "agent" | "system";
  visibility: "public" | "internal";
  createdAt: string; // ISO
  body: string;
};

export type Ticket = {
  id: TicketId;
  subject: string;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  status: "new" | "open" | "pending" | "solved";
  type: TicketType;
  priority: TicketPriority;
  tags: string[];
  similarityGroup: SimilarityGroup;
  isRecurring: boolean;
  isUrgent: boolean;
  requester: Customer;
  assigneeName: string;
  followers: string[];
  conversation: Message[];
  lyzr: {
    summary: string;
    issueReported: string;
    nextSteps: string[];
    draftResponse: string;
    sentiment: TicketSentiment;
  };
};

type SeedTicketInput = Omit<Ticket, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

function iso(d: string) {
  return new Date(d).toISOString();
}

const customers = {
  samAcme: {
    id: "cust_sam",
    name: "Sam",
    orgName: "Acme Corp",
    email: "sam@acme.com",
  },
  lucyNorthwind: {
    id: "cust_lucy",
    name: "Lucy",
    orgName: "Northwind Traders",
    email: "lucy@northwind.example",
  },
  peterGlobex: {
    id: "cust_peter",
    name: "Peter Strong",
    orgName: "Globex",
    email: "peter@globex.example",
  },
} satisfies Record<string, Customer>;

const agentNames = {
  lucy: "Lucy",
  peter: "Peter Strong",
  aisha: "Aisha Khan",
  marco: "Marco Alvarez",
} as const;

export const tickets: Ticket[] = [
  // Group A (5) - Workflow Studio execution failures
  seed({
    id: "1001",
    subject: "Workflow Studio: Execute fails with TIMEOUT on ai_processor node",
    createdAt: iso("2026-04-12T09:13:00-07:00"),
    updatedAt: iso("2026-04-12T11:28:00-07:00"),
    status: "open",
    type: "incident",
    priority: "high",
    tags: ["lyzr", "studio", "workflow", "execute", "timeout"],
    similarityGroup: "A",
    isRecurring: true,
    isUrgent: true,
    requester: customers.samAcme,
    assigneeName: agentNames.lucy,
    followers: ["Support Ops"],
    conversation: [
      msg(
        "m_1001_1",
        "Lucy",
        "agent",
        "internal",
        "2026-04-12T09:20:00-07:00",
        "Repro needed: which workflow id + node config + approximate payload size. Check recent run durations."
      ),
      msg(
        "m_1001_2",
        "Sam",
        "customer",
        "public",
        "2026-04-12T09:13:00-07:00",
        "In Workflow Studio, execution fails on the `ai_processor` node with a TIMEOUT. Retrying works sometimes but often fails. Error payload:\n\n{\n  \"status\": \"failed\",\n  \"error\": {\n    \"type\": \"NodeExecutionError\",\n    \"message\": \"Agent API timeout\",\n    \"node\": \"ai_processor\",\n    \"code\": \"TIMEOUT\"\n  }\n}\n\nHappens on our production tenant; started today."
      ),
    ],
    lyzr: {
      summary:
        "Workflow executions in Studio are failing at the `ai_processor` node with a `TIMEOUT` error. The issue is intermittent but frequent enough to block production runs, suggesting either slow model/tool latency, oversized inputs, or an execution timeout threshold being hit.",
      issueReported:
        "Workflow Studio execution fails on `ai_processor` with `NodeExecutionError` / `TIMEOUT` (intermittent).",
      nextSteps: [
        "Confirm the workflow ID, run ID(s), and the approximate input size when the timeout occurs.",
        "Check whether the `ai_processor` node is calling an external tool/LLM and measure typical latency for that provider/model.",
        "Retry with a smaller payload (or add a pre-processing node to trim context) to test whether input size is the driver.",
        "If available, increase node/workflow timeout and add retry with exponential backoff for transient latency spikes.",
      ],
      draftResponse:
        "Hi Sam — thanks for sharing the error payload. A `TIMEOUT` on the `ai_processor` node usually means that step is taking longer than the current execution limit (often due to model/tool latency or a large input/context).\n\nWe’ll review the recent execution times for this workflow and correlate the failing runs. To pinpoint the cause, could you share:\n- the workflow ID and 2–3 approximate timestamps of failed runs\n- whether the input payload size changed recently (more context, larger documents, etc.)\n\nIn the meantime, if you can try one run with a smaller input (or trimmed context), it will help confirm whether input size is the driver. We’ll follow up with the recommended timeout/retry configuration once we confirm.\n\nThanks,\nLucy",
      sentiment: {
        satisfactionLevel: "Neutral",
        confusionLevel: "Low",
        urgencyLevel: "High",
        sentimentScore: 6,
        sentimentLabel: "neutral",
      },
    },
  }),
  seed({
    id: "1002",
    subject: "Workflow Studio: INVALID_CONFIG after importing exported JSON",
    createdAt: iso("2026-04-11T15:05:00-07:00"),
    updatedAt: iso("2026-04-12T08:10:00-07:00"),
    status: "open",
    type: "problem",
    priority: "high",
    tags: ["lyzr", "studio", "workflow", "invalid_config", "import"],
    similarityGroup: "A",
    isRecurring: true,
    isUrgent: true,
    requester: customers.samAcme,
    assigneeName: agentNames.marco,
    followers: ["Engineering"],
    conversation: [
      msg(
        "m_1002_1",
        "Sam",
        "customer",
        "public",
        "2026-04-11T15:05:00-07:00",
        "We designed a workflow in Studio and exported JSON. When we import the same JSON into another workspace and hit Execute, it fails with:\n\n`{\"status\":\"failed\",\"error\":{\"type\":\"NodeExecutionError\",\"code\":\"INVALID_CONFIG\",\"message\":\"Wrong parameters\",\"node\":\"tool_call\"}}`\n\nWe didn’t manually edit the JSON. Is the export supposed to be portable?"
      ),
      msg(
        "m_1002_2",
        "Marco Alvarez",
        "agent",
        "public",
        "2026-04-11T15:30:00-07:00",
        "Thanks Sam — likely a missing credential/tool binding in the destination workspace. I’m checking what fields are environment-specific."
      ),
    ],
    lyzr: {
      summary:
        "A workflow exported from Studio fails to run after import with `INVALID_CONFIG` on a `tool_call` node. This typically indicates that a referenced tool/credential/environment variable isn’t present in the destination workspace, or node parameters require re-binding after import.",
      issueReported:
        "Imported workflow JSON executes with `NodeExecutionError` / `INVALID_CONFIG` on `tool_call` node.",
      nextSteps: [
        "Compare the `tool_call` node configuration between source and destination workspaces (tool name, operationId, required params).",
        "Verify the destination workspace has the same tool installed/enabled and the required tool credentials configured.",
        "Re-bind any environment-specific IDs (tool credential IDs, KB IDs, context IDs) referenced in the imported workflow.",
        "Re-run execution and confirm whether the error persists on the same node.",
      ],
      draftResponse:
        "Hi Sam — thanks for the details. An `INVALID_CONFIG` on a `tool_call` node after importing exported JSON usually means the destination workspace is missing a required binding (tool enablement, tool credential, or an environment-specific ID referenced by that node).\n\nNext, we’ll validate:\n- whether the same tool is enabled in the destination workspace\n- whether the required tool credentials exist and are attached\n- whether any IDs in the exported JSON (credential IDs / KB IDs / context IDs) need to be re-bound\n\nIf you can share the workflow ID in both workspaces (or the `tool_call` node snippet from the exported JSON), we can point to the exact field to update.\n\nThanks,\nMarco",
      sentiment: {
        satisfactionLevel: "Low",
        confusionLevel: "Medium",
        urgencyLevel: "High",
        sentimentScore: 4,
        sentimentLabel: "negative",
      },
    },
  }),
  seed({
    id: "1003",
    subject: "Workflow execute API returns API_RATE_LIMIT during load test",
    createdAt: iso("2026-04-10T10:42:00-07:00"),
    updatedAt: iso("2026-04-10T13:55:00-07:00"),
    status: "pending",
    type: "incident",
    priority: "normal",
    tags: ["lyzr", "workflow", "api", "rate_limit", "429"],
    similarityGroup: "A",
    isRecurring: false,
    isUrgent: false,
    requester: customers.lucyNorthwind,
    assigneeName: agentNames.aisha,
    followers: [],
    conversation: [
      msg(
        "m_1003_1",
        "Lucy",
        "customer",
        "public",
        "2026-04-10T10:42:00-07:00",
        "We are calling Execute Workflow from our backend (about 30 req/min) and see failures:\n\n`{\"status\":\"failed\",\"error\":{\"type\":\"NodeExecutionError\",\"code\":\"API_RATE_LIMIT\",\"message\":\"Too many requests\"}}`\n\nWhat’s the recommended retry/backoff pattern?"
      ),
      msg(
        "m_1003_2",
        "Aisha Khan",
        "agent",
        "public",
        "2026-04-10T11:10:00-07:00",
        "Got it — we’ll share recommended backoff + concurrency limits and confirm any per-tenant quotas."
      ),
    ],
    lyzr: {
      summary:
        "Workflow executions are intermittently failing with `API_RATE_LIMIT` during a load test. This indicates request bursts exceeding quota or concurrency limits, and should be handled with exponential backoff, jitter, and request shaping.",
      issueReported:
        "Execute Workflow calls fail with `NodeExecutionError` / `API_RATE_LIMIT` under moderate load (~30/min).",
      nextSteps: [
        "Implement exponential backoff with jitter for `API_RATE_LIMIT` (and optionally for transient `NETWORK_ERROR` / 5xx).",
        "Cap concurrent executions and smooth request bursts (queue + worker pool).",
        "Record and report the workflow ID, peak concurrency, and timestamps of rate-limit responses to validate quota settings.",
      ],
      draftResponse:
        "Hi Lucy — thanks for sharing the payload. `API_RATE_LIMIT` means requests are arriving faster than the allowed quota/concurrency for workflow execution.\n\nRecommended approach:\n- add exponential backoff with jitter on `API_RATE_LIMIT`\n- cap concurrency (queue executions and run via a worker pool)\n- avoid bursts by smoothing traffic\n\nIf you share your approximate peak concurrency (not just req/min), the workflow ID, and 2–3 timestamps of failures, we can confirm whether you’re hitting a per-tenant limit and what safe throughput looks like.\n\nThanks,\nAisha",
      sentiment: {
        satisfactionLevel: "Neutral",
        confusionLevel: "Low",
        urgencyLevel: "Medium",
        sentimentScore: 6,
        sentimentLabel: "neutral",
      },
    },
  }),
  seed({
    id: "1004",
    subject: "Workflow Studio: AUTH_ERROR after rotating API key",
    createdAt: iso("2026-04-09T16:18:00-07:00"),
    updatedAt: iso("2026-04-09T16:45:00-07:00"),
    status: "open",
    type: "incident",
    priority: "high",
    tags: ["lyzr", "studio", "auth", "api_key", "workflow"],
    similarityGroup: "A",
    isRecurring: true,
    isUrgent: false,
    requester: customers.samAcme,
    assigneeName: agentNames.lucy,
    followers: ["Security"],
    conversation: [
      msg(
        "m_1004_1",
        "Sam",
        "customer",
        "public",
        "2026-04-09T16:18:00-07:00",
        "We rotated our Lyzr API key yesterday. Now workflow execution in Studio fails immediately with:\n\n`{\"status\":\"failed\",\"error\":{\"code\":\"AUTH_ERROR\",\"message\":\"Invalid credentials\"}}`\n\nWe updated the key in our backend env vars, but Studio still fails."
      ),
      msg(
        "m_1004_2",
        "Lucy",
        "agent",
        "internal",
        "2026-04-09T16:30:00-07:00",
        "Likely Studio workspace has a separate credential store; confirm where the key is configured and whether an old key is cached."
      ),
    ],
    lyzr: {
      summary:
        "Workflow execution fails with `AUTH_ERROR` after an API key rotation, indicating Studio is still using an outdated credential (or the new key isn’t applied to the Studio workspace). This is usually resolved by updating the Studio credential and re-validating permissions.",
      issueReported:
        "Studio workflow execution fails with `AUTH_ERROR` / invalid credentials after API key rotation.",
      nextSteps: [
        "Verify where the API key is configured for Studio (workspace credential settings vs backend environment).",
        "Re-save/validate the credential used by the workflow and re-run execution to ensure the new key is in effect.",
        "Confirm the rotated key has not been revoked and has access to the relevant resources (agents/workflows/tools).",
      ],
      draftResponse:
        "Hi Sam — thanks for the context. After an API key rotation, an `AUTH_ERROR` in Studio usually means the workflow is still pointing to an older credential saved in the Studio workspace (separate from your backend env vars).\n\nNext, we’ll:\n- confirm which credential the workflow is using in Studio\n- re-save/validate that credential with the new API key\n- re-run execution to confirm the new key is being applied\n\nIf you can share the Studio workspace name (or a screenshot of the credential entry you updated), we can guide you to the exact setting.\n\nThanks,\nLucy",
      sentiment: {
        satisfactionLevel: "Neutral",
        confusionLevel: "Medium",
        urgencyLevel: "Medium",
        sentimentScore: 5,
        sentimentLabel: "neutral",
      },
    },
  }),
  seed({
    id: "1005",
    subject: "Workflow Studio: intermittent NETWORK_ERROR from WebSocket monitoring",
    createdAt: iso("2026-04-08T09:02:00-07:00"),
    updatedAt: iso("2026-04-08T10:12:00-07:00"),
    status: "open",
    type: "problem",
    priority: "urgent",
    tags: ["lyzr", "studio", "websocket", "monitoring", "network_error"],
    similarityGroup: "A",
    isRecurring: true,
    isUrgent: true,
    requester: customers.samAcme,
    assigneeName: agentNames.marco,
    followers: ["Engineering", "Support Ops"],
    conversation: [
      msg(
        "m_1005_1",
        "Sam",
        "customer",
        "public",
        "2026-04-08T09:02:00-07:00",
        "We use Studio’s real-time monitoring (WebSocket) during workflow runs. The UI drops updates and shows `NETWORK_ERROR` periodically. The workflow may still finish, but we lose the run trace and have to refresh.\n\nThis is happening multiple times a day and makes debugging impossible."
      ),
      msg(
        "m_1005_2",
        "Marco Alvarez",
        "agent",
        "public",
        "2026-04-08T09:20:00-07:00",
        "Understood — marking as recurring + urgent. We’ll check WebSocket reconnect behavior and any proxy/firewall interference."
      ),
    ],
    lyzr: {
      summary:
        "Real-time workflow monitoring via WebSocket intermittently fails with `NETWORK_ERROR`, causing dropped run updates even when executions complete. Likely causes include aggressive proxy timeouts, missing keep-alives, or insufficient client-side reconnect/backoff.",
      issueReported:
        "Studio WebSocket monitoring drops updates and reports `NETWORK_ERROR` repeatedly (recurring + urgent).",
      nextSteps: [
        "Collect affected network environment details (corporate proxy/VPN), browser, and timestamps of failures.",
        "Validate WebSocket reconnect/backoff behavior and confirm keep-alive/idle timeout settings.",
        "As a workaround, rely on non-streaming run logs/history for the same workflow run IDs while WebSocket reliability is improved.",
      ],
      draftResponse:
        "Hi Sam — thanks for calling this out. If workflow executions are completing but the Studio monitoring stream drops with `NETWORK_ERROR`, it’s usually a WebSocket connectivity issue (often influenced by proxies/VPNs or idle timeout settings), plus the client’s reconnect behavior.\n\nWe’re escalating this as recurring/urgent. Could you share:\n- your browser + whether you’re on a corporate VPN/proxy\n- 2–3 timestamps of when the monitoring stream dropped\n\nIn the meantime, we can use run history/logs for the same workflow run IDs so you can continue debugging while we stabilize the streaming updates.\n\nThanks,\nMarco",
      sentiment: {
        satisfactionLevel: "Low",
        confusionLevel: "Low",
        urgencyLevel: "High",
        sentimentScore: 3,
        sentimentLabel: "negative",
      },
    },
  }),

  // Group B (3) - Knowledge Base / RAG ingestion & retrieval issues
  seed({
    id: "2001",
    subject: "KB Studio: Parse Website completes but Retrieve returns no relevant docs",
    createdAt: iso("2026-04-13T14:22:00-07:00"),
    updatedAt: iso("2026-04-13T15:10:00-07:00"),
    status: "open",
    type: "incident",
    priority: "high",
    tags: ["lyzr", "kb", "rag", "parse_website", "retrieve"],
    similarityGroup: "B",
    isRecurring: false,
    isUrgent: true,
    requester: customers.peterGlobex,
    assigneeName: agentNames.aisha,
    followers: [],
    conversation: [
      msg(
        "m_2001_1",
        "Peter Strong",
        "customer",
        "public",
        "2026-04-13T14:22:00-07:00",
        "We used Parse Website to ingest our docs site into our KB. The job says successful, but when we query via Retrieve we get irrelevant results or empty. We expected the KB to answer from the docs pages.\n\nWe’re using Qdrant + `text-embedding-3-large`."
      ),
      msg(
        "m_2001_2",
        "Aisha Khan",
        "agent",
        "public",
        "2026-04-13T14:40:00-07:00",
        "We’ll verify crawl coverage, chunking, and whether docs are actually present in the KB index."
      ),
    ],
    lyzr: {
      summary:
        "Website ingestion reports success, but retrieval returns empty/irrelevant results. This often happens when the crawl didn’t capture the intended pages (robots/noindex/auth), content was parsed into empty chunks, or the retrieval query settings are misconfigured.",
      issueReported:
        "KB Parse Website shows success, but Retrieve returns no/irrelevant documents for expected queries.",
      nextSteps: [
        "List the documents/chunks indexed for the KB to confirm pages were actually ingested and non-empty.",
        "Verify crawl settings (start URLs, depth, allowed domains) and confirm robots/noindex/auth aren’t blocking content.",
        "Check chunking/cleaning settings to ensure meaningful text is extracted (not nav-only or empty content).",
        "Test a very specific query (unique phrase) that should match exactly one page to validate retrieval end-to-end.",
      ],
      draftResponse:
        "Hi Peter — thanks for the details. If Parse Website completes but Retrieve returns empty/irrelevant results, the most common causes are: the crawl didn’t actually capture the target pages (robots/auth/allowed domains), the parsed chunks are empty, or retrieval settings aren’t pointing at the expected KB.\n\nNext, we’ll confirm what documents/chunks are indexed for your KB and whether they contain meaningful text. Could you share:\n- the starting URL(s) you provided to Parse Website\n- 1–2 example queries you expected to work\n- whether the site requires login or blocks bots/unknown user agents\n\nOnce we confirm crawl coverage and chunk content, we can tune chunking/retrieval settings so queries reliably ground to your docs.\n\nThanks,\nAisha",
      sentiment: {
        satisfactionLevel: "Low",
        confusionLevel: "High",
        urgencyLevel: "High",
        sentimentScore: 4,
        sentimentLabel: "negative",
      },
    },
  }),
  seed({
    id: "2002",
    subject: "RAG: PDF ingestion succeeds but answers cite wrong sections (chunking issue?)",
    createdAt: iso("2026-04-07T12:10:00-07:00"),
    updatedAt: iso("2026-04-07T13:30:00-07:00"),
    status: "open",
    type: "problem",
    priority: "normal",
    tags: ["lyzr", "rag", "parse_pdf", "chunking", "groundedness"],
    similarityGroup: "B",
    isRecurring: true,
    isUrgent: false,
    requester: customers.peterGlobex,
    assigneeName: agentNames.marco,
    followers: [],
    conversation: [
      msg(
        "m_2002_1",
        "Peter Strong",
        "customer",
        "public",
        "2026-04-07T12:10:00-07:00",
        "We trained a PDF into our RAG KB. Retrieval returns chunks, but the agent answers cite the wrong section or mixes two topics from different pages. Could this be chunk size/overlap?\n\nWe’d like more precise citations."
      ),
      msg(
        "m_2002_2",
        "Marco Alvarez",
        "agent",
        "public",
        "2026-04-07T12:28:00-07:00",
        "Likely chunk boundary issue. We’ll review chunk size/overlap and whether headings are preserved in parsed text."
      ),
    ],
    lyzr: {
      summary:
        "PDF-based RAG answers are pulling partially relevant context and mixing sections, which is commonly caused by overly large chunks, insufficient overlap/structure preservation, or poor PDF text extraction order. Adjusting chunking and validating extracted text usually improves citation accuracy.",
      issueReported:
        "After PDF ingestion, answers cite incorrect sections / mix topics; wants more precise grounding/citations.",
      nextSteps: [
        "Inspect extracted PDF text ordering and chunk boundaries for a few problematic pages (ensure headings and page breaks are preserved).",
        "Reduce chunk size and tune overlap to avoid mixing unrelated sections in the same chunk.",
        "Test retrieval with a narrow query and verify top-k results are from the expected page/section before generation.",
      ],
      draftResponse:
        "Hi Peter — yes, this often comes down to chunking and extraction. If chunks are too large (or extraction order is off), retrieval can pull a chunk that contains multiple topics, and the agent may cite the wrong portion.\n\nNext, we’ll validate the extracted text + chunk boundaries for the pages you’re seeing issues with, then tune chunk size/overlap for more precise retrieval. Could you share:\n- the PDF (or the specific page numbers/sections where citations go wrong)\n- 2–3 example questions and what section you expected it to cite\n\nOnce we confirm extraction quality, we’ll recommend the exact chunking settings to improve citation accuracy.\n\nThanks,\nMarco",
      sentiment: {
        satisfactionLevel: "Neutral",
        confusionLevel: "Medium",
        urgencyLevel: "Medium",
        sentimentScore: 6,
        sentimentLabel: "neutral",
      },
    },
  }),
  seed({
    id: "2003",
    subject: "KB reset/training: Retrieve still returns old content (stale index?)",
    createdAt: iso("2026-04-05T09:40:00-07:00"),
    updatedAt: iso("2026-04-05T10:05:00-07:00"),
    status: "pending",
    type: "question",
    priority: "low",
    tags: ["lyzr", "kb", "reset_rag", "train", "stale"],
    similarityGroup: "B",
    isRecurring: false,
    isUrgent: false,
    requester: customers.peterGlobex,
    assigneeName: agentNames.lucy,
    followers: [],
    conversation: [
      msg(
        "m_2003_1",
        "Peter Strong",
        "customer",
        "public",
        "2026-04-05T09:40:00-07:00",
        "We called Reset RAG and then trained new text, but Retrieve still returns snippets from the old dataset. How do we ensure the index is fully cleared before retraining?"
      ),
      msg(
        "m_2003_2",
        "Lucy",
        "agent",
        "public",
        "2026-04-05T09:55:00-07:00",
        "We’ll confirm the KB/RAG IDs used in both calls and whether you’re querying the same config after reset."
      ),
    ],
    lyzr: {
      summary:
        "After a Reset + retrain, retrieval still returns old content. This is commonly caused by querying a different RAG/KB ID than the one that was reset, or by multiple indices/configs existing. Verifying IDs and listing indexed docs post-reset should clarify.",
      issueReported:
        "Reset RAG + retrain performed, but Retrieve still surfaces old content; wants to ensure full reset.",
      nextSteps: [
        "Confirm the exact RAG/KB configuration ID used for Reset, Train, and Retrieve (ensure they match).",
        "List indexed documents/chunks immediately after Reset to confirm the store is empty before retraining.",
        "After retraining, validate retrieval against a unique phrase only present in the new dataset.",
      ],
      draftResponse:
        "Hi Peter — good question. If old content is still showing after a reset, the most common reason is that Reset/Train/Retrieve are pointing to different KB/RAG configuration IDs, or there are multiple configs and the query is hitting the older one.\n\nCould you share the IDs you used for:\n- Reset RAG\n- the subsequent Train call\n- the Retrieve call\n\nOnce we confirm the IDs match, we’ll have you list the indexed docs right after the reset (should be empty), then retrain and verify retrieval using a unique phrase from the new dataset.\n\nThanks,\nLucy",
      sentiment: {
        satisfactionLevel: "Neutral",
        confusionLevel: "Medium",
        urgencyLevel: "Low",
        sentimentScore: 6,
        sentimentLabel: "neutral",
      },
    },
  }),

  // Group C (2) - Tooling (OpenAPI tool execution / tool registration)
  seed({
    id: "3001",
    subject: "OpenAPI Tool: Execute fails with NotFoundError (404) for operationId",
    createdAt: iso("2026-04-06T08:05:00-07:00"),
    updatedAt: iso("2026-04-06T09:12:00-07:00"),
    status: "open",
    type: "question",
    priority: "normal",
    tags: ["lyzr", "tools", "openapi", "execute", "not_found"],
    similarityGroup: "C",
    isRecurring: false,
    isUrgent: false,
    requester: customers.lucyNorthwind,
    assigneeName: agentNames.aisha,
    followers: ["Billing"],
    conversation: [
      msg(
        "m_3001_1",
        "Lucy",
        "customer",
        "public",
        "2026-04-06T08:05:00-07:00",
        "We created an OpenAPI tool from our spec. The tool shows up in Studio, but when the workflow calls it, it fails with a 404 / NotFoundError for the operation.\n\nWe recently updated the OpenAPI spec — could the operationId mapping be stale?"
      ),
      msg(
        "m_3001_2",
        "Aisha Khan",
        "agent",
        "public",
        "2026-04-06T08:25:00-07:00",
        "Likely operationId mismatch after spec update. We’ll verify tool version and whether the workflow node references an old operationId."
      ),
    ],
    lyzr: {
      summary:
        "A workflow’s OpenAPI tool call is failing with a NotFound/404, likely due to an outdated `operationId` reference after the spec changed or a tool version mismatch. Re-syncing the tool and updating the node’s operation mapping should resolve it.",
      issueReported:
        "OpenAPI tool execution fails with 404 NotFound for operation/operationId after spec update.",
      nextSteps: [
        "Confirm the `operationId` referenced by the workflow node still exists in the latest OpenAPI spec.",
        "Re-import or refresh the OpenAPI tool so Studio indexes the latest spec version.",
        "Update the workflow node to point to the correct operation and re-run execution.",
      ],
      draftResponse:
        "Hi Lucy — thanks for the details. A 404/NotFound when calling an OpenAPI tool is most often caused by an `operationId` mismatch after the spec changed, or the workflow node referencing an older tool index.\n\nNext, we’ll:\n- confirm the `operationId` in your workflow node exists in the latest spec\n- refresh/re-import the OpenAPI tool so Studio indexes the current operations\n- update the node mapping and re-run\n\nIf you can share the `operationId` you’re calling (and whether the tool was re-imported after the spec update), we can tell you the quickest fix.\n\nThanks,\nAisha",
      sentiment: {
        satisfactionLevel: "Neutral",
        confusionLevel: "Low",
        urgencyLevel: "Medium",
        sentimentScore: 7,
        sentimentLabel: "neutral",
      },
    },
  }),
  seed({
    id: "3002",
    subject: "Workflow fails with ToolNotFoundError after renaming a tool",
    createdAt: iso("2026-04-02T17:30:00-07:00"),
    updatedAt: iso("2026-04-03T09:15:00-07:00"),
    status: "open",
    type: "incident",
    priority: "high",
    tags: ["lyzr", "tools", "toolnotfound", "workflow", "recurring"],
    similarityGroup: "C",
    isRecurring: true,
    isUrgent: true,
    requester: customers.lucyNorthwind,
    assigneeName: agentNames.marco,
    followers: ["Engineering"],
    conversation: [
      msg(
        "m_3002_1",
        "Lucy",
        "customer",
        "public",
        "2026-04-02T17:30:00-07:00",
        "We renamed a tool in Studio and now multiple workflows fail with ToolNotFoundError. The tool exists (new name), but old workflows still reference the previous name.\n\nIs there a way to update all workflows or keep an alias?"
      ),
      msg(
        "m_3002_2",
        "Marco Alvarez",
        "agent",
        "public",
        "2026-04-02T17:55:00-07:00",
        "Understood — tool name mismatch can break existing nodes. We’ll identify impacted workflows and suggest safest migration path."
      ),
    ],
    lyzr: {
      summary:
        "After a tool rename, existing workflow nodes still reference the old tool identifier, causing `ToolNotFoundError`. The fix is typically to update the affected workflow nodes to the new tool name/ID, or re-bind the tool in each node if the platform doesn’t support aliases.",
      issueReported:
        "Tool rename caused `ToolNotFoundError` in multiple existing workflows; needs bulk update/alias guidance.",
      nextSteps: [
        "Identify the old tool identifier referenced by failing workflow nodes (name/ID) and the new tool identifier.",
        "Update the tool reference in each impacted workflow node (or re-bind via Studio UI) and re-run a test execution.",
        "If many workflows are impacted, export workflow JSON, apply a controlled find/replace of the tool identifier, and re-import (with validation).",
      ],
      draftResponse:
        "Hi Lucy — that makes sense. When a tool is renamed, existing workflow nodes can keep pointing to the previous tool identifier, which then surfaces as `ToolNotFoundError` at runtime.\n\nNext, we’ll help you:\n- confirm the old tool name/ID referenced by the failing nodes\n- re-bind those nodes to the tool’s new name/ID\n\nIf there are many workflows, the fastest path is usually to export the workflows as JSON, update the tool identifier in a controlled way, then re-import and validate. Share 1 failing workflow ID and the old/new tool names, and we’ll outline the safest bulk migration steps.\n\nThanks,\nMarco",
      sentiment: {
        satisfactionLevel: "Low",
        confusionLevel: "Medium",
        urgencyLevel: "High",
        sentimentScore: 4,
        sentimentLabel: "negative",
      },
    },
  }),
];

function msg(
  id: string,
  authorName: string,
  authorType: Message["authorType"],
  visibility: Message["visibility"],
  createdAt: string,
  body: string
): Message {
  return {
    id,
    authorName,
    authorType,
    visibility,
    createdAt: iso(createdAt),
    body,
  };
}

function seed(t: SeedTicketInput): Ticket {
  return t;
}

export const ticketsById: Record<TicketId, Ticket> = Object.fromEntries(
  tickets.map((t) => [t.id, t])
);

export function getTicket(ticketId: TicketId) {
  return ticketsById[ticketId];
}

export function getCustomerTickets(customerId: string) {
  return tickets
    .filter((t) => t.requester.id === customerId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

