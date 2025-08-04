'use client'

import { useState } from 'react'

export default function UnifiedAiChatbox() {
  const [messages, setMessages] = useState<{ role: string; content: string; type?: 'chat' | 'image' }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim()) return

    const isImagePrompt = input.toLowerCase().startsWith('image:')
    const content = input.replace(/^image:/i, '').trim()
   const userMessage: { role: string; content: string; type: 'chat' | 'image' } = {
  role: 'user',
  content,
  type: isImagePrompt ? 'image' : 'chat',
}


    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      if (isImagePrompt) {
        const res = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: content, type: 'default', size: '1024x1024' }),
        })

        const data = await res.json()
        const imageUrl = data?.urls?.[0]

        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: imageUrl, type: 'image' },
        ])
      } else {
        const response = await fetch('/api/chat', {
          method: 'POST',
          body: JSON.stringify({ messages: [...messages, userMessage] }),
        })

        if (!response.body) throw new Error('No response body')

        const reader = response.body.getReader()
        const decoder = new TextDecoder()
        let assistantMessage = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          assistantMessage += decoder.decode(value)
          setMessages((prev) => {
            const last = prev[prev.length - 1]
            if (last?.role === 'assistant' && last.type === 'chat') {
              return [...prev.slice(0, -1), { role: 'assistant', content: assistantMessage, type: 'chat' }]
            } else {
              return [...prev, { role: 'assistant', content: assistantMessage, type: 'chat' }]
            }
          })
        }
      }
    } catch (error) {
      console.error('Error during message send:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!loading) sendMessage()
  }

  return (
   <div className="min-h-screen bg-gradient-to-br from-pink-300 to-blue-600 text-white">
 <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <img
          src="/434-logo.avif"
          alt="434 Media Watermark"
          className="w-1/2 max-w-md opacity-10"
        />
      </div>

     {/* Prompting Tips */}
        <aside className="w-full md:w-80 shrink-0 mt-13">
  <div className="bg-white/10 border border-white/30 rounded p-4">
    <h3 className="text-lg font-semibold mb-3">Prompting Tips</h3>
    <div className="text-sm space-y-4">

      <div>
        <h4 className="font-bold text-white">General</h4>
        <ul className="list-disc list-inside space-y-1 text-white/80">
          <li>Describe the <b>event or scene</b>, not layout</li>
          <li>Focus on the <b>vibe, subject, or action</b></li>
          <li><b>Don't</b> say “poster” it knows it's a poster</li>
        </ul>
      </div>

      <div>
        <h4 className="font-bold text-white">Vemos Vamos</h4>
        <ul className="list-disc list-inside space-y-1 text-blue-150">
          <li>Use scrapbook-friendly ideas: “print fair”, “collage club”</li>
          <li>Include words like: <i>paper cutouts, candid photo</i></li>
          <li><b>Avoid:</b> layout or font instructions</li>
        </ul>
      </div>

      <div>
        <h4 className="font-bold text-white">DEVSA</h4>
        <ul className="list-disc list-inside space-y-1 text-blue-150">
          <li>Describe the tech event: “AI meetup”, “student hackathon”</li>
          <li>Use terms like: <i>terminal, code, laptop crowd</i></li>
          <li><b>Don’t add:</b> font, bracket, or UI layout notes</li>
        </ul>
      </div>

      <div>
        <h4 className="font-bold text-white">TexMex Heritage</h4>
        <ul className="list-disc list-inside space-y-1 text-blue-150">
          <li>Focus on visual intensity: “boxer mid-swing”, “sparring”</li>
          <li>Lean into texture/motion: <i>gritty, rugged</i></li>
          <li><b>Avoid:</b> typefaces, frames, or poster structure</li>
        </ul>
      </div>
    </div>
  </div>
</aside>

    {/* Chat & Image Assistant UI */}
    <div className="space-y-6">
      {/* Message display area */}
      <div className="border rounded p-4 max-h-[500px] overflow-y-auto bg-gray-50 space-y-2">
        {messages.length === 0 && (
          <p className="text-gray-500">Ask anything, or try "image: a sunset over mountains"</p>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded ${
              msg.role === 'user' ? 'bg-blue-200 text-right' : 'bg-gray-200 text-left'
            }`}
          >
            {msg.type === 'image' && msg.role === 'assistant' ? (
              <img src={msg.content} alt="Generated" className="rounded max-w-xs" />
            ) : (
              msg.content
            )}
          </div>
        ))}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Type a message or "image: your prompt..."'
          className="flex-1 border p-2 rounded"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? '...' : 'Send'}
        </button>
      </form>
    </div>
  </div>
)
}