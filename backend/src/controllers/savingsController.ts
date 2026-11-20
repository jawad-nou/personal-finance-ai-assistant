import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as savingsService from '../services/savingsService';

export const addSavingsGoal = async (req: AuthRequest, res: Response) => {
  const { name, target_amount, current_amount, color, target_date } = req.body;
  if (!name || !target_amount) {
    return res.status(400).json({ message: 'Name and target amount are required' });
  }
  try {
    const id = await savingsService.createSavingsGoal(req.userId!, name, target_amount, current_amount, color, target_date);
    res.status(201).json({ id, message: 'Savings goal created' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to create savings goal' });
  }
};

export const getSavingsGoals = async (req: AuthRequest, res: Response) => {
  try {
    const goals = await savingsService.getSavingsGoals(req.userId!);
    res.json(goals);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch savings goals' });
  }
};

export const updateSavingsGoal = async (req: AuthRequest, res: Response) => {
  const goalId = parseInt(req.params.id);
  try {
    const success = await savingsService.updateSavingsGoal(goalId, req.userId!, req.body);
    if (!success) return res.status(404).json({ message: 'Goal not found' });
    res.json({ message: 'Goal updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Update failed' });
  }
};

export const deleteSavingsGoal = async (req: AuthRequest, res: Response) => {
  const goalId = parseInt(req.params.id);
  try {
    const success = await savingsService.deleteSavingsGoal(goalId, req.userId!);
    if (!success) return res.status(404).json({ message: 'Goal not found' });
    res.json({ message: 'Goal deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Delete failed' });
  }
};