import { useEffect, useState } from "react";
import Swal from "sweetalert2";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import Table from "../components/Table";
import { getUsers } from "../services/adminServices";

export default function Users(){
  const [users, setUsers] = useState([]);

  const load = async () => {
    try{
      const res = await getUsers();
      setUsers(res.data.data.users || res.data.data || []);
    }catch(e){
      console.error(e);
      Swal.fire("Erreur", "Impossible de charger les utilisateurs", "error");
    }
  };

  useEffect(()=>{ load(); }, []);

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <main className="p-6">
          <h1 className="text-2xl font-bold mb-4">Utilisateurs</h1>
          <Table
            columns={[
              { key: "id", title: "ID" },
              { key: "fullname", title: "Nom" },
              { key: "phoneNumber", title: "Téléphone" },
              { key: "nifNumber", title: "NIF" },
              { key: "nifStatus", title: "Statut NIF" }
            ]}
            data={users}
          />
        </main>
      </div>
    </div>
  );
}
