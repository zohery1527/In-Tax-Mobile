import React, { useState } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import Swal from 'sweetalert2'

const Header = ({ setSidebarOpen }) => {
  const { admin, logout } = useAuth()
  const navigate = useNavigate()
  const [profileOpen, setProfileOpen] = useState(false)

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: 'Déconnexion',
      text: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, se déconnecter',
      cancelButtonText: 'Annuler'
    })

    if (result.isConfirmed) {
      logout()
      navigate('/login')
    }
  }

  return (
    <header className="flex-shrink-0 relative h-16 bg-white shadow-sm z-10">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Menu button */}
        <button
          className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 lg:hidden"
          onClick={() => setSidebarOpen(true)}
        >
          <span className="sr-only">Ouvrir le menu</span>
          <span className="text-lg">☰</span>
        </button>

        <div className="flex-1 flex justify-between items-center">
          <div className="flex flex-col">
            <h1 className="text-2xl font-semibold text-gray-900">
              Tableau de Bord
            </h1>
            <p className="text-sm text-gray-500">
              {admin?.scope === 'GLOBAL' ? 'Administration globale' : `Zone: ${admin?.zones?.[0]?.name}`}
            </p>
          </div>

          {/* Profile dropdown */}
          <div className="ml-4 relative flex-shrink-0">
            <div>
              <button
                className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={() => setProfileOpen(!profileOpen)}
              >
                <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {admin?.fullName?.charAt(0) || 'A'}
                  </span>
                </div>
              </button>
            </div>

            {profileOpen && (
              <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5">
                <div className="py-1">
                  <div className="px-4 py-2 text-sm text-gray-700 border-b">
                    <div className="font-medium">{admin?.fullName}</div>
                    <div className="text-gray-500">{admin?.email}</div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setProfileOpen(false)
                      navigate('/admin/profile')
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Mon profil
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Déconnexion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header