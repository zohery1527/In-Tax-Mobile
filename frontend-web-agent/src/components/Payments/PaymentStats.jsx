
const PaymentStats = ({ stats }) => {
  const statCards = [
    {
      title: 'Revenu Total',
      value: `${(stats.totalRevenue || 0).toLocaleString()} Ar`,
      icon: '💰',
      color: 'green'
    },
    {
      title: 'Paiements Complets',
      value: stats.completedCount || 0,
      icon: '✅',
      color: 'blue'
    },
    {
      title: 'Paiements en Attente',
      value: stats.pendingCount || 0,
      icon: '⏳',
      color: 'yellow'
    }
  ]

  const colorClasses = {
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    yellow: 'bg-yellow-500'
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
      {statCards.map((card, index) => (
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
                  <dd className="text-lg font-semibold text-gray-900">
                    {card.value}
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

export default PaymentStats