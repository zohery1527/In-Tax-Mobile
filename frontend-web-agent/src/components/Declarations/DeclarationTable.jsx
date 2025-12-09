import { useState } from 'react'
import Swal from 'sweetalert2'

const DeclarationTable = ({ declarations, loading, pagination, onValidate, onPageChange }) => {
  const [validatingId, setValidatingId] = useState(null)

  // Icônes SVG simples
  const Icons = {
    Calendar: ({ className = "h-4 w-4" }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    User: ({ className = "h-4 w-4" }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    Currency: ({ className = "h-4 w-4" }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    Check: ({ className = "h-4 w-4" }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    Eye: ({ className = "h-4 w-4" }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
      </svg>
    ),
    XMark: ({ className = "h-4 w-4" }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
    ChevronLeft: ({ className = "h-4 w-4" }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
    ),
    ChevronRight: ({ className = "h-4 w-4" }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    ),
    Clock: ({ className = "h-4 w-4" }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }

  const handleValidation = async (declaration, action) => {
    setValidatingId(declaration.id)

    if (action === 'APPROVE') {
      await onValidate(declaration.id, 'APPROVE')
    } else {
      const { value: reason } = await Swal.fire({
        title: 'Raison du rejet',
        input: 'textarea',
        inputLabel: 'Veuillez indiquer la raison du rejet',
        inputPlaceholder: 'Entrez la raison...',
        showCancelButton: true,
        inputValidator: (value) => {
          if (!value) {
            return 'La raison du rejet est obligatoire!'
          }
        }
      })

      if (reason) {
        await onValidate(declaration.id, 'REJECT', reason)
      }
    }

    setValidatingId(null)
  }

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      VALIDATED: 'bg-green-100 text-green-800 border-green-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200',
      PARTIALLY_PAID: 'bg-blue-100 text-blue-800 border-blue-200',
      PAID: 'bg-purple-100 text-purple-800 border-purple-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getStatusIcon = (status) => {
    const icons = {
      PENDING: <Icons.Clock />,
      VALIDATED: <Icons.Check />,
      REJECTED: <Icons.XMark />,
      PAID: <Icons.Currency />
    }
    return icons[status] || <Icons.Clock />
  }

  const getStatusText = (status) => {
    const texts = {
      PENDING: 'En attente',
      VALIDATED: 'Validée',
      REJECTED: 'Rejetée',
      PARTIALLY_PAID: 'Partiellement payée',
      PAID: 'Payée'
    }
    return texts[status] || status
  }

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-center items-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                  <Icons.Calendar />
                  <span className="ml-2">Période</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                  <Icons.User />
                  <span className="ml-2">Utilisateur</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                  <Icons.Currency />
                  <span className="ml-2">Montants</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                  <Icons.Check />
                  <span className="ml-2">Statut</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                  <Icons.Calendar />
                  <span className="ml-2">Date</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {declarations.map((declaration) => (
              <tr key={declaration.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Icons.Calendar />
                    <div className="ml-2 text-sm font-medium text-gray-900">
                      {declaration.period}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Icons.User />
                    <div className="ml-2">
                      <div className="text-sm font-medium text-gray-900">
                        {declaration.user?.firstName} {declaration.user?.lastName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {declaration.user?.phoneNumber}
                      </div>
                      <div className="text-xs text-gray-400">
                        {declaration.user?.zone?.name}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Icons.Currency />
                    <div className="ml-2">
                      <div className="text-sm text-gray-900">
                        Montant: {declaration.amount?.toLocaleString()} Ar
                      </div>
                      <div className="text-sm text-gray-500">
                        Taxe: {declaration.taxAmount?.toLocaleString()} Ar
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(declaration.status)}`}>
                      {getStatusIcon(declaration.status)}
                      <span className="ml-1">{getStatusText(declaration.status)}</span>
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  <div className="flex items-center">
                    <Icons.Calendar />
                    <span className="ml-2">
                      {new Date(declaration.createdAt).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    {/* Bouton Voir les détails */}
                    <button
                      className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      title="Voir les détails"
                    >
                      <Icons.Eye />
                    </button>
                    
                    {declaration.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleValidation(declaration, 'APPROVE')}
                          disabled={validatingId === declaration.id}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm rounded-md text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                          title="Approuver"
                        >
                          {validatingId === declaration.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          ) : (
                            <>
                              <Icons.Check />
                              <span className="ml-1">Valider</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => handleValidation(declaration, 'REJECT')}
                          disabled={validatingId === declaration.id}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm rounded-md text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                          title="Rejeter"
                        >
                          <Icons.XMark />
                          <span className="ml-1">Rejeter</span>
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
          <div className="flex-1 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-700">
                Affichage de <span className="font-medium">{((pagination.page - 1) * pagination.limit) + 1}</span> à{' '}
                <span className="font-medium">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span>{' '}
                sur <span className="font-medium">{pagination.total}</span> résultats
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => onPageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <Icons.ChevronLeft />
                <span className="ml-1">Précédent</span>
              </button>
              <button
                onClick={() => onPageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.pages}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <span className="mr-1">Suivant</span>
                <Icons.ChevronRight />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Message si tableau vide */}
      {declarations.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <Icons.Calendar className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune déclaration</h3>
          <p className="mt-1 text-sm text-gray-500">
            Aucune déclaration trouvée pour le moment.
          </p>
        </div>
      )}
    </div>
  )
}

export default DeclarationTable