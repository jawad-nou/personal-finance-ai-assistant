import pool from '../config/db';

export const getCategoriesForUser = async (userId: number, type?: string) => {
  let query = 'SELECT * FROM categories WHERE user_id = ? AND is_active = TRUE';
  const params: any[] = [userId];
  
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  
  query += ' ORDER BY name';
  const [rows] = await pool.query(query, params);
  return rows;
};

export const createCategory = async (userId: number, name: string, type: string, icon?: string, color?: string, budget?: number) => {
  const [result] = await pool.query(
    'INSERT INTO categories (user_id, name, type, icon, color, budget) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, name, type, icon || 'tag', color || '#3B82F6', budget || 0]
  );
  return (result as any).insertId;
};

export const updateCategory = async (categoryId: number, userId: number, updates: any) => {
  const allowedFields = ['name', 'type', 'icon', 'color', 'budget', 'is_active'];
  const setClauses: string[] = [];
  const values: any[] = [];

  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      setClauses.push(`${key} = ?`);
      values.push(updates[key]);
    }
  }
  if (setClauses.length === 0) return false;

  values.push(categoryId, userId);
  const [result] = await pool.query(
    `UPDATE categories SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`,
    values
  );
  return (result as any).affectedRows > 0;
};

export const deleteCategory = async (categoryId: number, userId: number) => {
  const [result] = await pool.query(
    'UPDATE categories SET is_active = FALSE WHERE id = ? AND user_id = ?',
    [categoryId, userId]
  );
  return (result as any).affectedRows > 0;
};

export const getCategoryStats = async (userId: number, month: string) => {
  const [rows] = await pool.query(
    `SELECT c.*, 
     COALESCE(SUM(e.amount), 0) as spent,
     c.budget - COALESCE(SUM(e.amount), 0) as remaining,
     CASE WHEN c.budget > 0 THEN ROUND((COALESCE(SUM(e.amount), 0) / c.budget) * 100, 1) ELSE 0 END as percentage
     FROM categories c
     LEFT JOIN expenses e ON c.id = e.category_id AND DATE_FORMAT(e.expense_date, '%Y-%m') = ?
     WHERE c.user_id = ? AND c.type = 'expense' AND c.is_active = TRUE
     GROUP BY c.id
     ORDER BY c.name`,
    [month, userId]
  );
  return rows;
};