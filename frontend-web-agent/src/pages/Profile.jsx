import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { useAuth } from "../context/AuthContext";

export default function Profile(){
  const { user } = useAuth();
  if(!user) return <div>Chargement...</div>;

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <main className="p-6">
          <div className="bg-white p-6 rounded-2xl shadow max-w-md">
            <h2 className="text-xl font-semibold mb-4">Mon profil</h2>
            <div className="space-y-2">
              <div><strong>Nom :</strong> {user.fullname || `${user.firstName || ''} ${user.lastName || ''}`}</div>
              <div><strong>Téléphone :</strong> {user.phoneNumber || user.phone}</div>
              <div><strong>Rôle :</strong> {user.role}</div>
              <div><strong>Zone :</strong> {user.zone?.name || '-'}</div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
