import { BarElement, CategoryScale, Chart as ChartJS, Legend, LinearScale, Tooltip } from "chart.js";
import { useEffect, useState } from "react";
import { Bar } from "react-chartjs-2";
import CardStat from "../components/CardStat";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import { getDashboard } from "../services/adminServices";

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function Dashboard(){
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });

  useEffect(()=>{
    (async ()=>{
      try{
        const res = await getDashboard();
        const d = res.data.data;
        setStats(d.stats);
        // prepare small chart (recent declarations amounts)
        const recent = d.recentDeclarations || [];
        const labels = recent.map(r => (r.user?.firstName || r.user?.fullname || "—").slice(0,10));
        const values = recent.map(r => r.revenue || r.amount || 0);
        setChartData({
          labels,
          datasets: [{
            label: "Montants récents (Ar)",
            data: values,
            backgroundColor: "rgba(37,99,235,0.7)"
          }]
        });
      }catch(err){ console.error(err); }
    })();
  },[]);

  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <main className="p-6">
          <h1 className="text-2xl font-bold mb-4">Tableau de bord</h1>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <CardStat title="Vendeurs" value={stats?.totalUsers ?? "—"} />
            <CardStat title="Déclarations" value={stats?.totalDeclarations ?? "—"} />
            <CardStat title="Paiements complétés" value={stats?.totalPayments ?? "—"} />
            <CardStat title="Revenu total (Ar)" value={stats?.totalRevenue ? Number(stats.totalRevenue).toLocaleString() : "—"} />
          </div>

          <div className="bg-white p-6 rounded-2xl shadow">
            <h2 className="font-semibold mb-3">Aperçu des montants récents</h2>
            <Bar data={chartData} />
          </div>
        </main>
      </div>
    </div>
  );
}
