import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import userService from '../services/userService';

const NIFValidation = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPendingUsers = async () => {
    setLoading(true);
    try {
      const res = await userService.getPendingNIFUsers();
      setPendingUsers(res.data.users);
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la récupération des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const handleValidate = async (userId, action) => {
    try {
      await userService.validateNIF(userId, action);
      toast.success(`NIF ${action === 'VALIDATED' ? 'validé' : 'rejeté'}`);
      fetchPendingUsers();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la validation du NIF");
    }
  };

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Validation NIF</h2>
      {loading ? (
        <p>Chargement...</p>
      ) : pendingUsers.length === 0 ? (
        <p>Aucune demande en attente.</p>
      ) : (
        <table className="min-w-full bg-white border">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="py-2 px-4 border">Prénom</th>
              <th className="py-2 px-4 border">Nom</th>
              <th className="py-2 px-4 border">NIF</th>
              <th className="py-2 px-4 border">Téléphone</th>
              <th className="py-2 px-4 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pendingUsers.map(user => (
              <tr key={user.id}>
                <td className="py-2 px-4 border">{user.firstName}</td>
                <td className="py-2 px-4 border">{user.lastName}</td>
                <td className="py-2 px-4 border">{user.nifNumber}</td>
                <td className="py-2 px-4 border">{user.phoneNumber}</td>
                <td className="py-2 px-4 border space-x-2">
                  <button
                    onClick={() => handleValidate(user.id, 'VALIDATED')}
                    className="bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                  >
                    Valider
                  </button>
                  <button
                    onClick={() => handleValidate(user.id, 'REJECTED')}
                    className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                  >
                    Rejeter
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default NIFValidation;
