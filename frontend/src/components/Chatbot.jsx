import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

/* ── Simple Markdown renderer for chat messages ── */
function ChatMarkdown({ text }) {
  if (!text) return null;

  const renderLine = (line, idx) => {
    // Horizontal rule
    if (/^---+$/.test(line.trim())) {
      return <hr key={idx} className="my-2 border-slate-200/60" />;
    }

    // Bullet points
    if (/^[•\-\*]\s/.test(line.trim())) {
      const content = line.trim().replace(/^[•\-\*]\s*/, '');
      return (
        <div key={idx} className="flex gap-1.5 ml-1 my-0.5">
          <span className="text-brand-400 mt-0.5 flex-shrink-0">•</span>
          <span>{renderInline(content)}</span>
        </div>
      );
    }

    // Indented sub-items (↳ or spaces)
    if (/^\s{2,}↳/.test(line)) {
      const content = line.trim().replace(/^↳\s*/, '');
      return (
        <div key={idx} className="ml-4 text-slate-500 text-[11px] my-0.5">
          ↳ {renderInline(content)}
        </div>
      );
    }

    // Empty line = spacing
    if (line.trim() === '') {
      return <div key={idx} className="h-1.5" />;
    }

    // Normal line
    return <div key={idx} className="my-0.5">{renderInline(line)}</div>;
  };

  const renderInline = (text) => {
    // Split by bold markers (**text**) and italic (_text_)
    const parts = [];
    let remaining = text;
    let key = 0;

    while (remaining.length > 0) {
      // Bold: **text**
      const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
      // Italic: _text_
      const italicMatch = remaining.match(/_([^_]+?)_/);

      let firstMatch = null;
      let firstIdx = Infinity;

      if (boldMatch && remaining.indexOf(boldMatch[0]) < firstIdx) {
        firstMatch = { type: 'bold', match: boldMatch, idx: remaining.indexOf(boldMatch[0]) };
        firstIdx = firstMatch.idx;
      }
      if (italicMatch && remaining.indexOf(italicMatch[0]) < firstIdx) {
        firstMatch = { type: 'italic', match: italicMatch, idx: remaining.indexOf(italicMatch[0]) };
        firstIdx = firstMatch.idx;
      }

      if (!firstMatch) {
        parts.push(<span key={key++}>{remaining}</span>);
        break;
      }

      // Text before the match
      if (firstMatch.idx > 0) {
        parts.push(<span key={key++}>{remaining.substring(0, firstMatch.idx)}</span>);
      }

      if (firstMatch.type === 'bold') {
        parts.push(<strong key={key++} className="font-bold text-slate-800">{firstMatch.match[1]}</strong>);
      } else {
        parts.push(<em key={key++} className="italic text-slate-500">{firstMatch.match[1]}</em>);
      }

      remaining = remaining.substring(firstMatch.idx + firstMatch.match[0].length);
    }

    return parts;
  };

  const lines = text.split('\n');
  return <div className="space-y-0">{lines.map((line, i) => renderLine(line, i))}</div>;
}

export default function Chatbot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Hi! 👋 I'm BioTwin's AI Health Assistant.\n\nI can **predict diseases** from your symptoms & vitals, answer health questions, and give tips!\n\n💬 Try: \"I have chest pain, BP 140/90, age 55\"", suggestions: ['Predict my disease risk', 'What diseases can you detect?', 'Health tip', 'Tell me about heart disease'] },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = async (text) => {
    if (!text.trim()) return;
    const userMsg = text.trim();
    setMessages((m) => [...m, { role: 'user', text: userMsg }]);
    setInput('');
    setLoading(true);
    try {
      const res = await api.post('/chatbot/', { message: userMsg });
      const data = res.data.data;
      setMessages((m) => [...m, {
        role: 'bot',
        text: data.reply,
        suggestions: data.suggestions || [],
      }]);
    } catch {
      setMessages((m) => [...m, { role: 'bot', text: 'Sorry, something went wrong. Please try again.', suggestions: [] }]);
    }
    setLoading(false);
  };

  // Get suggestions from the last bot message
  const lastBotMsg = [...messages].reverse().find((m) => m.role === 'bot');
  const suggestions = lastBotMsg?.suggestions || [];

  return (
    <>
      {/* Floating button */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-br from-brand-500 to-purple-600 text-white rounded-2xl shadow-float flex items-center justify-center text-2xl z-50 hover:shadow-glow-brand transition-shadow"
      >
        {open ? '✕' : '💬'}
      </motion.button>

      {/* Chat window */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 right-6 w-80 sm:w-96 bg-white/90 backdrop-blur-2xl rounded-3xl shadow-float border border-white/60 flex flex-col z-50 overflow-hidden"
            style={{ height: '520px' }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-500 to-purple-600 text-white p-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center text-lg">🤖</div>
                <div>
                  <h3 className="font-bold text-sm">BioTwin Health Assistant</h3>
                  <p className="text-[10px] text-white/60 font-medium">AI-powered disease prediction & health info</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-2.5 text-[12.5px] leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white rounded-2xl rounded-br-md shadow-sm'
                        : 'bg-slate-50 text-slate-700 rounded-2xl rounded-bl-md border border-slate-100'
                    }`}
                  >
                    {m.role === 'bot' ? <ChatMarkdown text={m.text} /> : m.text}
                  </div>
                </motion.div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-slate-50 px-4 py-2.5 rounded-2xl rounded-bl-md text-sm text-slate-400 border border-slate-100">
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </span>
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>

            {/* Dynamic Suggestions */}
            {suggestions.length > 0 && !loading && (
              <div className="px-3 pb-2 flex flex-wrap gap-1.5">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="text-[10.5px] font-semibold bg-brand-50 text-brand-600 px-2.5 py-1.5 rounded-full hover:bg-brand-100 transition border border-brand-100 leading-tight"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={(e) => { e.preventDefault(); send(input); }}
              className="flex items-center gap-2 p-3 border-t border-slate-100 bg-white/60"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Symptoms, vitals, or health question…"
                className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400/40 focus:border-brand-400 transition"
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="w-9 h-9 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 text-white flex items-center justify-center text-sm shadow-sm hover:shadow-md disabled:opacity-40 transition-all"
              >
                ↑
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
