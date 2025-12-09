import Chart from 'chart.js/auto'
import { useEffect, useRef } from 'react'

const Charts = ({ data, period }) => {
  const revenueChartRef = useRef(null)
  const declarationsChartRef = useRef(null)
  
  useEffect(() => {
    let revenueChart, declarationsChart

    // Revenue Chart
    if (revenueChartRef.current && data.payments) {
      const ctx = revenueChartRef.current.getContext('2d')
      revenueChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.payments.labels,
          datasets: [{
            label: 'Revenu (Ar)',
            data: data.payments.values,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: `Évolution des Revenus (${period})`
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value) {
                  return new Intl.NumberFormat('fr-FR').format(value) + ' Ar';
                }
              }
            }
          }
        }
      })
    }

    // Declarations Chart
    if (declarationsChartRef.current && data.declarations) {
      const ctx = declarationsChartRef.current.getContext('2d')
      declarationsChart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.declarations.labels,
          datasets: [{
            label: 'Déclarations',
            data: data.declarations.values,
            backgroundColor: 'rgb(251, 191, 36)'
          }]
        },
        options: {
          responsive: true,
          plugins: {
            title: {
              display: true,
              text: `Déclarations Soumises (${period})`
            }
          }
        }
      })
    }

    return () => {
      if (revenueChart) revenueChart.destroy()
      if (declarationsChart) declarationsChart.destroy()
    }
  }, [data, period])

  return (
    <div className="space-y-6">
      {/* Revenue Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <canvas ref={revenueChartRef} width="400" height="200"></canvas>
      </div>

      {/* Declarations Chart */}
      <div className="bg-white p-6 rounded-lg shadow">
        <canvas ref={declarationsChartRef} width="400" height="200"></canvas>
      </div>
    </div>
  )
}

export default Charts