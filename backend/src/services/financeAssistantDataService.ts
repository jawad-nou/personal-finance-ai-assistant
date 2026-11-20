import jwt from 'jsonwebtoken';
import { RowDataPacket } from 'mysql2/promise';
import pool from '../config/db';

export class FinanceAssistantError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = 'FinanceAssistantError';
  }
}

export interface FinanceSnapshot {
  month: string;
  income: number;
  expenses: number;
  cashFlow: number;
  incomeByCategory: Array<{ category: string; amount: number }>;
  categorySpending: Array<{ category: string; amount: number }>;
  budgets: Array<{
    category: string;
    budget: number;
    spent: number;
    remaining: number;
    overBy: number;
    percentUsed: number;
  }>;
  savingsGoals: Array<{
    name: string;
    targetAmount: number;
    currentAmount: number;
    remaining: number;
    targetDate: string | null;
    completed: boolean;
  }>;
  comparison?: {
    month: string;
    previousIncome: number;
    previousExpenses: number;
    previousCashFlow: number;
    incomeChange: number;
    expenseChange: number;
    cashFlowChange: number;
    categoryChanges: Array<{ category: string; amountChange: number }>;
  };
  purchaseCheck?: {
    amount: number;
    affordableByRecordedCashFlow: boolean;
    cashFlowAfterPurchase: number;
  };
}

export interface BudgetProposal {
  approvalToken: string;
  category: string;
  month: string;
  currentAmount: number | null;
  proposedAmount: number;
}

const toMoney = (value: unknown): number => {
  const amount = Number(value) || 0;
  return Math.round((amount + Number.EPSILON) * 100) / 100;
};

const cents = (value: unknown): number => Math.round((Number(value) || 0) * 100);

const monthBounds = (month: string) => {
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    throw new FinanceAssistantError('Use a month in YYYY-MM format.', 400);
  }
  const [year, monthNumber] = month.split('-').map(Number);
  const nextMonth = new Date(Date.UTC(year, monthNumber, 1));
  const nextMonthStart = `${nextMonth.getUTCFullYear()}-${String(nextMonth.getUTCMonth() + 1).padStart(2, '0')}-01`;
  return { start: `${month}-01`, endExclusive: nextMonthStart };
};

export const getCurrentFinanceMonth = (): string => {
  const timeZone = process.env.APP_TIMEZONE || 'Asia/Beirut';
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(new Date());
  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  return `${year}-${month}`;
};

async function getMonthSnapshot(userId: number, month: string): Promise<FinanceSnapshot> {
  const { start, endExclusive } = monthBounds(month);
  const [[expenseTotals], [incomeTotals], [spendingRows], [incomeRows], [budgetRows], [goalRows]] = await Promise.all([
    pool.query<RowDataPacket[]>(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM expenses WHERE user_id = ? AND expense_date >= ? AND expense_date < ?',
      [userId, start, endExclusive]
    ),
    pool.query<RowDataPacket[]>(
      'SELECT COALESCE(SUM(amount), 0) AS total FROM income WHERE user_id = ? AND income_date >= ? AND income_date < ?',
      [userId, start, endExclusive]
    ),
    pool.query<RowDataPacket[]>(
      `SELECT c.name AS category, COALESCE(SUM(e.amount), 0) AS total
       FROM categories c
       LEFT JOIN expenses e ON e.category_id = c.id AND e.user_id = c.user_id
         AND e.expense_date >= ? AND e.expense_date < ?
       WHERE c.user_id = ? AND c.type = 'expense'
       GROUP BY c.id, c.name ORDER BY total DESC, c.name`,
      [start, endExclusive, userId]
    ),
    pool.query<RowDataPacket[]>(
      `SELECT c.name AS category, COALESCE(SUM(i.amount), 0) AS total
       FROM categories c
       LEFT JOIN income i ON i.category_id = c.id AND i.user_id = c.user_id
         AND i.income_date >= ? AND i.income_date < ?
       WHERE c.user_id = ? AND c.type = 'income'
       GROUP BY c.id, c.name ORDER BY total DESC, c.name`,
      [start, endExclusive, userId]
    ),
    pool.query<RowDataPacket[]>(
      `SELECT c.name AS category, b.amount AS budget,
         COALESCE(SUM(e.amount), 0) AS spent
       FROM budgets b
       JOIN categories c ON c.id = b.category_id AND c.user_id = b.user_id
       LEFT JOIN expenses e ON e.category_id = b.category_id AND e.user_id = b.user_id
         AND e.expense_date >= ? AND e.expense_date < ?
       WHERE b.user_id = ? AND b.month = ?
       GROUP BY b.id, c.name, b.amount ORDER BY c.name`,
      [start, endExclusive, userId, month]
    ),
    pool.query<RowDataPacket[]>(
      `SELECT name, target_amount, current_amount, target_date, is_completed
       FROM savings_goals WHERE user_id = ? ORDER BY is_completed, name`,
      [userId]
    ),
  ]);

  const expenses = toMoney(expenseTotals[0]?.total);
  const income = toMoney(incomeTotals[0]?.total);
  return {
    month,
    income,
    expenses,
    cashFlow: toMoney(income - expenses),
    incomeByCategory: incomeRows.map((row) => ({ category: String(row.category), amount: toMoney(row.total) })),
    categorySpending: spendingRows.map((row) => ({ category: String(row.category), amount: toMoney(row.total) })),
    budgets: budgetRows.map((row) => {
      const budget = toMoney(row.budget);
      const spent = toMoney(row.spent);
      return {
        category: String(row.category),
        budget,
        spent,
        remaining: toMoney(budget - spent),
        overBy: toMoney(Math.max(0, spent - budget)),
        percentUsed: budget > 0 ? Math.round((spent / budget) * 1000) / 10 : 0,
      };
    }),
    savingsGoals: goalRows.map((row) => {
      const targetAmount = toMoney(row.target_amount);
      const currentAmount = toMoney(row.current_amount);
      return {
        name: String(row.name),
        targetAmount,
        currentAmount,
        remaining: toMoney(Math.max(0, targetAmount - currentAmount)),
        targetDate: row.target_date ? String(row.target_date).slice(0, 10) : null,
        completed: Boolean(row.is_completed),
      };
    }),
  };
}

