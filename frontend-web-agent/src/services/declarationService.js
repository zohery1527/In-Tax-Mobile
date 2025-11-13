import axios from 'axios';
const API_URL = 'https://in-tax-mobile.onrender.com/api';
const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export const getPendingDeclarations = async (page=1, limit=20) => {
  const res = await axios.get(`${API_URL}/admin/declarations/pending?page=${page}&limit=${limit}`, authHeader());
  return res.data;
};

export const validateDeclaration = async (declarationId) => {
  const res = await axios.post(`${API_URL}/admin/declarations/${declarationId}/validate`, {}, authHeader());
  return res.data;
};

export default{
  getPendingDeclarations,
  validateDeclaration,
  authHeader
}