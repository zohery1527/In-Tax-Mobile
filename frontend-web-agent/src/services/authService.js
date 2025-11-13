import axios from 'axios';

const API_URL = 'https://in-tax-mobile.onrender.com/api/auth'; // adapte avec ton URL

// INSCRIPTION (optionnel si admin/agent seulement)
export const register = async ({ phoneNumber, firstName, lastName, activityType, zoneId }) => {
  const res = await axios.post(`${API_URL}/register`, {
    phoneNumber,
    firstName,
    lastName,
    activityType,
    zoneId
  });
  return res.data;
};

// CONNEXION via numéro de téléphone
export const login = async ({ phoneNumber }) => {
  const res = await axios.post(`${API_URL}/login`, { phoneNumber });
  return res.data; // retourne { success, message, data: { userId, role, otpCode } }
};

// VERIFICATION OTP
export const verifyOTP = async ({ userId, otpCode }) => {
  const res = await axios.post(`${API_URL}/verify-otp`, { userId, otpCode });
  return res.data; // retourne { success, message, data: { token, user } }
};

// PROFIL
export const getProfile = async (token) => {
  const res = await axios.get(`${API_URL}/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

// LOCAL STORAGE
export const getCurrentUser = () => {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
};

export const getToken = () => localStorage.getItem('token');

export const logout = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
  localStorage.removeItem('tempUserId');
  localStorage.removeItem('phoneNumber');
};

// EXPORT PAR DÉFAUT
export default {
  register,
  login,
  verifyOTP,
  getProfile,
  getCurrentUser,
  getToken,
  logout
};
