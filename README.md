# AI Assistant 🤖

A powerful AI-powered chatbot that provides instant answers to questions about your company's documentation, style guides, project briefs, and FAQs. Built with Next.js, the Vercel AI SDK, and OpenAI.

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

The Company Knowledge Assistant is a Retrieval-Augmented Generation (RAG) chatbot designed to centralize and provide quick, accurate answers to questions about your company's internal documentation. It leverages advanced AI models and vector search to understand natural language queries and retrieve relevant information from various sources, presenting it with direct citations.

This project aims to enhance efficiency in employee onboarding, policy lookups, project documentation, and technical support by providing an intelligent, real-time knowledge assistant.

## What This Application Does

The Company Knowledge Assistant is a RAG chatbot that:

- **Ingests company documents** from Notion pages and Google Docs
- **Processes and indexes** content using vector embeddings for semantic search
- **Provides instant answers** to natural language questions about your company knowledge
- **Cites sources** with direct links to the original documents
- **Streams responses** in real-time for a smooth chat experience

### Perfect For:
- Employee onboarding and training
- Quick access to company policies and procedures
- Design system and style guide queries
- Project documentation lookup
- HR policy questions
- Technical documentation search

## ✨ Key Features

- 🔍 **Semantic Search**: Find relevant information even with different wording
- 📚 **Multi-Source Support**: Integrates Notion pages and Google Docs
- 🔗 **Source Citations**: Every answer includes links to original documents
- ⚡ **Real-time Streaming**: Instant response generation with typing indicators
- 🎨 **Modern UI**: Clean, responsive interface built with Tailwind CSS
- 🛡️ **Production Ready**: Built for scale with proper error handling
- 🔧 **Admin Panel**: Easy document ingestion and management

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

### Data Sources
- **Notion API** - Company wiki and documentation
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
- Notion integration token
- Google Cloud service account (for Google Docs)

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

# Notion
NOTION_TOKEN=your_notion_integration_token
NOTION_DATABASE_ID=your_notion_database_id

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

### 5. Admin Panel

1. Go to `http://localhost:3000/admin`
2. Click "Ingest All Sources" to process your documents
3. Wait for ingestion to complete
4. Start asking questions!

## 🎯 Project Goals & Scope (For Interns)

This project is designed to give you hands-on experience with modern full-stack development, AI integration, and collaborative software engineering practices.

### Team Structure
You are part of a 3-person team. Each team is responsible for a distinct full-stack application. Collaboration within your team is key!

### Core Deliverables (MVP)
Your primary goal is to deliver a functional version with these core features:

- ✅ **Chat Interface**: Responsive UI for questions and AI-generated answers
- ✅ **Real-time Streaming**: Streaming responses for smooth chat experience
- ✅ **Semantic Search**: Retrieve relevant information using vector embeddings
- ✅ **Source Citations**: Display clickable links to original documents
- ✅ **Error Handling**: User-friendly error messages for API failures

### Stretch Goals
If your team completes the MVP ahead of schedule:

- [ ] User authentication for the chat interface
- [ ] Enhanced Admin Panel with ingestion logs
- [ ] Additional data sources (GitHub, Confluence)
- [ ] Chat history and suggested questions
- [ ] Query performance optimization

## 🔄 Development Workflow & Guidelines

### Git Workflow
- **Feature Branches**: Create branches for each feature (`feature/add-chat-history`)
- **Small Commits**: Make frequent, atomic commits with clear messages
- **Pull Requests**: All changes must go through PRs to main branch
- **Stay Updated**: Always `git pull` from main before starting new work

### Branch Protection Rules
- ❌ No direct pushes to main
- ✅ Required approving reviews from team members
- ✅ All status checks must pass before merging

### Code Review Process
- **Constructive Feedback**: Focus on code quality and readability
- **Prompt Reviews**: Review teammates' PRs quickly
- **Learning Opportunity**: Be open to feedback and ask questions

### Communication
- **Daily Stand-ups**: Discuss progress, blockers, and plans
- **Team Channels**: Use designated DEVSA Discord for quick questions
- **GitHub Issues**: Track bugs, features, and tasks

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Data Sources  │    │   Ingestion      │    │  Vector Store   │
│                 │    │                  │    │                 │
│ • Notion Pages  │───▶│ • Text Extraction│───▶│ • Supabase      │
│ • Google Docs   │    │ • Chunking       │    │ • Embeddings    │
│ • Future: PDFs  │    │ • Embedding      │    │ • Similarity    │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                                                         │
┌─────────────────┐    ┌──────────────────┐              │
│   Chat UI       │    │   API Routes     │              │
│                 │    │                  │              │
│ • Real-time     │◀───│ • Vector Search  │◀─────────────┘
│ • Citations     │    │ • AI Generation  │
│ • Streaming     │    │ • Source Linking │
└─────────────────┘    └──────────────────┘
```

## 🔧 Configuration

### Example Questions
Try asking:
- "What's our brand color palette?"
- "How do I submit a vacation request?"
- "What are our design principles?"
- "Who do I contact for IT support?"

### Customizing Responses
Modify the system prompt in `app/api/chat/route.ts`:

```typescript
const systemPrompt = `You are a helpful company knowledge assistant...
- Add your custom instructions here
- Modify tone and style
- Add specific formatting requirements`
```

## 🚀 Deployment

### Deploy to Vercel
1. Push your code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables in Production
Set all variables in your Vercel project settings:
- `OPENAI_API_KEY`
- `NOTION_TOKEN`
- `NOTION_DATABASE_ID`
- `GOOGLE_DOC_IDS`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

## 🆘 Mentorship & Support

Don't hesitate to ask questions, seek clarification, or request help if you get stuck.

## 👥 Team

- **Kamian** - Developer
- **Samuel** - Developer  
- **Guna** - Developer

---

Built with ❤️ using [Vercel AI SDK](https://sdk.vercel.ai) and [Next.js](https://nextjs.org)




ffffffff