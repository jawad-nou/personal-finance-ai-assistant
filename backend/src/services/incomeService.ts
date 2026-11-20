import pool from '../config/db';

export const createIncome = async (userId: number, categoryId: number, amount: number, description: string, incomeDate: string, source?: string, frequency?: string) => {
  const [result] = await pool.query(
    'INSERT INTO income (user_id, category_id, amount, description, income_date, source, frequency) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [userId, categoryId, amount, description, incomeDate, source || '', frequency || 'One-time']
  );
  return (result as any).insertId;
};

export const getIncomeByUser = async (userId: number) => {
  const [rows] = await pool.query(
    `SELECT i.*, c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM income i
     JOIN categories c ON i.category_id = c.id
     WHERE i.user_id = ?
     ORDER BY i.income_date DESC`,
    [userId]
  );
  return rows;
};

export const deleteIncome = async (userId: number, incomeId: number) => {
  const [result] = await pool.query(
    'DELETE FROM income WHERE id = ? AND user_id = ?',
    [incomeId, userId]
  );
  return (result as any).affectedRows > 0;
};