export async function getFinanceSnapshot(
  userId: number,
  month: string,
  compareToMonth?: string,
  purchaseAmount?: number
): Promise<FinanceSnapshot> {
  const snapshot = await getMonthSnapshot(userId, month);

  if (compareToMonth && compareToMonth !== month) {
    const previous = await getMonthSnapshot(userId, compareToMonth);
    const previousCategories = new Map(previous.categorySpending.map((item) => [item.category, item.amount]));
    const currentCategories = new Map(snapshot.categorySpending.map((item) => [item.category, item.amount]));
    const categoryNames = new Set([...previousCategories.keys(), ...currentCategories.keys()]);
    snapshot.comparison = {
      month: previous.month,
      previousIncome: previous.income,
      previousExpenses: previous.expenses,
      previousCashFlow: previous.cashFlow,
      incomeChange: toMoney(snapshot.income - previous.income),
      expenseChange: toMoney(snapshot.expenses - previous.expenses),
      cashFlowChange: toMoney(snapshot.cashFlow - previous.cashFlow),
      categoryChanges: Array.from(categoryNames)
        .map((category) => ({
          category,
          amountChange: toMoney((currentCategories.get(category) || 0) - (previousCategories.get(category) || 0)),
        }))
        .sort((a, b) => Math.abs(b.amountChange) - Math.abs(a.amountChange)),
    };
  }

  if (purchaseAmount !== undefined) {
    snapshot.purchaseCheck = {
      amount: toMoney(purchaseAmount),
      affordableByRecordedCashFlow: snapshot.cashFlow >= purchaseAmount,
      cashFlowAfterPurchase: toMoney(snapshot.cashFlow - purchaseAmount),
    };
  }
  return snapshot;
}

