// app/api/utils/openai.ts
import OpenAI from 'openai'

let _openai: OpenAI | null = null

function getOpenAI(): OpenAI {
  if (_openai) return _openai
  const key = process.env.OPENAI_API_KEY
  if (!key) {
    throw new Error('OPENAI_API_KEY not set')
  }
  _openai = new OpenAI({ apiKey: key })
  return _openai
}

export async function embedText(text: string): Promise<number[]> {
  const embeddingRes = await getOpenAI().embeddings.create({
    model: 'text-embedding-ada-002',
    input: text,
  })
  return embeddingRes.data[0].embedding
}

export { getOpenAI }

