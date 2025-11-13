import axios from 'axios';
const API_URL = 'https://in-tax-mobile.onrender.com/api';
const authHeader = () => ({ headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } });

export const getDashboard = async () => {
  const res = await axios.get(`${API_URL}/admin/dashboard`, authHeader());
  return res.data;
};

export const getSummary = async () => {
  const res = await axios.get(`${API_URL}/admin/summary`, authHeader());
  return res.data;
};



export default{
  authHeader,
  getDashboard,
  getSummary
}