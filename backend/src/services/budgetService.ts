import pool from '../config/db';

export const createOrUpdateBudget = async (userId: number, categoryId: number, amount: number, month: string) => {
  // Check if budget already exists for this category and month
  const [existing] = await pool.query(
    'SELECT id FROM budgets WHERE user_id = ? AND category_id = ? AND month = ?',
    [userId, categoryId, month]
  );
  
  if ((existing as any[]).length > 0) {
    // Update existing budget
    await pool.query(
      'UPDATE budgets SET amount = ? WHERE id = ? AND user_id = ?',
      [amount, (existing as any)[0].id, userId]
    );
  } else {
    // Create new budget
    await pool.query(
      'INSERT INTO budgets (user_id, category_id, amount, month) VALUES (?, ?, ?, ?)',
      [userId, categoryId, amount, month]
    );
  }
};

export const getBudgetsByUser = async (userId: number, month?: string) => {
  let query = `SELECT b.id, b.user_id, b.category_id, b.amount, b.month,
               c.name as category_name
               FROM budgets b
               JOIN categories c ON b.category_id = c.id
               WHERE b.user_id = ?`;
  const params: any[] = [userId];
  
  if (month) {
    query += ' AND b.month = ?';
    params.push(month);
  }
  
  query += ' ORDER BY c.name';
  
  try {
    const [rows] = await pool.query(query, params);
    return rows;
  } catch (err) {
    console.error('Error in getBudgetsByUser:', err);
    throw err;
  }
};

export const updateBudget = async (userId: number, budgetId: number, amount: number) => {
  const [result] = await pool.query(
    'UPDATE budgets SET amount = ? WHERE id = ? AND user_id = ?',
    [amount, budgetId, userId]
  );
  return (result as any).affectedRows > 0;
};

export const deleteBudget = async (userId: number, budgetId: number) => {
  const [result] = await pool.query(
    'DELETE FROM budgets WHERE id = ? AND user_id = ?',
    [budgetId, userId]
  );
  return (result as any).affectedRows > 0;
};