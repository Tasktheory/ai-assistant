import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { AirtableRecord, fetchAirtableData } from '../../airtable' 
import { scrapeWebsiteContent } from '../scraper' 
export const runtime = 'edge'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

type Role = 'user' | 'assistant' | 'system'

type ChatMessage = {
  role: Role
  content: string
}

function toOpenAIMessage(m: ChatMessage) {
  return { role: m.role, content: m.content }
}

async function generatePoster(prompt: string) {
  const response = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      prompt,
      n: 1,
      size: "1024x1024",
    }),
  })

  if (!response.ok) throw new Error('Poster generation failed')
  const data = await response.json()
  return data.data[0].url as string
}

async function answerCompanyQuestionStream(messages: ChatMessage[]) {
  const question = messages[messages.length - 1].content

  const embeddingRes = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: question,
  })

  const embedding = embeddingRes.data[0].embedding

  const { data } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_threshold: 0.75,
    match_count: 5,
  })

  type SupabaseDoc = { content: string; title?: string }
  const topDoc: SupabaseDoc | undefined = data?.[0]
  const contextText = (data as SupabaseDoc[] | undefined)?.map((doc) => doc.content).join('\n\n') || ''


  const systemPrompt = `You are a helpful assistant answering questions using the provided context only.
If unsure, say you don't know.
Context:
${contextText}`

  const stream = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map(toOpenAIMessage),
    ],
  })

  const encoder = new TextEncoder()
 const readableStream = new ReadableStream({
  async start(controller) {
    let fullContent = ''
    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content
      if (content) {
        fullContent += content
      }
    }

    if (topDoc?.title) {
      fullContent += ` (Source: ${topDoc.title})`
    }

    controller.enqueue(encoder.encode(fullContent))
    controller.close()
  }
})


  return new Response(readableStream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  })
}

async function handleAirtableData(messages: ChatMessage[]) {
  const airtableData: AirtableRecord[] = await fetchAirtableData()

  const context = airtableData.map(record => {
    return `Name: ${record.name}\nInfo: ${record.info}`
  }).join('\n\n')

  const systemPrompt = `You are an assistant helping answer questions based on the Airtable data below.
Use the data to help answer.
Airtable Records:
${context}`

  const stream = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map(toOpenAIMessage),
    ],
  })

  const encoder = new TextEncoder()
  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const content = chunk.choices?.[0]?.delta?.content
        if (content) {
          controller.enqueue(encoder.encode(content))
        }
      }
      controller.close()
    }
  })

  return new Response(readableStream)
}

async function handleWebScrape(messages: ChatMessage[]) {
  const lastMessage = messages[messages.length - 1].content
  const scraped = await scrapeWebsiteContent(lastMessage)

  const systemPrompt = `You are a helpful assistant summarizing scraped website content.
Here is the content you scraped:
${scraped}`

  const stream = await openai.chat.completions.create({
    model: 'gpt-4',
    stream: true,
    messages: [
      { role: 'system', content: systemPrompt },
      ...messages.map(toOpenAIMessage),
    ],
  })

  const encoder = new TextEncoder()
  const readableStream = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const content = chunk.choices?.[0]?.delta?.content
        if (content) {
          controller.enqueue(encoder.encode(content))
        }
      }
      controller.close()
    }
  })

  return new Response(readableStream)
}

export async function POST(req: NextRequest) {
  const { messages }: { messages: ChatMessage[] } = await req.json()
  const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || ''

  const posterKeywords = ['poster', 'create a poster', 'generate image', 'image of']
  const scrapeKeywords = ['scrape', 'get info from', 'fetch from']
  const airtableKeywords = ['airtable', 'database', 'crm']

  try {
    if (posterKeywords.some(k => lastMessage.includes(k))) {
      const url = await generatePoster(lastMessage)
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(`Here is the link for the image: ${url}`))
          controller.close()
        }
      })
      return new Response(stream)
    }

    if (scrapeKeywords.some(k => lastMessage.includes(k))) {
      return await handleWebScrape(messages)
    }

    if (airtableKeywords.some(k => lastMessage.includes(k))) {
      return await handleAirtableData(messages)
    }

    return await answerCompanyQuestionStream(messages)
  } catch (err) {
    return new Response(`Error: ${err}`, { status: 500 })
  }
}

