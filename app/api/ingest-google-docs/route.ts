//app/api/chat/ingest-google-docs
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

export async function GET() {
  const key = JSON.parse(readFileSync(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!, 'utf8'))

  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/documents.readonly'],
  })

  // ✅ Use auth object directly here
  const docs = google.docs({ version: 'v1', auth })

  const docIds = process.env.GOOGLE_DOC_IDS!.split(',')

  for (const id of docIds) {
    const doc = await docs.documents.get({ documentId: id })

    const title = doc.data.title || 'Untitled'

    const body = doc.data.body?.content
      ?.map(block =>
        block.paragraph?.elements
          ?.map(el => el.textRun?.content)
          .join('')
      )
      .join('') || ''

    const content = body.replace(/\n+/g, ' ').trim()

    const embedding = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: content,
    })

    await supabase.from('documents').upsert({
      id,
      title,
      content,
      url: `https://docs.google.com/document/d/${id}`,
      type: 'google-docs',
      embedding: embedding.data[0].embedding,
    })
  }

  return new Response('Google Docs ingested successfully!')
}
