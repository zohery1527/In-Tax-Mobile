import { useEffect, useState } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import authService from './services/authService';

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

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = authService.getCurrentUser();
    setUser(currentUser);
  }, []);

  return (
    <div className="flex h-screen bg-gray-100">
      {user && <Sidebar user={user} />}
      <div className="flex-1 flex flex-col">
        {user && <Header user={user} setUser={setUser} />}
        <main className="p-6 overflow-auto flex-1">
          <Routes>
            {/* Routes publiques */}
            <Route path="/login" element={<Login setUser={setUser} />} />
            <Route path="/otp-verification" element={<OTPVerification setUser={setUser} />} />

            {/* Routes protégées */}
            <Route
              path="/"
              element={
                <ProtectedRoute user={user}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute user={user}>
                  <Users />
                </ProtectedRoute>
              }
            />
            <Route
              path="/declarations"
              element={
                <ProtectedRoute user={user}>
                  <Declarations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/payments"
              element={
                <ProtectedRoute user={user}>
                  <Payments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/nif-validation"
              element={
                <ProtectedRoute user={user}>
                  <NIFValidation />
                </ProtectedRoute>
              }
            />
            <Route
              path="/export"
              element={
                <ProtectedRoute user={user}>
                  <ExportData />
                </ProtectedRoute>
              }
            />

            {/* Redirection par défaut */}
            <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;
