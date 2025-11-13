import { CheckIcon, XIcon } from '@heroicons/react/outline';
import { useEffect, useState } from 'react';
import Table from '../components/Table';
import { getUsers, validateNIF } from '../services/userService';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await getUsers();
    if (res.success) setUsers(res.data.users);
    setLoading(false);
  };

  const handleValidateNIF = async (userId, action) => {
    const reason = action === 'REJECTED' ? prompt('Motif du rejet') : '';
    const res = await validateNIF(userId, action, reason);
    if (res.success) fetchUsers();
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const columns = [
    { key: 'firstName', label: 'Prénom' },
    { key: 'lastName', label: 'Nom' },
    { key: 'phoneNumber', label: 'Téléphone' },
    { key: 'nifNumber', label: 'NIF' },
    {
      key: 'nifStatus',
      label: 'Statut NIF',
      render: (row) => (
        <span
          className={`px-3 py-1 rounded-full text-sm font-medium ${
            row.nifStatus === 'VALIDATED'
              ? 'bg-green-100 text-green-700'
              : row.nifStatus === 'REJECTED'
              ? 'bg-red-100 text-red-700'
              : 'bg-yellow-100 text-yellow-700'
          }`}
        >
          {row.nifStatus}
        </span>
      ),
    },
    { key: 'activityType', label: 'Activité' },
    { key: 'zone.name', label: 'Région' },
    {
      key: 'createdAt',
      label: 'Date inscription',
      render: (row) =>
        new Date(row.createdAt).toLocaleDateString('fr-FR'),
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="flex gap-2">
          <button
            onClick={() => handleValidateNIF(row.id, 'VALIDATED')}
            className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-md text-sm transition"
          >
            <CheckIcon className="h-4 w-4" /> Valider
          </button>
          <button
            onClick={() => handleValidateNIF(row.id, 'REJECTED')}
            className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-md text-sm transition"
          >
            <XIcon className="h-4 w-4" /> Rejeter
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">
          Liste des utilisateurs
        </h1>

        <div className="bg-white shadow-md rounded-lg p-4">
          {loading ? (
            <div className="text-center py-10 text-gray-500">Chargement...</div>
          ) : (
            <Table data={users} columns={columns} />
          )}
        </div>
      </div>
    </div>
  );
};

export default Users;
