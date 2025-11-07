import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Table from "../components/Table";
import { getPendingDeclarations, validateDeclaration } from "../services/adminServices";

export default function Declarations(){
  const [data, setData] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const load = async (p=1) => {
    try{
      const res = await getPendingDeclarations(p);
      const d = res.data.data;
      setData(d.declarations || []);
      setPage(d.page || p);
      setTotalPages(d.totalPages || 1);
    }catch(err){
      console.error(err);
      Swal.fire("Erreur", "Impossible de charger", "error");
    }
  };

  useEffect(()=>{ load(1); }, []);

  const handleValidate = async (id) => {
    const r = await Swal.fire({
      title: "Valider la déclaration ?",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Valider"
    });
    if(r.isConfirmed){
      try{
        await validateDeclaration(id);
        Swal.fire("Succès", "Déclaration validée", "success");
        load(page);
      }catch(e){
        Swal.fire("Erreur", "La validation a échoué", "error");
      }
    }
  };

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <main className="p-6">
          <h1 className="text-2xl font-bold mb-4">Déclarations en attente</h1>
          <Table
            columns={[
              { key: "id", title: "ID" },
              { key: "user", title: "Vendeur", render: r => `${r.user?.firstName || r.user?.fullname || '-'} ${r.user?.lastName || ''}` },
              { key: "period", title: "Période" },
              { key: "revenue", title: "Revenu", render: r => `${r.revenue || r.amount || 0} Ar` }
            ]}
            data={data}
            actions={(row) => <button onClick={()=>handleValidate(row.id)} className="bg-green-600 text-white px-3 py-1 rounded">Valider</button>}
          />

          <div className="mt-4 flex gap-2">
            <button disabled={page<=1} onClick={()=>load(page-1)} className="px-3 py-1 border rounded">Préc</button>
            <div className="px-3 py-1 border rounded">Page {page} / {totalPages}</div>
            <button disabled={page>=totalPages} onClick={()=>load(page+1)} className="px-3 py-1 border rounded">Suiv</button>
          </div>
        </main>
      </div>
    </div>
  );
}
