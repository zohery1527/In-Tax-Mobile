import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: '📊', permission: 'dashboard:view' },
  { name: 'Utilisateurs', href: '/admin/users', icon: '👥', permission: 'user:view' },
  { name: 'Déclarations', href: '/admin/declarations', icon: '📝', permission: 'declaration:view' },
  { name: 'Paiements', href: '/admin/payments', icon: '💰', permission: 'payment:view' },
  { name: 'Validation NIF', href: '/admin/nif', icon: '🆔', permission: 'nif:validate' },
  { name: 'Exports', href: '/admin/exports', icon: '📤', permission: 'report:export' },
  { name: 'Audit', href: '/admin/audit', icon: '📋', permission: 'audit:view', role: 'SUPER_ADMIN' },
  { name: 'Système', href: '/admin/system', icon: '⚙️', permission: 'system:config', role: 'SUPER_ADMIN' },
]

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation()
  const { admin } = useAuth()

  const hasPermission = (item) => {
    if (item.role && admin.role !== item.role) return false
    if (item.permission && !admin.permissions?.includes(item.permission)) return false
    return true
  }

  const filteredNavigation = navigation.filter(hasPermission)

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div 
          className="fixed inset-0 flex z-40 lg:hidden"
          onClick={() => setOpen(false)}
        >
          <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
        </div>
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 flex flex-col z-50 w-64 bg-gray-800 transform transition duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-center h-16 px-4 bg-gray-900">
          <div className="flex items-center">
            <span className="text-white text-xl font-bold">IN-TAX ADMIN</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
          {filteredNavigation.map((item) => {
            const isActive = location.pathname === item.href
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors
                  ${isActive 
                    ? 'bg-gray-900 text-white' 
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }
                `}
                onClick={() => setOpen(false)}
              >
                <span className="mr-3 text-lg">{item.icon}</span>
                {item.name}
              </Link>
            )
          })}
        </nav>

        {/* User info */}
        <div className="flex-shrink-0 flex bg-gray-700 p-4">
          <div className="flex items-center">
            <div className="ml-3">
              <p className="text-sm font-medium text-white">{admin?.fullName}</p>
              <p className="text-xs font-medium text-gray-300">{admin?.role}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Sidebar