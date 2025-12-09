import { useEffect, useState } from 'react'
import Swal from 'sweetalert2'
import ExportButton from '../components/Common/ExportButton'
import PaymentFilters from '../components/Payments/PaymentFilters'
import PaymentStats from '../components/Payments/PaymentStats'
import PaymentTable from '../components/Payments/PaymentTable'
import { paymentsAPI } from '../services/api'

const Payments = () => {
  const [payments, setPayments] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({})
  const [filters, setFilters] = useState({
    page: 1,
    limit: 20,
    status: '',
    provider: '',
    startDate: '',
    endDate: '',
    zoneId: ''
  })

  useEffect(() => {
    loadPayments()
  }, [filters])

  const loadPayments = async () => {
    try {
      setLoading(true)
      const response = await paymentsAPI.getPayments(filters)
      setPayments(response.data.data.payments)
      setStats(response.data.data.stats)
      setPagination(response.data.data.pagination)
    } catch (error) {
      Swal.fire('Erreur', 'Impossible de charger les paiements', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleRefund = async (paymentId) => {
    const { value: reason } = await Swal.fire({
      title: 'Raison du remboursement',
      input: 'textarea',
      inputLabel: 'Pourquoi effectuez-vous ce remboursement ?',
      inputPlaceholder: 'Entrez la raison...',
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return 'La raison du remboursement est obligatoire!'
        }
      }
    })

    if (reason) {
      try {
        await paymentsAPI.refundPayment(paymentId, { reason })
        Swal.fire('Succès', 'Paiement remboursé avec succès', 'success')
        loadPayments()
      } catch (error) {
        Swal.fire('Erreur', 'Le remboursement a échoué', 'error')
      }
    }
  }

  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }))
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Paiements</h1>
          <p className="text-gray-600">Suivi et gestion des transactions financières</p>
        </div>
        <ExportButton
          dataType="payments"
          filters={filters}
          label="Exporter les paiements"
        />
      </div>

      {/* Stats */}
      <PaymentStats stats={stats} />

      {/* Filters */}
      <PaymentFilters filters={filters} setFilters={setFilters} />

      {/* Payments Table */}
      <PaymentTable
        payments={payments}
        loading={loading}
        pagination={pagination}
        onRefund={handleRefund}
        onPageChange={handlePageChange}
      />
    </div>
  )
}

export default Payments