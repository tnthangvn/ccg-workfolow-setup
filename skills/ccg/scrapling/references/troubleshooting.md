# Scrapling Pitfall Records & Solutions

## ModuleNotFoundError: curl_cffi

**Error Message**: `ModuleNotFoundError: No module named 'curl_cffi'`
**Cause**: Installed the base package `pip install scrapling`, which does not include fetch dependencies.
**Solution**:
```bash
pip install "scrapling[fetchers]"
```

## Cloudflare 403 + "Just a moment"

**Error Message**: Returns 403, page content contains "Just a moment" or "Checking your browser".
**Cause**: Fetcher (curl_cffi) cannot pass Cloudflare verification.
**Solution**: Switch to StealthyFetcher + `solve_cloudflare=True`.
```python
from scrapling.fetchers import StealthyFetcher
page = StealthyFetcher.fetch(url, headless=True, solve_cloudflare=True, timeout=60000)
```

## cf_clearance cookie invalid

**Error Message**: Manually passing `cf_clearance` cookie but still blocked by Cloudflare.
**Cause**: `cf_clearance` is bound to the browser fingerprint (TLS/JA3/UA) and cannot be reused across clients.
**Solution**: Do not pass `cf_clearance` manually, let StealthyFetcher acquire it on its own through Cloudflare.

## Expected array, got object at $.cookies

**Error Message**: `Expected array, got object` at `$.cookies`
**Cause**: Browser Fetcher (StealthyFetcher/DynamicFetcher) cookies must be `list[dict]`, not `dict`.
**Solution**:
```python
# ❌ Incorrect
cookies = {'name': 'value'}

# ✅ Correct
cookies = [{'name': 'cookie_name', 'value': 'cookie_value', 'domain': '.site.com', 'path': '/'}]
```

## Cookie should have a url or a domain/path pair

**Error Message**: `Cookie should have a url or a domain/path pair`
**Cause**: Cookie dict is missing `domain` and `path` fields.
**Solution**: Every cookie dict must contain `domain` (starting with `.`) and `path` (usually `/`).
```python
cookies = [
    {'name': 'token', 'value': 'abc', 'domain': '.example.com', 'path': '/'},
]
```

## 404 "page is private"

**Error Message**: Returns 404, page prompt indicates content is private.
**Cause**: Passed Cloudflare, but the target page requires login state.
**Solution**: Include the login cookie (acquired manually from the browser), see `cookie-vault.md`.
```python
page = StealthyFetcher.fetch(
    url,
    solve_cloudflare=True,
    cookies=[{'name': '_session', 'value': '...', 'domain': '.site.com', 'path': '/'}],
    timeout=60000,
)
```

## Cloudflare multiple rounds of Turnstile

**Phenomenon**: StealthyFetcher runs for a very long time (30-90 seconds), logs show multiple Turnstile verifications.
**Cause**: Normal behavior, Cloudflare sometimes requires 2-3 rounds of verification.
**Solution**: Be patient and wait, ensure `timeout` is long enough (at least 60000ms). If it times out, increase to 120000ms and retry.

## scrapling: command not found

**Error Message**: `scrapling: command not found`
**Cause**: Python Scripts directory is not in PATH.
**Solution**:
```python
# Method 1: Use python -c
python -c "from scrapling.cli import main; main(['install'])"

# Method 2: Use python -m (if supported)
python -m scrapling install
```

## StealthyFetcher/DynamicFetcher reports browser not installed

**Error Message**: Similar to "browser not found" or Playwright/Camoufox related errors.
**Cause**: Browser engine dependencies are not installed.
**Solution**:
```bash
# Install scrapling browser dependencies
scrapling install
# Or
python -c "from scrapling.cli import main; main(['install'])"
```