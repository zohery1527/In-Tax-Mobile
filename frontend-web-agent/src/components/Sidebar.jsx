// src/components/Sidebar.jsx
import {
  CheckCircleIcon,
  CreditCardIcon,
  DocumentTextIcon,
  DownloadIcon,
  HomeIcon,
  UserIcon,
} from '@heroicons/react/outline';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ user }) => {
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <HomeIcon className="h-5 w-5" /> },
    { name: 'Utilisateurs', path: '/users', icon: <UserIcon className="h-5 w-5" /> },
    { name: 'Déclarations', path: '/declarations', icon: <DocumentTextIcon className="h-5 w-5" /> },
    { name: 'Paiements', path: '/payments', icon: <CreditCardIcon className="h-5 w-5" /> },
    { name: 'Validation NIF', path: '/nif-validation', icon: <CheckCircleIcon className="h-5 w-5" /> },
    { name: 'Exportation', path: '/export', icon: <DownloadIcon className="h-5 w-5" /> },
  ];

  return (
    <aside className="w-64 bg-white shadow-md border-r h-full flex flex-col">
      <div className="p-4 border-b text-center">
        <h2 className="text-lg font-semibold text-gray-800">
          In-Tax {user?.role ? `(${user.role})` : ''}
        </h2>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 rounded-md text-gray-700 hover:bg-blue-100 hover:text-blue-700 transition ${
                isActive ? 'bg-blue-500 text-white' : ''
              }`
            }
          >
            {item.icon}
            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
