# AI Assistant 🤖

A powerful AI-powered chatbot that provides instant answers to questions about your company's documentation, style guides, project briefs, and FAQs as well as transforming event concepts into professional poster designs with brand-consistent marketing copy. Built with Next.js, the Vercel AI SDK, and OpenAI.

## Table of Contents

- [Overview](#overview)
- [What This Application Does](#what-this-application-does)
- [Key Features](#key-features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Project Goals & Scope](#project-goals--scope-for-interns)
- [Development Workflow](#development-workflow--guidelines)
- [Architecture Overview](#architecture-overview)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Team](#team)
- [License](#license)

## Overview

The AI Assitant is an AI-powered chatbot designed to serve as your company’s intelligent assistant. It combines advanced Retrieval-Augmented Generation (RAG) capabilities to answer detailed questions about internal company documentation with creative AI features that generate visually appealing, brand-consistent marketing materials and SEO-optimized copy from high-level event concepts.

Whether you need quick, accurate answers about company policies, projects, or onboarding — or want to transform event ideas into professional marketing assets — ASKME seamlessly supports both knowledge management and creative workflows in a single, unified platform.

This project offers practical experience with AI models, vector search, and full-stack web development to build a versatile tool that boosts productivity and creativity company-wide.

## What This Application Does

The Company Knowledge Assistant is a RAG chatbot that:

- **Ingests company documents** from Notion pages and Google Docs
- **Processes and indexes** content using vector embeddings for semantic search
- **Provides instant answers** to natural language questions about your company knowledge
- **Cites sources** with direct links to the original documents
- **Streams responses** in real-time for a smooth chat experience

The Creative Agent helps designers and content creators generate professional event posters by:

-**Analyzing event concepts** Takes a event title and premise as input
-**Generating 3 unique poster designs**  Creates visually distinct concepts using AI image generation
-**Maintaining brand consistency**  Pulls brand colors, typography, and style guidelines from Notion
-**Creating marketing copy**  Generates a 100-word synopsis and punchy promo tagline
-**Ensuring accessibility**  Auto-generates descriptive alt text for all images

### Perfect For:
- Employee onboarding and training
- Quick access to company policies and procedures
- Design system and style guide queries
- Project documentation lookup
- HR policy questions
- Technical documentation search
- Generating event posters

## ✨ Key Features

- 🔍 **Semantic Search**: Find relevant information even with different wording
- 📚 **Multi-Source Support**: Integrates Notion pages and Google Docs
- 🔗 **Source Citations**: Every answer includes links to original documents
- ⚡ **Real-time Streaming**: Instant response generation with typing indicators
- 🎨 **Modern UI**: Clean, responsive interface built with Tailwind CSS
- 🛡️ **Production Ready**: Built for scale with proper error handling
- 🔧 **Admin Panel**: Easy document ingestion and management
-**DALL-E 3 Integration**  High-quality poster image generation
-**Brand-Aware Prompting**  Incorporates your brand guidelines automatically
-**Multiple Design Concepts**  3 distinct visual approaches per generation

## 🛠️ Tech Stack

### Core Framework
- **Next.js 15+** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling

### AI & Vector Search
- **Vercel AI SDK** - Streamlined AI integration
- **OpenAI GPT-4** - Language model for responses
- **OpenAI Embeddings** - Text-to-vector conversion
- **Supabase** - PostgreSQL with pgvector extension
- **DALL-E 3** - High-quality image generation

### Data Sources
- **Google Docs API** - Document and policy files
- **Custom ingestion pipeline** - Automated content processing

### Deployment
- **Vercel** - Hosting and deployment platform
- **Supabase** - Database and vector storage

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- OpenAI API key
- Supabase account
- Google Cloud service account (for Google Docs)
-Vercel account (for deployment)

### 1. Clone and Install

```bash
git clone https://github.com/434media/ai-assistant.git
cd ai-assistant
npm install
```

### 2. Environment Setup

Create a `.env.local` file:

```env
# OpenAI
OPENAI_API_KEY=your_openai_api_key


# Google Docs
GOOGLE_DOC_IDS=doc_id_1,doc_id_2,doc_id_3
GOOGLE_SERVICE_ACCOUNT_KEY=path/to/service-account.json

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Database Setup

Run the SQL script in your Supabase SQL editor:

```sql
-- Enable vector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create documents table
CREATE TABLE documents (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('notion', 'google-docs')),
  embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vector similarity search function
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
RETURNS TABLE(
  id text,
  content text,
  title text,
  url text,
  type text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    documents.id,
    documents.content,
    documents.title,
    documents.url,
    documents.type,
    1 - (documents.embedding <=> query_embedding) AS similarity
  FROM documents
  WHERE 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
$$;
```

### 4. Run the Application

```bash
npm run dev
```

Visit `http://localhost:3000` to start chatting!

### 5. Ingestion

1. Go to `http://localhost:3000/api/google-docs-ingest`
2. Wait for ingestion to complete. You will see "Google Docs ingested successfully"
3. Start asking questions!
**Note**: The link depends on where the ingestion.ts is located in the folder. 


### Branch Protection Rules
- ❌ No direct pushes to main

## 🏗️ Architecture Overview

```
to come
```

## 🔧 Configuration

### Example Questions
Try asking:
- "Whatis the Vemos Vamos brand style?"
- "How do I submit a vacation request?"
- "What are our company values?"
- "Who is the CEO?"


## 🚀 Deployment

### Deploy to Vercel
1. Push your code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables in Production
Set all variables in your Vercel project settings:
- `OPENAI_API_KEY`
- `GOOGLE_DOC_IDS`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## Creators

- **Kamian** - Developer
- **Samuel** - Developer  
- **Esther** - Developer

---

Built with ❤️ using [Vercel AI SDK](https://sdk.vercel.ai) and [Next.js](https://nextjs.org)
