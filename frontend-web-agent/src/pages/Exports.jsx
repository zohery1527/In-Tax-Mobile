import { useState } from 'react'
import ExportButton from '../components/Common/ExportButton'
import ExportFilters from '../components/Exports/ExportFilters'

const Exports = () => {
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    zoneId: '',
    status: '',
    activityType: ''
  })

  const exportTypes = [
    {
      id: 'users',
      title: 'Export des Utilisateurs',
      description: 'Liste complète des utilisateurs avec leurs informations et statuts',
      icon: '👥',
      filters: ['zoneId', 'status', 'activityType']
    },
    {
      id: 'declarations',
      title: 'Export des Déclarations',
      description: 'Déclarations fiscales avec statuts et montants',
      icon: '📝',
      filters: ['zoneId', 'status', 'startDate', 'endDate']
    },
    {
      id: 'payments',
      title: 'Export des Paiements',
      description: 'Transactions et historique des paiements',
      icon: '💰',
      filters: ['zoneId', 'status', 'startDate', 'endDate']
    }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Exports de Données</h1>
          <p className="text-gray-600">Générez des rapports Excel et PDF de vos données</p>
        </div>
      </div>

      {/* Filtres généraux */}
      <ExportFilters filters={filters} setFilters={setFilters} />

      {/* Cartes d'export */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {exportTypes.map((exportType) => (
          <div key={exportType.id} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <span className="text-2xl">{exportType.icon}</span>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {exportType.title}
                  </h3>
                  <p className="mt-1 text-sm text-gray-500">
                    {exportType.description}
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <ExportButton
                  dataType={exportType.id}
                  filters={filters}
                  label="Exporter les données"
                  className="w-full justify-center"
                />
              </div>

              {/* Filtres appliqués */}
              <div className="mt-4 text-xs text-gray-500">
                <div className="font-medium">Filtres appliqués:</div>
                <div className="mt-1 space-y-1">
                  {filters.zoneId && <div>• Zone spécifique</div>}
                  {filters.status && <div>• Statut: {filters.status}</div>}
                  {filters.activityType && <div>• Type: {filters.activityType}</div>}
                  {filters.startDate && <div>• À partir du: {filters.startDate}</div>}
                  {filters.endDate && <div>• Jusqu'au: {filters.endDate}</div>}
                  {!filters.zoneId && !filters.status && !filters.activityType && 
                   !filters.startDate && !filters.endDate && (
                    <div>• Toutes les données</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-blue-900 mb-2">
          📋 Instructions d'export
        </h3>
        <ul className="text-blue-800 space-y-2">
          <li>• <strong>Excel</strong>: Format idéal pour l'analyse et le traitement des données</li>
          <li>• <strong>PDF</strong>: Format adapté pour les rapports et l'archivage</li>
          <li>• Les exports incluent tous les filtres appliqués</li>
          <li>• Les données sont exportées dans la langue du système (Français)</li>
          <li>• Les formats de date respectent le format français (JJ/MM/AAAA)</li>
        </ul>
      </div>
    </div>
  )
}

export default Exports