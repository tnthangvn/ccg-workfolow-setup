---
name: testing
description: Software testing. Unit testing, integration testing, TDD, testing frameworks. Use when the user mentions testing, unit testing, pytest, Jest, mock, or TDD.
---

# 🔧 炼器秘典 · Software Testing


## Testing Pyramid

```
        /\
       /  \     E2E Testing (Few)
      /----\
     /      \   Integration Testing (Medium)
    /--------\
   /          \ Unit Testing (Many)
  --------------
```

## Python (pytest)

```python
import pytest
from myapp import calculate, UserService

# Basic test
def test_add():
    assert calculate.add(1, 2) == 3

# Parametrized
@pytest.mark.parametrize("a,b,expected", [
    (1, 2, 3),
    (0, 0, 0),
    (-1, 1, 0),
])
def test_add_params(a, b, expected):
    assert calculate.add(a, b) == expected

# Fixture
@pytest.fixture
def user_service():
    service = UserService()
    yield service
    service.cleanup()

def test_create_user(user_service):
    user = user_service.create("test")
    assert user.name == "test"

# Mock
from unittest.mock import Mock, patch

@patch('myapp.requests.get')
def test_fetch(mock_get):
    mock_get.return_value.json.return_value = {"id": 1}
    result = fetch_user(1)
    assert result["id"] == 1

# Async test
@pytest.mark.asyncio
async def test_async_fetch():
    result = await async_fetch()
    assert result is not None
```

### Run Commands
```bash
pytest                      # Run all
pytest test_file.py         # Specify file
pytest -k "test_add"        # Match by name
pytest -v                   # Verbose output
pytest --cov=myapp          # Coverage
pytest -x                   # Stop on first failure
```

## JavaScript (Jest/Vitest)

```javascript
import { describe, it, expect, vi } from 'vitest';

// Basic test
describe('add', () => {
  it('should add two numbers', () => {
    expect(add(1, 2)).toBe(3);
  });

  it.each([
    [1, 2, 3],
    [0, 0, 0],
    [-1, 1, 0],
  ])('add(%i, %i) = %i', (a, b, expected) => {
    expect(add(a, b)).toBe(expected);
  });
});

// Mock
vi.mock('./api', () => ({
  getUser: vi.fn().mockResolvedValue({ id: 1, name: 'test' })
}));

it('should fetch user', async () => {
  const user = await fetchUser(1);
  expect(user.name).toBe('test');
});

// Spy
const spy = vi.spyOn(console, 'log');
doSomething();
expect(spy).toHaveBeenCalledWith('message');
```

## Go (testing)

```go
package main

import (
    "testing"
    "github.com/stretchr/testify/assert"
)

func TestAdd(t *testing.T) {
    result := Add(1, 2)
    assert.Equal(t, 3, result)
}

// Table-driven tests
func TestAddTable(t *testing.T) {
    tests := []struct {
        name     string
        a, b     int
        expected int
    }{
        {"positive", 1, 2, 3},
        {"zero", 0, 0, 0},
        {"negative", -1, 1, 0},
    }

    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            assert.Equal(t, tt.expected, Add(tt.a, tt.b))
        })
    }
}

// Benchmark
func BenchmarkAdd(b *testing.B) {
    for i := 0; i < b.N; i++ {
        Add(1, 2)
    }
}
```

## Testing Principles

```yaml
FIRST:
  - Fast: Fast execution
  - Independent: Independent of each other
  - Repeatable: Repeatable results
  - Self-validating: Self-validating output
  - Timely: Written timely

AAA:
  - Arrange: Prepare data
  - Act: Perform operation
  - Assert: Verify result

Principles:
  - Every test verifies only one thing
  - Test boundary conditions
  - Test exceptional cases
  - Avoid testing implementation details
```

## TDD Workflow

```
Red → Green → Refactor

1. Red: Write a failing test
2. Green: Write minimal code to make the test pass
3. Refactor: Optimize code, keeping tests passing
```

---

## Testing Strategy (from testing-strategy)

### Test Pyramid Proportions

| Level | Proportion | Execution Time | Cost |
|------|------|----------|------|
| Unit Testing | 70% | <1s | Low |
| Integration Testing | 20% | 1-10s | Medium |
| E2E Testing | 10% | 10s-5m | High |

### Shift-Left Testing Checklist

```yaml
Requirement phase: Testability review, acceptance criteria definition, test case design
Development phase: TDD, concurrent unit test writing, code review includes tests
Commit phase: Pre-commit Hook, local tests must pass, static analysis
CI phase: Automated testing, coverage gating, performance benchmark tests
```

### Contract Testing Essentials

- Consumer-Driven Contracts (CDC): Consumer defines expectations → Provider verifies contract
- Tools: Pact (multi-language), Spring Cloud Contract (Java)
- Core: Provider API <-> Contract <-> Consumer, both sides verified independently

### Coverage Strategy

```yaml
Types: Line coverage, branch coverage, function coverage, statement coverage
Gating: Global ≥80%, Core modules ≥90%
Exclusions: tests/, migrations/, __init__.py, config files
```

### Mutation Testing

- Modify source code (mutants) to verify if tests can catch them
- Tools: Stryker (JS), Pitest (Java)
- Thresholds: high 80% / low 60% / break 50%

### Testing Best Practices

- AAA Pattern: Arrange → Act → Assert
- Naming: `should [expected behavior] when [condition]`
- Single Responsibility: Each test verifies exactly one thing
- Data Isolation: Fixture/Factory pattern, independent instances per test
- Parallel Execution: Jest `maxWorkers: '50%'`, pytest `-n auto`

---

## E2E Testing (from e2e-testing)

### Playwright vs Cypress

| Feature | Playwright | Cypress |
|------|-----------|---------|
| Multi-browser | Chromium/Firefox/WebKit | Chromium/Firefox/Edge |
| Multi-tab/iframe | Native support | Limited |
| Parallel Execution | Native support | Paid |
| Debugging Experience | Average | Excellent |

### Selector Priority

```
1. data-testid (Recommended)
2. role + accessible name
3. Stable class/id
4. Text content (Use with caution)
5. CSS/XPath (Avoid)
```

### E2E Checklist

```yaml
Architecture:
  - Page Object Model (POM) to encapsulate page operations
  - Test independence: Prepare data via API, no reliance on other tests
  - Smart wait: waitForSelector/waitForResponse, ban waitForTimeout

Network:
  - Mock API: page.route() / cy.intercept() isolates backend
  - Wait for response: waitForResponse to confirm data load

Visual Regression:
  - Playwright: toHaveScreenshot() + mask dynamic content
  - Percy/Chromatic: Cloud screenshot comparison

Authentication:
  - Playwright: storageState reuses login state
  - Cypress: cy.session() caches session

CI Integration:
  - retries: 2 retries in CI environment
  - artifacts: save screenshots/videos/traces on failure
```