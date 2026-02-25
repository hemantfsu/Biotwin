import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

/* Simple Markdown renderer for bot messages */
function ChatMarkdown({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5 text-[13px] leading-relaxed">
      {lines.map((line, i) => {
        // Horizontal rule
        if (/^---+$/.test(line.trim())) return <hr key={i} className="border-dark-500/40 my-2" />;
        // Bullet
        if (/^[\-\*]\s/.test(line.trim())) {
          const content = line.replace(/^[\-\*]\s/, '');
          return <p key={i} className="pl-3 before:content-['•'] before:mr-2 before:text-accent-cyan/60">{formatInline(content)}</p>;
        }
        // Bold line (heading-like)
        if (/^\*\*.*\*\*$/.test(line.trim())) {
          return <p key={i} className="font-bold text-white">{line.replace(/\*\*/g, '')}</p>;
        }
        if (line.trim() === '') return <br key={i} />;
        return <p key={i} className="text-slate-300">{formatInline(line)}</p>;
      })}
    </div>
  );
}

function formatInline(text) {
  // Bold
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) => {
    if (/^\*\*.*\*\*$/.test(p)) return <strong key={i} className="text-white font-semibold">{p.replace(/\*\*/g, '')}</strong>;
    // Italic
    const sub = p.split(/(\*[^*]+\*)/g); // eslint-disable-line no-useless-escape
    return sub.map((s, j) => {
      if (/^\*.*\*$/.test(s)) return <em key={`${i}-${j}`} className="text-accent-cyan/80">{s.replace(/\*/g, '')}</em>; // eslint-disable-line no-useless-escape
      return <span key={`${i}-${j}`}>{s}</span>;
    });
  });
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: 'Hello! I\'m your BioTwin AI health assistant. Ask me about symptoms, health metrics, or disease prevention.' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text) => {
    if (!text.trim()) return;
    const userMsg = { role: 'user', text: text.trim() };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post('/chatbot/', { message: text.trim() });
      setMessages((m) => [...m, { role: 'bot', text: res.data.response || res.data.reply || 'No response' }]);
    } catch {
      setMessages((m) => [...m, { role: 'bot', text: 'Sorry, something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    send(input);
  };

  // Dynamic suggestions from last bot message
  const lastBot = [...messages].reverse().find((m) => m.role === 'bot');
  const suggestions = [];
  if (lastBot) {
    if (lastBot.text.toLowerCase().includes('symptom')) suggestions.push('What could cause chest pain?');
    if (lastBot.text.toLowerCase().includes('heart') || lastBot.text.toLowerCase().includes('cardio')) suggestions.push('How to improve heart health?');
    if (lastBot.text.toLowerCase().includes('diet') || lastBot.text.toLowerCase().includes('nutrition')) suggestions.push('Best foods for heart health?');
    if (suggestions.length === 0) {
      suggestions.push('Check my symptoms', 'Disease prevention tips', 'Explain lab results');
    }
  }

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-gradient-to-br from-accent-cyan to-emerald-500 text-dark-900 shadow-lg shadow-accent-cyan/30 flex items-center justify-center text-2xl hover:scale-105 active:scale-95 transition-transform"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {open ? '✕' : '💬'}
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-24 right-6 z-50 w-[340px] sm:w-[400px] max-h-[520px] flex flex-col rounded-2xl bg-dark-800 border border-dark-600/60 shadow-2xl shadow-dark-900/50 overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-dark-750 border-b border-dark-600/40">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-cyan to-emerald-500 flex items-center justify-center text-lg">🧬</div>
                <div>
                  <h3 className="font-bold text-white text-sm">BioTwin AI Assistant</h3>
                  <p className="text-[10px] text-accent-cyan/60 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
                    Online · Disease Prediction Engine
                  </p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0" style={{ maxHeight: 340 }}>
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl ${
                    m.role === 'user'
                      ? 'bg-accent-cyan/15 text-slate-200 rounded-br-md'
                      : 'bg-dark-700/60 text-slate-300 rounded-bl-md border border-dark-600/30'
                  }`}>
                    {m.role === 'bot' ? <ChatMarkdown text={m.text} /> : <p className="text-[13px]">{m.text}</p>}
                  </div>
                </motion.div>
              ))}

              {loading && (
                <div className="flex justify-start">
                  <div className="bg-dark-700/60 rounded-2xl rounded-bl-md px-4 py-3 border border-dark-600/30">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 rounded-full bg-accent-cyan/40 animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 rounded-full bg-accent-cyan/40 animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 rounded-full bg-accent-cyan/40 animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions */}
            <div className="px-4 py-2 flex flex-wrap gap-1.5 border-t border-dark-600/30">
              {suggestions.slice(0, 3).map((s) => (
                <button key={s} onClick={() => send(s)}
                  className="text-[10px] font-medium px-2.5 py-1 rounded-lg bg-dark-700/50 border border-dark-600/40 text-slate-400 hover:text-accent-cyan hover:border-accent-cyan/20 transition-all">
                  {s}
                </button>
              ))}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="px-4 py-3 border-t border-dark-600/40 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask about your health…"
                className="flex-1 bg-dark-700/50 border border-dark-600/40 rounded-xl px-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-accent-cyan/40 focus:ring-1 focus:ring-accent-cyan/20 transition-all"
              />
              <button type="submit" disabled={loading || !input.trim()}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent-cyan to-emerald-500 text-dark-900 flex items-center justify-center text-sm font-bold disabled:opacity-40 transition-opacity hover:opacity-90">
                ↑
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
