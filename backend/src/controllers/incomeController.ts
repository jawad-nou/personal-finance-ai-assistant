import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as incomeService from '../services/incomeService';

export const addIncome = async (req: AuthRequest, res: Response) => {
  const { category_id, amount, description, income_date, source, frequency } = req.body;
  if (!category_id || !amount || !income_date) {
    return res.status(400).json({ message: 'Category, amount, and date are required' });
  }
  try {
    const id = await incomeService.createIncome(req.userId!, category_id, amount, description || '', income_date, source, frequency);
    res.status(201).json({ id, message: 'Income added' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to add income' });
  }
};

export const getIncome = async (req: AuthRequest, res: Response) => {
  try {
    const income = await incomeService.getIncomeByUser(req.userId!);
    res.json(income);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch income' });
  }
};

export const deleteIncome = async (req: AuthRequest, res: Response) => {
  const incomeId = parseInt(req.params.id);
  try {
    const success = await incomeService.deleteIncome(req.userId!, incomeId);
    if (!success) return res.status(404).json({ message: 'Income not found' });
    res.json({ message: 'Income deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Delete failed' });
  }
};