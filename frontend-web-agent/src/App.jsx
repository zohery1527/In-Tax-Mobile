import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Declarations from "./pages/Declarations";
import Login from "./pages/Login";
import Payments from "./pages/Payments";
import Profile from "./pages/Profile";
import Users from "./pages/Users";

export default function App(){
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />

      <Route path="/dashboard" element={
        <ProtectedRoute><Dashboard /></ProtectedRoute>
      } />

      <Route path="/declarations" element={
        <ProtectedRoute><Declarations /></ProtectedRoute>
      } />

      <Route path="/payments" element={
        <ProtectedRoute><Payments /></ProtectedRoute>
      } />

      <Route path="/users" element={
        <ProtectedRoute><Users /></ProtectedRoute>
      } />

      <Route path="/profile" element={
        <ProtectedRoute><Profile /></ProtectedRoute>
      } />

      <Route path="*" element={<div className="p-6">Page non trouvée</div>} />
    </Routes>
  );
}
