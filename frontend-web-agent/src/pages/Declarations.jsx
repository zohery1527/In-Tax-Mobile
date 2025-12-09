import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import ExportButton from '../components/Common/ExportButton'
import DeclarationFilters from '../components/Declarations/DeclarationFilters'
import DeclarationTable from '../components/Declarations/DeclarationTable'
import { declarationsAPI } from '../services/api'

const Declarations = () => {
  const [declarations, setDeclarations] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    period: '',
    zoneId: '',
    userId: ''
  })

  useEffect(() => {
    loadDeclarations()
  }, [filters])

  const loadDeclarations = async () => {
    try {
      setLoading(true)
      const response = await declarationsAPI.getDeclarations(filters)
      setDeclarations(response.data.data.declarations)
      setPagination(response.data.data.pagination)
    } catch (error) {
      Swal.fire('Erreur', 'Impossible de charger les déclarations', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleValidateDeclaration = async (declarationId, action, reason = '') => {
    try {
      await declarationsAPI.validateDeclaration(declarationId, { action, reason })
      
      Swal.fire({
        icon: 'success',
        title: `Déclaration ${action === 'APPROVE' ? 'approuvée' : 'rejetée'}`,
        showConfirmButton: false,
        timer: 1500
      })
      
      loadDeclarations()
    } catch (error) {
      Swal.fire('Erreur', 'Action échouée', 'error')
    }
  }

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Déclarations</h1>
          <p className="text-gray-600">Validation et suivi des déclarations fiscales</p>
        </div>
        <ExportButton
          dataType="declarations"
          filters={filters}
          label="Exporter les déclarations"
        />
      </div>

      {/* Filters */}
      <DeclarationFilters filters={filters} setFilters={setFilters} />

      {/* Declarations Table */}
      <DeclarationTable
        declarations={declarations}
        loading={loading}
        pagination={pagination}
        onValidate={handleValidateDeclaration}
        onPageChange={handlePageChange}
      />
    </div>
  )
}

export default Declarations