export async function draftSavingsPlan(userId: number, goalName: string, months?: number) {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, target_amount, current_amount, target_date, is_completed
     FROM savings_goals WHERE user_id = ? AND LOWER(name) = LOWER(?) AND is_completed = FALSE LIMIT 2`,
    [userId, goalName.trim()]
  );

  if (rows.length === 0) {
    throw new FinanceAssistantError('I could not find an active savings goal with that name in your account.', 404);
  }
  if (rows.length > 1) {
    throw new FinanceAssistantError('More than one active goal has that name. Please specify a unique goal name.', 409);
  }

  const row = rows[0];
  const targetAmount = toMoney(row.target_amount);
  const currentAmount = toMoney(row.current_amount);
  const remaining = toMoney(Math.max(0, targetAmount - currentAmount));
  let monthsToGoal = months;

  if (monthsToGoal === undefined && row.target_date) {
    const [targetYear, targetMonth] = String(row.target_date).slice(0, 7).split('-').map(Number);
    const [currentYear, currentMonth] = getCurrentFinanceMonth().split('-').map(Number);
    monthsToGoal = Math.max(1, (targetYear - currentYear) * 12 + targetMonth - currentMonth);
  }

  return {
    goal: String(row.name),
    targetAmount,
    currentAmount,
    remaining,
    targetDate: row.target_date ? String(row.target_date).slice(0, 10) : null,
    months: monthsToGoal ?? null,
    needsTimeframe: monthsToGoal === undefined,
    suggestedMonthlyContribution: monthsToGoal ? toMoney(Math.ceil((remaining / monthsToGoal) * 100) / 100) : null,
    isEstimate: true,
  };
}

interface BudgetApprovalClaims {
  action: 'apply_budget_change';
  categoryId: number;
  categoryName: string;
  month: string;
  proposedAmountCents: number;
  expectedAmountCents: number | null;
}

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new FinanceAssistantError('The assistant approval feature needs JWT_SECRET configured on the server.', 503);
  return secret;
}

export async function proposeBudgetChange(
  userId: number,
  categoryName: string,
  month: string,
  proposedAmount: number
): Promise<BudgetProposal> {
  monthBounds(month);
  if (!Number.isFinite(proposedAmount) || proposedAmount <= 0 || proposedAmount > 1_000_000_000) {
    throw new FinanceAssistantError('The proposed budget must be a positive amount.', 400);
  }

  const [categoryRows] = await pool.query<RowDataPacket[]>(
    `SELECT id, name FROM categories
     WHERE user_id = ? AND type = 'expense' AND is_active = TRUE AND LOWER(name) = LOWER(?) LIMIT 2`,
    [userId, categoryName.trim()]
  );
  if (categoryRows.length === 0) throw new FinanceAssistantError('That expense category was not found in your account.', 404);
  if (categoryRows.length > 1) throw new FinanceAssistantError('That category name is ambiguous. Please use a more specific category.', 409);

  const category = categoryRows[0];
  const [budgetRows] = await pool.query<RowDataPacket[]>(
    'SELECT amount FROM budgets WHERE user_id = ? AND category_id = ? AND month = ? LIMIT 1',
    [userId, category.id, month]
  );
  const currentAmount = budgetRows.length ? toMoney(budgetRows[0].amount) : null;
  const claims: BudgetApprovalClaims = {
    action: 'apply_budget_change',
    categoryId: Number(category.id),
    categoryName: String(category.name),
    month,
    proposedAmountCents: cents(proposedAmount),
    expectedAmountCents: currentAmount === null ? null : cents(currentAmount),
  };
  const approvalToken = jwt.sign(
    { ...claims, sub: String(userId) },
    getJwtSecret(),
    { expiresIn: '15m', audience: 'finance-budget-approval' }
  );

  return {
    approvalToken,
    category: String(category.name),
    month,
    currentAmount,
    proposedAmount: toMoney(proposedAmount),
  };
}

export async function approveBudgetChange(userId: number, token: string) {
  let claims: BudgetApprovalClaims & { sub?: string };
  try {
    claims = jwt.verify(token, getJwtSecret(), { audience: 'finance-budget-approval' }) as BudgetApprovalClaims & { sub?: string };
  } catch {
    throw new FinanceAssistantError('This budget approval has expired or is invalid. Ask the assistant to draft it again.', 400);
  }

  if (
    claims.sub !== String(userId) || claims.action !== 'apply_budget_change' ||
    !Number.isInteger(claims.categoryId) || !Number.isInteger(claims.proposedAmountCents) ||
    claims.proposedAmountCents <= 0
  ) {
    throw new FinanceAssistantError('This approval does not belong to your account or is malformed.', 403);
  }
  monthBounds(claims.month);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [categoryRows] = await connection.query<RowDataPacket[]>(
      `SELECT id FROM categories
       WHERE id = ? AND user_id = ? AND type = 'expense' AND is_active = TRUE FOR UPDATE`,
      [claims.categoryId, userId]
    );
    if (categoryRows.length === 0) throw new FinanceAssistantError('That category is no longer available.', 404);

    const [budgetRows] = await connection.query<RowDataPacket[]>(
      'SELECT id, amount FROM budgets WHERE user_id = ? AND category_id = ? AND month = ? FOR UPDATE',
      [userId, claims.categoryId, claims.month]
    );
    const existing = budgetRows[0];
    const actualAmountCents = existing ? cents(existing.amount) : null;

    // A repeated click is harmless, while intervening edits must be reviewed again.
    if (actualAmountCents === claims.proposedAmountCents) {
      await connection.commit();
      return { applied: false, alreadyApplied: true, category: claims.categoryName, month: claims.month };
    }
    if (actualAmountCents !== claims.expectedAmountCents) {
      throw new FinanceAssistantError('This budget changed after the draft was created. Ask the assistant for a fresh proposal.', 409);
    }

    const amount = claims.proposedAmountCents / 100;
    if (existing) {
      await connection.query(
        'UPDATE budgets SET amount = ? WHERE id = ? AND user_id = ?',
        [amount, existing.id, userId]
      );
    } else {
      await connection.query(
        'INSERT INTO budgets (user_id, category_id, amount, month) VALUES (?, ?, ?, ?)',
        [userId, claims.categoryId, amount, claims.month]
      );
    }
    await connection.commit();
    return { applied: true, alreadyApplied: false, category: claims.categoryName, month: claims.month, amount };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
