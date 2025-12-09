import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import ExportButton from '../components/Common/ExportButton'
import UserFilters from '../components/Users/UserFilters'
import UserTable from '../components/Users/UserTable'
import { usersAPI } from '../services/api'

const Users = () => {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    search: '',
    status: '',
    activityType: '',
    zoneId: ''
  })

  useEffect(() => {
    loadUsers()
  }, [filters])

  const loadUsers = async () => {
    try {
      setLoading(true)
      const response = await usersAPI.getUsers(filters)
      setUsers(response.data.data.users)
      setPagination(response.data.data.pagination)
    } catch (error) {
      Swal.fire('Erreur', 'Impossible de charger les utilisateurs', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (userId, isActive) => {
    const result = await Swal.fire({
      title: 'Confirmer',
      text: `Êtes-vous sûr de vouloir ${isActive ? 'activer' : 'désactiver'} cet utilisateur ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Confirmer',
      cancelButtonText: 'Annuler'
    })

    if (result.isConfirmed) {
      try {
        await usersAPI.updateUserStatus(userId, { isActive })
        Swal.fire('Succès', `Utilisateur ${isActive ? 'activé' : 'désactivé'}`, 'success')
        loadUsers()
      } catch (error) {
        Swal.fire('Erreur', 'Action échouée', 'error')
      }
    }
  }

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
          <p className="text-gray-600">Liste et gestion des utilisateurs de la plateforme</p>
        </div>
        <ExportButton
          dataType="users"
          filters={filters}
          label="Exporter les utilisateurs"
        />
      </div>

      {/* Filters */}
      <UserFilters filters={filters} setFilters={setFilters} />

      {/* Users Table */}
      <UserTable
        users={users}
        loading={loading}
        pagination={pagination}
        onUpdateStatus={handleUpdateStatus}
        onPageChange={handlePageChange}
      />
    </div>
  )
}

export default Users