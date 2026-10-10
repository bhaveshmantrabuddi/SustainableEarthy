Portfolio fork by Bhavesh Mantrabuddi. [Team credits and project history](PORTFOLIO.md).

# EcoFinance - Sustainable Finance Tracker

A comprehensive web application designed to transform personal financial behavior into meaningful environmental impact through intelligent analysis, real-time tracking, and AI-powered sustainability insights.

## Core Features

- **Authentication System**: Secure user registration and login
- **Transaction Analysis**: Upload and analyze credit card transactions
- **Sustainability Scoring**: Calculate eco-scores for purchases with detailed metrics
- **Category Breakdowns**: Visualize spending patterns by category
- **Recommendations**: Get personalized suggestions for sustainable alternatives
- **Eco-Search**: Find eco-friendly alternatives to products using Google's Generative AI
- **Cashback Rewards**: Earn cashback based on sustainability scores
- **Green Investments**: Invest rewards in sustainable companies and green bonds
- **Risk Assessment**: Personalized investment recommendations based on risk profile
- **Responsive Design**: Optimized for mobile, tablet, and desktop

## Technology Stack

### Frontend
- React with TypeScript
- TanStack Query for data fetching
- @nivo/pie and Recharts for data visualization
- Shadcn UI components with Radix UI primitives
- Tailwind CSS for styling

### Backend
- Express.js server with Node.js
- Passport.js for authentication
- Session management with MemoryStore
- Google Generative AI integration
- In-memory data storage

## Project Structure

```
├── client/               # React frontend
│   ├── src/
│   │   ├── components/   # UI components organized by feature
│   │   │   ├── cashback/      # Cashback rewards components
│   │   │   ├── dashboard/     # Dashboard visualization components
│   │   │   ├── investments/   # Investment platform components
│   │   │   ├── layout/        # Layout and navigation components
│   │   │   ├── ui/            # Shadcn UI components
│   │   │   └── ...
│   │   ├── hooks/        # Custom React hooks
│   │   ├── lib/          # Utility functions
│   │   ├── pages/        # Page components
│   │   └── App.tsx       # Main application component
│
├── server/               # Node.js backend
│   ├── utils/            # Utility functions
│   │   ├── csvParser.ts         # CSV parsing logic
│   │   ├── ecoSearch.ts         # Google AI integration
│   │   └── sustainabilityCalculator.ts  # Eco-score calculation
│   ├── auth.ts           # Authentication logic
│   ├── routes.ts         # API endpoints
│   ├── storage.ts        # Data storage
│   └── index.ts          # Server entry point
│
└── shared/               # Shared code between frontend and backend
    └── schema.ts         # Data models and validation
```

## Getting Started

### Running the Application
```bash
# Install dependencies
npm install

# Start the development server
npm run dev
# or
./start.sh
```

## Usage

1. Register a new account or log in
2. Upload a CSV file of your credit card transactions
   - Required columns: date, merchant, category, amount
3. View your sustainability score and spending analysis on the Dashboard
4. Explore detailed transaction history in the Transactions section
5. Get personalized recommendations to improve your sustainability
6. Search for eco-friendly product alternatives with EcoSearch
7. Earn and redeem cashback rewards based on your eco-score
8. Complete a risk assessment and invest in sustainable options

## Environment Variables

- `GEMINI_API_KEY`: Required for Google Generative AI integration
- `SESSION_SECRET`: Secret for session encryption (auto-generated for development)

## New Features

### Cashback Rewards
- Dynamic cashback based on eco-friendliness score
- Higher eco-scores earn larger multipliers (up to 3x for excellent scores)
- Clear visual indicators of eco-score impact on rewards

### Green Investment Platform
- Risk assessment survey to determine user's risk profile
- AI-powered recommendations for sustainable investments
- Green bond and eco-friendly company investment options
- Portfolio tracking and management
---

# Gemini Semantic Recommendations (768D Embeddings + Grounding)

Track the environmental impact of your spending: upload transactions, get sustainability
scores, and receive **semantically matched sustainable alternatives** powered by
**Gemini 768-dimensional embeddings** and **Gemini grounding with Google Search and
Google Maps**.

## Architecture

```
EcoFinance
    |
transactions (CSV upload -> parse -> MemStorage)
    |
eco scoring (merchant/category ratings; carbon & water estimates)   [server/utils/sustainabilityCalculator.ts]
    |
Gemini sustainability enrichment
    |--- Google Search grounding  -> merchant research w/ citations (cached 7d)
    |--- Google Maps grounding    -> nearby alternatives (request-scoped location)
    |
Gemini 768D embeddings
    |
semantic alternative retrieval/ranking (cosine similarity + weighted re-rank)
    |
React dashboard (Vite + Tailwind + shadcn/ui)
```

### Request flow for `POST /api/recommendations`

1. Route validates the body with Zod (`shared/schema.ts`) — only normalized fields
   (merchant, category, amount, description) are accepted and forwarded. **No card
   numbers or financial PII ever reach Gemini.**
2. `recommendationService` builds a purchase description and embeds it with
   `gemini-embedding-2` at exactly **768 dimensions** (validated at runtime).
3. Candidate sustainable products (already embedded **once** and persisted in a local
   vector index) are retrieved by cosine similarity (top-20 semantic pool).
