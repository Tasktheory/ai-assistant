import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// Initialize Supabase
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

type MatchDocument = {
  id: string
  title: string
  content: string
  url: string
  type: string
  embedding: number[]
  similarity: number
}

export async function POST(req: NextRequest) {
  const { messages } = await req.json()

  // Extract latest user message
  const userQuestion = messages[messages.length - 1]?.content

  // Embed user query
  const embeddingResponse = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: userQuestion,
  })

  const userEmbedding = embeddingResponse.data[0].embedding

  // Query Supabase for top 5 matching document chunks
  const { data: matches, error } = await supabase.rpc('match_documents', {
    query_embedding: userEmbedding,
    match_threshold: 0.75,
    match_count: 5,
  })

  if (error) {
    console.error('Supabase RPC error:', error)
    return new Response('Error fetching documents', { status: 500 })
  }

  // Build context from matched document content
  const contextText = (matches as MatchDocument[]).map(
    (doc) => `From "${doc.title}" (${doc.url}):\n${doc.content}`
  ).join('\n\n')

  // System instructions
  const systemPrompt = `You are a helpful company knowledge assistant.
Only answer questions based on the provided context.
If the context does not contain the answer, respond with:
"I'm not sure based on current documentation."
Always cite the source using the document URL.
Use markdown formatting.`

  // Inject the context into the prompt
  const contextMessage = {
    role: 'user' as const,
    content: `Here is relevant context from company documents:\n\n${contextText}\n\nNow answer the following question: ${userQuestion}`,
  }

  const finalMessages = [
    { role: 'system' as const, content: systemPrompt },
    contextMessage,
  ]

  // Stream GPT-4 response
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages: finalMessages,
  })

  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of response) {
        const text = chunk.choices[0]?.delta?.content || ''
        controller.enqueue(encoder.encode(text))
      }
      controller.close()
    },
  })

  return new Response(stream)
}
