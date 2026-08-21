/**
 * aiService.ts — Pure Google Gemini AI Engine for MahaResilience
 *
 * Direct integration with Google Gemini:
 * - 100% reliant on Google Gemini API (no controller or canned replies)
 * - Transmits full User Profile & Real-Time Situational JSON context to Gemini
 * - Multi-turn conversational memory with live token optimization
 * - Model auto-fallback across gemini-1.5-flash, gemini-2.0-flash, and gemini-1.5-pro
 */

/**
 * Retrieve the active Gemini API Key from localStorage or environment
 */
export const getGeminiApiKey = (): string => {
  try {
    const local1 = localStorage.getItem('mr_gemini_api_key');
    if (local1 && local1.trim()) return local1.trim();
    const local2 = localStorage.getItem('gemini_api_key');
    if (local2 && local2.trim()) return local2.trim();
    const local3 = localStorage.getItem('VITE_GEMINI_API_KEY');
    if (local3 && local3.trim()) return local3.trim();
  } catch (_) {}

  const envKey = (import.meta as any).env?.VITE_GEMINI_API_KEY || '';
  if (envKey && envKey.trim().length > 10) return envKey.trim();

  return '';
};

/**
 * Save custom Gemini API Key
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
 * Call Google Gemini REST API directly without any controlled / scripted interception
 */
export const queryGeminiAI = async (
  promptText: string,
  history: Array<{ sender: 'USER' | 'AI'; text: string }> = [],
  systemInstructionText?: string
): Promise<string> => {
  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    throw new Error(
      'MISSING_API_KEY: Please provide your Google Gemini API Key in the settings (⚙️ Key icon) above to activate live Gemini AI answers.'
    );
  }

  const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-pro'];

  // Format contents array including previous history turns
  const contents: any[] = [];

  // Add recent conversation history
  const recentHistory = history.slice(-6);
  for (const h of recentHistory) {
    contents.push({
      role: h.sender === 'USER' ? 'user' : 'model',
      parts: [{ text: h.text }],
    });
  }

  // Add current prompt
  contents.push({
    role: 'user',
    parts: [{ text: promptText }],
  });

  let lastErrorMsg = '';

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const requestBody: any = {
        contents,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      };

      if (systemInstructionText) {
        requestBody.systemInstruction = {
          parts: [{ text: systemInstructionText }],
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
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

        if (res.status === 400 || res.status === 403) {
          if (errMsg.includes('API_KEY_INVALID') || errMsg.includes('key not valid')) {
            throw new Error(`Invalid Gemini API Key: ${errMsg}. Please update your API key in the top settings.`);
          }
        }
      }
    } catch (err: any) {
      if (err.message?.includes('Invalid Gemini API Key') || err.message?.includes('MISSING_API_KEY')) {
        throw err;
      }
      lastErrorMsg = err.message || 'Network error';
    }
  }

  throw new Error(`Google Gemini API call failed: ${lastErrorMsg || 'Please verify your API key and network connection.'}`);
};

/**
 * Main conversational assistant query with deep User JSON Context
 */
export const fetchAIAssistantResponse = async (
  question: string,
  userSituationalContext: Record<string, any>,
  history: Array<{ sender: 'USER' | 'AI'; text: string }> = []
): Promise<string> => {
  const systemInstruction = `You are the official MahaResilience AI Assistant powered directly by Google Gemini for Maharashtra, India.
You assist citizens, farmers, travelers, and district administrators.

You are provided with the live JSON context of the user, their real-time location, active local alerts, and profile attributes.
Always utilize this JSON data to deliver hyper-relevant, contextual, and grounded answers.

Format your responses with clean, readable Markdown (bullet points, bold highlights, section headers).
If the user asks about emergency situations, provide immediate life-saving steps and official helplines (112, 108, 1916).
If the user asks about welfare schemes, provide exact criteria and steps for Maharashtra portals.
Support queries in English, Marathi (मराठी), and Hindi.`;

  // Attach User JSON Situational Payload
  const contextualPrompt = `[REAL-TIME USER & SITUATION JSON CONTEXT]:
\`\`\`json
${JSON.stringify(userSituationalContext, null, 2)}
\`\`\`

[USER MESSAGE]:
${question}`;

  return await queryGeminiAI(contextualPrompt, history, systemInstruction);
};

/**
 * Agronomist AI Query for crop diseases
 */
export const fetchAIAgronomistAdvisory = async (
  crop: string,
  problem: string,
  district: string = 'Maharashtra'
): Promise<string> => {
  const prompt = `You are an expert Senior Agricultural Scientist & Agronomist for Maharashtra.
Farmer Location: ${district}, Maharashtra.
Crop: ${crop}
Reported Issue: ${problem}

Provide an authentic agronomic recommendation:
1. **Pest / Pathogen Identification**
2. **Chemical Control**: CIBRC-approved active ingredient, brand reference, formulation, and precise dosage per Litre and per Acre.
3. **Organic / Biological Alternative**: Neem oil or bio-agent dosage.
4. **Agronomic Best Practices**: Preventive irrigation, soil and canopy care.

Format with clean Markdown.`;

  return await queryGeminiAI(prompt);
};

export const queryAgriculturePesticideAI = fetchAIAgronomistAdvisory;
