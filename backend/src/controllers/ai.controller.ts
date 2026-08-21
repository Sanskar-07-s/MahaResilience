import { Request, Response } from 'express';

export const handleAiAssistant = async (req: Request, res: Response) => {
  try {
    const { question, district = 'Pune', city = 'Pune' } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question prompt is required.' });
    }

    const q = question.toLowerCase();
    let answer = `### 🛡️ MahaResilience AI Assistant for ${city}, ${district}\n\n`;

    if (q.includes('fort') || q.includes('tourist') || q.includes('visit') || q.includes('travel')) {
      answer += `• **Historic Forts & Tourism**: Visit renowned monuments in ${district} District.\n• **Helpline**: 112 / 108\n• **Aaple Sarkar Portal**: https://aaplesarkar.maharashtra.gov.in`;
    } else if (q.includes('hospital') || q.includes('doctor') || q.includes('icu')) {
      answer += `• **${district} Civil Hospital**: Call 020-26120120 / 108\n• **Municipal Health Center (${city})**: Free primary health OPD\n• **Emergency Helpline**: 108`;
    } else if (q.includes('scheme') || q.includes('yojana')) {
      answer += `• **Ladki Bahin Yojana**: ₹1,500/month for women\n• **PM-Kisan**: ₹12,000/year for farmers\n• **Apply Online**: https://aaplesarkar.maharashtra.gov.in`;
    } else {
      answer += `• **National Emergency**: 112\n• **Medical Emergency**: 108\n• **Municipal Helpline**: 1916\n• **Official Services**: https://aaplesarkar.maharashtra.gov.in`;
    }

    return res.json({ answer, location: `${city}, ${district}` });
  } catch (err: any) {
    return res.json({
      answer: `### 🛡️ MahaResilience Civic Assistant\n\n• Emergency Helpline: Dial 112\n• Ambulance Service: Dial 108\n• Aaple Sarkar Portal: https://aaplesarkar.maharashtra.gov.in`,
      location: 'Maharashtra',
    });
  }
};

export const handleDisasterAssistant = async (req: Request, res: Response) => {
  return res.json({
    safetyGuidance: `1. Move to elevated ground immediately.\n2. Store potable drinking water.\n3. Call 112 for emergency rescue response.`,
    emergencyNumbers: ['112', '108', '1916'],
  });
};

export const handleGovernmentAssistant = async (req: Request, res: Response) => {
  const { schemeName = 'Welfare Scheme' } = req.body;
  return res.json({
    schemeInfo: `Information for ${schemeName}. Apply online via Aaple Sarkar portal with Aadhaar card, income certificate, and domicile certificate.`,
    portalUrl: 'https://aaplesarkar.maharashtra.gov.in',
  });
};

export const handleLocalInfoSummarizer = async (req: Request, res: Response) => {
  return res.json({
    summary: 'Weather and disaster bulletin: Moderate to heavy rainfall expected. Citizens are advised to follow official municipal advisories.',
  });
};
