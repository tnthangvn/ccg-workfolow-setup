---
name: rag-system
description: RAG Retrieval-Augmented Generation Architecture. Vector databases, Embedding, retrieval strategies, reranking algorithms, hybrid retrieval. Use when the user mentions RAG, retrieval-augmented, vector databases, Embedding, reranking, LangChain, or LlamaIndex.
---

# 🔮 Alchemy Manual · RAG System (Retrieval-Augmented Generation)

## RAG Architecture

```
Query → Embedding → Vector Retrieval → Rerank → Context Injection → LLM Generation
  │         │           │         │          │            │
  └─ Rewrite ─┴─ Hybrid Retrieval ┴─ Relevance ─┴─ Compression ─┴─ Answer + Citation
```

### Core Flow
```python
from langchain.embeddings import OpenAIEmbeddings
from langchain.vectorstores import Chroma
from langchain.chat_models import ChatOpenAI
from langchain.chains import RetrievalQA

# 1. Document Loading and Splitting
from langchain.document_loaders import TextLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

loader = TextLoader("docs.txt")
documents = loader.load()

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    separators=["\n\n", "\n", "。", ".", " "]
)
chunks = splitter.split_documents(documents)

# 2. Vectorization and Storage
embeddings = OpenAIEmbeddings()
vectorstore = Chroma.from_documents(chunks, embeddings)

# 3. Retrieval and Generation
llm = ChatOpenAI(model="gpt-4", temperature=0)
qa_chain = RetrievalQA.from_chain_type(
    llm=llm,
    retriever=vectorstore.as_retriever(search_kwargs={"k": 5}),
    return_source_documents=True
)

result = qa_chain({"query": "What is RAG?"})
print(result["result"])
```

## Vector Database Comparison

| Database | Type | Index Algorithm | Applicable Scenarios | Deployment |
|--------|------|----------|----------|------|
| Pinecone | Managed | HNSW | Production-grade, high concurrency | Cloud |
| Weaviate | Open Source | HNSW | Multi-modal, GraphQL | Self-hosted/Cloud |
| Qdrant | Open Source | HNSW | High performance, filtering | Self-hosted/Cloud |
| Chroma | Open Source | HNSW | Fast prototyping, local | Local/Memory |
| Milvus | Open Source | IVF/HNSW | Large-scale, distributed | Self-hosted |
| Faiss | Library | IVF/PQ | Research, offline | Local |

### Pinecone Example
```python
import pinecone
from langchain.vectorstores import Pinecone

pinecone.init(api_key="YOUR_KEY", environment="us-west1-gcp")

index_name = "rag-index"
if index_name not in pinecone.list_indexes():
    pinecone.create_index(
        name=index_name,
        dimension=1536,  # OpenAI ada-002
        metric="cosine"
    )

vectorstore = Pinecone.from_documents(
    documents=chunks,
    embedding=embeddings,
    index_name=index_name
)
```

### Qdrant Example
```python
from qdrant_client import QdrantClient
from langchain.vectorstores import Qdrant

client = QdrantClient(host="localhost", port=6333)

vectorstore = Qdrant.from_documents(
    documents=chunks,
    embedding=embeddings,
    collection_name="knowledge_base",
    client=client
)

# Retrieval with filtering
results = vectorstore.similarity_search(
    query="RAG architecture",
    k=5,
    filter={"source": "technical_docs"}
)
```

## Embedding Model Selection

### Model Comparison
| Model | Dimensions | Performance | Cost | Applicable Scenarios |
|------|------|------|------|----------|
| OpenAI ada-002 | 1536 | High | Medium | General, multi-lingual |
| Cohere embed-v3 | 1024 | High | Medium | Multi-lingual, compression |
| BGE-large-zh | 1024 | High | Free | Chinese optimized |
| E5-large-v2 | 1024 | Medium | Free | Open source, general |
| text2vec-base | 768 | Medium | Free | Chinese, lightweight |

