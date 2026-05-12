# Scrapling API Quick Reference

## Fetcher (Based on curl_cffi, fastest)

```python
from scrapling.fetchers import Fetcher

# GET request
page = Fetcher.get(url, impersonate='chrome', timeout=30, headers=None, cookies=None)

# POST request
page = Fetcher.post(url, data=None, json=None, impersonate='chrome', timeout=30)
```

**Cookie format**: `dict` — `{'name': 'value'}`
**Timeout unit**: seconds

## FetcherSession (Maintain session cookies)

```python
from scrapling.fetchers import FetcherSession

with FetcherSession(impersonate='chrome') as s:
    s.post(login_url, data={'user': '...', 'pass': '...'})
    page = s.get(target_url)
```

## StealthyFetcher (Camoufox, bypass anti-scraping)

```python
from scrapling.fetchers import StealthyFetcher

page = StealthyFetcher.fetch(
    url,
    headless=True,           # Headless mode
    solve_cloudflare=True,   # Automatically bypass Cloudflare
    cookies=None,            # list[dict] format
    timeout=60000,           # milliseconds
    network_idle=True,       # Wait for network idle
    hide_canvas=True,        # Hide canvas fingerprint
    block_webrtc=True,       # Block WebRTC IP leak
    disable_resources=False, # Disable image/font acceleration
)
```

**Cookie format**: `list[dict]` — `[{'name': 'n', 'value': 'v', 'domain': '.site.com', 'path': '/'}]`
**Timeout unit**: milliseconds

## DynamicFetcher (Playwright, JS rendering)

```python
from scrapling.fetchers import DynamicFetcher

page = DynamicFetcher.fetch(
    url,
    headless=True,
    cookies=None,            # list[dict] format
    timeout=30000,           # milliseconds
    network_idle=True,       # Wait for network idle
    wait_selector=None,      # Wait for specific element to appear
    disable_resources=True,  # Skip image/font/CSS acceleration
)
```

**Cookie format**: `list[dict]`
**Timeout unit**: milliseconds

## Selector (Pure HTML parsing, no network requests)

```python
from scrapling.parser import Selector

page = Selector(html_string, url='https://base-url.com')
```

## Common Response Attributes

```python
page.status          # HTTP status code (int)
page.text            # Raw HTML/text content (str)
page.url             # Final URL (might be redirected)
page.cookies         # Response cookies
page.headers         # Response headers
```

## Selector Methods

```python
# CSS selector
page.css('div.content')              # Returns list of elements
page.css_first('h1')                 # Returns first matching element

# XPath selector
page.xpath('//div[@class="content"]')

# Text extraction pseudo-elements
page.css('h1::text')                 # Extract text content
page.css('a::attr(href)')            # Extract attribute value

# Get text of all matching results
results = page.css('h1::text').getall()  # list[str]

# Get text of first matching result
result = page.css('h1::text').get()      # str | None
```

## Element Methods

```python
element = page.css_first('div.post')

element.text                          # Direct child text
element.get_all_text(strip=True)      # Get all text recursively
element.attrib                        # Attributes dictionary
element.attrib.get('href')            # Get single attribute
element.css('span.author::text')      # Continue selecting in subtree
element.parent                        # Parent element
element.children                      # List of child elements
```

## Regex Extraction

```python
# Extract matches from text
page.re(r'price: \$(\d+\.\d+)')      # list[str] — All matches
page.re_first(r'price: \$(\d+\.\d+)')  # str | None — First match
```