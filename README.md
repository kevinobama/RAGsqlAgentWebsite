# crabAI — Custom RAG & SQL Agent Engineering

## Overview

**crabAI** is a production-grade website showcasing custom RAG (Retrieval-Augmented Generation) systems and natural-language SQL agents. It serves as both a marketing presence and a demo platform for the company's core capabilities.

## Project Structure

- **Next.js 16** with React 19 — the app framework
- **Tailwind CSS** v4 — styling
- **shadcn/ui** + **Radix UI** — component primitives
- **Prisma ORM** — database integration
- **z-ai-web-dev-sdk** — AI SDK for LLM interactions

## Key Features

### Landing Page Sections
- Hero, Services, Demos, Industries, Process, Pricing, FAQ, Contact

### Multi-language Support
- English/Chinese (EN/ZH) toggle with persistent `localStorage` storage
- `next-themes` for dark mode support

### API Endpoints

| Endpoint | Description |
|---|---|
| `POST /api/lead` | Contact form capture with email validation, stores leads in Prisma DB |
| `POST /api/rag-demo` | RAG demo: retrieves from knowledge base, generates AI answer with source citations |
| `POST /api/sql-agent-demo` | SQL Agent demo: translates natural-language questions to SQL against mock e-commerce schema |

### Demo Functionality

**RAG Demo** (`/api/rag-demo`):
- In-memory knowledge base with 8 documents (return policy, warranty, shipping, pricing, account/billing, data security, integration/API, technical support)
- Keyword-overlap retrieval returning top-3 results
- LLM-generated answers in English or Chinese with source citations

**SQL Agent Demo** (`/api/sql-agent-demo`):
- Mock e-commerce database schema (customers, orders, products, order_items)
- Intent-based mock result selection
- Natural-language summary generation
- Returns SQL + columns + rows + summary

## Tech Stack

- **Framework**: Next.js 16 (`output: "standalone"`)
- **UI**: React 19, shadcn/ui components, Radix UI primitives
- **Styling**: Tailwind CSS v4
- **Database**: Prisma ORM with SQLite
- **AI**: `@z-ai/web-dev-sdk` for LLM interactions
- **Other**: date-fns, recharts, embla-carousel, framer-motion, sonner

## Development

```bash
# Install dependencies
bun install

# Development server
bun dev

# Build
bun build

# Start production
bun start
```

## API Routes

- `/api/lead` — Lead capture form
- `/api/rag-demo` — RAG question answering demo
- `/api/sql-agent-demo` — Natural-language to SQL demo
- `/api` — Simple GET endpoint returning "Hello, world!"

## Multilingual

Language persistence via `localStorage` with `useSyncExternalStore`. Toggle switches locale between `en` and `zh`, updates `<html lang>` attribute, and dispatches storage events for cross-tab synchronization.