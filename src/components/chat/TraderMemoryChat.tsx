"use client";
// @ts-nocheck

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef } from "react";
import { Send, Bot, User, BrainCircuit } from "lucide-react";
import { auth } from "@/lib/firebase/client";

interface Props {
  traderId: string;
}

export default function TraderMemoryChat({ traderId }: Props) {
  // Use a custom api endpoint and pass headers
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat/trader",
    body: { traderId },
    async onResponse(response: Response) {
      if (!response.ok) {
         try {
             const data = await response.json();
             alert(data.error || "Error al conectar con la IA");
         } catch {
             alert("Error de conexión");
         }
      }
    },
    // Dynamically inject authorization header
    fetch(input: RequestInfo | URL, init?: RequestInit) {
      return new Promise((resolve) => {
        auth.currentUser?.getIdToken().then(token => {
          resolve(fetch(input, {
             ...init,
             headers: {
                 ...init?.headers,
                 "Authorization": `Bearer ${token}`
             },
             // Need to inject userId into body because edge route has no easy auth verify 
             body: JSON.stringify({
                 ...(init?.body ? JSON.parse(init.body as string) : {}),
                 userId: auth.currentUser?.uid
             })
          }));
        });
      });
    }
  } as any) as any;

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-[500px] border border-[var(--border-primary)] rounded-xl bg-[var(--bg-secondary)] overflow-hidden">
      <div className="p-4 bg-[var(--bg-elevated)] border-b border-[var(--border-primary)] flex items-center gap-3">
        <BrainCircuit className="w-5 h-5 text-indigo-400" />
        <div>
          <h3 className="font-semibold text-sm">Interrogar a la IA</h3>
          <p className="text-xs text-[var(--text-tertiary)]">Pregúntale sobre sus últimas decisiones (RAG activado)</p>
        </div>
      </div>
      
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center text-[var(--text-tertiary)] p-6">
            <Bot className="w-10 h-10 mb-3 opacity-20" />
            <p className="text-sm">Pregúntame algo como: <i>"¿Por qué vendiste Ethereum ayer?"</i> o <i>"¿Cuál es tu PnL actual estimado?"</i></p>
          </div>
        ) : (
          messages.map((msg: any) => (
            <div 
              key={msg.id} 
              className={`flex gap-3 max-w-[85%] ${msg.role === 'user' ? 'ml-auto' : 'mr-auto'}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-sky-500/20' : 'bg-indigo-500/20'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4 text-sky-400" /> : <Bot className="w-4 h-4 text-indigo-400" />}
              </div>
              <div 
                className={`p-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-sky-500/10 text-white rounded-tr-none' 
                    : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-primary)] rounded-tl-none'
                }`}
                style={{ whiteSpace: "pre-wrap" }}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex gap-3 max-w-[85%] mr-auto items-center">
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-indigo-500/20">
              <Bot className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="p-3 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-2xl rounded-tl-none flex gap-1">
               <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce"></span>
               <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.2s]"></span>
               <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-bounce [animation-delay:0.4s]"></span>
            </div>
          </div>
        )}
      </div>

      <div className="p-3 bg-[var(--bg-elevated)] border-t border-[var(--border-primary)]">
        <form onSubmit={handleSubmit} className="flex relative">
          <input 
            className="w-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-full pl-4 pr-12 py-2.5 text-sm focus:outline-none focus:border-indigo-500/50 transition-colors"
            value={input}
            onChange={handleInputChange}
            placeholder="Pregúntale a tu Agente..."
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="absolute right-1.5 top-1.5 bottom-1.5 w-8 rounded-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-indigo-500 flex items-center justify-center transition-colors"
          >
            <Send className="w-4 h-4 text-white" />
          </button>
        </form>
      </div>
    </div>
  );
}
