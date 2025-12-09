import { useEffect, useState } from 'react'
import Charts from '../components/Dashboard/Charts'
import RecentActivities from '../components/Dashboard/RecentActivities'
import StatsCards from '../components/Dashboard/StatsCards'
import { dashboardAPI } from '../services/api'

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null)
  const [chartsData, setChartsData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [period, setPeriod] = useState('month')

  useEffect(() => {
    loadDashboardData()
  }, [period])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const [dashboardResponse, chartsResponse] = await Promise.all([
        dashboardAPI.getDashboard(),
        dashboardAPI.getCharts(period)
      ])
      
      setDashboardData(dashboardResponse.data.data)
      setChartsData(chartsResponse.data.data)
    } catch (error) {
      console.error('Error loading dashboard:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord</h1>
          <p className="text-gray-600">Aperçu général de la plateforme</p>
        </div>
        
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="week">Cette semaine</option>
          <option value="month">Ce mois</option>
          <option value="year">Cette année</option>
        </select>
      </div>

      {/* Stats Cards */}
      {dashboardData?.stats && (
        <StatsCards stats={dashboardData.stats} />
      )}

      {/* Charts & Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {chartsData && (
          <Charts data={chartsData} period={period} />
        )}
        
        {/* Recent Activities */}
        {dashboardData?.recentActivities && (
          <RecentActivities activities={dashboardData.recentActivities} />
        )}
      </div>
    </div>
  )
}

export default Dashboard