import axios from 'axios';
const API_URL = 'https://in-tax-mobile.onrender.com/api';
const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export const getPayments = async (page=1, limit=20) => {
  const res = await axios.get(`${API_URL}/admin/payments?page=${page}&limit=${limit}`, authHeader());
  return res.data;
};

export const confirmPaymentManual = async (paymentId) => {
  const res = await axios.post(`${API_URL}/admin/payments/${paymentId}/confirm`, {}, authHeader());
  return res.data;
};

export default{
  getPayments,
  confirmPaymentManual
}