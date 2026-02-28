# Firecrawl — Web Search, Scrape & Crawl

Search the web, scrape pages to markdown, or crawl entire sites using [Firecrawl](https://firecrawl.dev).

## Requirements

- `FIRECRAWL_API_KEY` env var (set via docker.env or workspace .env)
- `firecrawl` CLI available at `/usr/local/bin/firecrawl`

## Commands

### Search the web
```bash
firecrawl search "query" --limit 5
```
Returns titles, URLs, and snippets.

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

## When to Use

- **Search**: Finding information, researching topics, looking up companies/products
- **Scrape**: Reading a specific webpage, extracting content from a URL the user shares
- **Crawl**: Understanding an entire site, gathering docs, mapping site structure

## Tips

- Scrape is fastest for single pages — use it when you have a URL
- Search is best for discovering URLs you don't have yet
- Crawl burns more API credits — use sparingly and with low limits
- Output is JSON — parse it to extract what you need
