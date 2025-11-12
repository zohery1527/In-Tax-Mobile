import React, { useState } from 'react';
import { sendOTP } from '../services/authService';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await sendOTP(phone);
      if(res.success) navigate(`/otp?phone=${phone}`);
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur serveur');
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form className="bg-white p-6 rounded shadow w-80" onSubmit={handleSubmit}>
        <h2 className="text-2xl font-bold mb-4">Connexion Admin/Agent</h2>
        <input type="text" placeholder="Numéro de téléphone" value={phone} onChange={e=>setPhone(e.target.value)}
          className="w-full p-2 border rounded mb-4" required />
        <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded">{loading ? 'Envoi...' : 'Envoyer OTP'}</button>
      </form>
    </div>
  );
};

export default Login;
