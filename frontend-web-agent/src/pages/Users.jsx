import { useEffect, useState } from 'react';
import Table from '../components/Table';
import { getUsers, validateNIF } from '../services/userService';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await getUsers();
    if(res.success) setUsers(res.data.users);
    setLoading(false);
  };

  const handleValidateNIF = async (userId, action) => {
    const reason = action === 'REJECTED' ? prompt("Motif du rejet") : '';
    const res = await validateNIF(userId, action, reason);
    if(res.success) fetchUsers();
  };

  useEffect(()=> { fetchUsers(); }, []);

  const columns = [
    { key: 'firstName', label: 'Prénom' },
    { key: 'lastName', label: 'Nom' },
    { key: 'phoneNumber', label: 'Téléphone' },
    { key: 'nifNumber', label: 'NIF' },
    { key: 'nifStatus', label: 'Statut NIF' },
    { key: 'activityType', label: 'Activité' },
    { key: 'zone.name', label: 'Région' },
    { key: 'createdAt', label: 'Date inscription', render: row => new Date(row.createdAt).toLocaleDateString('fr-FR') },
    { key: 'actions', label: 'Actions', render: row => (
        <div className="flex gap-2">
          <button onClick={()=>handleValidateNIF(row.id,'VALIDATED')} className="bg-green-600 text-white px-2 py-1 rounded">Valider</button>
          <button onClick={()=>handleValidateNIF(row.id,'REJECTED')} className="bg-red-600 text-white px-2 py-1 rounded">Rejeter</button>
        </div>
    )}
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Liste des utilisateurs</h1>
      {loading ? <div>Chargement...</div> : <Table data={users} columns={columns}/>}
    </div>
  );
};

export default Users;
