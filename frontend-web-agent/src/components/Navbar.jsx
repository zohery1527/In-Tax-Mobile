import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar(){
  const { user, logout } = useAuth();
  return (
    <header className="bg-white border-b p-4 flex justify-between items-center">
      <div className="flex items-center gap-4">
        <div className="text-primary-600 font-bold text-lg">In-Tax</div>
        <nav className="hidden md:flex gap-4 text-sm text-gray-600">
          <Link to="/dashboard" className="hover:underline">Dashboard</Link>
          <Link to="/declarations" className="hover:underline">Déclarations</Link>
          <Link to="/payments" className="hover:underline">Paiements</Link>
          <Link to="/users" className="hover:underline">Utilisateurs</Link>
        </nav>
      </div>

      <div className="flex items-center gap-3">
        {user && <div className="text-sm text-gray-700">Bonjour, <strong>{user.fullname || user.firstName}</strong></div>}
        <button onClick={logout} className="bg-red-500 text-white px-3 py-1 rounded">Déconnexion</button>
      </div>
    </header>
  );
}
