import { genkit } from 'genkit';
import { googleAI, gemini15Flash } from '@genkit-ai/googleai';
import { enableFirebaseTelemetry } from '@genkit-ai/firebase';

// Enable Genkit observability & telemetry safely (only inside Google Cloud / Firebase Functions)
if (process.env.GCLOUD_PROJECT || process.env.GCP_PROJECT) {
  enableFirebaseTelemetry().catch((err) => {
    console.warn('[Genkit] Telemetry fallback on external server:', err?.message || err);
  });
}

// Configure Genkit instance with Google AI Gemini model
export const ai = genkit({
  plugins: [googleAI({ apiKey: process.env.GOOGLE_GENAI_API_KEY })],
  model: gemini15Flash,
});

/**
 * 1. AI Community Assistant Flow
 */
export const aiCommunityAssistantFlow = ai.defineFlow(
  'aiCommunityAssistantFlow',
  async (input: { question: string; district?: string; city?: string }) => {
    const district = input.district || 'Pune';
    const city = input.city || district;

    const prompt = `You are the official MahaResilience AI Community Assistant for ${city}, ${district} District, Maharashtra.
You assist citizens with verified government services, emergency contacts, healthcare facilities, and disaster management.
IMPORTANT SAFETY RULE: You MUST NOT invent or hallucinate government numbers, addresses, or scheme guidelines. If verified details are unknown, direct citizens to the Collectorate Helpline: 1800-120-8040 or Emergency: 112.

User Question: "${input.question}"
Active Location: ${city}, ${district}, Maharashtra.

Provide a concise, helpful, grounded response in clear Markdown format.`;

    const { text } = await ai.generate(prompt);
    return { answer: text, location: `${city}, ${district}` };
  }
);

/**
 * 2. Disaster Safety Assistant Flow
 */
export const disasterAssistantFlow = ai.defineFlow(
  'disasterAssistantFlow',
  async (input: { situation: string; district?: string; city?: string }) => {
    const district = input.district || 'Pune';
    const city = input.city || district;

    const prompt = `You are the MahaResilience Emergency & Disaster Assistant for ${city}, ${district}.
Provide immediate emergency safety guidance for citizens during floods, heatwaves, cyclones, or heavy monsoon rain.

User Emergency Query: "${input.situation}"
Active Location: ${city}, ${district}.

Rules:
1. Prioritize life safety first (elevated ground, emergency battery power, drinking water).
2. Direct citizens to local emergency numbers (Police/Disaster: 112, Ambulance: 108, Municipal Control: 1916).
3. Be reassuring, actionable, and structured with bullet points.`;

    const { text } = await ai.generate(prompt);
    return { safetyGuidance: text, emergencyNumbers: ['112', '108', '1916'] };
  }
);

/**
 * 3. Government Services & Scheme Assistant Flow
 */
export const governmentServiceAssistantFlow = ai.defineFlow(
  'governmentServiceAssistantFlow',
  async (input: { schemeName: string; district?: string }) => {
    const district = input.district || 'Pune';

    const prompt = `Explain the Maharashtra Government scheme/service: "${input.schemeName}" for a citizen residing in ${district}.
List required documents (e.g. Income Proof, Domicile, Aadhaar, 7/12 land extract), eligibility criteria, and application portal (e.g. Aaple Sarkar / MahaDBT).
Do not invent requirements. Keep explanation simple and structured.`;

    const { text } = await ai.generate(prompt);
    return { schemeInfo: text, portalUrl: 'https://aaplesarkar.maharashtra.gov.in' };
  }
);

/**
 * 4. Local Info & Disaster Bulletin Summarizer Flow
 */
export const localInfoSummarizerFlow = ai.defineFlow(
  'localInfoSummarizerFlow',
  async (input: { rawBulletin: string; district?: string }) => {
    const prompt = `Summarize this technical weather/disaster bulletin into simple citizen language (max 3 sentences) with clear action items:
"${input.rawBulletin}"`;

    const { text } = await ai.generate(prompt);
    return { summary: text };
  }
);
