import { Request, Response } from 'express';
import {
  aiCommunityAssistantFlow,
  disasterAssistantFlow,
  governmentServiceAssistantFlow,
  localInfoSummarizerFlow,
} from '../config/genkit';

export const handleAiAssistant = async (req: Request, res: Response) => {
  try {
    const { question, district, city } = req.body;
    if (!question) {
      return res.status(400).json({ error: 'Question prompt is required.' });
    }
    const result = await aiCommunityAssistantFlow({ question, district, city });
    return res.json(result);
  } catch (err: any) {
    console.error('[AI Controller] handleAiAssistant error:', err);
    return res.status(500).json({ error: 'AI Assistant temporarily unavailable.' });
  }
};

export const handleDisasterAssistant = async (req: Request, res: Response) => {
  try {
    const { situation, district, city } = req.body;
    if (!situation) {
      return res.status(400).json({ error: 'Situation description is required.' });
    }
    const result = await disasterAssistantFlow({ situation, district, city });
    return res.json(result);
  } catch (err: any) {
    console.error('[AI Controller] handleDisasterAssistant error:', err);
    return res.status(500).json({ error: 'Disaster Assistant temporarily unavailable.' });
  }
};

export const handleGovernmentAssistant = async (req: Request, res: Response) => {
  try {
    const { schemeName, district } = req.body;
    if (!schemeName) {
      return res.status(400).json({ error: 'Scheme name is required.' });
    }
    const result = await governmentServiceAssistantFlow({ schemeName, district });
    return res.json(result);
  } catch (err: any) {
    console.error('[AI Controller] handleGovernmentAssistant error:', err);
    return res.status(500).json({ error: 'Government Assistant temporarily unavailable.' });
  }
};

export const handleLocalInfoSummarizer = async (req: Request, res: Response) => {
  try {
    const { rawBulletin, district } = req.body;
    if (!rawBulletin) {
      return res.status(400).json({ error: 'Raw bulletin text is required.' });
    }
    const result = await localInfoSummarizerFlow({ rawBulletin, district });
    return res.json(result);
  } catch (err: any) {
    console.error('[AI Controller] handleLocalInfoSummarizer error:', err);
    return res.status(500).json({ error: 'Summarizer temporarily unavailable.' });
  }
};
