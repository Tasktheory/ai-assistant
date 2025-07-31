// app/api/page.tsx
'use client'

import Chat from '../component/Chat'

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-pink-300 to-blue-600 text-white p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold">434 Media Assistant</h1>
        <p className="mt-2 text-white/80 max-w-xl">
          Use this assistant to create branded posters or ask company policy questions.
        </p>
      </div>

      {/* Chatbot */}
      <div className="bg-white/10 p-6 rounded-lg border border-white/20  mx-auto">
        <Chat />
      </div>
    </main>
  )
}