### Local Embedding
```python
from langchain.embeddings import HuggingFaceEmbeddings

# BGE Chinese model
embeddings = HuggingFaceEmbeddings(
    model_name="BAAI/bge-large-zh-v1.5",
    model_kwargs={'device': 'cuda'},
    encode_kwargs={'normalize_embeddings': True}
)

# Batch encoding
texts = ["Document 1", "Document 2", "Document 3"]
vectors = embeddings.embed_documents(texts)

# Query encoding (with instruction)
query_vector = embeddings.embed_query("Generate a representation for this sentence")
```

### Multi-modal Embedding
```python
from langchain.embeddings import OpenAIEmbeddings

# CLIP Image-Text joint
class MultiModalEmbedding:
    def __init__(self):
        self.text_model = OpenAIEmbeddings()
        self.image_model = CLIPModel.from_pretrained("openai/clip-vit-base-patch32")

    def embed_image(self, image_path: str):
        image = Image.open(image_path)
        return self.image_model.encode_image(image)

    def embed_text(self, text: str):
        return self.text_model.embed_query(text)
```

## Retrieval Strategies

### Dense Retrieval (Vectors)
```python
# Cosine similarity retrieval
retriever = vectorstore.as_retriever(
    search_type="similarity",
    search_kwargs={"k": 5}
)

# MMR (Maximal Marginal Relevance) - Diversity
retriever = vectorstore.as_retriever(
    search_type="mmr",
    search_kwargs={"k": 5, "fetch_k": 20, "lambda_mult": 0.5}
)

# Similarity score threshold filtering
retriever = vectorstore.as_retriever(
    search_type="similarity_score_threshold",
    search_kwargs={"score_threshold": 0.8, "k": 5}
)
```

### Sparse Retrieval (BM25)
```python
from langchain.retrievers import BM25Retriever

# BM25 keyword retrieval
bm25_retriever = BM25Retriever.from_documents(chunks)
bm25_retriever.k = 5

results = bm25_retriever.get_relevant_documents("RAG System")
```

### Hybrid Retrieval
```python
from langchain.retrievers import EnsembleRetriever

# Vector + BM25 Hybrid
ensemble_retriever = EnsembleRetriever(
    retrievers=[vectorstore.as_retriever(), bm25_retriever],
    weights=[0.6, 0.4]  # Vector weight 60%, BM25 weight 40%
)

results = ensemble_retriever.get_relevant_documents("Query")
```

### Multi-Recall
```python
class MultiRecallRetriever:
    def __init__(self, vector_store, bm25_retriever, graph_retriever):
        self.retrievers = {
            "vector": vector_store.as_retriever(search_kwargs={"k": 10}),
            "bm25": bm25_retriever,
            "graph": graph_retriever
        }

    def retrieve(self, query: str, top_k: int = 5):
        all_docs = []
        for name, retriever in self.retrievers.items():
            docs = retriever.get_relevant_documents(query)
            all_docs.extend([(doc, name) for doc in docs])

        # Deduplication + Reranking
        unique_docs = self._deduplicate(all_docs)
        return self._rerank(unique_docs, query)[:top_k]
```

## Reranking Algorithms

### Cross-Encoder Reranking
```python
from sentence_transformers import CrossEncoder

class Reranker:
    def __init__(self):
        self.model = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')

    def rerank(self, query: str, documents: list, top_k: int = 5):
        pairs = [[query, doc.page_content] for doc in documents]
        scores = self.model.predict(pairs)

        # Sort by score
        ranked = sorted(zip(documents, scores), key=lambda x: x[1], reverse=True)
        return [doc for doc, score in ranked[:top_k]]

# Usage
reranker = Reranker()
initial_docs = vectorstore.similarity_search(query, k=20)
final_docs = reranker.rerank(query, initial_docs, top_k=5)
```

