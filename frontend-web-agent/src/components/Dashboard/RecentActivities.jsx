
const RecentActivities = ({ activities }) => {
  const getActivityIcon = (type) => {
    const icons = {
      LOGIN: '🔐',
      LOGOUT: '🚪',
      CREATE: '➕',
      UPDATE: '✏️',
      DELETE: '🗑️',
      VALIDATE: '✅',
      REJECT: '❌'
    }
    return icons[type] || '📝'
  }

  const getActivityColor = (type) => {
    const colors = {
      LOGIN: 'text-green-600',
      LOGOUT: 'text-gray-600',
      CREATE: 'text-blue-600',
      UPDATE: 'text-yellow-600',
      DELETE: 'text-red-600',
      VALIDATE: 'text-green-600',
      REJECT: 'text-red-600'
    }
    return colors[type] || 'text-gray-600'
  }

  return (
    <div className="bg-white shadow rounded-lg">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Activités Récentes</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {activities.slice(0, 8).map((activity, index) => (
          <div key={index} className="px-6 py-4">
            <div className="flex items-center">
              <div className={`text-lg ${getActivityColor(activity.type)}`}>
                {getActivityIcon(activity.type)}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-900">
                  {activity.description}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(activity.timestamp).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default RecentActivities