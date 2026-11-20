import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as budgetService from '../services/budgetService';

export const addBudget = async (req: AuthRequest, res: Response) => {
  const { category_id, amount, month } = req.body;
  if (!category_id || !amount || !month) {
    return res.status(400).json({ message: 'Category, amount, and month are required' });
  }
  try {
    await budgetService.createOrUpdateBudget(req.userId!, category_id, amount, month);
    res.status(201).json({ message: 'Budget saved' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to save budget' });
  }
};

export const getBudgets = async (req: AuthRequest, res: Response) => {
  const month = req.query.month as string | undefined;
  try {
    const budgets = await budgetService.getBudgetsByUser(req.userId!, month);
    res.json(budgets);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch budgets' });
  }
};

export const updateBudget = async (req: AuthRequest, res: Response) => {
  const budgetId = parseInt(req.params.id);
  const { amount } = req.body;
  if (!amount) return res.status(400).json({ message: 'Amount is required' });
  try {
    const success = await budgetService.updateBudget(req.userId!, budgetId, amount);
    if (!success) return res.status(404).json({ message: 'Budget not found' });
    res.json({ message: 'Budget updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Update failed' });
  }
};

export const deleteBudget = async (req: AuthRequest, res: Response) => {
  const budgetId = parseInt(req.params.id);
  try {
    const success = await budgetService.deleteBudget(req.userId!, budgetId);
    if (!success) return res.status(404).json({ message: 'Budget not found' });
    res.json({ message: 'Budget deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Delete failed' });
  }
};