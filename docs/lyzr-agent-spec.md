# Lyzr Support Copilot — Agent Spec

## Name
**Lyzr Support Copilot**

## Description
Lyzr Support Copilot is an agent-side assistant designed to help support teams work faster inside an agent workspace by producing:
- a concise ticket **Summary**
- actionable **Next steps**
- a customer-ready **Draft response**
- a **Search** experience over the customer’s prior tickets in the workspace
- **Customer sentiment analysis** output
- **KB recommendations** (links to relevant articles from your provided KB corpus)
- **KB article draft** from the ticket (optional authoring mode)
- a **Salesforce push** action

In this application, agent outputs are **precomputed** per ticket and rendered in the Lyzr panel.

## Role
Help a support agent quickly understand the issue, decide what to do next, and respond professionally—while highlighting recurring/urgent patterns across a customer’s recent history.

## Goal
Given a full ticket payload and a supplied KB corpus, generate structured, UI-ready outputs: Summary, Next steps, Draft response, and KB recommendations (Others tab).

## Agent interface (backend contract)

### Inputs
The backend should call the agent with:
- `ticket`: a full ticket payload (subject, description, conversation/comments, requester/org, priority, timestamps, tags, custom fields, and any extracted attachment text if available)
- `kb_corpus`: knowledge base entries you provide, each with a stable link URL that the UI can render
- optional: `brand_voice`, `support_policy`, `sla_hours`, `product_context`

#### Suggested `ticket` JSON shape (example)
This is intentionally Zendesk-like, but flexible. Fields may be omitted if unavailable.

```json
{
  "id": "1001",
  "subject": "Workflow Studio: Execute fails with TIMEOUT on ai_processor node",
  "status": "open",
  "type": "incident",
  "priority": "high",
  "createdAt": "2026-04-12T16:13:00.000Z",
  "updatedAt": "2026-04-12T18:28:00.000Z",
  "tags": ["lyzr", "studio", "workflow", "timeout"],
  "custom_fields": {
    "tenant": "acme-prod",
    "product_area": "workflow_studio"
  },
  "requester": {
    "id": "cust_sam",
    "name": "Sam",
    "email": "sam@acme.com",
    "orgName": "Acme Corp"
  },
  "conversation": [
    {
      "id": "m1",
      "authorType": "customer",
      "authorName": "Sam",
      "visibility": "public",
      "createdAt": "2026-04-12T16:13:00.000Z",
      "body": "In Workflow Studio, execution fails..."
    }
  ],
  "attachments_text": [
    {
      "filename": "error.json",
      "text": "{ \"status\": \"failed\", \"error\": { \"code\": \"TIMEOUT\" } }"
    }
  ]
}
```

#### `kb_corpus` JSON shape (example)

```json
[
  {
    "id": "kb_019",
    "title": "Workflow execution errors: TIMEOUT and retries",
    "url": "https://kb.example.com/articles/kb_019",
    "body": "How to diagnose timeouts, increase node timeouts, and add retries...",
    "keywords": ["TIMEOUT", "NodeExecutionError", "workflow", "retry"],
    "product_area": "workflow_studio"
  }
]
```

### Outputs (what the UI renders)
The agent should return:
- `summary`: 2–4 sentences
- `issue_reported`: 1 sentence (what user reported)
- `next_steps`: 3–5 ordered steps (strings)
- `draft_response`: customer-ready message
- `kb_articles`: 3–5 recommended KB items for the Others tab, as links
- optional: `sentiment` (if you want to keep the rubric-based output)

#### Output JSON shape (example)

```json
{
  "summary": "Workflow executions in Studio are failing at the ai_processor node with a TIMEOUT error...",
  "issue_reported": "Workflow Studio execution fails on ai_processor with NodeExecutionError/TIMEOUT.",
  "next_steps": [
    "Confirm the workflow ID and timestamps of failed runs.",
    "Measure provider/model latency for the ai_processor step.",
    "Retry with a smaller payload to validate whether input size is the driver.",
    "Add retry with exponential backoff and increase timeout if appropriate."
  ],
  "draft_response": "Hi Sam — thanks for sharing the error payload...",
  "kb_articles": [
    {
      "id": "kb_019",
      "title": "Workflow execution errors: TIMEOUT and retries",
      "url": "https://kb.example.com/articles/kb_019",
      "why_relevant": "Matches TIMEOUT failures on ai_processor; includes retry/backoff and timeout tuning steps.",
      "confidence": 0.86
    }
  ],
  "sentiment": {
    "satisfactionLevel": "Neutral",
    "confusionLevel": "Low",
    "urgencyLevel": "High",
    "sentimentScore": 6,
    "sentimentLabel": "neutral"
  }
}
```

