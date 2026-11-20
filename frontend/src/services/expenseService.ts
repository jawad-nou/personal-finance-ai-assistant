import api from './api';

export const fetchExpenses = (params?: any) =>
  api.get('/expenses', { params }).then(res => res.data);

export const addExpense = (data: any) =>
  api.post('/expenses', data);

export const updateExpense = (id: number, data: any) =>
  api.put(`/expenses/${id}`, data);

export const deleteExpense = (id: number) =>
  api.delete(`/expenses/${id}`);

export const getExpenseSummary = (month: string) =>
  api.get('/expenses/summary', { params: { month } }).then(res => res.data);

export const getDashboardStats = (month: string) =>
  api.get('/expenses/dashboard', { params: { month } }).then(res => res.data);

export const getRecentTransactions = (limit: number = 5) =>
  api.get('/expenses/recent', { params: { limit } }).then(res => res.data);