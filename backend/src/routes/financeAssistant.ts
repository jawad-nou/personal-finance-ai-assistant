import { Router } from 'express';
import { approveAssistantBudget, sendAssistantMessage } from '../controllers/financeAssistantController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.post('/message', sendAssistantMessage);
router.post('/approve-budget', approveAssistantBudget);

export default router;