## Agent instructions (behavior)
- Stay grounded in ticket evidence. Do not invent product capabilities or internal tooling.
- Ask for the *minimum* missing details needed to proceed (timestamps, workflow ID, environment, affected users).
- Write Next steps as actions a support engineer can execute (config checks, permissions, logs, run IDs, retry/backoff).
- KB recommendations must come from `kb_corpus` (do not browse the web); always return the KB `url` for UI linking.
- If no good KB match exists, return an empty `kb_articles` array and suggest what article should be authored.
- Keep `draft_response` friendly, concise, and expectation-setting (include a follow-up timeframe).

## What the agent powers in the UI

### Home tab
#### 1) Summary
- **Goal**: 2–4 sentences that explain what’s happening in plain language.
- **Includes**: product area, symptom, impact, and likely cause category (auth/sync/indexing/etc.).

#### 2) Next steps
- **Goal**: 3–5 ordered actions, written as imperative steps.
- **Style**: specific checks (configuration, permissions, logs, last-sync timestamp) + 1 immediate workaround if applicable.

#### 3) Draft a response
- **Goal**: a customer-ready message, friendly and direct.
- **Must**:
  - acknowledge the problem
  - summarize what will be checked
  - ask for the minimal clarifying details (timestamps, project, affected users)
  - set expectations for follow-up
- **Behavior in UI**: clicking “Draft a response” populates the reply composer for that ticket.

### Search tab
#### Purpose
Show previous tickets created by the same customer (matched by requester in the workspace data).

#### Matching rule
- Filter tickets where `requester.id` matches the currently viewed ticket requester.

#### Recurring + urgent flags
- **Recurring issue** (`isRecurring: true`): the same customer has similar issues over time, or the same root-cause category repeats.
- **Urgent** (`isUrgent: true`): high business impact, repeated failure, or blocking setup/workflows.

#### Ticket card content
- Subject
- Date
- Short summary (1–2 lines)
- Badges:
  - Recurring issue (if flagged)
  - Urgent (if flagged)
  - Similarity group (A/B/C)

### Others tab
#### Create a KB article
Generate a structured draft with:
- Title (from subject)
- Problem (from issue reported)
- Resolution steps (from next steps)

#### KB recommendations (Others tab)
Return 3–5 recommended KB articles (from `kb_corpus`) as:
- `title`
- `url` (rendered as a link)
- `why_relevant` (1 sentence)
- `confidence` (0–1)

#### Customer Sentiment Analysis
Use the following rubric to populate fields:
- **Satisfaction level**: Low / Neutral / High
- **Confusion level**: Low / Medium / High
- **Urgency level**: Low / Medium / High
- **Sentiment score**: 1–10 (integer)
- **Sentiment label**: neutral / negative / positive

Rubric guidance:
- negative: score 1–4, satisfaction low, urgency medium/high
- neutral: score 5–7, satisfaction neutral, urgency low/medium/high depending on impact
- positive: score 8–10, satisfaction high, urgency typically low/medium

#### Push to Salesforce
Surface a primary action that, when confirmed, shows a success state (e.g. “Synced to Salesforce”) in the UI.

## Similar-ticket logic
The workspace includes 10 tickets partitioned into similarity groups:
- **Group A**: 5 tickets with the same root issue category
- **Group B**: 3 tickets with the same root issue category
- **Group C**: 2 tickets with the same root issue category

Within the UI, the similarity group is displayed as a badge to show clustering.

## Knowledge base

### Definitions
- **Recurring issue**: the same symptom/root-cause category reappears for the same customer across multiple tickets.
- **Urgent**: blocking setup, major business impact, or repeated failures in a short time window.

### Draft response template
Use this template (filled per ticket):

1) Acknowledge + restate issue
2) What we’re checking (2–3 bullets)
3) What we need from you (1–2 questions)
4) Next update expectation (timeframe)
5) Signature (agent name)
