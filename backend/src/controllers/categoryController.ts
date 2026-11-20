import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import * as categoryService from '../services/categoryService';

export const getAllCategories = async (req: AuthRequest, res: Response) => {
  try {
    const type = req.query.type as string | undefined;
    const categories = await categoryService.getCategoriesForUser(req.userId!, type);
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not fetch categories' });
  }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
  const { name, type, icon, color, budget } = req.body;
  if (!name || !type || !['income', 'expense'].includes(type)) {
    return res.status(400).json({ message: 'Valid name and type (income/expense) required' });
  }
  try {
    const id = await categoryService.createCategory(req.userId!, name, type, icon, color, budget);
    res.status(201).json({ id, name, type, user_id: req.userId, is_active: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not create category' });
  }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
  const categoryId = parseInt(req.params.id);
  try {
    const success = await categoryService.updateCategory(categoryId, req.userId!, req.body);
    if (!success) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Update failed' });
  }
};

export const deleteCategory = async (req: AuthRequest, res: Response) => {
  const categoryId = parseInt(req.params.id);
  try {
    const success = await categoryService.deleteCategory(categoryId, req.userId!);
    if (!success) return res.status(404).json({ message: 'Category not found' });
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Delete failed' });
  }
};

export const getCategoryStats = async (req: AuthRequest, res: Response) => {
  const month = req.query.month as string;
  if (!month) return res.status(400).json({ message: 'Month (YYYY-MM) is required' });
  try {
    const stats = await categoryService.getCategoryStats(req.userId!, month);
    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to fetch stats' });
  }
};