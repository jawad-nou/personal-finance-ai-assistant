import { Router } from 'express';
import { 
  addExpense, 
  getExpenses, 
  updateExpense, 
  deleteExpense, 
  getExpenseSummary, 
  getDashboardStats, 
  getRecentTransactions 
} from '../controllers/expenseController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// IMPORTANT: Specific routes MUST come before /:id
router.get('/summary', getExpenseSummary);
router.get('/dashboard', getDashboardStats);
router.get('/recent', getRecentTransactions);
router.get('/', getExpenses);
router.post('/', addExpense);
router.put('/:id', updateExpense);
router.delete('/:id', deleteExpense);

export default router;