### Cohere Rerank API
```python
import cohere

co = cohere.Client("YOUR_API_KEY")

def cohere_rerank(query: str, documents: list, top_k: int = 5):
    results = co.rerank(
        query=query,
        documents=[doc.page_content for doc in documents],
        top_n=top_k,
        model="rerank-multilingual-v2.0"
    )

    return [documents[r.index] for r in results]
```

### LLM Reranking
```python
from langchain.chat_models import ChatOpenAI

def llm_rerank(query: str, documents: list, top_k: int = 3):
    llm = ChatOpenAI(model="gpt-4", temperature=0)

    prompt = f"""Given the query and document list, sort them by relevance (1 is most relevant).

Query: {query}

Documents:
{chr(10).join([f"{i+1}. {doc.page_content[:200]}" for i, doc in enumerate(documents)])}

Output Format: 1,3,2,5,4 (Only numbers and commas)"""

    ranking = llm.predict(prompt).strip().split(',')
    return [documents[int(i)-1] for i in ranking[:top_k]]
```

## Document Splitting Strategies

### Recursive Splitting
```python
from langchain.text_splitter import RecursiveCharacterTextSplitter

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,
    chunk_overlap=200,
    length_function=len,
    separators=["\n\n", "\n", "。", ".", " ", ""]
)
```

### Semantic Splitting
```python
from langchain.text_splitter import SemanticChunker

semantic_splitter = SemanticChunker(
    embeddings=embeddings,
    breakpoint_threshold_type="percentile",  # or "standard_deviation"
    breakpoint_threshold_amount=95
)

chunks = semantic_splitter.split_text(long_text)
```

### Markdown Structured Splitting
```python
from langchain.text_splitter import MarkdownHeaderTextSplitter

headers_to_split_on = [
    ("#", "Header 1"),
    ("##", "Header 2"),
    ("###", "Header 3"),
]

markdown_splitter = MarkdownHeaderTextSplitter(headers_to_split_on)
chunks = markdown_splitter.split_text(markdown_text)
```

## Query Optimization

### Query Rewriting
```python
from langchain.prompts import ChatPromptTemplate

query_rewrite_prompt = ChatPromptTemplate.from_template("""
Rewrite the user query into a form more suitable for retrieval.

Original Query: {query}

Rewrite Requirements:
1. Complete omitted information
2. Expand synonyms
3. Split compound questions

Rewritten Query:""")

def rewrite_query(query: str):
    chain = query_rewrite_prompt | llm
    return chain.invoke({"query": query}).content
```

### Multi-Query Generation
```python
from langchain.retrievers.multi_query import MultiQueryRetriever

multi_query_retriever = MultiQueryRetriever.from_llm(
    retriever=vectorstore.as_retriever(),
    llm=llm
)

# Automatically generate 3-5 variant queries
results = multi_query_retriever.get_relevant_documents("What is RAG?")
```

### HyDE (Hypothetical Document Embeddings)
```python
def hyde_retrieval(query: str):
    # 1. Let LLM generate a hypothetical answer
    hyde_prompt = f"Please answer in detail: {query}"
    hypothetical_doc = llm.predict(hyde_prompt)

    # 2. Retrieve using the hypothetical answer
    results = vectorstore.similarity_search(hypothetical_doc, k=5)
    return results
```

## Context Compression

### LLM Compressor
```python
from langchain.retrievers import ContextualCompressionRetriever
from langchain.retrievers.document_compressors import LLMChainExtractor

compressor = LLMChainExtractor.from_llm(llm)

compression_retriever = ContextualCompressionRetriever(
    base_compressor=compressor,
    base_retriever=vectorstore.as_retriever(search_kwargs={"k": 10})
)

# Retrieve 10 documents, compress and return the most relevant snippets
compressed_docs = compression_retriever.get_relevant_documents(query)
```

### Embedding Filtering
```python
from langchain.retrievers.document_compressors import EmbeddingsFilter

embeddings_filter = EmbeddingsFilter(
    embeddings=embeddings,
    similarity_threshold=0.76
)

compression_retriever = ContextualCompressionRetriever(
    base_compressor=embeddings_filter,
    base_retriever=vectorstore.as_retriever(search_kwargs={"k": 20})
)
```

