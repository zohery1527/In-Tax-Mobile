import { useState } from 'react'

const AuditFilters = ({ filters, setFilters }) => {
  const [showFilters, setShowFilters] = useState(false)

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }))
  }

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 50,
      action: '',
      resource: '',
      adminId: '',
      startDate: '',
      endDate: ''
    })
  }

  const auditActions = [
    'LOGIN', 'LOGOUT', 'CREATE', 'UPDATE', 'DELETE', 
    'VALIDATE', 'REJECT', 'APPROVE', 'REFUND'
  ]

  const auditResources = [
    'USER', 'DECLARATION', 'PAYMENT', 'NIF', 'SYSTEM', 'AUTH'
  ]

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium text-gray-900">Filtres d'Audit</h3>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-gray-200">
          {/* Action */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Action
            </label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Toutes les actions</option>
              {auditActions.map(action => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          {/* Resource */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ressource
            </label>
            <select
              value={filters.resource}
              onChange={(e) => handleFilterChange('resource', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Toutes les ressources</option>
              {auditResources.map(resource => (
                <option key={resource} value={resource}>
                  {resource}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Période
            </label>
            <div className="grid grid-cols-2 gap-4">
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Date de début"
              />
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Date de fin"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AuditFilters