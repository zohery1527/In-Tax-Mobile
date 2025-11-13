import { useState } from 'react';
import { FaLock } from 'react-icons/fa';
import { MdOutlinePin } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const OTPVerification = ({ setUser }) => {
  const [otp, setOtp] = useState('');
  const navigate = useNavigate();
  const userId = localStorage.getItem('tempUserId');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userId) return alert('ID utilisateur manquant');

    try {
      const res = await authService.verifyOTP({ userId, otpCode: otp });
      if (res.success) {
        localStorage.setItem('user', JSON.stringify(res.data.user));
        localStorage.setItem('token', res.data.token);
        localStorage.removeItem('tempUserId');
        setUser(res.data.user);
        navigate('/');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-blue-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-lg w-80 text-center"
      >
        <div className="flex justify-center mb-4">
          <FaLock className="text-4xl text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Vérification OTP</h2>
        <p className="text-gray-500 mb-6 text-sm">
          Code envoyé à : <span className="font-semibold">{localStorage.getItem('phoneNumber')}</span>
        </p>

        <div className="flex items-center border rounded-lg mb-5 px-3">
          <MdOutlinePin className="text-gray-400 text-xl mr-2" />
          <input
            type="text"
            placeholder="Entrez le code OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full p-2 outline-none text-gray-700"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition duration-300"
        >
          Vérifier
        </button>
      </form>
    </div>
  );
};

export default OTPVerification;
