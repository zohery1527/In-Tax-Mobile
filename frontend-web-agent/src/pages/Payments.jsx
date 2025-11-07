import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Table from "../components/Table";
import { confirmPayment, getPayments } from "../services/adminServices";

export default function Payments(){
  const [payments, setPayments] = useState([]);

  const load = async () => {
    try{
      const res = await getPayments();
      setPayments(res.data.data.payments || res.data.data || []);
    }catch(e){
      console.error(e);
      Swal.fire("Erreur", "Impossible de charger les paiements", "error");
    }
  };

  useEffect(()=>{ load(); }, []);

  const handleConfirm = async (id) => {
    const r = await Swal.fire({
      title: "Confirmer manuellement ?",
      showCancelButton: true,
      confirmButtonText: "Confirmer"
    });
    if(r.isConfirmed){
      try{
        await confirmPayment(id);
        Swal.fire("Succès", "Paiement confirmé", "success");
        load();
      }catch(e){
        Swal.fire("Erreur", "Impossible de confirmer", "error");
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <main className="p-6">
          <h1 className="text-2xl font-bold mb-4">Paiements</h1>
          <Table
            columns={[
              { key: "id", title: "#" },
              { key: "user", title: "Vendeur", render: r => r.user?.fullname || r.user?.firstName || '-' },
              { key: "amount", title: "Montant", render: r => `${r.amount} Ar`},
              { key: "status", title: "Statut" },
              { key: "createdAt", title: "Date", render: r => new Date(r.createdAt).toLocaleDateString() }
            ]}
            data={payments}
            actions={(row) => row.status !== 'COMPLETED' ? <button onClick={()=>handleConfirm(row.id)} className="bg-blue-600 text-white px-3 py-1 rounded">Confirmer</button> : <span className="text-green-600">Confirmé</span>}
          />
        </main>
      </div>
    </div>
  );
}
