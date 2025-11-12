import { NavLink } from 'react-router-dom';

const Sidebar = () => {
  const linkClasses = ({ isActive }) =>
    isActive
      ? 'block py-2 px-4 bg-blue-500 text-white rounded mb-1'
      : 'block py-2 px-4 hover:bg-blue-200 rounded mb-1';

  return (
    <aside className="w-60 bg-gray-100 p-4 min-h-screen">
      <nav className="flex flex-col">
        <NavLink to="/dashboard" className={linkClasses}>Dashboard</NavLink>
        <NavLink to="/users" className={linkClasses}>Utilisateurs</NavLink>
        <NavLink to="/declarations" className={linkClasses}>Déclarations</NavLink>
        <NavLink to="/payments" className={linkClasses}>Paiements</NavLink>
        <NavLink to="/nif-validation" className={linkClasses}>Validation NIF</NavLink>
        <NavLink to="/export-data" className={linkClasses}>Export</NavLink>
      </nav>
    </aside>
  );
};

export default Sidebar;
