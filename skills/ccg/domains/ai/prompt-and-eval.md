---
name: prompt-and-eval
description: Prompt Engineering and Model Evaluation. Prompt patterns (Zero-shot, Few-shot, CoT, ReAct, ToT), template design, RAGAS, LLM-as-Judge, benchmarking, A/B testing, continuous monitoring. Use when the user mentions Prompt engineering, Few-shot, CoT, model evaluation, RAGAS, LLM-as-Judge, or benchmarking.
---

# Prompt Engineering and Model Evaluation

## I. Prompt Patterns

### Pattern Comparison

| Pattern | Complexity | Accuracy | Token Consumption | Applicable Scenarios |
|------|--------|--------|------------|----------|
| Zero-shot | Low | Medium | Low | Simple tasks, general questions |
| Few-shot | Medium | High | Medium | Formatted output, classification |
| CoT | Medium | High | Medium | Reasoning, math, logic |
| Self-Consistency | High | Very High | High | Critical decisions |
| ToT | Very High | Very High | Very High | Complex planning |
| ReAct | High | High | High | Tool calling, Agent |

### Zero-shot

```python
# Key: Clear instructions + Role setting + Output format
prompt = """
You are a senior security engineer.
Task: Classify the following text as positive, negative, or neutral.
Input: {text}
Output Format: JSON {"sentiment": "...", "confidence": 0.0-1.0}
"""
```

### Few-shot

```python
# Key: 2-5 high-quality examples + Semantic similarity selection
prompt = """
Classify the reviews:

Review: Great sound quality, very comfortable to wear. → Positive
Review: Battery life is too poor. → Negative
Review: {new_review} →
"""

# Dynamic example selection (LangChain)
selector = SemanticSimilarityExampleSelector.from_examples(
    examples, OpenAIEmbeddings(), Chroma, k=2
)
```

### Chain-of-Thought (CoT)

```python
# Zero-shot CoT — Magic incantation
prompt = f"Question: {question}\n\nLet's think step by step:"

# Self-Consistency — Multi-path voting
answers = [extract_answer(llm.predict(prompt, temperature=0.7)) for _ in range(5)]
final = Counter(answers).most_common(1)[0][0]
```

### ReAct

```python
# Thought → Action → Observation Loop
prompt = """
Tools: Search[query], Calculate[expr], Finish[answer]

Thought: I need to search for the height of the Eiffel Tower
Action: Search[Eiffel Tower height]
Observation: 330 meters
Thought: Now I know the answer
Action: Finish[330 meters]
"""
```

### Tree-of-Thoughts (ToT)

```python
# Generate multiple thought paths → Evaluate and score → Beam Search for best → Recursive expansion
class TreeOfThoughts:
    def solve(self, problem):
        thoughts = self._generate(problem, n=3)
        scored = self._evaluate(problem, thoughts)
        best = sorted(scored, key=lambda x: x[1], reverse=True)[:self.beam_width]
        # Recursively deepen the best path
```

## II. Prompt Design Techniques

### Template Structure

```python
messages = [
    {"role": "system", "content": "Role + Capability Boundaries + Output Constraints"},
    {"role": "user", "content": "### Instruction\n{task}\n### Input\n{input}\n### Output Format\n{format}"},
]
```

### Optimization Principles

| Principle | Do | Don't |
|------|-----|------|
| Clarity | Specific, actionable, constrained | Vague instructions |
| Structured | Delimiters, numbering, formatting | Wall of text |
| Example-Driven | 2-5 high-quality examples | No examples |
| Step-by-step | Step 1/2/3 | All in one sentence |
| Constraint Boundaries | State what to do and what not to do | No limits |

### Advanced Techniques

```python
# Meta-prompting — Use LLM to generate Prompts
meta = "You are an expert Prompt Engineer. Generate the optimal Prompt for the following task: {task}"

# Self-Critique — Generate → Critique → Improve
answer = llm(question)
critique = llm(f"Critique: {answer}")
improved = llm(f"Improve based on critique: {critique}")
```

### Prompt Template Quick Reference

```yaml
Code Generation: "Generate {lang} code for: {desc}. Requirements: Best practices + comments + error handling"
Text Summarization: "Summarize in {n} words: {text}. Keep key information, concise language"
Data Extraction: "Extract {fields} from text, output JSON: {text}"
NL2SQL: "Convert natural language to SQL: {query}. Table schema: {schema}"
```

## III. Model Evaluation

### Evaluation Dimensions

| Dimension | Metrics | Applicable Scenarios |
|------|------|----------|
| Accuracy | Accuracy, F1, Precision, Recall | Classification, NER |
| Relevance | Relevance, Context Precision | RAG, Retrieval |
| Faithfulness | Faithfulness, Hallucination Rate | Generation tasks |
| Efficiency | Latency P95, Throughput, Cost/1K | Production deployment |

