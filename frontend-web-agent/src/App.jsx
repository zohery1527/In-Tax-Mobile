import { Navigate, Route, BrowserRouter as Router, Routes } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import { AuthProvider, useAuth } from './hooks/useAuth'
import AuditLogs from './pages/AuditLogs'
import Dashboard from './pages/Dashboard'
import Declarations from './pages/Declarations'
import Login from './pages/Login'
import NIFValidation from './pages/NIFValidation'
import Payments from './pages/Payments'
import SystemConfig from './pages/SystemConfig'
import Users from './pages/Users'

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth()
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          <Route path="/admin" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Dashboard />} />
            <Route path="users" element={<Users />} />
            <Route path="declarations" element={<Declarations />} />
            <Route path="payments" element={<Payments />} />
            <Route path="nif" element={<NIFValidation />} />
            <Route path="audit" element={<AuditLogs />} />
            <Route path="system" element={<SystemConfig />} />
          </Route>
          
          <Route path="/" element={<Navigate to="/admin" />} />
        </Routes>
      </Router>
    </AuthProvider>
  )
}

export default App