import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as expenseService from '../services/expenseService';

export const addExpense = async (req: AuthRequest, res: Response) => {
  const { category_id, amount, description, expense_date, payment_method } = req.body;
  if (!category_id || !amount || !expense_date) {
    return res.status(400).json({ message: 'Category, amount, and date are required' });
  }
  try {
    const id = await expenseService.createExpense(
      req.userId!, category_id, amount, description || '', expense_date, payment_method
    );
    res.status(201).json({ id, message: 'Expense added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add expense' });
  }
};

export const getExpenses = async (req: AuthRequest, res: Response) => {
  const { category_id, start_date, end_date, limit, search } = req.query;
  try {
    const expenses = await expenseService.getExpensesByUser(req.userId!, {
      categoryId: category_id ? parseInt(category_id as string) : undefined,
      startDate: start_date as string,
      endDate: end_date as string,
      limit: limit ? parseInt(limit as string) : undefined,
      search: search as string,
    });
    res.json(expenses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch expenses' });
  }
};

export const updateExpense = async (req: AuthRequest, res: Response) => {
  const expenseId = parseInt(req.params.id);
  try {
    const success = await expenseService.updateExpense(req.userId!, expenseId, req.body);
    if (!success) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Update failed' });
  }
};

export const deleteExpense = async (req: AuthRequest, res: Response) => {
  const expenseId = parseInt(req.params.id);
  try {
    const success = await expenseService.deleteExpense(req.userId!, expenseId);
    if (!success) return res.status(404).json({ message: 'Expense not found' });
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Delete failed' });
  }
};

export const getExpenseSummary = async (req: AuthRequest, res: Response) => {
  const { month } = req.query;
  if (!month) return res.status(400).json({ message: 'Month (YYYY-MM) is required' });
  try {
    const summary = await expenseService.getExpenseSummary(req.userId!, month as string);
    res.json(summary);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Summary failed' });
  }
};

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
  try {
    const stats = await expenseService.getDashboardStats(req.userId!, month);
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch dashboard stats' });
  }
};

export const getRecentTransactions = async (req: AuthRequest, res: Response) => {
  const limit = parseInt((req.query.limit as string) || '5');
  try {
    const transactions = await expenseService.getRecentTransactions(req.userId!, limit);
    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch transactions' });
  }
};