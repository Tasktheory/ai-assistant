import { NextRequest , NextResponse} from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { AirtableRecord, fetchAirtableData } from '../airtable' 
import { scrapeWebsiteContent } from '../scraper' 
export const runtime = 'edge'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
//const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!)

type Role = 'user' | 'assistant' | 'system'

type ChatMessage = {
  role: Role
  content: string
}

function toOpenAIMessage(m: ChatMessage) {
  return { role: m.role, content: m.content }
}

const brandMap: Record<string, { name: string; stylePrompt: string }> = {
      vemosvamos: {
        name: "Vemos Vamos",
        stylePrompt: `
Design a single-page poster with a clean, scrapbook-inspired look.

Use one central, realistic image that reflects the event theme. Keep the layout simple and minimal, like a student flyer.

Stick to a cream background (#ECEADA) with dark red (#861804) and black accents. Add subtle paper textures, cutout edges, or tape to create a handmade, analog feel.

Avoid multiple layouts, ornate patterns, decorative flourishes, or mockup-style borders. The final image should feel like a real flyer, photographed or scanned.
`,

      },
      devsa: {
        name: "DEVSA",
        stylePrompt: `
Use a modern, tech-inspired photo.

Design should be influenced by command-line terminals and code editor UIs. Incorporate visual elements such as:
- monospaced fonts
- dark backgrounds with neon green (#00FF00), electric blue (#00BFFF)
- brackets, code snippets, or syntax-like separators

Avoid serif fonts, analog textures, or retro imagery. The design should feel sleek, digital, and clearly themed around coding or developer culture.
        `,
      },
      texmex: {
        name: "TexMex Heritage",
        stylePrompt: `
Create a single black-and-white illustration with a gritty, high-contrast look. Inspired by vintage boxing aesthetics, but with no text.

Focus on texture, motion, and visual intensity — no layout or type. Just raw, rugged visual storytelling in bold style.
        `,
      },
    };
async function generatePoster(prompt: string, type: string = "default", size: string = "1024x1024") {
  const brand = brandMap[type] || { name: "Generic Event", stylePrompt: "" };

  const dallePrompt = `
Create a bold, full-frame illustrated image for the brand "${brand.name}".
Theme: ${prompt}

Visual direction:
- Apply the following style: ${brand.stylePrompt}
- Focus on strong composition, texture, and atmosphere.
- Avoid excessive or detailed text; use minimal or no lettering.
- Emphasize visual storytelling over layout or typography.

This should look like a single, standalone poster design — not a framed mockup, not a collage, not a digital ad.
Do not show multiple layouts, frames, rooms, or photo-mockups.
`;

 const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
     throw new Error("Missing API Key")
    }

    // === DALL·E Image Generation ===
    const imageRes = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: dallePrompt,
        n: 1,
        size,
        response_format: "url",
      }),
    });

    const imageData = await imageRes.json();
    if (imageData.error) {
      console.error("OpenAI image error:", imageData.error)
      throw new Error(imageData.error.message)
    }

    const urls = imageData.data?.map((img: { url: string }) => img.url);



    return {
    urls  };

  } 


// async function answerCompanyQuestionStream(messages: ChatMessage[]) {
//   const question = messages[messages.length - 1].content

//   const embeddingRes = await openai.embeddings.create({
//     model: 'text-embedding-ada-002',
//     input: question,
//   })

//   const embedding = embeddingRes.data[0].embedding

//   const { data } = await supabase.rpc('match_documents', {
//     query_embedding: embedding,
//     match_threshold: 0.75,
//     match_count: 5,
//   })

//   const topDoc = data?.[0]
// const contextText = data?.map((doc: any) => doc.content).join('\n\n') || ''


//   const systemPrompt = `You are a helpful assistant answering questions using the provided context only.
// If unsure, say you don't know.
// Context:
// ${contextText}`

