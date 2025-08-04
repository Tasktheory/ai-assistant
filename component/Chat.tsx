//component\Chat.tsx
'use client'

import { useState } from 'react'

export default function Chat() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    const response = await fetch('/api/chat', {
      method: 'POST',
      body: JSON.stringify({ messages: [...messages, userMessage] }),
    })

    if (!response.body) {
      console.error('No response body')
      setLoading(false)
      return
    }

    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let assistantMessage = ''

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      assistantMessage += decoder.decode(value)
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (last?.role === 'assistant') {
          return [...prev.slice(0, -1), { role: 'assistant', content: assistantMessage }]
        } else {
          return [...prev, { role: 'assistant', content: assistantMessage }]
        }
      })
    }

    setLoading(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!loading) sendMessage()
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-4">
      <div className="space-y-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded ${
              msg.role === 'user' ? 'bg-blue-100 text-right' : 'bg-gray-100'
            }`}
          >
            <span>{msg.content}</span>
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="flex-1 border p-2 rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a 434 question..."
        />
        <button
          type="submit"
          className="bg-black text-white font-bold px-4 py-2 rounded disabled:opacity-50"
          disabled={loading}
        >
          {loading ? '...' : 'ASK'}
        </button>
      </form>
    </div>
  )
}
