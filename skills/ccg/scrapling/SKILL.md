---
name: scrapling
description: "Use scrapling for web scraping and data extraction. Automatically selects Fetcher, supports Cloudflare/WAF bypass, Session login, HTML parsing. Triggers when the user mentions scrape/crawl/fetch page/extract data/爬取/抓取/绕过Cloudflare/解析HTML/批量采集."
user-invocable: true
allowed-tools: Read, Bash
argument-hint: "[URL or scraping task description]"
license: MIT
---

# Scrapling Web Scraping Skill

## Step 0: Check Version

```bash
pip show scrapling
```

- Not installed → Execute `pip install "scrapling[fetchers]"` + `scrapling install`
- New version available → Execute `pip install --upgrade "scrapling[fetchers]"` → Check changelog and inform user
- Already up to date → Continue

## Step 1: Select Fetcher

```
Target Website →
│
├─ Already have HTML string/file, just need to parse?
│   → Selector (Pure parsing, no network requests)
│   → Template: templates/parse_only.py
│
├─ Static page, no JS rendering, no anti-scraping?
│   → Fetcher (Fastest, based on curl_cffi)
│   → Template: templates/basic_fetch.py
│
├─ Requires login (HTTP form, not JS login)?
│   → FetcherSession (Maintain session cookies)
│   → Template: templates/session_login.py
│
├─ Protected by Cloudflare / WAF?
│   → StealthyFetcher (Camoufox browser, automatically bypass CF)
│   → Template: templates/stealth_cloudflare.py
│
├─ SPA application (React/Vue), requires JS rendering?
│   → DynamicFetcher (Playwright browser)
│   → Generate instantly based on template
│
└─ Unsure?
    → Try Fetcher first, if 403/empty content → Upgrade to StealthyFetcher
```

## Step 2: Execute Workflow

```
1. Check version (Step 0)
2. Review references/site-patterns.md — If it matches an existing pattern, reuse it directly
3. No match → Use decision tree to select Fetcher
4. Read corresponding template → Replace parameters → Generate complete script
5. Execute script → Return results
6. **Accumulate experience (Mandatory)**:
   - New site → Append to site-patterns.md
   - New cookie / User provided cookie → Save to cookie-vault.md
   - **MUST check after scraping**: Are there new cookies or site patterns that need to be saved
```

## Cookie Format Quick Reference

| Fetcher Type | Cookie Format | Example |
|-------------|-------------|------|
| Fetcher / FetcherSession | `dict` | `{'name': 'value', 'token': 'abc'}` |
| StealthyFetcher / DynamicFetcher | `list[dict]` | `[{'name': 'n', 'value': 'v', 'domain': '.site.com', 'path': '/'}]` |

**Browser Fetcher cookie required fields**: `name`, `value`, `domain`, `path`

## Timeout Unit Quick Reference

| Fetcher Type | Timeout Unit | Example |
|-------------|---------|------|
| Fetcher / FetcherSession | seconds | `timeout=30` |
| StealthyFetcher / DynamicFetcher | milliseconds | `timeout=60000` |

## Template Index

| Template | File | When to Read |
|------|------|---------|
| Basic HTTP Scraping | `templates/basic_fetch.py` | Target is a static page, no anti-scraping |
| Cloudflare Bypass | `templates/stealth_cloudflare.py` | Target is protected by CF/WAF |
| Session Login | `templates/session_login.py` | Requires HTTP form login before scraping |
| Pure HTML Parsing | `templates/parse_only.py` | Already have HTML string, just need to extract data |

## References Index

| File | When to Read |
|------|---------|
| `references/site-patterns.md` | **Review before every scrape** — Check if the target site has recorded patterns |
| `references/api-quick-ref.md` | Review when generating scripts — Fetcher/Selector method signatures and parameters |
| `references/troubleshooting.md` | Review upon execution errors — Find causes and solutions based on error messages |
| `references/cookie-vault.md` | Review when login cookies are needed — Check if historical records can be reused |
| `references/maintenance.md` | Review for installation/upgrade/dependency issues — Installation hierarchy and verification commands |
