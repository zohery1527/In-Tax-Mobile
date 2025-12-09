import { useEffect, useState } from 'react'
import { systemAPI } from '../../services/api'

const DeclarationFilters = ({ filters, setFilters }) => {
  const [zones, setZones] = useState([])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    loadZones()
  }, [])

  const loadZones = async () => {
    try {
      const response = await systemAPI.getZones()
      setZones(response.data.data.zones)
    } catch (error) {
      console.error('Error loading zones:', error)
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 20,
      status: '',
      period: '',
      zoneId: '',
      userId: ''
    })
  }

  // Générer les périodes (6 derniers mois)
  const generatePeriods = () => {
    const periods = []
    const date = new Date()
    for (let i = 0; i < 6; i++) {
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      periods.push(`${year}-${month}`)
      date.setMonth(date.getMonth() - 1)
    }
    return periods
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filtres</h3>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            {showFilters ? 'Masquer' : 'Afficher'} les filtres
          </button>
          <button
            onClick={clearFilters}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
          >
            Réinitialiser
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous</option>
              <option value="PENDING">En attente</option>
              <option value="VALIDATED">Validée</option>
              <option value="REJECTED">Rejetée</option>
              <option value="PARTIALLY_PAID">Partiellement payée</option>
              <option value="PAID">Payée</option>
            </select>
          </div>

          {/* Period */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Période
            </label>
            <select
              value={filters.period}
              onChange={(e) => handleFilterChange('period', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Toutes</option>
              {generatePeriods().map(period => (
                <option key={period} value={period}>
                  {period}
                </option>
              ))}
            </select>
          </div>

          {/* Zone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Zone
            </label>
            <select
              value={filters.zoneId}
              onChange={(e) => handleFilterChange('zoneId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Toutes les zones</option>
              {zones.map(zone => (
                <option key={zone.id} value={zone.id}>
                  {zone.name} ({zone.region})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

export default DeclarationFilters