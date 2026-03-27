# OpenClaw SearXNG Search Plugin

Free, private, unlimited web search for [OpenClaw](https://github.com/openclaw/openclaw) using [SearXNG](https://github.com/searxng/searxng).

No API keys. No rate limits. No tracking. Aggregates results from Google, Bing, DuckDuckGo, Brave, Wikipedia, and 70+ other search engines.

## Quick Start

```bash
# Install the plugin
openclaw plugins install @erhhung/searxng-search@1.0.0

# Or clone and install locally
git clone https://github.com/erhhung/openclaw-searxng-search.git
cd openclaw-searxng-search
pnpm install && pnpm run build
openclaw plugins install .
```

## Prerequisites

A running SearXNG instance with JSON format enabled. The easiest way:

```bash
docker run -d --name searxng -p 8888:8080 searxng/searxng:latest
```

Then enable JSON format in SearXNG settings (`/etc/searxng/settings.yml`):

```yaml
search:
  formats:
    - html
    - json
```

## Configuration

Configure via `openclaw.json`:

```json
{
  "plugins": {
    "entries": {
      "searxng-search": {
        "enabled": true,
        "config": {
          "baseUrl": "http://localhost:8888",
          "defaultCount": 5,
          "timeoutMs": 10000
        }
      }
    }
  }
}
```

Or via environment variable:

```bash
export SEARXNG_BASE_URL=http://localhost:8888
```

## How It Works

The plugin registers a `web_search` tool that OpenClaw's agent can call when it needs to search the web. Queries are sent to your SearXNG instance, which aggregates results from multiple search engines and returns them to the agent.

## NemoClaw / OpenShell Usage

If running inside a NemoClaw sandbox, you need to add a network policy allowing access to your SearXNG instance:

```yaml
network_policies:
  searxng:
    name: searxng
    endpoints:
      - host: your-searxng-host.com
        port: 443
        protocol: rest
        tls: terminate
        enforcement: enforce
        rules:
          - allow:
              method: GET
              path: /**
```

## License

MIT
