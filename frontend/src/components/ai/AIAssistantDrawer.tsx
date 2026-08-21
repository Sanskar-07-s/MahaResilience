import React, { useState, useEffect, useRef } from 'react';
import {
  Bot, X, Send, MapPin, Sparkles, AlertTriangle, ShieldCheck,
  RefreshCw, Mic, MicOff, Volume2, VolumeX, Copy, Check, Share2
} from 'lucide-react';
import { useLocation } from '../../contexts/LocationContext.tsx';
import { fetchAIAssistantResponse } from '../../services/aiService.ts';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  timestamp: string;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({ isOpen, onClose }) => {
  const { ward, city, district } = useLocation();
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'AI',
      text: `Namaskar! I am your refined **MahaResilience AI Assistant** for **${ward || city || 'Maharashtra'}, ${district}**. \n\nAsk me anything about **Government Schemes**, **Emergency Rescue**, **Tourist Forts**, **Nearest Hospitals**, or **APMC Mandi Rates**!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechClass) {
      const recognition = new SpeechClass();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN'; // Supports Marathi/Hindi mixed queries

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  if (!isOpen) return null;

  const toggleMic = () => {
    if (!recognitionRef.current) {
      alert('Voice dictation is not supported in this browser. Please type your query.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        setIsListening(false);
      }
    }
  };

  const speakText = (msgId: string, text: string) => {
    if (!('speechSynthesis' in window)) return;

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    // Clean markdown symbols for natural speech synthesis
    const cleanText = text.replace(/[*#_`\[\]()]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    setSpeakingMsgId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  const copyText = (msgId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(msgId);
    setTimeout(() => setCopiedMsgId(null), 2500);
  };

  const quickPrompts = [
    `🏰 Top historic forts & tourist places near ${district}?`,
    `📜 Which government schemes am I eligible for?`,
    '🏥 Nearest government hospitals & ICU beds?',
    '🌊 Emergency flood & disaster guidelines',
    '🌾 APMC Mandi rates & crop protection',
    '💧 How to book a municipal water tanker?',
  ];

  const handleSend = async (promptText?: string) => {
    const textToSend = promptText || input;
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: 'u-' + Date.now(),
      sender: 'USER',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!promptText) setInput('');
    setLoading(true);

    try {
      const answer = await fetchAIAssistantResponse(
        textToSend,
        district || 'Pune',
        ward || city || 'Pune'
      );

      const aiMsg: ChatMessage = {
        id: 'ai-' + Date.now(),
        sender: 'AI',
        text: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      const aiMsg: ChatMessage = {
        id: 'ai-' + Date.now(),
        sender: 'AI',
        text: `### 🛡️ Grounded Emergency Helpline (${ward || city}, ${district})\n\n• **National Emergency Helpline**: Dial **112**\n• **Ambulance**: Dial **108**\n• **Municipal Water/Waste**: Dial **1916**\n• **Aaple Sarkar Portal**: [https://aaplesarkar.maharashtra.gov.in](https://aaplesarkar.maharashtra.gov.in)`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
        onClick={onClose}
      ></div>

      {/* Slide-out Drawer */}
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col z-10 border-l border-slate-200">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600/40 border border-teal-400/30 flex items-center justify-center text-teal-300 shadow-inner">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                MahaResilience AI Assistant <Sparkles className="w-4 h-4 text-yellow-300" />
              </h3>
              <div className="text-[10px] text-teal-200 flex items-center gap-1 font-medium mt-0.5">
                <MapPin className="w-3 h-3 text-yellow-400" /> Location: {ward || city || 'Maharashtra'}, {district}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Topics Pills */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 flex gap-2 overflow-x-auto text-[11px] no-scrollbar">
          {quickPrompts.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(q)}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-700 font-bold hover:border-teal-600 hover:text-teal-800 hover:bg-teal-50/50 shrink-0 shadow-2xs transition-all"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 text-xs">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${m.sender === 'USER' ? 'items-end' : 'items-start'}`}
            >
              <div
                className={`max-w-[90%] p-4 rounded-2xl shadow-xs whitespace-pre-wrap leading-relaxed ${
                  m.sender === 'USER'
                    ? 'bg-teal-700 text-white font-semibold rounded-tr-none'
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none font-normal'
                }`}
              >
                {m.text}

                {/* AI Card Action Tools: Read Aloud & Copy */}
                {m.sender === 'AI' && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                    <span className="font-bold text-teal-700 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-teal-600" /> Grounded Advisor
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => speakText(m.id, m.text)}
                        className={`p-1 rounded hover:bg-slate-100 transition-colors flex items-center gap-1 ${
                          speakingMsgId === m.id ? 'text-teal-600 font-bold' : 'text-slate-500'
                        }`}
                        title="Read Aloud"
                      >
                        {speakingMsgId === m.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        <span>{speakingMsgId === m.id ? 'Stop' : 'Listen'}</span>
                      </button>
                      <button
                        onClick={() => copyText(m.id, m.text)}
                        className="p-1 rounded hover:bg-slate-100 transition-colors flex items-center gap-1 text-slate-500"
                        title="Copy Response"
                      >
                        {copiedMsgId === m.id ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedMsgId === m.id ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[9px] text-slate-400 mt-1 px-1">{m.timestamp}</span>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 p-3 bg-white border border-slate-200 rounded-2xl max-w-[70%] text-slate-600">
              <RefreshCw className="w-4 h-4 animate-spin text-teal-600" />
              <span className="text-xs font-semibold">Consulting MahaResilience Advisor...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <button
              type="button"
              onClick={toggleMic}
              className={`p-2.5 rounded-xl transition-all border ${
                isListening
                  ? 'bg-red-500 text-white border-red-600 animate-pulse'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
              title={isListening ? 'Listening...' : 'Voice Dictation'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? 'Listening to your voice...' : 'Ask about schemes, hospitals, forts, or SOS...'}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:bg-white"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="bg-teal-700 hover:bg-teal-800 text-white p-2.5 rounded-xl shadow-xs hover-scale disabled:opacity-40"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
