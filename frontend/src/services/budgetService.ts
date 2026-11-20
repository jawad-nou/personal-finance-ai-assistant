import api from './api';

export const fetchBudgets = (month?: string) =>
  api.get('/budgets', { params: { month } }).then(res => res.data);

export const createBudget = (data: { category_id: number; amount: number; month: string }) =>
  api.post('/budgets', data);

export const updateBudget = (id: number, data: { amount: number }) =>
  api.put(`/budgets/${id}`, data);

export const deleteBudget = (id: number) =>
  api.delete(`/budgets/${id}`);