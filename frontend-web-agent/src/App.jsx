import { Navigate, Route, Routes } from 'react-router-dom';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Declarations from './pages/Declarations';
import ExportData from './pages/ExportData';
import Login from './pages/Login';
import NIFValidation from './pages/NIFValidation';
import OTPVerification from './pages/OTPVerification';
import Payments from './pages/Payments';
import Users from './pages/Users';

function App() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <Header />

        {/* Contenu principal */}
        <main className="flex-1 p-6 overflow-auto">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/otp" element={<OTPVerification />} />

            {/* Routes protégées */}
            <Route element={<ProtectedRoute allowedRoles={['ADMIN', 'AGENT']} />}>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/users" element={<Users />} />
              <Route path="/declarations" element={<Declarations />} />
              <Route path="/payments" element={<Payments />} />
              <Route path="/nif-validation" element={<NIFValidation />} />
              <Route path="/export" element={<ExportData />} />
            </Route>

            {/* Route fallback */}
            <Route path="*" element={<div className="text-center text-red-500 text-xl">Page non trouvée</div>} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

export default App;
