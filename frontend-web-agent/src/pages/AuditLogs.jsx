import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import AuditFilters from '../components/Audit/AuditFilters'
import AuditTable from '../components/Audit/AuditTable'
import { auditAPI } from '../services/api'

const AuditLogs = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    action: '',
    resource: '',
    adminId: '',
    startDate: '',
    endDate: ''
  })

  useEffect(() => {
    loadAuditLogs()
  }, [filters])

  const loadAuditLogs = async () => {
    try {
      setLoading(true)
      const response = await auditAPI.getAuditLogs(filters)
      setLogs(response.data.data.logs)
      setPagination(response.data.data.pagination)
    } catch (error) {
      Swal.fire('Erreur', 'Impossible de charger les logs d\'audit', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Journal d'Audit</h1>
          <p className="text-gray-600">Historique complet des actions administrateurs</p>
        </div>
      </div>

      {/* Filters */}
      <AuditFilters filters={filters} setFilters={setFilters} />

      {/* Audit Table */}
      <AuditTable
        logs={logs}
        loading={loading}
        pagination={pagination}
        onPageChange={handlePageChange}
      />
    </div>
  )
}

export default AuditLogs