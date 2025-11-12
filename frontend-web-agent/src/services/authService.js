import axios from 'axios';

const API_URL = 'https://in-tax-mobile.onrender.com/api';

export const sendOTP = async (phoneNumber) => {
  const response = await axios.post(`${API_URL}/auth/send-otp`, { phoneNumber });
  return response.data;
};

export const verifyOTP = async (phoneNumber, code) => {
  const response = await axios.post(`${API_URL}/auth/verify-otp`, { phoneNumber, code });
  return response.data;
};
