// src/components/chat/ChatWidget.jsx
import { useState, useRef, useEffect } from 'react';
import { useUIStore } from '@/lib/store';
import { chatApi } from '@/lib/api';
import { MessageCircle, X, Send, Bot, Loader2 } from 'lucide-react';

const QUICK_REPLIES = [
  'Office space in Sandton',
  'Warehouse in Cape Town',
  'How do lease terms work?',
  'Feature my listing',
];

const SYSTEM_MSG = {
  role: 'assistant',
  content: "Hi there! 👋 I'm PropFlow's AI Property Advisor.\n\nI can help you find the perfect commercial space, understand lease terms, or connect you with an agent.\n\nWhat are you looking for today?",
};

export default function ChatWidget() {
  const { chatOpen, toggleChat, closeChat } = useUIStore();
  const [messages, setMessages] = useState([SYSTEM_MSG]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [quickVisible, setQuickVisible] = useState(true);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (chatOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatOpen, messages]);

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;

    setInput('');
    setQuickVisible(false);
    setLoading(true);

    const userMsg = { role: 'user', content: userText };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    try {
      // Exclude the initial assistant greeting from API call (it's UI-only)
      const apiMessages = newMessages.filter((m, i) => !(i === 0 && m.role === 'assistant'));
      const { data } = await chatApi.send(apiMessages);
      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'I\'m having trouble connecting right now. Please try again or call us directly at **+27 87 234 8000**.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const formatMsg = (text) =>
    text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');

  return (
    <>
      {/* FAB */}
      <button
        onClick={toggleChat}
        className="fixed bottom-6 right-6 z-50 w-13 h-13 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/40 flex items-center justify-center transition-all hover:scale-105 active:scale-95"
        style={{ width: 52, height: 52 }}
      >
        {chatOpen
          ? <X className="w-5 h-5" />
          : <>
              <MessageCircle className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center font-700">1</span>
            </>
        }
      </button>

      {/* Chat Window */}
      <div className={`
        fixed bottom-20 right-6 z-50 w-80 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden
        transition-all duration-300 origin-bottom-right
        ${chatOpen ? 'opacity-100 scale-100 pointer-events-auto' : 'opacity-0 scale-90 pointer-events-none'}
      `} style={{ height: 480 }}>
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-800 to-blue-600 px-4 py-3 flex items-center gap-3 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-700 text-white">PropFlow AI Advisor</div>
            <div className="text-xs text-blue-200 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Online · Powered by Claude AI
            </div>
          </div>
          <button onClick={closeChat} className="text-white/60 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-2 msg-animate ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              {msg.role === 'assistant' && (
                <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Bot className="w-3 h-3 text-white" />
                </div>
              )}
              <div className={`max-w-[80%] px-3 py-2 rounded-xl text-sm leading-relaxed
                ${msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-sm'
                  : 'bg-gray-100 text-gray-800 rounded-bl-sm'}`}
                dangerouslySetInnerHTML={{ __html: formatMsg(msg.content) }}
              />
            </div>
          ))}
          {loading && (
            <div className="flex gap-2 msg-animate">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <div className="bg-gray-100 rounded-xl rounded-bl-sm px-3 py-3 flex gap-1.5 items-center">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay:`${i*0.12}s` }} />
                ))}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick replies */}
        {quickVisible && messages.length <= 2 && (
          <div className="px-3 pb-2 flex flex-wrap gap-1.5">
            {QUICK_REPLIES.map(qr => (
              <button key={qr} onClick={() => sendMessage(qr)}
                className="text-xs bg-blue-50 text-blue-700 border border-blue-200 rounded-full px-3 py-1 hover:bg-blue-100 transition-colors font-500">
                {qr}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="px-3 pb-3 pt-2 border-t border-gray-100 flex gap-2 flex-shrink-0">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Ask about properties…"
            rows={1}
            className="flex-1 resize-none text-sm bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 outline-none focus:border-blue-400 placeholder-gray-300 leading-5 max-h-24"
            style={{ height: 'auto' }}
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
            className="w-9 h-9 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl flex items-center justify-center flex-shrink-0 self-end transition-colors"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </>
  );
}
