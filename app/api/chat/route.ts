// app/api/chat/route.ts
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

// Define the interface for your documents
interface Document {
  id: string
  content: string
  title: string
  url: string
  type: string
  similarity: number
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
)

export async function POST(req: NextRequest) {
  const { messages } = await req.json()
  const question = messages[messages.length - 1].content

  const embedding = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: question,
  })

  const { data } = await supabase.rpc('match_documents', {
    query_embedding: embedding.data[0].embedding,
    match_threshold: 0.75,
    match_count: 5,
  })

  // Cast 'data' as Document[] so TypeScript knows the shape
  const matches = data as Document[] | undefined

  const contextText = matches?.map(doc => `From ${doc.title}:\n${doc.content}`).join('\n\n') || ''

  const systemPrompt = `You are a helpful assistant answering questions using internal company documents. Answer **only** from the context below. If the answer is not clearly found, respond with "I don't know."

Context:
${contextText}
`

  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages,
    ],
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