//   const stream = await openai.chat.completions.create({
//     model: 'gpt-4',
//     stream: true,
//     messages: [
//       { role: 'system', content: systemPrompt },
//       ...messages.map(toOpenAIMessage),
//     ],
//   })

//   const encoder = new TextEncoder()
//  const readableStream = new ReadableStream({
//   async start(controller) {
//     let fullContent = ''
//     for await (const chunk of stream) {
//       const content = chunk.choices?.[0]?.delta?.content
//       if (content) {
//         fullContent += content
//       }
//     }

//     if (topDoc?.title) {
//       fullContent += ` (Source: ${topDoc.title})`
//     }

//     controller.enqueue(encoder.encode(fullContent))
//     controller.close()
//   }
// })


//   return new Response(readableStream, {
//     headers: {
//       'Content-Type': 'text/plain; charset=utf-8',
//       'Cache-Control': 'no-cache',
//     },
//   })
// }

// async function handleAirtableData(messages: ChatMessage[]) {
//   const airtableData: AirtableRecord[] = await fetchAirtableData()

//   const context = airtableData.map(record => {
//     return `Name: ${record.name}\nInfo: ${record.info}`
//   }).join('\n\n')

//   const systemPrompt = `You are an assistant helping answer questions based on the Airtable data below.
// Use the data to help answer.
// Airtable Records:
// ${context}`

//   const stream = await openai.chat.completions.create({
//     model: 'gpt-4',
//     stream: true,
//     messages: [
//       { role: 'system', content: systemPrompt },
//       ...messages.map(toOpenAIMessage),
//     ],
//   })

//   const encoder = new TextEncoder()
//   const readableStream = new ReadableStream({
//     async start(controller) {
//       for await (const chunk of stream) {
//         const content = chunk.choices?.[0]?.delta?.content
//         if (content) {
//           controller.enqueue(encoder.encode(content))
//         }
//       }
//       controller.close()
//     }
//   })

//   return new Response(readableStream)
// }

// async function handleWebScrape(messages: ChatMessage[]) {
//   const lastMessage = messages[messages.length - 1].content
//   const scraped = await scrapeWebsiteContent(lastMessage)

//   const systemPrompt = `You are a helpful assistant summarizing scraped website content.
// Here is the content you scraped:
// ${scraped}`

//   const stream = await openai.chat.completions.create({
//     model: 'gpt-4',
//     stream: true,
//     messages: [
//       { role: 'system', content: systemPrompt },
//       ...messages.map(toOpenAIMessage),
//     ],
//   })

//   const encoder = new TextEncoder()
//   const readableStream = new ReadableStream({
//     async start(controller) {
//       for await (const chunk of stream) {
//         const content = chunk.choices?.[0]?.delta?.content
//         if (content) {
//           controller.enqueue(encoder.encode(content))
//         }
//       }
//       controller.close()
//     }
//   })

//   return new Response(readableStream)
// }

export async function POST(req: NextRequest) {
  const { messages }: { messages: ChatMessage[] } = await req.json()
  const lastMessage = messages[messages.length - 1]?.content.toLowerCase() || ''

  const posterKeywords = ['poster', 'create a poster', 'generate image', 'image of']
  const scrapeKeywords = ['scrape', 'get info from', 'fetch from']
  const airtableKeywords = ['airtable', 'database', 'crm']

  try {
         if (posterKeywords.some(k => lastMessage.includes(k))) {
      const { urls } = await generatePoster(lastMessage)
      if (!urls || urls.length === 0) {
        return NextResponse.json({ error: "Image generation failed" }, { status: 500 })
      }
      return NextResponse.json({
        imageUrl: urls[0],
      })
    }
    // if (scrapeKeywords.some(k => lastMessage.includes(k))) {
    //   return await handleWebScrape(messages)
    // }

    // if (airtableKeywords.some(k => lastMessage.includes(k))) {
    //   return await handleAirtableData(messages)
    // }

    // return await answerCompanyQuestionStream(messages)
  } catch (err) {
    console.error("Error in POST handler:", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })  }
}
