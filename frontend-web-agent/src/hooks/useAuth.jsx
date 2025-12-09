import { createContext, useContext, useEffect, useState } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [admin, setAdmin] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      if (token) {
        const response = await authAPI.getProfile()
        setAdmin(response.data.data.admin)
        setIsAuthenticated(true)
      }
    } catch (error) {
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_profile')
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials)
      const { token, admin } = response.data.data
      
      localStorage.setItem('admin_token', token)
      localStorage.setItem('admin_profile', JSON.stringify(admin))
      
      setAdmin(admin)
      setIsAuthenticated(true)
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Erreur de connexion' 
      }
    }
  }

  const logout = () => {
    localStorage.removeItem('admin_token')
    localStorage.removeItem('admin_profile')
    setAdmin(null)
    setIsAuthenticated(false)
  }

  const value = {
    isAuthenticated,
    admin,
    loading,
    login,
    logout,
    checkAuth
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}