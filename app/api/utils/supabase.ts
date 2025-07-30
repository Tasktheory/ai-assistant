//app/api/utils/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role for secure writes
)

export async function upsertDocument(doc: {
  id: string
  content: string
  title: string
  url: string
  type: string
  embedding: number[]
}) {
  const { error } = await supabase.from('documents').upsert([doc])
  if (error) throw error
}