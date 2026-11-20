import { Router } from 'express';
import { addSavingsGoal, getSavingsGoals, updateSavingsGoal, deleteSavingsGoal } from '../controllers/savingsController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.post('/', addSavingsGoal);
router.get('/', getSavingsGoals);
router.put('/:id', updateSavingsGoal);
router.delete('/:id', deleteSavingsGoal);

export default router;