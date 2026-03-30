# Example: Batch Scrape Multiple URLs

## The Problem

You have 10+ URLs to extract. Running `extract.js` one by one is slow. `batch-extract.js` runs them concurrently.

## From a Comma-Separated List

```bash
node scripts/batch-extract.js \
  --urls "https://example.com,https://httpbin.org/html,https://news.ycombinator.com" \
  --concurrency 3
```

## From a File

Create `urls.txt`:
```
https://example.com
https://httpbin.org/html
https://news.ycombinator.com
```

```bash
node scripts/batch-extract.js \
  --file urls.txt \
  --concurrency 5 \
  --delay 2000
```

## Output Format

JSONL — one JSON object per line, plus a summary:

```jsonl
{"url":"https://example.com","title":"Example Domain","content":"...","source":"playwright"}
{"url":"https://httpbin.org/html","title":"Herman Melville","content":"...","source":"playwright"}
{"url":"https://news.ycombinator.com","title":"Hacker News","content":"...","source":"playwright"}
{"summary":{"total":3,"success":3,"failed":0,"elapsed_ms":12450}}
```

## Flags

| Flag | Description | Default |
|------|-------------|---------|
| `--concurrency` | How many browsers run in parallel | 3 |
| `--delay` | Milliseconds between batches | 1000 |
| `--scroll` | Auto-scroll each page | false |
| `--exclude` | Elements to strip from all pages | — |

## Tips

- Keep concurrency at 3-5 for most machines
- Add `--delay 2000` for rate-limited sites
- Output pipes cleanly to `jq` for further processing:
  ```bash
  node scripts/batch-extract.js --file urls.txt | jq -c 'select(.title)'
  ```
