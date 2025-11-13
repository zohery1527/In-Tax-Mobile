import axios from 'axios';
const API_URL = 'https://in-tax-mobile.onrender.com/api';

const authHeader = () => {
  const token = localStorage.getItem('token');
  return { headers: { Authorization: `Bearer ${token}` } };
};

export const getUsers = async (page=1, limit=20) => {
  const res = await axios.get(`${API_URL}/admin/users?page=${page}&limit=${limit}`, authHeader());
  return res.data;
};

export const validateNIF = async (userId, action, reason='') => {
  const res = await axios.post(`${API_URL}/admin/nif/validate`, { userId, action, reason }, authHeader());
  return res.data;
};

export default {
    authHeader,
    getUsers,
    validateNIF
};