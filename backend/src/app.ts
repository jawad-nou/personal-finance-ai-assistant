import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth';
import categoryRoutes from './routes/categories';
import budgetRoutes from './routes/budgets';
import expenseRoutes from './routes/expenses';
import incomeRoutes from './routes/income';
import savingsRoutes from './routes/savings';
import financeAssistantRoutes from './routes/financeAssistant';
import { errorHandler } from './middleware/errorHandler';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/budgets', budgetRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/savings', savingsRoutes);
app.use('/api/assistant', financeAssistantRoutes);

app.use(errorHandler);

export default app;
