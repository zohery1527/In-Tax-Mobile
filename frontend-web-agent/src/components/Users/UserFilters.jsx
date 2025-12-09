import { useEffect, useState } from 'react'
import { systemAPI } from '../../services/api'

const UserFilters = ({ filters, setFilters }) => {
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
      search: '',
      status: '',
      activityType: '',
      zoneId: ''
    })
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

      {/* Search */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Rechercher par nom, téléphone ou NIF..."
          value={filters.search}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        />
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
              <option value="active">Actif</option>
              <option value="inactive">Inactif</option>
            </select>
          </div>

          {/* Activity Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Type d'activité
            </label>
            <select
              value={filters.activityType}
              onChange={(e) => handleFilterChange('activityType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tous</option>
              <option value="commercant">Commerçant</option>
              <option value="service">Service</option>
              <option value="artisan">Artisan</option>
              <option value="autre">Autre</option>
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

export default UserFilters