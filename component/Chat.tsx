'use client'

import { useState } from 'react'

export default function Chat() {
  // Chat messages state
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([])
  // User input state
  const [input, setInput] = useState('')
  // Loading state for async calls
  const [loading, setLoading] = useState(false)
  // Track last poster info for edits
  const [lastPoster, setLastPoster] = useState<{ prompt: string; imageUrl: string } | null>(null)

  const sendMessage = async () => {
    if (!input.trim()) return

    const userMessage = { role: 'user', content: input }
    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)

    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      // Send messages + lastPoster for context
      body: JSON.stringify({ messages: [...messages, userMessage], lastPoster }),
    })

    const contentType = response.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const json = await response.json()

      if (json.imageUrl) {
        // Received an image (new or edited poster)
        setMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            content: `<img src="${json.imageUrl}" alt="Generated Poster" class="max-w-full rounded-lg mt-2" />`,
          },
        ])

        // Logic to decide if this is an edit or new poster
        // Assume backend sets a boolean `json.isEdit` to indicate edit
        if (json.isEdit) {
          // Update lastPoster with new prompt + edited image URL
          setLastPoster({ prompt: userMessage.content, imageUrl: json.imageUrl })
        } else {
          // New poster generated - store prompt and URL
          setLastPoster({ prompt: userMessage.content, imageUrl: json.imageUrl })
        }
      } else if (json.error) {
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: `❌ Error: ${json.error}` },
        ])
      }

      setLoading(false)
      return
    }

    if (!response.body) {
      console.error('No response body')
      setLoading(false)
      return
    }

    // Handle streaming text response (e.g., company questions)
    const reader = response.body.getReader()
    const decoder = new TextDecoder()
    let partialContent = ''

    const appendMessage = (content: string) => {
      setMessages((prev) => {
        const last = prev[prev.length - 1]
        if (last?.role === 'assistant') {
          return [...prev.slice(0, -1), { role: 'assistant', content }]
        } else {
          return [...prev, { role: 'assistant', content }]
        }
      })
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      partialContent += chunk
      appendMessage(partialContent)
    }

    setLoading(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!loading) sendMessage()
  }

  // Turn URLs into clickable links in messages
  function linkify(text: string): string {
    const urlRegex = /(https?:\/\/[^\s]+)/g
    return text.replace(urlRegex, (url) => {
      return `<a href="${url}" class="text-blue-500 underline" target="_blank" rel="noopener noreferrer">${url}</a>`
    })
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-4 space-y-4">
      <div className="space-y-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-3 rounded ${
              msg.role === 'user'
                ? 'bg-blue-100 text-right text-gray-900'
                : 'bg-white text-left text-gray-800 shadow-sm rounded-2xl'
            }`}
          >
            {/* Render images as HTML; text messages linkified */}
            {msg.role === 'assistant' && msg.content.includes('<img') ? (
              <span dangerouslySetInnerHTML={{ __html: msg.content }}></span>
            ) : (
              <span dangerouslySetInnerHTML={{ __html: linkify(msg.content) }}></span>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          className="flex-1 border p-2 rounded"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a 434 question or generate a poster..."
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
