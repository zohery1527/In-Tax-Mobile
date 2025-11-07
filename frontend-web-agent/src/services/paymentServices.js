import api from "./api";

export const getPayments = (page = 1, limit = 50) =>
  api.get(`/admin/payments?page=${page}&limit=${limit}`);

export const confirmPayment = (id) =>
  api.patch(`/admin/payments/${id}/confirm`);
