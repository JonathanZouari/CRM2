import { useState, useRef, useEffect } from 'react'
import { apiFetch } from '../api/client'
import Header from '../components/Header'
import type { ApiResponse } from '../types'

interface Message {
  role: 'user' | 'assistant'
  content: string
  sql?: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || loading) return

    const question = input.trim()
    setInput('')
    setMessages((prev) => [...prev, { role: 'user', content: question }])
    setLoading(true)

    try {
      const res = await apiFetch<ApiResponse<{ answer: string; sql?: string }>>('/api/chat/', {
        method: 'POST',
        body: JSON.stringify({ question }),
      })
      if (res.data) {
        setMessages((prev) => [...prev, { role: 'assistant', content: res.data!.answer, sql: res.data!.sql }])
      }
    } catch {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'שגיאה בעיבוד השאלה' }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Header title="צ׳אט AI" subtitle="שאל שאלות על המרפאה בשפה טבעית" />
      <div className="flex-1 flex flex-col p-8">
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 mt-12">
                <span className="material-symbols-outlined text-5xl mb-2 block">smart_toy</span>
                <p>שאל שאלה על המרפאה, למשל:</p>
                <p className="text-sm mt-2">״כמה תורים יש החודש?״</p>
                <p className="text-sm">״מי המטופל עם הכי הרבה ביקורים?״</p>
              </div>
            )}
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[75%] rounded-xl px-4 py-3 text-sm ${
                  msg.role === 'user' ? 'bg-primary text-white' : 'bg-gray-100 text-gray-800'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                  {msg.sql && (
                    <details className="mt-2">
                      <summary className="text-xs opacity-70 cursor-pointer">SQL שאילתה</summary>
                      <pre className="text-xs mt-1 p-2 bg-black/10 rounded overflow-x-auto" dir="ltr">{msg.sql}</pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-end">
                <div className="bg-gray-100 rounded-xl px-4 py-3 text-sm text-gray-500">
                  מעבד...
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={sendMessage} className="border-t p-4 flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="שאל שאלה..."
              disabled={loading}
              className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-primary text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60 flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-lg">send</span>
              שלח
            </button>
          </form>
        </div>
      </div>
    </>
  )
}
