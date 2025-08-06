// app/api/ingest-google-docs/route.ts
import { google } from 'googleapis'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'
import { readFileSync } from 'fs'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Helper: Parse sections based on capitalized headers and bullet points
const parseSections = (text: string) => {
  const lines = text.split('\n').map(line => line.trim()).filter(Boolean)

  const chunks: { title: string; content: string }[] = []
  let currentTitle = ''
  let currentContent: string[] = []

  for (const line of lines) {
    if (/^[A-Z][A-Za-z\s&-]+$/.test(line)) {
      if (currentTitle && currentContent.length) {
        chunks.push({ title: currentTitle, content: currentContent.join('\n') })
        currentContent = []
      }
      currentTitle = line
    } else {
      currentContent.push(line)
    }
  }

  if (currentTitle && currentContent.length) {
    chunks.push({ title: currentTitle, content: currentContent.join('\n') })
  }

  return chunks
}

export async function GET(req: NextRequest) {
  try {
    const key = JSON.parse(
      readFileSync(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!, 'utf8')
    )

    const auth = new google.auth.GoogleAuth({
      credentials: key,
      scopes: ['https://www.googleapis.com/auth/documents.readonly'],
    })

    const docs = google.docs({ version: 'v1', auth })

    const docIds = process.env.GOOGLE_DOC_IDS!.split(',')

    for (const id of docIds) {
      const doc = await docs.documents.get({ documentId: id.trim() })

      const title = doc.data.title || 'Untitled'

      const body =
        doc.data.body?.content
          ?.map(block =>
            block.paragraph?.elements?.map(el => el.textRun?.content).join('')
          )
          .join('') || ''

      const content = body.replace(/\n+/g, '\n').trim()

      console.log('Ingesting doc:', {
        id,
        title,
        contentLength: content.length,
      })

      const sections = parseSections(content)

      for (let i = 0; i < sections.length; i++) {
        const section = sections[i]
        const fullText = `${section.title}\n${section.content}`

        const embeddingRes = await openai.embeddings.create({
          model: 'text-embedding-ada-002',
          input: fullText,
        })

        const embedding = embeddingRes.data[0].embedding

        const { error } = await supabase.from('documents').upsert({
          id: `${id}_section_${i}`,
          title: section.title,
          content: section.content,
          url: `https://docs.google.com/document/d/${id}`,
          type: 'google-docs',
          embedding,
        })

        if (error) {
          console.error('Supabase upsert error:', error)
        } else {
          console.log(` Section saved: ${section.title}`)
        }
      }
    }

    return new Response('Google Docs ingested successfully')
  } catch (error: any) {
    console.error('Error during ingestion:', error)
    return new Response(`Internal Server Error:\n\n${error.message}`, {
      status: 500,
    })
  }
}