## Complete RAG Pipeline

### LangChain Implementation
```python
from langchain.chains import ConversationalRetrievalChain
from langchain.memory import ConversationBufferMemory

# Memory
memory = ConversationBufferMemory(
    memory_key="chat_history",
    return_messages=True,
    output_key="answer"
)

# Conversational RAG
qa_chain = ConversationalRetrievalChain.from_llm(
    llm=llm,
    retriever=vectorstore.as_retriever(search_kwargs={"k": 5}),
    memory=memory,
    return_source_documents=True,
    verbose=True
)

# Multi-turn conversation
result1 = qa_chain({"question": "What is RAG?"})
result2 = qa_chain({"question": "What are its advantages?"})  # Automatically references context
```

### LlamaIndex Implementation
```python
from llama_index import VectorStoreIndex, ServiceContext
from llama_index.llms import OpenAI
from llama_index.embeddings import OpenAIEmbedding

# Service Context
service_context = ServiceContext.from_defaults(
    llm=OpenAI(model="gpt-4", temperature=0),
    embed_model=OpenAIEmbedding()
)

# Build Index
index = VectorStoreIndex.from_documents(
    documents,
    service_context=service_context
)

# Query Engine
query_engine = index.as_query_engine(
    similarity_top_k=5,
    response_mode="compact"  # or "tree_summarize", "refine"
)

response = query_engine.query("What is RAG?")
print(response.response)
print(response.source_nodes)  # Citation sources
```

## Advanced RAG Patterns

### Self-RAG (Self-Reflection)
```python
class SelfRAG:
    def __init__(self, llm, retriever):
        self.llm = llm
        self.retriever = retriever

    def query(self, question: str):
        # 1. Determine if retrieval is needed
        need_retrieval = self._check_retrieval_need(question)

        if not need_retrieval:
            return self.llm.predict(question)

        # 2. Retrieval
        docs = self.retriever.get_relevant_documents(question)

        # 3. Generate answer
        answer = self._generate_with_docs(question, docs)

        # 4. Self-evaluation
        if self._verify_answer(question, answer, docs):
            return answer
        else:
            # Re-retrieve or generate fallback
            return self._fallback_generate(question)
```

### RAPTOR (Recursive Summarization)
```python
from langchain.chains.summarize import load_summarize_chain

def raptor_indexing(documents, levels=3):
    current_docs = documents
    all_summaries = []

    for level in range(levels):
        # Cluster
        clusters = cluster_documents(current_docs, n_clusters=10)

        # Generate summary for each cluster
        summaries = []
        for cluster in clusters:
            summary = summarize_chain.run(cluster)
            summaries.append(summary)

        all_summaries.extend(summaries)
        current_docs = summaries

    # Index original documents + summaries of all levels
    vectorstore.add_documents(documents + all_summaries)
```

## Tools and Frameworks

| Tool | Type | Features |
|------|------|------|
| LangChain | Framework | Rich ecosystem, componentized |
| LlamaIndex | Framework | Index optimization, query engine |
| Haystack | Framework | Production-grade, Pipeline |
| Pinecone | Vector DB | Managed, high performance |
| Qdrant | Vector DB | Open source, strong filtering |
| Weaviate | Vector DB | Multi-modal, GraphQL |
| Cohere | API | Embedding + Rerank |

## Best Practices

- ✅ Document Splitting: chunk_size 500-1500, overlap 10-20%
- ✅ Retrieval Quantity: Initial recall 10-20, after reranking 3-5
- ✅ Hybrid Retrieval: Vector + BM25 weight 6:4 or 7:3
- ✅ Metadata Filtering: Time, source, type
- ✅ Citation Sources: Return source_documents
- ✅ Caching: Cache results for identical queries
- ✅ Monitoring: Retrieval latency, relevance, answer quality
- ❌ Avoid: Chunk too large/small, no reranking, no compression

---
