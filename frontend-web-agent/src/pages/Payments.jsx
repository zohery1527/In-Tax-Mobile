import { useEffect, useState } from 'react';
import Table from '../components/Table';
import { confirmPaymentManual, getPayments } from '../services/paymentService';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPayments = async () => {
    setLoading(true);
    const res = await getPayments();
    if(res.success) setPayments(res.data.payments);
    setLoading(false);
  };

  const handleConfirm = async (id) => {
    const res = await confirmPaymentManual(id);
    if(res.success) fetchPayments();
  };

  useEffect(()=>{ fetchPayments(); }, []);

  const columns = [
    { key: 'amount', label: 'Montant' },
    { key: 'provider', label: 'Moyen de paiement' },
    { key: 'status', label: 'Statut' },
    { key: 'createdAt', label: 'Date', render: row => new Date(row.createdAt).toLocaleDateString('fr-FR') },
    { key: 'user.firstName', label: 'Vendeur' },
    { key: 'declaration.period', label: 'Période' },
    { key: 'actions', label: 'Actions', render: row => row.status !== 'COMPLETED' && (
      <button onClick={()=>handleConfirm(row.id)} className="bg-green-600 text-white px-2 py-1 rounded">Confirmer</button>
    )}
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Paiements</h1>
      {loading ? <div>Chargement...</div> : <Table data={payments} columns={columns}/>}
    </div>
  );
};

export default Payments;
