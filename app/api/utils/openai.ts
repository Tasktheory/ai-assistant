//app/api/utils/route.ts

import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function embedText(text: string): Promise<number[]> {
  const embeddingRes = await openai.embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  })
  return embeddingRes.data[0].embedding
}