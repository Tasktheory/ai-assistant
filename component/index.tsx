//ai-assistant\component\index.tsx

import { useState } from 'react'

export default function PromptingTips() {
  const [open, setOpen] = useState<string | null>(null)

  const toggle = (section: string) => {
    setOpen(open === section ? null : section)
  }

  return (
    <aside className="bg-white/10 border border-white/30 rounded p-4">
      <h3 className="text-lg font-semibold text-white mb-3">Prompting Tips</h3>

      {/* Section: Company Questions */}
      <div className="mb-4">
        <button
          onClick={() => toggle('company')}
          className="text-white font-semibold w-full text-left"
        >
          ▸ Asking About 434 Media
        </button>
        {open === 'company' && (
          <ul className="list-disc list-inside text-sm text-white/80 mt-2 space-y-1">
            <li>Ask: “What is 434 Media?” or “Who founded 434 Media?”</li>
            <li>Try: “What are the company values of 434 Media?”</li>
            <li>Avoid: vague queries like “tell me something” — be specific.</li>
          </ul>
        )}
      </div>

      {/* Section: General Image Generation */}
      <div className="mb-4">
        <button
          onClick={() => toggle('image')}
          className="text-white font-semibold w-full text-left"
        >
          ▸ General Image Creation
        </button>
        {open === 'image' && (
          <ul className="list-disc list-inside text-sm text-white/80 mt-2 space-y-1">
            <li>Start with <code>image:</code> followed by your scene</li>
            <li>Be descriptive: e.g. “image: TexMex boxing event called "Fight to the finish" on 
              June 28th at 8:00pm”</li>
            <li>Focus on subject and mood, not layout or fonts</li>
          </ul>
        )}
      </div>

      {/* Section: Poster Types */}
      <div className="mb-2">
        <button
          onClick={() => toggle('poster')}
          className="text-white font-semibold w-full text-left"
        >
          ▸ Poster Styles (DEVSA, TexMex, Vemos Vamos)
        </button>
        {open === 'poster' && (
          <div className="mt-2 space-y-3 text-sm text-white/80">
            <div>
              <strong className="text-white">DEVSA</strong>
              <ul className="list-disc list-inside">
                <li>Describe the tech event: “AI meetup”, “student hackathon”</li>
          <li>Use terms like: <i>terminal, code, laptop crowd</i></li>
          <li><b>Don’t add:</b> font, bracket, or UI layout notes</li>
              </ul>
            </div>
            <div>
              <strong className="text-white">TexMex Heritage</strong>
              <ul className="list-disc list-inside">
                <li>Focus on action scenes: “boxer mid-swing”, “cultural parade”</li>
                <li>Use vivid texture words: <i>gritty, rugged, vibrant</i></li>
              </ul>
            </div>
            <div>
              <strong className="text-white">Vemos Vamos</strong>
              <ul className="list-disc list-inside">
              <li>Use scrapbook-friendly ideas: “print fair”, “collage club”</li>
          <li>Include words like: <i>paper cutouts, candid photo</i></li>
          <li><b>Avoid:</b> layout or font instructions</li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
