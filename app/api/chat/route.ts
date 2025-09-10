import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { question } = await req.json();
    if (!question) return NextResponse.json({ error: "Missing question" }, { status: 400 });

    // 1) Embed the question
    const q = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: question
    });
    const vector = q.data[0].embedding;

    // 2) Retrieve top-k from Supabase
    const { data: matches, error } = await supabase.rpc("match_documents", {
      query_embedding: vector,
      match_count: 5
    });
    if (error) throw error;

    const context = (matches ?? []).map((m: any) => m.content).join("\n---\n");

    // 3) Ask the chat model
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "Answer concisely using only the provided context. If missing, say you don't know." },
        { role: "user", content: `Question: ${question}\n\nContext:\n${context}` }
      ]
    });

    const answer = completion.choices[0]?.message?.content ?? "No answer.";
    return NextResponse.json({
      answer,
      sources: (matches ?? []).map((m: any) => ({ id: m.id, title: m.title, similarity: m.similarity }))
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "chat failed" }, { status: 500 });
  }
}
