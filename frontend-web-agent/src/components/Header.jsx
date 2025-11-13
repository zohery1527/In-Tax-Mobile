import { LogoutIcon } from '@heroicons/react/outline';
import authService from '../services/authService';

const Header = ({ user, setUser }) => {
  const handleLogout = () => {
    authService.logout();
    setUser(null);
    window.location.href = '/login'; // redirection après déconnexion
  };

  return (
    <header className="flex items-center justify-between bg-white shadow px-6 py-3 border-b">
      <h1 className="text-xl font-semibold text-gray-800">
        Tableau de bord - {user?.role || 'Utilisateur'}
      </h1>
      <button
        onClick={handleLogout}
        className="flex items-center gap-2 text-red-600 hover:text-red-800 font-medium"
      >
        <LogoutIcon className="h-6 w-6" />
        Déconnexion
      </button>
    </header>
  );
};

export default Header;
