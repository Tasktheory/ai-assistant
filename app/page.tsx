//import Chat from '../component/Chat'
import AiAssistant from '../component/combination'


export default function Home() {
  return (
    <main className="relative min-h-screen p-8 bg-gradient-to-br from-pink-300 to-blue-600 overflow-hidden">
       <div className="relative z-10">
       <h1 className="text-4xl font-bold mb-6 text-center">
          Ask434
        </h1>
        <AiAssistant />
      </div>
    </main>
  )
}


