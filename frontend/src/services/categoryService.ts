import api from './api';

export const fetchCategories = (type?: string) =>
  api.get('/categories', { params: { type } }).then(res => res.data);

export const createCategory = (data: { name: string; type: string; icon?: string; color?: string; budget?: number }) =>
  api.post('/categories', data);

export const updateCategory = (id: number, data: any) =>
  api.put(`/categories/${id}`, data);

export const deleteCategory = (id: number) =>
  api.delete(`/categories/${id}`);

export const fetchCategoryStats = (month: string) =>
  api.get('/categories/stats', { params: { month } }).then(res => res.data);