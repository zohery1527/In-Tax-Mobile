import { useEffect, useState } from 'react';
import Table from '../components/Table';
import { getPendingDeclarations, validateDeclaration } from '../services/declarationService';

const Declarations = () => {
  const [declarations, setDeclarations] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDeclarations = async () => {
    setLoading(true);
    const res = await getPendingDeclarations();
    if(res.success) setDeclarations(res.data.declarations);
    setLoading(false);
  };

  const handleValidate = async (id) => {
    const res = await validateDeclaration(id);
    if(res.success) fetchDeclarations();
  };

  useEffect(()=> { fetchDeclarations(); }, []);

  const columns = [
    { key: 'period', label: 'Période' },
    { key: 'amount', label: 'Montant' },
    { key: 'taxAmount', label: 'Taxe' },
    { key: 'status', label: 'Statut' },
    { key: 'activityType', label: 'Activité' },
    { key: 'user.firstName', label: 'Vendeur' },
    { key: 'user.zone.name', label: 'Région' },
    { key: 'createdAt', label: 'Date', render: row => new Date(row.createdAt).toLocaleDateString('fr-FR') },
    { key: 'actions', label: 'Actions', render: row => (
      <button onClick={()=>handleValidate(row.id)} className="bg-green-600 text-white px-2 py-1 rounded">Valider</button>
    )}
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Déclarations en attente</h1>
      {loading ? <div>Chargement...</div> : <Table data={declarations} columns={columns}/>}
    </div>
  );
};

export default Declarations;
