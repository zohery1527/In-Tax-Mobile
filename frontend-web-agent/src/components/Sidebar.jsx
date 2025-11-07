import { NavLink } from "react-router-dom";

const Item = ({ to, children }) => (
  <NavLink to={to} className={({isActive}) => `block px-4 py-2 rounded ${isActive ? 'bg-gray-100 font-semibold' : 'hover:bg-gray-50'}`}>
    {children}
  </NavLink>
);

export default function Sidebar(){
  return (
    <aside className="w-64 bg-white border-r hidden md:block">
      <div className="p-4">
        <h3 className="font-bold mb-4">Menu</h3>
        <Item to="/dashboard">Tableau de bord</Item>
        <Item to="/declarations">Déclarations</Item>
        <Item to="/payments">Paiements</Item>
        <Item to="/users">Utilisateurs</Item>
      </div>
    </aside>
  );
}
