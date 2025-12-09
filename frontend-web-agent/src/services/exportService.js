import { exportAPI } from './api'

export const exportService = {
  // Export des utilisateurs - RESPECT DU BACKEND
  exportUsers: async (filters, format = 'excel') => {
    try {
      const params = {
        format,
        zoneId: filters.zoneId || '',
        status: filters.status || '',
        activityType: filters.activityType || ''
      }
      
      // Nettoyer les paramètres vides
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key]
      })

      const response = await exportAPI.exportUsers(params)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'export des utilisateurs')
    }
  },

  // Export des déclarations - RESPECT DU BACKEND
  exportDeclarations: async (filters, format = 'excel') => {
    try {
      const params = {
        format,
        status: filters.status || '',
        period: filters.period || '',
        zoneId: filters.zoneId || '',
        userId: filters.userId || ''
      }
      
      // Nettoyer les paramètres vides
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key]
      })

      const response = await exportAPI.exportDeclarations(params)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'export des déclarations')
    }
  },

  // Export des paiements - RESPECT DU BACKEND
  exportPayments: async (filters, format = 'excel') => {
    try {
      const params = {
        format,
        status: filters.status || '',
        provider: filters.provider || '',
        startDate: filters.startDate || '',
        endDate: filters.endDate || '',
        zoneId: filters.zoneId || ''
      }
      
      // Nettoyer les paramètres vides
      Object.keys(params).forEach(key => {
        if (!params[key]) delete params[key]
      })

      const response = await exportAPI.exportPayments(params)
      return response.data
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Erreur lors de l\'export des paiements')
    }
  },

  // Méthode utilitaire pour télécharger le fichier
  downloadFile: (data, filename, mimeType) => {
    const blob = new Blob([data], { type: mimeType })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }
}