import { useEffect, useState } from 'react';
import Card from '../components/Card';
import Chart from '../components/Chart';
import { getDashboard, getSummary } from '../services/dashboardService';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [summary, setSummary] = useState(null);

  useEffect(()=>{
    const fetchData = async () => {
      const dashRes = await getDashboard();
      if(dashRes.success) setStats(dashRes.data.stats);
      const sumRes = await getSummary();
      if(sumRes.success) setSummary(sumRes.data);
    };
    fetchData();
  }, []);

  if(!stats || !summary) return <div>Chargement...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card title="Total Users" value={stats.totalUsers}/>
        <Card title="Total Declarations" value={stats.totalDeclarations}/>
        <Card title="Total Payments" value={stats.totalPayments}/>
        <Card title="Total Revenue" value={`${stats.totalRevenue} MGA`}/>
        <Card title="Pending Declarations" value={stats.pendingDeclarations}/>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Chart type="bar" data={summary.revenueByRegion} xKey="region" yKey="revenue" title="Revenus par région"/>
        <Chart type="line" data={summary.monthlyStats} xKey="month" yKey="totalRevenue" title="Revenus mensuels"/>
      </div>
    </div>
  );
};

export default Dashboard;
