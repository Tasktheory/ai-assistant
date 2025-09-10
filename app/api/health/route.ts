import { NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";
import { Client as NotionClient } from "@notionhq/client";

function has(v?: string) { return !!(v && v.length > 5); }

export async function GET() {
  const out: any = {
    env: {
      OPENAI_API_KEY: has(process.env.OPENAI_API_KEY),
      NEXT_PUBLIC_SUPABASE_URL: has(process.env.NEXT_PUBLIC_SUPABASE_URL),
      NEXT_PUBLIC_SUPABASE_ANON_KEY: has(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      SUPABASE_SERVICE_ROLE_KEY: has(process.env.SUPABASE_SERVICE_ROLE_KEY),
      NOTION_TOKEN: has(process.env.NOTION_TOKEN),
      NOTION_DATABASE_ID: has(process.env.NOTION_DATABASE_ID),
    },
  };

  // OpenAI quick ping (cheap embedding)
  try {
    if (out.env.OPENAI_API_KEY) {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
      await openai.embeddings.create({ model: "text-embedding-3-small", input: "ping" });
      out.openai = "ok";
    }
  } catch (e: any) { out.openai = `error: ${e.message}`; }

  // Supabase quick ping (count on 'documents')
  try {
    if (out.env.NEXT_PUBLIC_SUPABASE_URL && out.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY! // server-only
      );
      const { error } = await supabase.from("documents").select("id", { count: "exact", head: true });
      out.supabase = error ? `error: ${error.message}` : "ok";
    }
  } catch (e: any) { out.supabase = `error: ${e.message}`; }

  // Notion quick ping (optional)
  try {
    if (out.env.NOTION_TOKEN && out.env.NOTION_DATABASE_ID) {
      const notion = new NotionClient({ auth: process.env.NOTION_TOKEN! });
      await notion.databases.retrieve({ database_id: process.env.NOTION_DATABASE_ID! });
      out.notion = "ok";
    }
  } catch (e: any) { out.notion = `error: ${e.message}`; }

  return NextResponse.json(out);
}
