export type KbEntry = {
  id: string;
  title: string;
  url: string;
  body: string;
  keywords?: string[];
  product_area?: string;
};

/**
 * Replace this with your real KB corpus source.
 * The backend agent route will pass these entries to the Lyzr agent and
 * the UI will render the returned `kb_articles` list as links.
 */
export const kbCorpus: KbEntry[] = [
  {
    id: "kb_workflow_errors",
    title: "Workflow execution errors (TIMEOUT / INVALID_CONFIG / AUTH_ERROR)",
    url: "https://kb.example.com/articles/workflow-execution-errors",
    body: "How to diagnose common workflow execution errors, validate node configuration, increase timeouts, and apply retry/backoff patterns.",
    keywords: ["TIMEOUT", "INVALID_CONFIG", "AUTH_ERROR", "API_RATE_LIMIT", "NETWORK_ERROR"],
    product_area: "workflow_studio",
  },
  {
    id: "kb_rag_website_ingestion",
    title: "RAG website ingestion: crawl coverage + empty chunks checklist",
    url: "https://kb.example.com/articles/rag-website-ingestion-checklist",
    body: "Checklist for Parse Website ingestion: allowed domains, robots/noindex, auth walls, chunking, and verifying indexed docs before retrieval.",
    keywords: ["Parse Website", "Retrieve", "crawl", "robots", "empty chunks"],
    product_area: "knowledge_base",
  },
  {
    id: "kb_openapi_tool_404",
    title: "OpenAPI tool 404/NotFound: operationId drift after spec changes",
    url: "https://kb.example.com/articles/openapi-tool-404-operationid",
    body: "What to do when an OpenAPI tool call fails with 404: refresh/re-import the tool, confirm operationId, and re-bind workflow nodes.",
    keywords: ["OpenAPI", "operationId", "NotFound", "404", "tool"],
    product_area: "tools",
  },
];

