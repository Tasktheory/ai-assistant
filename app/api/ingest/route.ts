import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

function env(n: keyof NodeJS.ProcessEnv) {
  const v = process.env[n];
  if (!v) throw new Error(`Missing env: ${n}`);
  return v;
}

const openai = new OpenAI({ apiKey: env("OPENAI_API_KEY") });
const supabase = createClient(
  env("NEXT_PUBLIC_SUPABASE_URL"),
  env("SUPABASE_SERVICE_ROLE_KEY") // server-only key
);

// split long text into chunks
function chunk(t: string, size = 1000, overlap = 200) {
  const out: string[] = []; let i = 0;
  while (i < t.length) { out.push(t.slice(i, i + size)); i += size - overlap; }
  return out;
}

export async function POST(req: NextRequest) {
  try {
    const { title = "Untitled", content } = await req.json();
    if (!content) {
      return NextResponse.json({ ok: false, error: { where: "route", message: "Missing content" } }, { status: 400 });
    }

    // 1) Create embeddings (1536 dims)
    const parts = chunk(content);
    const emb = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: parts,
    });

    // 2) Insert rows into Supabase
    const rows = parts.map((c, i) => ({
      title,
      content: c,
      embedding: emb.data[i].embedding as unknown as number[], // pgvector accepts number[]
      metadata: { source: "manual" },
    }));

    const { error } = await supabase.from("documents").insert(rows);
    if (error) {
      return NextResponse.json({ ok: false, error: { where: "supabase.insert", message: error.message } }, { status: 500 });
    }

    return NextResponse.json({ ok: true, inserted: rows.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: { where: "route", message: e?.message ?? "unknown" } }, { status: 500 });
  }
}
