import Chat from '../component/Chat'

export default function Home() {
  return (
    <main className="relative min-h-screen p-8 bg-white overflow-hidden">
      {/* Watermark */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
        <img
          src="/434-logo.avif"
          alt="434 Media Watermark"
          className="w-1/2 max-w-md opacity-10"
        />
      </div>

      {/* Foreground Content */}
      <div className="relative z-10">
        <h1 className="text-4xl font-bold mb-6 text-center">
          Company Knowledge Assistant
        </h1>
        <Chat />
      </div>
    </main>
  )
}


