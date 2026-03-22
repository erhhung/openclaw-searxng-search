import { Type } from "@sinclair/typebox";
import https from "node:https";
import http from "node:http";

interface SearXNGResult {
  url: string;
  title: string;
  content: string;
  engine: string;
}

interface SearXNGResponse {
  query: string;
  results: SearXNGResult[];
  suggestions: string[];
}

function fetchSearXNG(baseUrl: string, query: string, count: number, timeoutMs: number): Promise<SearXNGResponse> {
  const params = new URLSearchParams({ q: query, format: "json", categories: "general" });
  const url = `${baseUrl}/search?${params.toString()}`;
  const client = url.startsWith("https") ? https : http;

  return new Promise((resolve, reject) => {
    const req = client.get(url, { timeout: timeoutMs }, (res) => {
      let data = "";
      res.on("data", (chunk: Buffer) => { data += chunk.toString(); });
      res.on("end", () => {
        try {
          const json = JSON.parse(data) as SearXNGResponse;
          json.results = json.results.slice(0, count);
          resolve(json);
        } catch {
          reject(new Error(`Failed to parse SearXNG response: ${data.slice(0, 200)}`));
        }
      });
    });
    req.on("error", reject);
    req.on("timeout", () => { req.destroy(); reject(new Error("SearXNG request timed out")); });
  });
}

const SearchParams = Type.Object({
  query: Type.String({ description: "The search query" }),
  count: Type.Optional(Type.Number({ description: "Number of results (default: 5)" })),
});

export default function register(api: any) {
  const config = api.getConfig?.() ?? {};
  const baseUrl = config.baseUrl ?? process.env.SEARXNG_BASE_URL ?? "http://localhost:8888";
  const defaultCount = config.defaultCount ?? 5;
  const timeoutMs = config.timeoutMs ?? 10000;

  const tool = {
    name: "searxng_search",
    label: "SearXNG Web Search",
    description: "Search the web using SearXNG. Returns results from multiple search engines (Google, Bing, DuckDuckGo, etc.). Use this tool to find current information, research topics, or look up any facts on the internet.",
    parameters: SearchParams,
    async execute(_toolCallId: string, params: { query: string; count?: number }) {
      const count = params.count ?? defaultCount;
      try {
        const response = await fetchSearXNG(baseUrl, params.query, count, timeoutMs);
        if (!response.results?.length) {
          return { content: [{ type: "text" as const, text: `No results found for "${params.query}".` }], details: {} };
        }
        const formatted = response.results
          .map((r, i) => `${i + 1}. **${r.title}**\n   ${r.url}\n   ${r.content || "No description."}`)
          .join("\n\n");
        const text = `Search results for "${params.query}":\n\n${formatted}${
          response.suggestions?.length ? `\n\nRelated: ${response.suggestions.slice(0, 5).join(", ")}` : ""
        }`;
        return { content: [{ type: "text" as const, text }], details: { resultCount: response.results.length } };
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        return { content: [{ type: "text" as const, text: `Search failed: ${message}` }], details: { error: message } };
      }
    },
  };

  api.registerTool(tool, { optional: false });
}
