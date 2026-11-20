import { Router } from 'express';
import { addIncome, getIncome, deleteIncome } from '../controllers/incomeController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);
router.post('/', addIncome);
router.get('/', getIncome);
router.delete('/:id', deleteIncome);

export default router;