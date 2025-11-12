import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { verifyOTP } from '../services/authService';

const OTPVerification = () => {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const phone = new URLSearchParams(location.search).get('phone');

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await verifyOTP(phone, code);
      if(res.success){
        localStorage.setItem('token', res.data.token);
        navigate('/dashboard');
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Code OTP invalide');
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <form className="bg-white p-6 rounded shadow w-80" onSubmit={handleVerify}>
        <h2 className="text-2xl font-bold mb-4">Vérification OTP</h2>
        <input type="text" placeholder="Code OTP" value={code} onChange={e=>setCode(e.target.value)}
          className="w-full p-2 border rounded mb-4" required />
        <button type="submit" className="w-full bg-green-600 text-white p-2 rounded">{loading ? 'Vérification...' : 'Valider OTP'}</button>
        <p className="mt-2 text-gray-500 text-sm">Numéro: {phone}</p>
      </form>
    </div>
  );
};

export default OTPVerification;
