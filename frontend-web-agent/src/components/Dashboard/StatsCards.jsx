
const StatsCards = ({ stats }) => {
  const cards = [
    {
      title: 'Utilisateurs Totaux',
      value: stats.users?.totalUsers || 0,
      change: '+12%',
      icon: '👥',
      color: 'blue'
    },
    {
      title: 'Utilisateurs Actifs',
      value: stats.users?.activeUsers || 0,
      change: '+8%',
      icon: '✅',
      color: 'green'
    },
    {
      title: 'Déclarations en Attente',
      value: stats.declarations?.pendingDeclarations || 0,
      change: '+5%',
      icon: '📋',
      color: 'yellow'
    },
    {
      title: 'Revenu Total',
      value: `${(stats.payments?.totalRevenue || 0).toLocaleString()} Ar`,
      change: '+15%',
      icon: '💰',
      color: 'purple'
    }
  ]

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    yellow: 'bg-yellow-500',
    purple: 'bg-purple-500'
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card, index) => (
        <div key={index} className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center ${colorClasses[card.color]} bg-opacity-10`}>
                  <span className="text-lg">{card.icon}</span>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {card.title}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {card.value}
                    </div>
                    <div className="ml-2 flex items-baseline text-sm font-semibold text-green-600">
                      {card.change}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

export default StatsCards