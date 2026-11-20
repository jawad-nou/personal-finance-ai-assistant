import pool from '../config/db';

interface ExpenseFilters {
  categoryId?: number;
  startDate?: string;
  endDate?: string;
  limit?: number;
  search?: string;
}

export const createExpense = async (userId: number, categoryId: number, amount: number, description: string, expenseDate: string, paymentMethod?: string) => {
  const [result] = await pool.query(
    'INSERT INTO expenses (user_id, category_id, amount, description, expense_date, payment_method) VALUES (?, ?, ?, ?, ?, ?)',
    [userId, categoryId, amount, description, expenseDate, paymentMethod || 'Cash']
  );
  return (result as any).insertId;
};

export const getExpensesByUser = async (userId: number, filters: ExpenseFilters) => {
  let query = `SELECT e.*, c.name as category_name, c.icon as category_icon, c.color as category_color
               FROM expenses e
               JOIN categories c ON e.category_id = c.id
               WHERE e.user_id = ?`;
  const params: any[] = [userId];

  if (filters.categoryId) {
    query += ' AND e.category_id = ?';
    params.push(filters.categoryId);
  }
  if (filters.startDate) {
    query += ' AND e.expense_date >= ?';
    params.push(filters.startDate);
  }
  if (filters.endDate) {
    query += ' AND e.expense_date <= ?';
    params.push(filters.endDate);
  }
  if (filters.search) {
    query += ' AND (e.description LIKE ? OR CAST(e.id AS CHAR) LIKE ?)';
    params.push(`%${filters.search}%`, `%${filters.search}%`);
  }
  
  query += ' ORDER BY e.expense_date DESC, e.created_at DESC';
  if (filters.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }

  const [rows] = await pool.query(query, params);
  return rows;
};

export const updateExpense = async (userId: number, expenseId: number, updates: any) => {
  const allowedFields = ['category_id', 'amount', 'description', 'expense_date', 'payment_method', 'status'];
  const setClauses: string[] = [];
  const values: any[] = [];

  for (const key of allowedFields) {
    if (updates[key] !== undefined) {
      setClauses.push(`${key} = ?`);
      values.push(updates[key]);
    }
  }
  if (setClauses.length === 0) return false;

  values.push(expenseId, userId);
  const [result] = await pool.query(
    `UPDATE expenses SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`,
    values
  );
  return (result as any).affectedRows > 0;
};

export const deleteExpense = async (userId: number, expenseId: number) => {
  const [result] = await pool.query(
    'DELETE FROM expenses WHERE id = ? AND user_id = ?',
    [expenseId, userId]
  );
  return (result as any).affectedRows > 0;
};

export const getExpenseSummary = async (userId: number, month: string) => {
  const [rows] = await pool.query(
    `SELECT c.name, c.color, SUM(e.amount) as total
     FROM expenses e
     JOIN categories c ON e.category_id = c.id
     WHERE e.user_id = ? AND DATE_FORMAT(e.expense_date, '%Y-%m') = ?
     GROUP BY e.category_id, c.name, c.color
     ORDER BY total DESC`,
    [userId, month]
  );
  return rows;
};

export const getDashboardStats = async (userId: number, month: string) => {
  console.log('Getting dashboard stats for user:', userId, 'month:', month);
  
  const [expenseResult] = await pool.query(
    "SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE user_id = ? AND DATE_FORMAT(expense_date, '%Y-%m') = ?",
    [userId, month]
  );
  
  const [incomeResult] = await pool.query(
    "SELECT COALESCE(SUM(amount), 0) as total FROM income WHERE user_id = ? AND DATE_FORMAT(income_date, '%Y-%m') = ?",
    [userId, month]
  );
  
  const [savingsResult] = await pool.query(
    'SELECT COALESCE(SUM(current_amount), 0) as total FROM savings_goals WHERE user_id = ? AND is_completed = FALSE',
    [userId]
  );

  const totalExpenses = parseFloat((expenseResult as any)[0].total) || 0;
  const totalIncome = parseFloat((incomeResult as any)[0].total) || 0;
  const totalSavings = parseFloat((savingsResult as any)[0].total) || 0;
  const currentBalance = totalIncome - totalExpenses;

  console.log('Stats:', { currentBalance, totalIncome, totalExpenses, totalSavings });

  return {
    currentBalance: currentBalance,
    monthlyIncome: totalIncome,
    monthlyExpenses: totalExpenses,
    totalSavings: totalSavings,
  };
};
export const getRecentTransactions = async (userId: number, limit: number = 5) => {
  const [rows] = await pool.query(
    `SELECT 'expense' as type, e.id, e.amount, e.description, e.expense_date as date, e.status, e.payment_method,
            c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM expenses e
     JOIN categories c ON e.category_id = c.id
     WHERE e.user_id = ?
     UNION ALL
     SELECT 'income' as type, i.id, i.amount, i.description, i.income_date as date, 'Completed' as status, i.source as payment_method,
            c.name as category_name, c.icon as category_icon, c.color as category_color
     FROM income i
     JOIN categories c ON i.category_id = c.id
     WHERE i.user_id = ?
     ORDER BY date DESC
     LIMIT ?`,
    [userId, userId, limit]
  );
  return rows;
};