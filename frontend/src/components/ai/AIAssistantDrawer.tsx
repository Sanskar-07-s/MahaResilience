import React, { useState, useEffect, useRef } from 'react';
import {
  Bot, X, Send, MapPin, Sparkles, AlertTriangle, ShieldCheck,
  RefreshCw, Mic, MicOff, Volume2, VolumeX, Copy, Check, Key, Settings, User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext.tsx';
import { useLocation } from '../../contexts/LocationContext.tsx';
import { useDisasterAlerts } from '../../contexts/AlertContext.tsx';
import {
  fetchAIAssistantResponse,
  getGeminiApiKey,
  setGeminiApiKey
} from '../../services/aiService.ts';

interface AIAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ChatMessage {
  id: string;
  sender: 'USER' | 'AI';
  text: string;
  timestamp: string;
  isError?: boolean;
}

export const AIAssistantDrawer: React.FC<AIAssistantDrawerProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const locationCtx = useLocation();
  const { localAlerts } = useDisasterAlerts();

  const district = locationCtx.district || user?.district || 'Pune';
  const ward = locationCtx.ward || '';
  const city = locationCtx.city || locationCtx.district || 'Pune';

  const [apiKey, setApiKey] = useState<string>(() => getGeminiApiKey());
  const [showKeyConfig, setShowKeyConfig] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [keySavedMsg, setKeySavedMsg] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm-1',
      sender: 'AI',
      text: `Namaskar ${user?.name ? `**${user.name}**` : ''}! I am your **Google Gemini AI Assistant** connected to Maharashtra's state data network for **${ward || city}, ${district}**.\n\nAsk me anything in English, Marathi, or Hindi about **Welfare Schemes (Ladki Bahin, DBT)**, **Emergency Rescue & Hospitals**, **Tourist Forts**, or **APMC Mandi Rates**!`,
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

  // Sync API key state
  useEffect(() => {
    const k = getGeminiApiKey();
    setApiKey(k);
    if (!k) {
      setShowKeyConfig(true);
    }
  }, [isOpen]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechClass) {
      const recognition = new SpeechClass();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
        }
        setIsListening(false);
      };

      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);

      recognitionRef.current = recognition;
    }
  }, []);

  if (!isOpen) return null;

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (keyInput.trim()) {
      setGeminiApiKey(keyInput.trim());
      setApiKey(keyInput.trim());
      setKeySavedMsg(true);
      setShowKeyConfig(false);
      setTimeout(() => setKeySavedMsg(false), 3000);
    }
  };

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
    `📜 Mukhyamantri Majhi Ladki Bahin Yojana eligibility?`,
    '🏥 24x7 emergency civil hospitals with ICU in my area?',
    '🌾 Best pesticide & spray dosage for Soybean stem borer?',
    '🌊 Flood safety precautions and NDRF helpline numbers',
    '💧 How to book a municipal drinking water tanker?',
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

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    if (!promptText) setInput('');
    setLoading(true);

    // Build complete User Situational JSON Context for Gemini
    const userSituationalContext = {
      user_profile: {
        name: user?.name || 'Citizen',
        email: user?.email || 'Not provided',
        role: user?.role || 'CITIZEN',
        admin_field: user?.adminField || 'NONE',
        district: user?.district || district,
        taluka: user?.taluka || 'Not specified',
        village: user?.village || 'Not specified',
        state: user?.state || 'Maharashtra',
        language_preference: user?.language || 'en',
        is_verified: user?.isEmailVerified || user?.isPhoneVerified || false,
      },
      live_location_telemetry: {
        district: district,
        city: city,
        ward: ward,
        coordinates: {
          latitude: locationCtx.latitude || null,
          longitude: locationCtx.longitude || null,
        },
        source: locationCtx.source || 'MANUAL',
      },
      active_local_alerts: (localAlerts || []).map((a: any) => ({
        title: a.title,
        severity: a.severity,
        category: a.category,
        district: a.district,
        instructions: a.instructions,
      })),
      timestamp: new Date().toISOString(),
    };

    try {
      const answer = await fetchAIAssistantResponse(
        textToSend,
        userSituationalContext,
        messages
      );

      const aiMsg: ChatMessage = {
        id: 'ai-' + Date.now(),
        sender: 'AI',
        text: answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errMsg = err.message || 'Gemini API call failed';
      const isMissingKey = errMsg.includes('MISSING_API_KEY') || errMsg.includes('Invalid Gemini API Key');

      if (isMissingKey) {
        setShowKeyConfig(true);
      }

      const aiMsg: ChatMessage = {
        id: 'ai-' + Date.now(),
        sender: 'AI',
        text: `⚠️ **Gemini AI Connection**\n\n${errMsg}\n\n*Click the ⚙️ Key icon in the top header to enter and save your Google Gemini API key.*`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end font-sans">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs animate-fadeIn"
        onClick={onClose}
      />

      {/* Slide-out Drawer */}
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col z-10 border-l border-slate-200">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-600/40 border border-teal-400/30 flex items-center justify-center text-teal-300 shadow-inner">
              <Bot className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm flex items-center gap-1.5">
                MahaResilience Gemini AI <Sparkles className="w-4 h-4 text-yellow-300" />
              </h3>
              <div className="text-[10px] text-teal-200 flex items-center gap-1 font-medium mt-0.5">
                <MapPin className="w-3 h-3 text-yellow-400" /> {ward || city || 'Maharashtra'}, {district}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className={`p-2 rounded-xl transition-all ${
                apiKey
                  ? 'bg-teal-700/50 hover:bg-teal-600 text-teal-200'
                  : 'bg-amber-500 text-slate-950 font-bold animate-pulse'
              }`}
              title="Configure Google Gemini API Key"
            >
              <Key className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* API Key Config Box */}
        {showKeyConfig && (
          <div className="p-4 bg-slate-900 text-white border-b border-slate-800 text-xs space-y-3 shrink-0 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="font-bold flex items-center gap-1.5 text-amber-400">
                <Key className="w-4 h-4" /> Google Gemini API Key Settings
              </span>
              <button
                onClick={() => setShowKeyConfig(false)}
                className="text-slate-400 hover:text-white text-[11px]"
              >
                ✕
              </button>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Connect your Google Gemini API key to receive 100% dynamic, live AI reasoning with full user and local situational context.
            </p>
            <form onSubmit={handleSaveApiKey} className="space-y-2">
              <input
                type="password"
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
                placeholder="AIzaSy... (Paste Gemini Key)"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-400 font-mono"
              />
              <div className="flex justify-between items-center pt-1">
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-teal-400 hover:underline text-[10px]"
                >
                  Get free key from Google AI Studio →
                </a>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-lg text-xs"
                >
                  Save API Key
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Toast confirmation */}
        {keySavedMsg && (
          <div className="bg-emerald-600 text-white px-3 py-1.5 text-center text-xs font-bold shrink-0">
            ✓ Gemini API Key saved successfully! Live AI reasoning active.
          </div>
        )}

        {/* Chat Messages Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.map((m) => {
            const isUser = m.sender === 'USER';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} space-y-1`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs shadow-xs leading-relaxed ${
                    isUser
                      ? 'bg-teal-700 text-white rounded-br-none'
                      : m.isError
                      ? 'bg-red-50 text-red-900 border border-red-200 rounded-bl-none'
                      : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-none'
                  }`}
                >
                  <div className="whitespace-pre-line prose-xs select-text font-sans">
                    {m.text}
                  </div>
                </div>

                <div className="flex items-center gap-2 px-1 text-[10px] text-slate-400 font-mono">
                  <span>{m.timestamp}</span>
                  {!isUser && !m.isError && (
                    <>
                      <button
                        onClick={() => speakText(m.id, m.text)}
                        className="hover:text-teal-600 transition-colors"
                        title={speakingMsgId === m.id ? 'Stop reading' : 'Read aloud'}
                      >
                        {speakingMsgId === m.id ? (
                          <VolumeX className="w-3.5 h-3.5 text-teal-600" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        onClick={() => copyText(m.id, m.text)}
                        className="hover:text-teal-600 transition-colors"
                        title="Copy answer"
                      >
                        {copiedMsgId === m.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 bg-white p-3 rounded-2xl border border-slate-200 w-fit">
              <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
              <span>Gemini AI is analyzing user context & reasoning...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggested Queries */}
        <div className="p-2.5 bg-white border-t border-slate-100 flex gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              disabled={loading}
              className="px-2.5 py-1 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-slate-600 border border-slate-200 rounded-full text-[10px] font-semibold whitespace-nowrap shrink-0 transition-all"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Message Input Box */}
        <div className="p-3 bg-white border-t border-slate-200 shrink-0">
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
              className={`p-2.5 rounded-xl transition-all ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
              title={isListening ? 'Stop listening' : 'Voice Input (Marathi/Hindi/English)'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything (forts, schemes, health, crops)..."
              disabled={loading}
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-teal-600"
            />

            <button
              type="submit"
              disabled={!input.trim() || loading}
              className={`p-2.5 rounded-xl transition-all ${
                input.trim() && !loading
                  ? 'bg-teal-700 hover:bg-teal-600 text-white shadow-md'
                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantDrawer;
