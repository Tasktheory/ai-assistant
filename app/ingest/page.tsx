"use client";
import { useState } from "react";

export default function IngestPage() {
  const [title, setTitle] = useState("FAQ");
  const [content, setContent] = useState("");
  const [msg, setMsg] = useState("");

  async function handleIngest(e: React.FormEvent) {
    e.preventDefault();
    setMsg("Ingesting…");
    try {
      const res = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data?.ok) {
        setMsg(`Inserted ${data.inserted} chunks ✅`);
      } else {
        const human =
          data?.error?.message ||
          data?.message ||
          (typeof data === "string" ? data : JSON.stringify(data));
        setMsg(`Error: ${human || "unknown"}`);
      }
    } catch (err: any) {
      setMsg(`Error: ${err?.message || "network"}`);
    }
  }

  return (
    <main style={{ maxWidth: 720, margin: "40px auto", padding: 16 }}>
      <h1>Ingest content</h1>
      <form onSubmit={handleIngest}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          style={{ width: "100%", padding: 8, marginBottom: 8 }}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Paste FAQ / docs here…"
          rows={10}
          style={{ width: "100%", padding: 8 }}
        />
        <button type="submit" style={{ marginTop: 12, padding: "8px 16px" }}>
          Ingest
        </button>
      </form>
      <p style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>{msg}</p>
    </main>
  );
}
