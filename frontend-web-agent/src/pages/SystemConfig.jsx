import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import { systemAPI } from '../services/api'

const SystemConfig = () => {
  const [configs, setConfigs] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingKey, setEditingKey] = useState(null)
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    loadConfigs()
  }, [])

  const loadConfigs = async () => {
    try {
      const response = await systemAPI.getConfig()
      setConfigs(response.data.data.configs)
    } catch (error) {
      Swal.fire('Erreur', 'Impossible de charger la configuration', 'error')
    } finally {
      setLoading(false)
    }
  }

  const startEditing = (config) => {
    setEditingKey(config.key)
    setEditValue(config.value)
  }

  const cancelEditing = () => {
    setEditingKey(null)
    setEditValue('')
  }

  const saveConfig = async (key) => {
    try {
      await systemAPI.updateConfig({ key, value: editValue })
      Swal.fire('Succès', 'Configuration mise à jour', 'success')
      setEditingKey(null)
      loadConfigs()
    } catch (error) {
      Swal.fire('Erreur', 'Échec de la mise à jour', 'error')
    }
  }

  const groupedConfigs = configs.reduce((groups, config) => {
    const category = config.category || 'OTHER'
    if (!groups[category]) groups[category] = []
    groups[category].push(config)
    return groups
  }, {})

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Configuration Système</h1>
          <p className="text-gray-600">Paramètres globaux de la plateforme</p>
        </div>
      </div>

      {Object.entries(groupedConfigs).map(([category, categoryConfigs]) => (
        <div key={category} className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              {category === 'SYSTEM' ? 'Système' : 
               category === 'PAYMENT' ? 'Paiements' :
               category === 'TAX' ? 'Taxes' : category}
            </h3>
          </div>
          
          <div className="divide-y divide-gray-200">
            {categoryConfigs.map((config) => (
              <div key={config.key} className="px-6 py-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="text-sm font-medium text-gray-900">
                        {config.key}
                      </h4>
                      {config.description && (
                        <span className="ml-2 text-xs text-gray-500">
                          ({config.description})
                        </span>
                      )}
                    </div>
                    
                    {editingKey === config.key ? (
                      <div className="mt-2 flex space-x-2">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={() => saveConfig(config.key)}
                          className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        >
                          Sauvegarder
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-3 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                        >
                          Annuler
                        </button>
                      </div>
                    ) : (
                      <div className="mt-1 flex items-center">
                        <p className="text-sm text-gray-600">{config.value}</p>
                        <button
                          onClick={() => startEditing(config)}
                          className="ml-4 text-sm text-blue-600 hover:text-blue-900"
                        >
                          Modifier
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export default SystemConfig