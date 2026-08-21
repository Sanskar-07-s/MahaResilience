/**
 * aiService.ts — Google Gemini AI Engine for MahaResilience
 *
 * Provides real-time, dynamic Google Gemini AI generation:
 * - Reads API key from environment or localStorage ('mr_gemini_api_key' / 'gemini_api_key')
 * - Direct REST API integration with fallback model support (gemini-1.5-flash -> gemini-2.0-flash -> gemini-1.5-pro)
 * - Multi-turn conversational context support
 * - Dynamic pest & crop agronomy solutions
 */

import { getApiUrl } from '../config/api.config.ts';

/**
 * Get currently active Gemini API Key
 */
export const getGeminiApiKey = (): string => {
  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  if (envKey && envKey.trim().length > 10) return envKey.trim();

  try {
    const local1 = localStorage.getItem('mr_gemini_api_key');
    if (local1 && local1.trim()) return local1.trim();
    const local2 = localStorage.getItem('gemini_api_key');
    if (local2 && local2.trim()) return local2.trim();
    const local3 = localStorage.getItem('VITE_GEMINI_API_KEY');
    if (local3 && local3.trim()) return local3.trim();
  } catch (_) {}

  return '';
};

/**
 * Save custom Gemini API Key to local storage
 */
export const setGeminiApiKey = (key: string): void => {
  try {
    if (key.trim()) {
      localStorage.setItem('mr_gemini_api_key', key.trim());
      localStorage.setItem('gemini_api_key', key.trim());
    } else {
      localStorage.removeItem('mr_gemini_api_key');
      localStorage.removeItem('gemini_api_key');
    }
  } catch (_) {}
};

/**
 * Call Google Gemini REST API with model fallback
 */
export const queryGeminiAI = async (
  promptText: string,
  history: Array<{ sender: 'USER' | 'AI'; text: string }> = []
): Promise<string> => {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error(
      'MISSING_API_KEY: Please provide your Google Gemini API Key in the chat settings above to activate live AI answers.'
    );
  }

  const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-pro'];

  // Format contents array including previous history
  const contents: any[] = [];

  // Add previous conversational turns (up to last 6)
  const recentHistory = history.slice(-6);
  for (const h of recentHistory) {
    contents.push({
      role: h.sender === 'USER' ? 'user' : 'model',
      parts: [{ text: h.text }],
    });
  }

  // Add the current prompt
  contents.push({
    role: 'user',
    parts: [{ text: promptText }],
  });

  let lastErrorMsg = '';

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1500,
          },
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (generatedText && generatedText.trim().length > 0) {
          return generatedText.trim();
        }
      } else {
        const errJson = await res.json().catch(() => null);
        const errMsg = errJson?.error?.message || `HTTP ${res.status} ${res.statusText}`;
        lastErrorMsg = errMsg;
        console.warn(`[Gemini AI] Model ${model} returned error:`, errMsg);
        // If API key is invalid, fail early
        if (res.status === 400 || res.status === 403) {
          if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('key not valid')) {
            throw new Error(`Invalid Gemini API Key: ${errMsg}. Please update your API key in the top settings.`);
          }
        }
      }
    } catch (err: any) {
      if (err.message?.includes('Invalid Gemini API Key')) {
        throw err;
      }
      lastErrorMsg = err.message || 'Network error';
    }
  }

  // Try backend proxy if direct fetch failed
  try {
    const backendRes = await fetch(getApiUrl('/api/ai/assistant'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: promptText, apiKey }),
    });
    if (backendRes.ok) {
      const data = await backendRes.json();
      if (data.answer) return data.answer;
    }
  } catch (_) {}

  throw new Error(`Google Gemini API call failed: ${lastErrorMsg || 'Please verify your internet connection and API key.'}`);
};

/**
 * Main conversational assistant query
 */
export const fetchAIAssistantResponse = async (
  question: string,
  district: string = 'Pune',
  city: string = 'Pune',
  history: Array<{ sender: 'USER' | 'AI'; text: string }> = []
): Promise<string> => {
  const systemContext = `You are the official MahaResilience AI Assistant serving citizens, travelers, and farmers across Maharashtra, India.
Current User Location: ${city}, ${district} District, Maharashtra.

Instructions:
1. Provide accurate, helpful, non-robotic, natural answers with rich Markdown formatting (bullet points, bold text, headers).
2. For government schemes (e.g. Majhi Ladki Bahin, PM-Kisan, Namo Shetkari, Sanjay Gandhi Niradhar), provide genuine eligibility and documentation steps.
3. For emergency or safety queries, mention official helplines (112 for All Emergencies, 108 for Ambulance, 1916 for Civic Water/Waste).
4. For agriculture/farming, give scientific dosage & CIBRC approved recommendations.
5. For tourism/forts in Maharashtra, give authentic travel tips and historical context.`;

  const fullPrompt = `${systemContext}\n\nUser Question: ${question}`;

  return await queryGeminiAI(fullPrompt, history);
};

/**
 * Agronomist AI Query for crop diseases
 */
export const fetchAIAgronomistAdvisory = async (
  crop: string,
  problem: string,
  district: string = 'Maharashtra'
): Promise<string> => {
  const prompt = `You are an expert Senior Agricultural Scientist & Agronomist for the Government of Maharashtra and Dr. Balasaheb Sawant Konkan Krishi Vidyapeeth / MPKV Rahuri.
Farmer Location: ${district}, Maharashtra.
Crop: ${crop}
Reported Disease / Pest Issue: ${problem}

Provide an authentic, highly practical agronomy recommendation in clear bullet points:
1. **Pest / Pathogen Identification**: What causes this problem on ${crop}.
2. **Immediate Chemical Control**: Exact CIBRC-registered active ingredient name, brand reference, formulation percentage (e.g. EC/SC/WP), and precise dosage per Litre of water and per Acre.
3. **Biological / Organic Alternative**: Bio-pesticides or Neem extract dosage.
4. **Agronomic Best Practices**: Preventive irrigation, canopy management, and soil health measures.

Format with clean Markdown.`;

  return await queryGeminiAI(prompt);
};

export const queryAgriculturePesticideAI = fetchAIAgronomistAdvisory;
