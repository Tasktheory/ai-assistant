// app/api/generate/route.ts
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

interface Document {
  id: string;
  content: string;
  title: string;
  url: string;
  type: string;
  similarity: number;
}

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

// Helper to extract brand styles from document content given brand name
function extractBrandStyles(docContent: string, brandName: string) {
  const brandRegex = new RegExp(
    `## Brand:\\s*${brandName}[\\s\\S]*?(?=(## Brand:|$))`,
    "i"
  );
  const match = docContent.match(brandRegex);
  if (!match) return null;

  const section = match[0];

  // Extract Overview (optional)
  const overviewMatch = section.match(/Overview:\s*([\s\S]*?)(?=\n[A-Z]|$)/i);
  const overview = overviewMatch ? overviewMatch[1].trim() : "";

  // Extract Colors
  const colorsMatch = section.match(/Colors:\s*(.+)/i);
  const colors = colorsMatch ? colorsMatch[1].trim() : "";

  // Extract Notes (as array)
  const notesMatches = [...section.matchAll(/- (.+)/g)].map((m) => m[1]);

  return {
    overview,
    colors,
    notes: notesMatches,
  };
}

export async function POST(req: NextRequest) {
  try {
    const { prompt, size = "1024x1024" } = await req.json();

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Missing or invalid prompt" }, { status: 400 });
    }

    // 1. Embed prompt and fetch matching docs
    const embedding = await openai.embeddings.create({
      model: "text-embedding-ada-002",
      input: prompt,
    });

    const { data } = await supabase.rpc("match_documents", {
      query_embedding: embedding.data[0].embedding,
      match_threshold: 0.7,
      match_count: 1,
    });

    if (!data || data.length === 0) {
      // No matches: fallback generic style prompt
      const genericPrompt = `
Create a clean, modern poster with neutral colors (gray, white, blue).
Focus on strong composition and visual storytelling.
Avoid brand-specific elements or colors.
Theme or subject: ${prompt}
      `;
      return await generateImage(genericPrompt, size);
    }

    // 2. Extract brand name from prompt (simple heuristic: first word or known brand words)
    // For demo, try extracting a single brand word that matches any brand title in the doc
    const docContent = data[0].content;

    // Find all brand names in the doc to match prompt words
    const brandNames = [...docContent.matchAll(/## Brand:\s*(\w+)/gi)].map(m => m[1].toLowerCase());
    const promptWords = prompt.toLowerCase().split(/\W+/);

    const detectedBrand = brandNames.find(b => promptWords.includes(b));

    // 3. Extract style info if brand found, else fallback
    let stylePrompt: string;
    let brandOverview = "";

    if (detectedBrand) {
      const styles = extractBrandStyles(docContent, detectedBrand);
      brandOverview = styles?.overview || "";
      stylePrompt = `
Use these style details:
- Colors: ${styles?.colors || "N/A"}.
- Notes: ${styles?.notes?.join("; ") || "No specific notes."}.
`;
    } else {
      stylePrompt = `
Create a clean, modern poster with neutral colors (gray, white, blue).
Focus on strong composition and visual storytelling.
Avoid brand-specific elements or colors.
`;
    }

    // 4. Construct final prompt for DALL·E
const dallePrompt = `
Create a bold, full-frame illustrated image.

${brandOverview ? `Brand overview: ${brandOverview}\n` : ""}

Visual style:
${stylePrompt}

Focus on strong composition, texture, and atmosphere.
Avoid excessive or detailed text; use minimal or no lettering.
Emphasize visual storytelling over layout or typography.

Image request details:
${prompt}

This should look like a single, standalone image — not a framed mockup, collage, or digital ad.
`;

    // 5. Generate image
    return await generateImage(dallePrompt, size);

  } catch (err: unknown) {
    console.error("Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Helper function to call DALL·E API and return the image URLs
async function generateImage(prompt: string, size: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
  }

  const imageRes = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt,
      n: 1,
      size,
      response_format: "url",
    }),
  });

  const imageData = await imageRes.json();
  if (imageData.error) {
    console.error("OpenAI image error:", imageData.error);
    return NextResponse.json({ error: imageData.error.message }, { status: 500 });
  }

  const urls = imageData.data?.map((img: { url: string }) => img.url);
  return NextResponse.json({ urls });
}
