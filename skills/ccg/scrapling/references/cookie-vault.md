# Cookie Vault

Record historical cookies partitioned by site, for quick lookup and usage during scraping.

> **Security Notice**: This file stores sensitive cookie values, do not commit it to version control or share it with others.
> For actual use, please copy this file to `cookie-vault.local.md` and fill in the real values.

---

## Example Site (example.com)

**Last Updated**: YYYY-MM-DD
**Status**: Valid / Possibly Expired
**Login Cookie Fields**: `session_id`, `auth_token`
**Fetcher Type**: StealthyFetcher

### Playwright Format (for StealthyFetcher/DynamicFetcher)

```python
cookies = [
    {'name': 'session_id', 'value': '<YOUR_SESSION_ID>', 'domain': '.example.com', 'path': '/'},
    {'name': 'auth_token', 'value': '<YOUR_AUTH_TOKEN>', 'domain': '.example.com', 'path': '/'},
]
```

### Notes

- Get real values from Browser DevTools > Application > Cookies.
- Cookie validity depends on site settings; reacquire if expired.

---

## Template: Add New Site

Copy the template below, replace the specific content, and append it to this file:

```markdown
## Site Name (Domain)

**Last Updated**: YYYY-MM-DD
**Status**: Valid / Possibly Expired
**Login Cookie Fields**: `field1`, `field2`
**Fetcher Type**: Fetcher / StealthyFetcher / DynamicFetcher

### Playwright Format

\```python
cookies = [
    {'name': 'field1', 'value': '...', 'domain': '.example.com', 'path': '/'},
]
\```

### Notes

- Relevant precautions
```