import { Router } from 'express';
import { getAllCategories, createCategory, updateCategory, deleteCategory, getCategoryStats } from '../controllers/categoryController';
import { authenticate } from '../middleware/auth';

const router = Router();
router.use(authenticate);

// IMPORTANT: /stats must come BEFORE /:id
router.get('/stats', getCategoryStats);
router.get('/', getAllCategories);
router.post('/', createCategory);
router.put('/:id', updateCategory);
router.delete('/:id', deleteCategory);

export default router;