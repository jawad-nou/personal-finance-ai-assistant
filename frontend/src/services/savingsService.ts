import api from './api';

export const fetchSavingsGoals = () =>
  api.get('/savings').then(res => res.data);

export const createSavingsGoal = (data: any) =>
  api.post('/savings', data);

export const updateSavingsGoal = (id: number, data: any) =>
  api.put(`/savings/${id}`, data);

export const deleteSavingsGoal = (id: number) =>
  api.delete(`/savings/${id}`);