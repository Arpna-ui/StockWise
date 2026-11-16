import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import { ToastProvider } from './components/common/Toast';
import { MainLayout } from './components/layout/MainLayout';
import { ProtectedRoute } from './components/common/ProtectedRoute';

// 11 Frontend Pages + Auth Utilities
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Markets } from './pages/Markets';
import { StockDetails } from './pages/StockDetails';
import { Portfolio } from './pages/Portfolio';
import { Watchlist } from './pages/Watchlist';
import { Transactions } from './pages/Transactions';
import { News } from './pages/News';
import { Profile } from './pages/Profile';
import { Settings } from './pages/Settings';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WalletProvider>
          <ToastProvider>
            <BrowserRouter>
              <Routes>
              {/* Public Auth Routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/reset-password/:token" element={<ResetPassword />} />

              {/* Protected Platform Routes */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<MainLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="markets" element={<Markets />} />
                  <Route path="stock/:symbol" element={<StockDetails />} />
                  <Route path="portfolio" element={<Portfolio />} />
                  <Route path="watchlist" element={<Watchlist />} />
                  <Route path="transactions" element={<Transactions />} />
                  <Route path="news" element={<News />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Route>

              {/* Catch-all route */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        </ToastProvider>
      </WalletProvider>
    </AuthProvider>
  </ThemeProvider>
  );
}
