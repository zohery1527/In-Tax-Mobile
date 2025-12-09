import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import NIFFilters from '../components/NIF/NIFFilters'
import NIFTable from '../components/NIF/NIFTable'
import { nifAPI } from '../services/api'

const NIFValidation = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    zoneId: ''
  })

  useEffect(() => {
    loadPendingNIF()
  }, [filters])

  const loadPendingNIF = async () => {
    try {
      setLoading(true)
      const response = await nifAPI.getPendingNIF(filters)
      setUsers(response.data.data.users)
      setPagination(response.data.data.pagination)
    } catch (error) {
      Swal.fire('Erreur', 'Impossible de charger les demandes NIF', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleValidateNIF = async (userId, action, nifNumber = '', reason = '') => {
    try {
      await nifAPI.validateNIF(userId, { action, nifNumber, rejectionReason: reason })
      
      Swal.fire({
        icon: 'success',
        title: `NIF ${action === 'APPROVE' ? 'validé' : 'rejeté'}`,
        showConfirmButton: false,
        timer: 1500
      })
      
      loadPendingNIF()
    } catch (error) {
      Swal.fire('Erreur', error.response?.data?.message || 'Action échouée', 'error')
    }
  }

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Validation des NIF</h1>
          <p className="text-gray-600">Gestion des demandes de numéro d'identification fiscale</p>
        </div>
        <div className="text-sm text-gray-500">
          {pagination.total} demande(s) en attente
        </div>
      </div>

      {/* Filters */}
      <NIFFilters filters={filters} setFilters={setFilters} />

      {/* NIF Table */}
      <NIFTable
        users={users}
        loading={loading}
        pagination={pagination}
        onValidate={handleValidateNIF}
        onPageChange={handlePageChange}
      />
    </div>
  )
}

export default NIFValidation