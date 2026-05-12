# Scrapling Installation & Maintenance

## Installation Levels

| Install Command | Included Content |
|-----------------|------------------|
| `pip install scrapling` | Only core parser (Selector), no network fetching capabilities |
| `pip install "scrapling[fetchers]"` | + Fetcher/StealthyFetcher/DynamicFetcher (curl_cffi, Playwright, Camoufox) |
| `pip install "scrapling[ai]"` | + AI features (transformers) |
| `pip install "scrapling[shell]"` | + Interactive shell |
| `pip install "scrapling[all]"` | All features |

**Recommendation**: Use `scrapling[fetchers]` for most scenarios.

## Check Installation Status

```bash
# Check version
pip show scrapling

# Verify base package is available
python -c "from scrapling.parser import Selector; print('Parser OK')"

# Verify Fetcher is available (requires [fetchers])
python -c "from scrapling.fetchers import Fetcher; print('Fetcher OK')"

# Verify StealthyFetcher is available
python -c "from scrapling.fetchers import StealthyFetcher; print('StealthyFetcher OK')"

# Verify DynamicFetcher is available
python -c "from scrapling.fetchers import DynamicFetcher; print('DynamicFetcher OK')"
```

## Install Browser Dependencies

StealthyFetcher and DynamicFetcher require a browser engine. After installation, you must run:

```bash
# Method 1: Direct command (if PATH includes Scripts directory)
scrapling install

# Method 2: Invoke via Python (recommended, avoids PATH issues)
python -c "from scrapling.cli import main; main(['install'])"
```

## Upgrade

```bash
pip install --upgrade "scrapling[fetchers]"
```

After upgrading, it is recommended to re-verify that all three Fetchers are available (see check commands above).

## Three-Fetcher Full Verification Script

```python
#!/usr/bin/env python3
"""Verify that all three scrapling Fetchers can be used normally"""
import scrapling

print(f"scrapling version: {scrapling.__version__}")

# 1. Fetcher (curl_cffi)
from scrapling.fetchers import Fetcher
page = Fetcher.get("https://httpbin.org/get", impersonate='chrome', timeout=15)
print(f"Fetcher: status={page.status}")

# 2. StealthyFetcher (Camoufox)
from scrapling.fetchers import StealthyFetcher
page = StealthyFetcher.fetch("https://httpbin.org/get", headless=True, timeout=30000)
print(f"StealthyFetcher: status={page.status}")

# 3. DynamicFetcher (Playwright)
from scrapling.fetchers import DynamicFetcher
page = DynamicFetcher.fetch("https://httpbin.org/get", headless=True, timeout=30000)
print(f"DynamicFetcher: status={page.status}")

print("\nAll Fetchers verified successfully")
```