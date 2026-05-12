# Site Scraping Patterns Experience Base

After successfully scraping a new type of site, the Agent should prompt the user whether to append the experience to this file.

---

## Discourse Forums (linux.do, meta.discourse.org, etc.)

**Site Features**: Cloudflare protection + Ember.js SPA + Login state differentiation
**Recommended Fetcher**: StealthyFetcher
**Key Parameters**:
- `solve_cloudflare=True` — Required
- `network_idle=True` — Wait for Ember rendering to complete
- `timeout=60000` — CF verification takes a long time, at least 60 seconds (in milliseconds)
**Login Cookie Fields**: `_forum_session`, `_t`
**Not Required**: `cf_clearance` (StealthyFetcher acquires it automatically)
**JSON API**: `/t/topic/{id}.json` (Available only after passing CF)
**Selector Reference**:
- Post list: `.topic-post`
- Author: `[data-user-card]::attr(data-user-card)`
- Content: `.cooked` → `.get_all_text(strip=True)`

---

## Static Blogs/Docs Sites (GitHub Pages, Hugo, Jekyll)

**Site Features**: Pure static HTML, no JS rendering dependency, no anti-scraping
**Recommended Fetcher**: Fetcher (Fastest)
**Key Parameters**: `impersonate='chrome'`, `timeout=30`
**Selector Reference**: `article`, `.content`, `.post-body`

---

## SPA Applications (React/Vue/Next.js)

**Site Features**: JS rendered, content is not in initial HTML
**Recommended Fetcher**: DynamicFetcher
**Key Parameters**:
- `network_idle=True` — Wait for API requests to complete
- `wait_selector='.content-loaded'` — Wait for key element (adjust based on reality)
- `disable_resources=True` — Skip fonts/images for speed
**Note**: Prioritize checking if there are API endpoints that can be directly requested with Fetcher (faster and more stable).

---

## API Endpoints (REST/GraphQL)

**Site Features**: Returns JSON, no HTML parsing needed
**Recommended Fetcher**: Fetcher
**Key Parameters**: `impersonate='chrome'`, custom `headers`
**Processing Method**: `page.text` to get JSON → `json.loads()` to parse
**Note**: If the API has anti-scraping, it may require Referer/Origin headers.

---

## TAPD Project Management (tapd.cn)

**Site Features**: React SPA + Enterprise login state + Paginated lazy loading ("Load More" button)
**Recommended Solution**: Direct control via Playwright (Not scrapling Fetcher)
**Reason**: DynamicFetcher can render the first screen but cannot click/interact; scrapling Fetcher returns empty `page.text` when calling APIs; curl reaches the API but returns 500 (requires CSRF validation within the browser environment).
**Key Workflow**:
1. Playwright + cookies to load the page, `wait_until='networkidle'`
2. Loop clicking the "Load More" button to load all data
3. `page.inner_text('body')` to extract plain text, parse line by line
**Cookie Format**: `list[dict]`, required `name/value/domain/path`, domain is `.tapd.cn`
**API Endpoint** (for reference, used inside the browser): `POST /api/my_worktable/my_worktable/get_my_worktable_by_page`
**CSRF**: The value of the cookie `dsc-token` must be sent as the `DSC-TOKEN` header (automatically added by axios interceptor)
**Known Limitations**: scrapling Fetcher returns an empty response (empty `page.text`) for TAPD API, use Playwright or curl.
**Data Structure**: Text arranged by line, type prefix (P/E/PROGRAM/TEST/BUG) → Title → Status → Priority → ...

---

## Template: Add New Site Pattern

Copy the template below, replace the specific content, and append it to this file:

```markdown
## Site Name/Type (Representative Domain)

**Site Features**: Description
**Recommended Fetcher**: Fetcher / StealthyFetcher / DynamicFetcher
**Key Parameters**:
- `ParameterName=Value` — Explanation
**Selector Reference**: CSS selector examples
**Note**: Pitfall experiences
```