### RAGAS Framework

```python
from ragas import evaluate
from ragas.metrics import faithfulness, answer_relevancy, context_precision, context_recall

dataset = Dataset.from_dict({
    "question": questions,
    "answer": answers,
    "contexts": contexts,
    "ground_truth": ground_truths,
})

result = evaluate(dataset, metrics=[
    faithfulness,        # Is answer based on context (0-1)
    answer_relevancy,    # Answer relevance to question (0-1)
    context_precision,   # Proportion of relevant info in retrieved context (0-1)
    context_recall,      # Does context contain all required info (0-1)
])
```

### LLM-as-Judge

```python
class LLMJudge:
    def evaluate(self, question, answer, criteria):
        prompt = f"""
Evaluate answer quality (1-5 points):
Question: {question}
Answer: {answer}
Criteria: {criteria}

Output JSON: {{"accuracy": N, "completeness": N, "clarity": N, "overall": N, "feedback": "..."}}
"""
        return json.loads(self.llm.predict(prompt))

# Pairwise Comparison + ELO Ranking
def pairwise(q, a, b):
    # Returns {"winner": "A"|"B", "confidence": 0-1}
    ...
```

### Benchmark Quick Reference

| Benchmark | Evaluating Capability | Core Metrics |
|------|----------|----------|
| MMLU | Multi-task language understanding | Accuracy |
| HumanEval | Code generation | Pass@k |
| GSM8K | Math reasoning | Accuracy (CoT) |
| Custom | Business scenarios | Weighted scoring + latency |

### Retrieval Metrics

```python
def evaluate_retrieval(retrieved, relevant, k=5):
    precision_at_k = len(set(retrieved[:k]) & set(relevant)) / k
    recall_at_k = len(set(retrieved[:k]) & set(relevant)) / len(relevant)
    # MRR: Mean Reciprocal Rank of the first relevant document
    # NDCG: Normalized Discounted Cumulative Gain
    return {"precision@k": precision_at_k, "recall@k": recall_at_k, "mrr": mrr, "ndcg": ndcg}
```

### Generation Metrics

```python
# ROUGE: Summary quality (rouge-1, rouge-2, rouge-l)
# BLEU: Translation quality
from rouge import Rouge
rouge_scores = Rouge().get_scores(predictions, references, avg=True)
```

## IV. A/B Testing and Monitoring

### A/B Testing

```python
class ABTest:
    def __init__(self, variants):  # [Variant(name, model, ratio)]
        self.variants = variants

    def get_variant(self, user_id):
        # Consistent hashing diversion
        return self.variants[hash(user_id) % 100 < cumulative_ratio]

    def check_significance(self, a_scores, b_scores, alpha=0.05):
        t_stat, p_value = stats.ttest_ind(a_scores, b_scores)
        cohens_d = (mean(a) - mean(b)) / pooled_std
        return {"p_value": p_value, "significant": p_value < alpha, "effect": cohens_d}
```

### Continuous Monitoring

```python
from prometheus_client import Counter, Histogram, Gauge

request_count = Counter('llm_requests_total', 'Total', ['model', 'status'])
latency = Histogram('llm_latency_seconds', 'Latency', ['model'])
quality = Gauge('llm_quality_score', 'Quality', ['model'])

# Anomaly Detection: Z-score > 2.0 triggers an alert
class AnomalyDetector:
    def check(self, value):
        z = abs((value - mean(self.window)) / std(self.window))
        return z > self.threshold
```

## V. Checklist

### Prompt Engineering

- Clear instructions + Role setting + Output format constraints
- Use CoT / ReAct for complex tasks
- Use Self-Consistency multi-path voting for critical decisions
- Version control Prompts, use A/B testing to compare results
- Iterative optimization: Test → Analyze → Improve

### Model Evaluation

- Multi-dimensional evaluation: Accuracy + Relevance + Faithfulness + Efficiency
- Use RAGAS four metrics for RAG
- Automated evaluation with LLM-as-Judge + regular manual sampling
- Standard benchmarks (MMLU/HumanEval) + custom business benchmarks
- A/B testing before release, continuous monitoring + anomaly alerts post-release
- Feedback loop: Collect user feedback for continuous improvement

## Tool Quick Reference

| Tool | Purpose |
|------|------|
| RAGAS | Dedicated evaluation for RAG |
| LangSmith | LLM application monitoring |
| Phoenix | Observability platform |
| LangChain | Prompt template management |
| Guidance | Structured generation |
| OpenAI Evals | Model evaluation framework |
| W&B | Experiment tracking |

---
