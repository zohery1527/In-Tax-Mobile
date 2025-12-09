import { useEffect, useState } from 'react'
import { systemAPI } from '../../services/api'

const ExportFilters = ({ filters, setFilters }) => {
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
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      zoneId: '',
      status: '',
      activityType: ''
    })
  }

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(value => value !== '').length
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Filtres d'Export</h3>
          <p className="text-sm text-gray-500">
            Appliquez des filtres pour exporter des données spécifiques
          </p>
        </div>
        <div className="flex space-x-3">
          {getActiveFilterCount() > 0 && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              {getActiveFilterCount()} filtre(s) actif(s)
            </span>
          )}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          {/* Date de début */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de début
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleFilterChange('startDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Date de fin */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date de fin
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleFilterChange('endDate', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
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

          {/* Statut */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Statut
            </label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous statuts</option>
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
              <option value="PENDING">En attente</option>
              <option value="VALIDATED">Validé</option>
              <option value="REJECTED">Rejeté</option>
              <option value="COMPLETED">Complété</option>
            </select>
          </div>

          {/* Type d'activité */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type d'activité
            </label>
            <select
              value={filters.activityType}
              onChange={(e) => handleFilterChange('activityType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous types</option>
              <option value="commercant">Commerçant</option>
              <option value="service">Service</option>
              <option value="artisan">Artisan</option>
              <option value="autre">Autre</option>
            </select>
          </div>
        </div>
      )}
    </div>
  )
}

export default ExportFilters