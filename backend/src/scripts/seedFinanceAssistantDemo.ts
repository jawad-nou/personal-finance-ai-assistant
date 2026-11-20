import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2/promise';
import pool from '../config/db';

const demoEmail = 'case2-demo@example.test';

const categories = [
  { name: 'Food', type: 'expense', icon: 'utensils', color: '#F59E0B' },
  { name: 'Housing', type: 'expense', icon: 'home', color: '#8B5CF6' },
  { name: 'Transport', type: 'expense', icon: 'car', color: '#3B82F6' },
  { name: 'Other', type: 'expense', icon: 'tag', color: '#64748B' },
  { name: 'Salary', type: 'income', icon: 'briefcase', color: '#10B981' },
];

const expenseFixture = [
  { month: '2026-09', category: 'Food', amount: 450 },
  { month: '2026-09', category: 'Housing', amount: 900 },
  { month: '2026-09', category: 'Transport', amount: 300 },
  { month: '2026-09', category: 'Other', amount: 350 },
  { month: '2026-10', category: 'Food', amount: 650 },
  { month: '2026-10', category: 'Housing', amount: 900 },
  { month: '2026-10', category: 'Transport', amount: 250 },
  { month: '2026-10', category: 'Other', amount: 500 },
];

const incomeFixture = [
  { month: '2026-09', amount: 2300 },
  { month: '2026-10', amount: 2500 },
];

const budgetFixture = [
  { month: '2026-10', category: 'Food', amount: 500 },
  { month: '2026-10', category: 'Housing', amount: 1000 },
  { month: '2026-10', category: 'Transport', amount: 300 },
  { month: '2026-10', category: 'Other', amount: 550 },
  { month: '2026-11', category: 'Food', amount: 500 },
];

async function main() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('Set JWT_SECRET in backend/.env before seeding the synthetic demo account.');

  const [users] = await pool.query<RowDataPacket[]>('SELECT id FROM users WHERE email = ? LIMIT 1', [demoEmail]);
  let userId: number;
  let createdUser = false;
  let generatedPassword: string | undefined;
  if (users.length) {
    userId = Number(users[0].id);
  } else {
    generatedPassword = randomBytes(24).toString('base64url');
    const passwordHash = await bcrypt.hash(generatedPassword, 10);
    const [result] = await pool.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [
      'Case 2 Demo User', demoEmail, passwordHash,
    ]);
    userId = Number((result as any).insertId);
    createdUser = true;
  }

  const categoryIds = new Map<string, number>();
  for (const category of categories) {
    const [rows] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM categories WHERE user_id = ? AND type = ? AND LOWER(name) = LOWER(?) ORDER BY id LIMIT 1',
      [userId, category.type, category.name]
    );
    let categoryId: number;
    if (rows.length) {
      categoryId = Number(rows[0].id);
      await pool.query('UPDATE categories SET is_active = TRUE WHERE id = ? AND user_id = ?', [categoryId, userId]);
    } else {
      const [result] = await pool.query(
        'INSERT INTO categories (user_id, name, type, icon, color, budget, is_active) VALUES (?, ?, ?, ?, ?, 0, TRUE)',
        [userId, category.name, category.type, category.icon, category.color]
      );
      categoryId = Number((result as any).insertId);
    }
    categoryIds.set(`${category.type}:${category.name}`, categoryId);
  }

  for (const item of expenseFixture) {
    const categoryId = categoryIds.get(`expense:${item.category}`)!;
    const description = `CASE2-FIXTURE ${item.month} ${item.category}`;
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM expenses WHERE user_id = ? AND description = ? LIMIT 1', [userId, description]
    );
    if (existing.length) {
      await pool.query(
        'UPDATE expenses SET category_id = ?, amount = ?, expense_date = ?, status = ? WHERE id = ? AND user_id = ?',
        [categoryId, item.amount, `${item.month}-10`, 'Completed', existing[0].id, userId]
      );
    } else {
      await pool.query(
        'INSERT INTO expenses (user_id, category_id, amount, description, expense_date, payment_method, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, categoryId, item.amount, description, `${item.month}-10`, 'Cash', 'Completed']
      );
    }
  }

  for (const item of incomeFixture) {
    const categoryId = categoryIds.get('income:Salary')!;
    const description = `CASE2-FIXTURE ${item.month} salary`;
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM income WHERE user_id = ? AND description = ? LIMIT 1', [userId, description]
    );
    if (existing.length) {
      await pool.query(
        'UPDATE income SET category_id = ?, amount = ?, income_date = ?, source = ?, frequency = ? WHERE id = ? AND user_id = ?',
        [categoryId, item.amount, `${item.month}-01`, 'Salary', 'Monthly', existing[0].id, userId]
      );
    } else {
      await pool.query(
        'INSERT INTO income (user_id, category_id, amount, description, income_date, source, frequency) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [userId, categoryId, item.amount, description, `${item.month}-01`, 'Salary', 'Monthly']
      );
    }
  }

  for (const item of budgetFixture) {
    const categoryId = categoryIds.get(`expense:${item.category}`)!;
    const [existing] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM budgets WHERE user_id = ? AND category_id = ? AND month = ? ORDER BY id LIMIT 1',
      [userId, categoryId, item.month]
    );
    if (existing.length) {
      await pool.query('UPDATE budgets SET amount = ? WHERE id = ? AND user_id = ?', [item.amount, existing[0].id, userId]);
    } else {
      await pool.query(
        'INSERT INTO budgets (user_id, category_id, amount, month) VALUES (?, ?, ?, ?)',
        [userId, categoryId, item.amount, item.month]
      );
    }
  }

  const [goals] = await pool.query<RowDataPacket[]>(
    'SELECT id FROM savings_goals WHERE user_id = ? AND name = ? LIMIT 1', [userId, 'Emergency Fund']
  );
  if (goals.length) {
    await pool.query(
      'UPDATE savings_goals SET target_amount = 3000, current_amount = 1000, target_date = NULL, is_completed = FALSE WHERE id = ? AND user_id = ?',
      [goals[0].id, userId]
    );
  } else {
    await pool.query(
      'INSERT INTO savings_goals (user_id, name, target_amount, current_amount, color, target_date, is_completed) VALUES (?, ?, 3000, 1000, ?, NULL, FALSE)',
      [userId, 'Emergency Fund', '#10B981']
    );
  }

  const token = jwt.sign({ id: userId }, secret, { expiresIn: '8h' });
  console.info(`Synthetic demo account ${createdUser ? 'created' : 'reused'}: ${demoEmail} (user ${userId})`);
  if (createdUser && generatedPassword) console.info(`Demo login password: ${generatedPassword}`);
  console.info(`FINANCE_ASSISTANT_TOKEN=${token}`);
  await pool.end();
}

main().catch(async (error) => {
  console.error('Could not seed the Case 2 demo account:', error.message);
  await pool.end();
  process.exitCode = 1;
});
