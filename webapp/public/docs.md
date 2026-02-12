# CoralBricks API Documentation

## 1. Overview

CoralBricks provides commerce-optimized embedding models designed for real-time retrieval, search, and discovery. Unlike generic embeddings, CoralBricks models are built to understand structured, attribute-rich data such as products, variants, and queries.

**Use CoralBricks when:**
- Zero result queries and long tail attribute specified queries matter
- Latency and GPU efficiency matter

CoralBricks follows the OpenAI Embeddings API interface and can be used as a drop-in replacement for existing embedding workflows.

## 2. Quick Start

Get your first embedding in minutes.

### Create an API Key

Sign up to generate an API key from the dashboard.

### Embed a Query (curl)

```bash
curl -X POST https://api.coralbricks.ai/api/v1/embeddings \
  -H "Authorization: Bearer $CORALBRICKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "black leather office chair with wheels",
    "task": "query"
  }'
```

### Example Response

```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "embedding": [
        0.015192857943475246,
        0.03750135749578476,
        -0.0298087727278471,
        ...
      ],
      "index": 0
    }
  ],
  "model": "coral_embed",
  "usage": {
    "prompt_tokens": 5,
    "total_tokens": 5
  }
}
```

## 3. Authentication

Authentication is handled via API keys. Include your key in the Authorization header:

```
Authorization: Bearer <API_KEY>
```

**Security Best Practices:**
- Keep keys secret
- Rotate keys if compromised
- Do not embed keys in client-side code

## 4. Core Concepts

### Tasks: query vs product

CoralBricks uses a single embedding model with two distinct embedding tasks:

- **task = "query"** — embeds user intent (search queries)
- **task = "product"** — embeds structured product data

The task is specified via `task` parameter in the request body and controls how the model interprets the input. Although both tasks return vectors in the same embedding space, they are optimized for different roles in retrieval.

## 5. Query Embeddings (task = "query")

Query embeddings represent user intent.

**Use this task for:**
- Search queries
- Natural language prompts
- Short or underspecified inputs

**Example:**

```python
response = client.embeddings.create(
    model="coral_embed",
    input=["christmas window snowflake stickers"],
    extra_body={"task": "query"}
)
```

**Query embeddings are designed to:**
- Be robust to short, ambiguous text
- Emphasize attributes, constraints, and intent
- Match directly against product embeddings using cosine similarity

## 6. Product Embeddings (task = "product")

Product embeddings represent catalog items or variants. They are optimized for understanding structured commerce data, not just raw text.

Inputs for `task="product"` must be a JSON object describing a product. The model is trained to jointly reason over field structure and field content.

**Example:**

```python
response = client.embeddings.create(
    model="coral_embed",
    input=[{
        "title": "retro humor graphic t-shirt",
        "color": "dark gray",
        "brand": "example apparel studio",
        "category": "Apparel & Accessories > Clothing > Shirts & Tops > T-Shirts",
        "attributes": { "theme": "nostalgic humor" },
        "bullets": [
            "comfortable unisex fit",
            "soft cotton fabric",
            "vintage-inspired graphic design"
        ],
        "description": "a casual graphic t-shirt designed for everyday wear, featuring a nostalgic humor theme and a comfortable fit."
    }],
    extra_body={"task": "product"}
)
```

### Supported Product Fields

Common fields include (but are not limited to):

- **title** (required)
- **category**
- **brand**
- **color**
- **bullets**
- **description**
- **attributes**

### Example Product Input

```json
{
  "title": "retro humor graphic t-shirt",
  "color": "dark gray",
  "brand": "example apparel studio",
  "category": "Apparel & Accessories > Clothing > Shirts & Tops > T-Shirts",
  "attributes": { "theme": "nostalgic humor" },
  "bullets": [
    "comfortable unisex fit",
    "soft cotton fabric",
    "vintage-inspired graphic design"
  ],
  "description": "a casual graphic t-shirt designed for everyday wear, featuring a nostalgic humor theme and a comfortable fit."
}
```

### Notes & Best Practices

- **Cleaning is not required** — Fields may be noisy, verbose, or inconsistently formatted.
- **Only title is required** — All other fields are optional and handled gracefully when missing.
- **Structured inputs are preserved** — Fields are treated as structured semantic signals, not flattened text.
- **Automatic length management** — If the serialized product exceeds 512 tokens, CoralBricks automatically prioritizes and truncates less relevant content while preserving core attributes.
- **Attributes should be high-signal** — Keep attribute keys and values short and semantically meaningful.
- **Categories** — Categories should follow the Google Product Taxonomy and be provided as a canonical category path string.

### Shared Embedding Space

Query and product embeddings:
- Share the same dimensionality
- Live in a single vector space
- Are directly comparable using cosine similarity or dot product

This enables:
- Query → product retrieval
- Ranking and re-ranking
- Hybrid keyword + vector search

### Determinism

- Identical inputs with the same task produce identical embeddings
- Batch ordering is preserved
- Query and product tasks are deterministic independently

### Why Tasks Matter

Use the correct task for best relevance:
- **query embeddings** emphasize intent and constraints
- **product embeddings** emphasize attributes and catalog semantics

Embedding products as queries (or vice versa) may reduce retrieval quality.

## 7. Batching & Performance

- Batch requests are supported (arrays of queries or products)
- Recommended batch size: 1–64 items

## 8. Output Format

- Embeddings are returned as float32 vectors
- Fixed dimensionality per model (e.g., 768)
- Deterministic: identical inputs produce identical embeddings
- Ordering is preserved for batched requests

## 9. Errors & Status Codes

| Status | Meaning |
|--------|---------|
| 400 | Invalid request body |
| 401 | Unauthorized |
| 429 | Rate limit exceeded |
| 500 | Internal server error |

### Example Error

```json
{
  "error": "Invalid input: at least one product field must be provided"
}
```

## 10. Limits & Quotas

- **Token limit**: Inputs are capped at 512 tokens per item. Truncation is applied deterministically and does not result in errors.
- **Rate limits** apply per API key. Please reference your dashboard for your rate limits.
- Max batch size enforced
- Field size limits apply to text inputs
- Exact limits may change; contact us for higher quotas.

## 11. Deployment & Latency Notes

- The public API is best-effort and optimized for high throughput.
- Services are hosted in AWS us-east.
- Dedicated, in-region deployments are available and can achieve <100 ms P95 latency, depending on configuration and workload.
- On-prem and customer-GPU deployments are available on request.

Contact us to discuss deployment options, latency targets, or custom configurations.

## 12. FAQ

**How is this different from OpenAI embeddings?**
CoralBricks embeddings are trained specifically for structured commerce data and retrieval-first workloads.

**Should I clean my data first?**
Basic normalization helps, but CoralBricks handles noisy real-world inputs well.

**Can I mix query and product embeddings?**
Yes — they are designed to be directly comparable.

## 13. Support & Contact

- **Email**: hello@coralbricks.ai
- **Enterprise & deployments**: Contact us
