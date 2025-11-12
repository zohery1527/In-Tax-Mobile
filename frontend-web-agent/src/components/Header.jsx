import { useNavigate } from 'react-router-dom';
import authService from '../services/authService';

const Header = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <header className="bg-blue-600 text-white flex justify-between items-center p-4 shadow-md">
      <div className="text-xl font-bold">In-Tax Admin</div>
      <div className="flex items-center space-x-4">
        <span>{user?.firstName} {user?.lastName}</span>
        <button
          onClick={handleLogout}
          className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded"
        >
          Déconnexion
        </button>
      </div>
    </header>
  );
};

export default Header;
