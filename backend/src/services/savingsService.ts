import pool from '../config/db';

export const createSavingsGoal = async (userId: number, name: string, targetAmount: number, currentAmount?: number, color?: string, targetDate?: string) => {
  const [result] = await pool.query(
    'INSERT INTO savings_goals (user_id, name, target_amount, current_amount, color, target_date) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, name, targetAmount, currentAmount || 0, color || '#3B82F6', targetDate || null]
  );
  return (result as any).insertId;
};

export const getSavingsGoals = async (userId: number) => {
  const [rows] = await pool.query(
    'SELECT * FROM savings_goals WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  );
  return rows;
};

export const updateSavingsGoal = async (goalId: number, userId: number, updates: any) => {
  const allowedFields = ['name', 'target_amount', 'current_amount', 'color', 'target_date', 'is_completed'];
  const setClauses: string[] = [];
  const values: any[] = [];

  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      setClauses.push(`${key} = ?`);
      values.push(updates[key]);
    }
  }
  if (setClauses.length === 0) return false;

  values.push(goalId, userId);
  const [result] = await pool.query(
    `UPDATE savings_goals SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`,
    values
  );
  return (result as any).affectedRows > 0;
};

export const deleteSavingsGoal = async (goalId: number, userId: number) => {
  const [result] = await pool.query(
    'DELETE FROM savings_goals WHERE id = ? AND user_id = ?',
    [goalId, userId]
  );
  return (result as any).affectedRows > 0;
};