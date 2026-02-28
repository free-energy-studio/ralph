---
name: firecrawl
description: "Web search, scrape, and crawl via Firecrawl API. Use when: (1) searching the web for information, (2) scraping a URL to extract content, (3) crawling a site for docs or structure. NOT for: simple queries that web_search handles, or when no FIRECRAWL_API_KEY is configured."
metadata:
  {
    "openclaw":
      {
        "emoji": "🔥",
        "requires": { "bins": ["firecrawl"], "env": ["FIRECRAWL_API_KEY"] },
      },
  }
---

# Firecrawl Skill

Search the web, scrape pages to markdown, or crawl entire sites using [Firecrawl](https://firecrawl.dev).

## When to Use

✅ **USE this skill when:**

- Searching for information on the web
- Extracting content from a URL someone shares
- Scraping a page to markdown for analysis
- Crawling a site to understand its structure or gather docs
- Getting clean content from pages that block simple fetches (Cloudflare, JS-heavy)

❌ **DON'T use when:**

- `web_search` or `web_fetch` tools are available and sufficient
- You don't have `FIRECRAWL_API_KEY` set

## Requirements

- `FIRECRAWL_API_KEY` env var (set via docker.env or workspace .env)
- `firecrawl` CLI at `/usr/local/bin/firecrawl`

## Commands

### Search the web

```bash
firecrawl search "your query" --limit 5
```

Returns titles, URLs, and snippets as JSON.

### Scrape a single page

```bash
firecrawl scrape https://example.com
firecrawl scrape https://example.com --format markdown
firecrawl scrape https://example.com --format text
firecrawl scrape https://example.com --format html
```

Returns clean extracted content. Default format is markdown.

### Crawl a site

```bash
firecrawl crawl https://example.com --limit 10 --depth 2
```

Crawls multiple pages starting from the URL. Returns content from all crawled pages.

## Tips

- **Scrape** is fastest for single pages — use it when you have a URL
- **Search** is best for discovering URLs you don't have yet
- **Crawl** burns more API credits — use sparingly and with low limits
- Output is JSON — parse it to extract what you need
- Firecrawl handles JS rendering and bypasses many anti-bot protections
