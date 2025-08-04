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

export async function GET(req: NextRequest) {
  try {
    // Read and parse Google service account key JSON
    const key = JSON.parse(
      readFileSync(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!, 'utf8')
    )

    const auth = new google.auth.GoogleAuth({
  credentials: key,
  scopes: ['https://www.googleapis.com/auth/documents.readonly'],
})


const docs = google.docs({ version: 'v1', auth }) // Pass auth directly

    // Get comma-separated Google Doc IDs from env
    const docIds = process.env.GOOGLE_DOC_IDS!.split(',')

    for (const id of docIds) {
      const doc = await docs.documents.get({ documentId: id.trim() })

      const title = doc.data.title || 'Untitled'

      // Extract text content safely
      const body =
        doc.data.body?.content
          ?.map((block) =>
            block.paragraph?.elements
              ?.map((el) => el.textRun?.content)
              .join('')
          )
          .join('') || ''

      const content = body.replace(/\n+/g, ' ').trim()

      // Log extracted data info
      console.log('Ingesting doc:', {
        id,
        title,
        contentLength: content.length,
      })

      // Create OpenAI embedding
      const embeddingRes = await openai.embeddings.create({
        model: 'text-embedding-ada-002',
        input: content,
      })

      const embedding = embeddingRes.data[0].embedding

      // Log embedding snippet for sanity check
      console.log('Embedding snippet:', embedding.slice(0, 5))

      // Upsert into Supabase
      const { error } = await supabase.from('documents').upsert({
        id,
        title,
        content,
        url: `https://docs.google.com/document/d/${id}`,
        type: 'google-docs',
        embedding,
      })

      if (error) {
        console.error('Supabase upsert error:', error)
      }
    }

    return new Response(' Google Docs ingested successfully!')
  } catch (error: any) {
    console.error(' Error during ingestion:', error)
    return new Response(`Internal Server Error:\n\n${error.message}`, {
      status: 500,
    })
  }
}