4. The pool is re-ranked by a transparent weighted score (below) and top-5 returned.
5. Merchant sustainability is researched with Gemini + **Google Search grounding**
   (source citations captured, results cached 7 days).
6. If — and only if — the request includes a user location, Gemini + **Google Maps
   grounding** finds nearby sustainable businesses. Location is request-scoped and
   never persisted.
7. Any grounding failure degrades gracefully: that section is returned as
   `null`/`[]` with a warning, while semantic results still return.

### Ranking approach

```
final_score = 0.55 * semantic_similarity      # cosine mapped to [0,1]
            + 0.25 * sustainability_factor    # catalog score / 100
            + 0.15 * price_factor             # cheaper-vs-original, 0 at 2x price
            + 0.05 * category_match           # same category bonus
```

Weights live in `server/services/ranking.ts` (`RANKING_WEIGHTS`). In development mode
each result includes its `ranking_factors` so any ranking can be explained.

### Vector store

`server/services/vectorStore.ts` — a JSON-file-backed index in `.data/vector-index.json`
(gitignored) with in-process cosine search, deduplication by stable id (URL or
name+merchant), and atomic writes. Chosen deliberately: the app currently persists
nothing (MemStorage) and the catalog is small, so pgvector/ChromaDB would add
infrastructure without benefit. Swapping in pgvector later only requires
reimplementing `upsert`/`search`.

### Embedding model

- Model: `gemini-embedding-2` (override: `GEMINI_EMBEDDING_MODEL`)
- Dimensionality: **exactly 768** (validated — a wrong-length vector throws)
- Per Google's current guidance, `gemini-embedding-2` does not take a `taskType`
  parameter; retrieval task instructions are embedded in the prompt:
  - query: `task: search result | query: {purchase description}`
  - document: `title: {product name} | text: {description/attributes}`
- Sub-3072-dim outputs are automatically normalized by the API.

### Grounding approach

- **Search grounding** (`server/services/merchantSustainability.ts`): `google_search`
  tool on `gemini-2.5-flash` (override: `GEMINI_TEXT_MODEL`). The model is asked for
  strict JSON (score/summary/factors); citations are extracted from grounding
  metadata. The score is clearly labeled an **EcoFinance-generated assessment**, not a
  certified ESG rating. Cached in `.data/merchant-research-cache.json` for 7 days.
- **Maps grounding** (`server/services/nearbyAlternatives.ts`): `googleMaps` tool with
  `toolConfig.retrievalConfig.latLng` — only invoked when a location was provided.
  Maps may not expose product prices; the app returns price **context** (e.g. "$$")
  or "exact pricing unavailable" — never a fabricated number.

## Setup

```bash
npm install
cp .env.example .env       # then set GEMINI_API_KEY (server-side only!)
npm run dev                # dev server on :5000 (or PORT=5001 npm run dev locally)
```

`GEMINI_API_KEY` is read **only** in `server/services/geminiClient.ts`. It is never
bundled into frontend code. Without a key, existing features still work and
`POST /api/recommendations` returns HTTP 503 with a clear message.

## Evaluation

### Embedding retrieval (demo evaluation)

```bash
npm run eval:embeddings                            # keyword baseline always runs
GEMINI_API_KEY=... npm run eval:embeddings         # adds the semantic metrics
```

Compares **keyword matching (baseline)** vs **Gemini 768D retrieval** on a small
handcrafted set (8 realistic purchases, 23 demo catalog candidates) with
Recall@5 / Precision@5 / MRR. **This is a demo evaluation, not a production-grade
benchmark** — the dataset is intentionally tiny.

### LightGBM transaction classification

```bash
npm run ml:generate-data   # generates SYNTHETIC demo dataset (ml/data/)
npm run ml:train           # trains + evaluates, writes ml/results.json
```

Methodology: stratified 60/20/20 train/validation/hold-out-test split (seed 42);
an intentionally naive config documents the overfitting gap; a regularized config
(num_leaves, depth, min_child_samples, feature/bagging fractions, L1/L2, early
stopping on validation only) is scored once on the untouched test set.

**Honesty note:** this repository contains **no original training data**. The dataset
is synthetic and clearly labeled; resulting metrics are demo numbers and **cannot
substantiate** the "88% accuracy / 20%+ overfitting" resume claim. Provide real
labeled data to make that claim reproducible.

## Tests

```bash
npm test          # vitest — external APIs mocked, zero API spend
```

## Key files

| Area | File |
|---|---|
| Gemini client/key/retries | `server/services/geminiClient.ts` |
| 768D embeddings | `server/services/geminiEmbeddings.ts` |
| Ranking weights | `server/services/ranking.ts` |
| Vector store | `server/services/vectorStore.ts` |
| Catalog (demo corpus) | `server/data/sustainable-catalog.json`, `server/services/catalog.ts` |
| Search grounding | `server/services/merchantSustainability.ts` |
| Maps grounding | `server/services/nearbyAlternatives.ts` |
| Orchestration | `server/services/recommendationService.ts` |
| API route | `server/routes.ts` (`registerRecommendationRoutes`) |
| Frontend section | `client/src/components/recommendations/SemanticAlternativesSection.tsx` |
| Embedding evaluation | `scripts/evaluate-embeddings.ts` |
| LightGBM pipeline | `ml/generate_demo_dataset.py`, `ml/train_classifier.py` |
