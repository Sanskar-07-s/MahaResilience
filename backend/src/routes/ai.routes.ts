import { Router } from 'express';
import {
  handleAiAssistant,
  handleDisasterAssistant,
  handleGovernmentAssistant,
  handleLocalInfoSummarizer,
} from '../controllers/ai.controller';

const router = Router();

router.post('/assistant', handleAiAssistant);
router.post('/disaster', handleDisasterAssistant);
router.post('/government', handleGovernmentAssistant);
router.post('/summarize', handleLocalInfoSummarizer);

export default router;
