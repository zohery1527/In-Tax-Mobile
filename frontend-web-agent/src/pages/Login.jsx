import { ArrowRightIcon, PhoneIcon } from '@heroicons/react/outline';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const Login = ({ setUser }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    setLoading(true);
    try {
      const res = await authService.login({ phoneNumber });
      if (res.success) {
        localStorage.setItem('tempUserId', res.data.userId);
        localStorage.setItem('phoneNumber', phoneNumber);
        navigate('/otp-verification');
      } else {
        alert(res.message || 'Erreur de connexion.');
      }
    } catch (err) {
      console.error('Erreur login:', err);
      alert('Une erreur est survenue, veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-100 to-blue-200">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-96">
        <h2 className="text-2xl font-bold text-center text-blue-700 mb-6">
          Connexion à In-Tax
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="relative">
            <PhoneIcon className="h-5 w-5 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Numéro de téléphone"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 p-2 rounded-lg text-white font-medium transition 
              ${loading ? 'bg-blue-300' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {loading ? (
              <span className="animate-pulse">Envoi...</span>
            ) : (
              <>
                Envoyer OTP
                <ArrowRightIcon className="h-5 w-5" />
              </>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Entrez votre numéro pour recevoir le code OTP.
        </p>
      </div>
    </div>
  );
};

export default Login;
