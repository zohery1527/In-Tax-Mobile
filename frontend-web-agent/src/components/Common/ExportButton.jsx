import { useState } from 'react'
import Swal from 'sweetalert2'
import { exportService } from '../../services/exportService'

const ExportButton = ({ 
  dataType, 
  filters = {}, 
  label = "Exporter",
  className = "" 
}) => {
  const [exporting, setExporting] = useState(false)

  const handleExport = async (format) => {
    if (exporting) return
    
    setExporting(true)
    
    try {
      let data
      
      // Appel du service d'export avec les bons paramètres
      switch (dataType) {
        case 'users':
          data = await exportService.exportUsers(filters, format)
          break
        case 'declarations':
          data = await exportService.exportDeclarations(filters, format)
          break
        case 'payments':
          data = await exportService.exportPayments(filters, format)
          break
        default:
          throw new Error('Type d\'export non supporté')
      }

      // Génération du nom de fichier
      const date = new Date().toISOString().split('T')[0]
      const filename = `${dataType}-${date}.${format === 'pdf' ? 'pdf' : 'xlsx'}`
      
      // Type MIME correct
      const mimeType = format === 'pdf' 
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

      // Téléchargement
      exportService.downloadFile(data, filename, mimeType)
      
      // Notification de succès
      await Swal.fire({
        icon: 'success',
        title: 'Export réussi !',
        text: `Votre fichier ${format.toUpperCase()} a été téléchargé.`,
        timer: 3000,
        showConfirmButton: false
      })
      
    } catch (error) {
      console.error('Export error:', error)
      
      // Gestion d'erreur
      let errorMessage = 'Une erreur est survenue lors de l\'export'
      
      if (error.message) {
        errorMessage = error.message
      }
      
      await Swal.fire({
        icon: 'error',
        title: 'Erreur d\'export',
        text: errorMessage,
        confirmButtonText: 'OK'
      })
    } finally {
      setExporting(false)
    }
  }

  const showExportOptions = async () => {
    const { value: format } = await Swal.fire({
      title: 'Choisir le format',
      input: 'select',
      inputOptions: {
        'excel': '📊 Excel (.xlsx)',
        'pdf': '📄 PDF (.pdf)'
      },
      inputPlaceholder: 'Sélectionnez un format',
      showCancelButton: true,
      confirmButtonText: 'Exporter',
      cancelButtonText: 'Annuler',
      inputValidator: (value) => {
        if (!value) {
          return 'Veuillez sélectionner un format!'
        }
      }
    })

    if (format) {
      handleExport(format)
    }
  }

  return (
    <button
      onClick={showExportOptions}
      disabled={exporting}
      className={`
        inline-flex items-center px-4 py-2 border border-transparent 
        text-sm font-medium rounded-md shadow-sm text-white 
        bg-green-600 hover:bg-green-700 focus:outline-none 
        focus:ring-2 focus:ring-offset-2 focus:ring-green-500 
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${className}
      `}
    >
      {exporting ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Export en cours...
        </>
      ) : (
        <>
          <span className="mr-2">📥</span>
          {label}
        </>
      )}
    </button>
  )
}

export default ExportButton