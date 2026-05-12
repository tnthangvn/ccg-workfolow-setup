---
name: python
description: Python Development. Web frameworks, data processing, automation scripts, testing. Route to here when the user mentions Python, Django, Flask, FastAPI, pytest, or pandas.
---

# 📜 Talisman Grimoire · Python


## Web Frameworks

### FastAPI (Recommended)
```python
from fastapi import FastAPI, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional

app = FastAPI()

class User(BaseModel):
    name: str
    email: str
    age: Optional[int] = None

@app.get("/users/{user_id}")
async def get_user(user_id: int):
    return {"user_id": user_id}

@app.post("/users")
async def create_user(user: User):
    return user

# Dependency Injection
async def get_db():
    db = Database()
    try:
        yield db
    finally:
        await db.close()

@app.get("/items")
async def get_items(db = Depends(get_db)):
    return await db.fetch_all("SELECT * FROM items")
```

### Flask
```python
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/users', methods=['GET', 'POST'])
def users():
    if request.method == 'POST':
        data = request.json
        return jsonify(data), 201
    return jsonify([])

@app.errorhandler(404)
def not_found(e):
    return jsonify(error="Not found"), 404
```

### Django
```python
# models.py
from django.db import models

class User(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

# views.py
from django.http import JsonResponse
from django.views import View

class UserView(View):
    def get(self, request, user_id):
        user = User.objects.get(id=user_id)
        return JsonResponse({'name': user.name})

# urls.py
urlpatterns = [
    path('users/<int:user_id>/', UserView.as_view()),
]
```

## Asynchronous Programming

```python
import asyncio
import aiohttp

async def fetch(url: str) -> str:
    async with aiohttp.ClientSession() as session:
        async with session.get(url) as response:
            return await response.text()

async def fetch_all(urls: list[str]) -> list[str]:
    tasks = [fetch(url) for url in urls]
    return await asyncio.gather(*tasks)

# Run
asyncio.run(fetch_all(['http://example.com', 'http://example.org']))
```

## Data Processing

### Pandas
```python
import pandas as pd

# Read data
df = pd.read_csv('data.csv')
df = pd.read_json('data.json')

# Data cleaning
df = df.dropna()
df = df.drop_duplicates()
df['column'] = df['column'].str.strip()

# Data transformation
df['date'] = pd.to_datetime(df['date'])
df['category'] = df['category'].astype('category')

# Aggregation and analysis
result = df.groupby('category').agg({
    'value': ['sum', 'mean', 'count']
})

# Export
df.to_csv('output.csv', index=False)
df.to_json('output.json', orient='records')
```

## Testing

### pytest
```python
import pytest
from myapp import calculate, UserService

# Basic test
def test_add():
    assert calculate.add(1, 2) == 3

# Parametrization
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

### Running Tests
```bash
pytest                      # Run all
pytest test_file.py         # Specify file
pytest -k "test_add"        # Match name
pytest -v                   # Verbose output
pytest --cov=myapp          # Coverage
pytest -x                   # Stop on first failure
```

## CLI Tools

### Typer (Recommended)
```python
import typer

app = typer.Typer()

@app.command()
def hello(name: str, count: int = 1):
    """Say hello NAME, COUNT times."""
    for _ in range(count):
        typer.echo(f"Hello {name}!")

@app.command()
def goodbye(name: str, formal: bool = False):
    if formal:
        typer.echo(f"Goodbye Ms. {name}. Have a good day.")
    else:
        typer.echo(f"Bye {name}!")

if __name__ == "__main__":
    app()
```

### argparse
```python
import argparse

parser = argparse.ArgumentParser(description='My CLI tool')
parser.add_argument('input', help='Input file')
parser.add_argument('-o', '--output', default='output.txt')
parser.add_argument('-v', '--verbose', action='store_true')

args = parser.parse_args()
```

## Project Structure

```
myproject/
├── pyproject.toml          # Project configuration
├── README.md
├── src/
│   └── myproject/
│       ├── __init__.py
│       ├── main.py
│       ├── models.py
│       └── utils.py
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   └── test_main.py
└── scripts/
    └── run.py
```

### pyproject.toml
```toml
[project]
name = "myproject"
version = "0.1.0"
dependencies = [
    "fastapi>=0.100.0",
    "uvicorn>=0.23.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=7.0.0",
    "pytest-cov>=4.0.0",
]

[tool.pytest.ini_options]
testpaths = ["tests"]

[tool.ruff]
line-length = 120
select = ["E", "F", "I"]
```

## Common Libraries

| Library | Purpose |
|---|------|
| requests/httpx | HTTP Client |
| aiohttp | Async HTTP |
| SQLAlchemy | ORM |
| Pydantic | Data Validation |
| Click/Typer | CLI |
| pytest | Testing |
| pandas | Data Processing |
| loguru | Logging |

---