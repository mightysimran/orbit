import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginPage from "./pages/LoginPage";
import Sidebar from "./components/Sidebar";
import Navbar from "./components/Navbar";
import PendingDriversPage from "./pages/PendingDriversPage";
import PendingVerificationsPage from "./pages/PendingVerificationsPage";

const AdminLayout = ({ children }) => {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "#F8FAFC",
      }}
    >
      <Sidebar />
      <div
        style={{
          flex: 1,
          marginLeft: "250px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Navbar />
        {children}
      </div>
    </div>
  );
};

const ProtectedRoute = ({ children }) => {
  const { isAdminLoggedIn, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!isAdminLoggedIn) return <Navigate to="/login" replace />;

  return <AdminLayout>{children}</AdminLayout>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/verifications"
            element={
              <ProtectedRoute>
                <PendingVerificationsPage />
              </ProtectedRoute>
            }
          />

          {/* Temporary fallbacks for the other sidebar links */}
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <div style={{ padding: "30px" }}>
                  All Users Page (Coming Soon)
                </div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/driver-approvals"
            element={
              <ProtectedRoute>
                <PendingDriversPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reports"
            element={
              <ProtectedRoute>
                <div style={{ padding: "30px" }}>Reports (Coming Soon)</div>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/verifications" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
