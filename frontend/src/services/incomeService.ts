import api from './api';

export const fetchIncome = () =>
  api.get('/income').then(res => res.data);

export const addIncome = (data: any) =>
  api.post('/income', data);

export const deleteIncome = (id: number) =>
  api.delete(`/income/${id}`);