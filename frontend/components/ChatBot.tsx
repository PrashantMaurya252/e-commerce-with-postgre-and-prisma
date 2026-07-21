"use client"
import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Bot, User, Loader2 } from 'lucide-react'
import { useAppSelector } from '@/redux/hooks'
import { getChatHistoryAPI, sendChatMessageAPI } from '@/utils/api'
import clsx from 'clsx'
import ReactMarkdown from 'react-markdown'
import { RootState } from '@/redux/store'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [chatId, setChatId] = useState<string | undefined>()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const { isAuthenticated } = useAppSelector((state: RootState) => state.auth)

  useEffect(() => {
    if (isOpen && isAuthenticated && messages.length === 0) {
      loadHistory()
    } else if (isOpen && !isAuthenticated && messages.length === 0) {
      setMessages([{ role: 'assistant', content: "Hi there! I'm your DesiMarket AI assistant. How can I help you today?" }])
    }
  }, [isOpen, isAuthenticated])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const loadHistory = async () => {
    setLoading(true)
    const res = await getChatHistoryAPI()
    setLoading(false)

    if (res.success && res.data && res.data.length > 0) {
      const latestChat = res.data[0]
      setChatId(latestChat.id)
      setMessages(latestChat.messages.map((m: any) => ({ role: m.role, content: m.content })))
    } else {
      setMessages([{ role: 'assistant', content: "Hi there! I'm your DesiMarket AI assistant. How can I help you today?" }])
    }
  }

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim() || loading) return

    const userMsg = input.trim()
    setInput('')
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)

    const res = await sendChatMessageAPI(userMsg, chatId)
    if (res.success && res.data) {
      setChatId(res.data.chatId)
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.message }])
    } else {
      setMessages(prev => [...prev, { role: 'assistant', content: "Sorry, I'm having trouble connecting right now." }])
    }

    setLoading(false)
  }

  return (
    <>
      {/* Floating Action Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={clsx(
          "fixed bottom-24 right-6 lg:bottom-8 lg:right-8 z-[100] p-4 rounded-full shadow-2xl transition-all duration-300",
          "bg-primary text-white hover:scale-110 active:scale-95",
          isOpen ? "scale-0 opacity-0 pointer-events-none" : "scale-100 opacity-100"
        )}
      >
        <MessageCircle size={28} />
      </button>

      {/* Chat Window */}
      <div
        className={clsx(
          "fixed z-[100] transition-all duration-300 flex flex-col",
          "bg-[var(--card)] border border-[var(--border)] shadow-2xl overflow-hidden",
          "bottom-0 right-0 w-full h-[80vh] sm:h-[600px] sm:w-[400px] sm:bottom-24 sm:right-6 lg:bottom-8 lg:right-8 sm:rounded-2xl",
          isOpen ? "translate-y-0 opacity-100 pointer-events-auto" : "translate-y-10 opacity-0 pointer-events-none"
        )}
      >
        {/* Header */}
        <div className="bg-primary p-4 flex items-center justify-between text-white shadow-md relative z-10">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm shadow-inner">
              <Bot size={20} />
            </div>
            <div>
              <h3 className="font-bold tracking-tight">DesiMarket Assistant</h3>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <p className="text-[10px] text-white/90 uppercase tracking-wider font-semibold">Online</p>
              </div>
            </div>
          </div>
          <button onClick={() => setIsOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[var(--surface-2)]">
          {!isAuthenticated && messages.length > 0 && (
            <div className="text-center p-3 bg-amber-500/10 border border-amber-500/20 text-amber-600 rounded-xl text-xs font-medium mb-4 shadow-sm mx-4">
              Log in to save your chat history and manage your cart directly from chat!
            </div>
          )}

          {messages.length === 0 && loading && (
            <div className="flex justify-center my-8">
              <Loader2 className="animate-spin text-primary" size={24} />
            </div>
          )}

          {messages.map((msg, idx) => (
            <div key={idx} className={clsx("flex gap-3 max-w-[85%] animate-fade-in", msg.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
              <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center shrink-0 shadow-sm", msg.role === 'user' ? "bg-primary text-white" : "bg-[var(--card)] border border-[var(--border)] text-primary")}>
                {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
              </div>
              <div className={clsx("p-3.5 rounded-2xl text-sm shadow-sm", msg.role === 'user' ? "bg-primary text-white rounded-tr-sm" : "bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-tl-sm")}>
                <div className="prose dark:prose-invert max-w-none text-sm prose-p:leading-snug prose-a:text-blue-500 prose-a:no-underline hover:prose-a:underline">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}
          {loading && messages.length > 0 && (
            <div className="flex gap-3 max-w-[85%] animate-fade-in">
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-[var(--card)] border border-[var(--border)] text-primary shadow-sm">
                <Bot size={14} />
              </div>
              <div className="p-3.5 rounded-2xl bg-[var(--card)] border border-[var(--border)] text-[var(--foreground)] rounded-tl-sm flex items-center gap-2 shadow-sm">
                <Loader2 size={16} className="animate-spin text-primary" />
                <span className="text-xs text-[var(--foreground-muted)] font-medium">Thinking...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} className="h-2" />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-3 bg-[var(--card)] border-t border-[var(--border)] flex gap-2 relative z-10 shadow-[0_-4px_10px_rgba(0,0,0,0.05)] dark:shadow-[0_-4px_10px_rgba(0,0,0,0.2)]">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about products..."
            className="flex-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 text-[var(--foreground)] transition-all"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-primary text-white p-3 rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:hover:scale-100 hover:scale-105 active:scale-95 flex items-center justify-center shadow-md shadow-primary/20"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </>
  )
}

export default ChatBot
