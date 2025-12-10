import { useState } from 'react'
import Swal from 'sweetalert2'

const NIFTable = ({ users, loading, pagination, onValidate, onPageChange }) => {
  const [validatingId, setValidatingId] = useState(null)

  // Icônes SVG (gardez les mêmes)
  const Icons = {
    User: ({ className = "h-4 w-4" }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    Phone: ({ className = "h-4 w-4" }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
      </svg>
    ),
    Location: ({ className = "h-4 w-4" }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
    Briefcase: ({ className = "h-4 w-4" }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    Calendar: ({ className = "h-4 w-4" }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
    Check: ({ className = "h-4 w-4" }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
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
    Document: ({ className = "h-4 w-4" }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    // Ajouter une icône NIF
    NIF: ({ className = "h-4 w-4" }) => (
      <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    )
  }

  // MODIFIÉ : Approuver sans demander de NIF
  const handleApprove = async (user) => {
    setValidatingId(user.id)

    // Vérifier si l'utilisateur a déjà un NIF
    if (!user.nifNumber) {
      await Swal.fire({
        icon: 'error',
        title: 'Pas de NIF',
        text: 'Cet utilisateur n\'a pas encore de numéro NIF attribué.',
      })
      setValidatingId(null)
      return
    }

    // Confirmation simple
    const result = await Swal.fire({
      title: 'Confirmer l\'approbation',
      html: `
        <div class="text-left">
          <p>Voulez-vous approuver le NIF de cet utilisateur ?</p>
          <div class="mt-4 p-3 bg-gray-50 rounded">
            <p class="text-sm text-gray-600">Utilisateur: <span class="font-semibold">${user.firstName} ${user.lastName}</span></p>
            <p class="text-sm text-gray-600">NIF: <span class="font-semibold text-green-600">${user.nifNumber}</span></p>
            <p class="text-sm text-gray-600">Activité: ${user.activityType}</p>
          </div>
        </div>
      `,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10b981',
      confirmButtonText: 'Oui, approuver',
      cancelButtonText: 'Annuler'
    })

    if (result.isConfirmed) {
      await onValidate(user.id, 'APPROVE')
    }

    setValidatingId(null)
  }

  // MODIFIÉ : Rejeter avec demande de raison
  const handleReject = async (user) => {
    setValidatingId(user.id)

    const { value: reason } = await Swal.fire({
      title: 'Raison du rejet',
      html: `
        <div class="text-left">
          <p>Pourquoi rejetez-vous la demande NIF de <strong>${user.firstName} ${user.lastName}</strong> ?</p>
          ${user.nifNumber ? `<p class="mt-2 text-sm text-gray-600">NIF: <span class="font-semibold">${user.nifNumber}</span></p>` : ''}
        </div>
      `,
      input: 'textarea',
      inputLabel: 'Raison du rejet',
      inputPlaceholder: 'Entrez la raison du rejet (minimum 10 caractères)...',
      inputAttributes: {
        minlength: 10
      },
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value || value.trim().length < 10) {
          return 'La raison du rejet est obligatoire (minimum 10 caractères)'
        }
        return null
      }
    })

    if (reason) {
      await onValidate(user.id, 'REJECT', reason)
    }

    setValidatingId(null)
  }

  const getStatusColor = (status) => {
    const colors = {
      PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      VALIDATED: 'bg-green-100 text-green-800 border-green-200',
      REJECTED: 'bg-red-100 text-red-800 border-red-200'
    }
    return colors[status] || 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const getStatusText = (status) => {
    const texts = {
      PENDING: 'En attente',
      VALIDATED: 'Validé',
      REJECTED: 'Rejeté'
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
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                  <Icons.User />
                  <span className="ml-2">Utilisateur</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                  <Icons.NIF />
                  <span className="ml-2">Numéro NIF</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                  <Icons.Location />
                  <span className="ml-2">Zone</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                  <Icons.Briefcase />
                  <span className="ml-2">Activité</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center">
                  <Icons.Calendar />
                  <span className="ml-2">Statut & Date</span>
                </div>
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-medium text-sm">
                        {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                      </span>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.firstName} {user.lastName}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center mt-1">
                        <Icons.Phone className="h-3 w-3 mr-1" />
                        {user.phoneNumber}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Icons.NIF className="h-4 w-4 mr-2 text-gray-400" />
                    <div>
                      <div className="text-sm font-mono text-gray-900">
                        {user.nifNumber || 'Non attribué'}
                      </div>
                      <div className="text-xs text-gray-500">
                        {user.nifNumber ? 'Créé automatiquement' : 'En attente'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Icons.Location className="h-4 w-4 mr-2 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-900">{user.zone?.name}</div>
                      <div className="text-sm text-gray-500">{user.zone?.region}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Icons.Briefcase className="h-4 w-4 mr-2 text-gray-400" />
                    <div>
                      <div className="text-sm text-gray-900">{user.activityType}</div>
                      <div className="text-sm text-gray-500 capitalize">
                        {user.businessType?.toLowerCase() || 'Non spécifié'}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(user.nifStatus)}`}>
                        {getStatusText(user.nifStatus)}
                      </span>
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Icons.Calendar className="h-3 w-3 mr-1 text-gray-400" />
                      {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApprove(user)}
                      disabled={validatingId === user.id || user.nifStatus !== 'PENDING'}
                      className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm rounded-md text-white ${user.nifStatus !== 'PENDING' ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'} disabled:opacity-50`}
                      title={user.nifStatus !== 'PENDING' ? 'Déjà traité' : 'Approuver'}
                    >
                      {validatingId === user.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Icons.Check />
                          <span className="ml-1">Approuver</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleReject(user)}
                      disabled={validatingId === user.id || user.nifStatus !== 'PENDING'}
                      className={`inline-flex items-center px-3 py-1.5 border border-transparent text-sm rounded-md text-white ${user.nifStatus !== 'PENDING' ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'} disabled:opacity-50`}
                      title={user.nifStatus !== 'PENDING' ? 'Déjà traité' : 'Rejeter'}
                    >
                      <Icons.XMark />
                      <span className="ml-1">Rejeter</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {users.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400">
            <Icons.Document className="h-12 w-12" />
          </div>
          <h3 className="mt-2 text-sm font-medium text-gray-900">Aucune demande NIF en attente</h3>
          <p className="mt-1 text-sm text-gray-500">Toutes les demandes NIF ont été traitées.</p>
        </div>
      )}

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
    </div>
  )
}

export default NIFTable