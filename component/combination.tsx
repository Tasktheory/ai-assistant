'use client'

import { useState } from 'react'
import PromptingTips from '../component/index'

export default function AiAssistant() {
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

  <div className="min-h-screen flex flex-col bg-gradient-to-br from-pink-300 to-blue-600 text-white relative">
    {/* Watermark */}
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
      <img
        src="/434-logo.avif"
        alt="434 Media Watermark"
        className="w-1/2 max-w-md opacity-10"
      />
    </div>

    {/* Prompting Tips at top */}
    <div className="relative z-10 p-4">
      <PromptingTips />
    </div>

    {/* Chat section fills rest of screen */}
    <div className="relative z-10 flex flex-col flex-grow justify-end px-4 pb-6 space-y-4">
      {/* Messages */}
      

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded ${
              msg.role === 'user' ? 'bg-blue-300 text-right' : 'bg-gray-500 text-left'
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

      {/* Input */}
      <form onSubmit={handleSubmit} className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Type a 434 company question or "image: prompt"'
          className="flex-1 border p-2 rounded text-black"
          disabled={loading}
        />
        <button
          type="submit"
          disabled={loading}
          className="bg-black text-white px-4 py-2 rounded disabled:opacity-50"
        >
          {loading ? '...' : 'Send'}
        </button>
      </form>
    </div>

)
}