import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import QRScanner from './pages/QRScanner';
import History from './pages/History';
import AccountManagement from './pages/AccountManagement';
import VehicleDetail from './pages/VehicleDetail';
import VehicleList from './pages/VehicleList';
import OrderForm from './pages/OrderForm';
import OrderConfirm from './pages/OrderConfirm';
import OrderDetail from './pages/OrderDetail';
import ChangePassword from './pages/ChangePassword';
import PWAInstallButton from './components/PWAInstallButton';
import { AuthProvider } from './context/AuthContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/scan" element={<QRScanner />} />
            <Route path="/history" element={<History />} />
            <Route path="/account-management" element={<AccountManagement />} />
            <Route path="/vehicle/:id" element={<VehicleDetail />} />
            <Route path="/vehicle-list" element={<VehicleList />} />
            <Route path="/order-form" element={<OrderForm />} />
            <Route path="/order-confirm" element={<OrderConfirm />} />
            <Route path="/order-detail/:id" element={<OrderDetail />} />
            <Route path="/change-password" element={<ChangePassword />} />
          </Routes>
          <PWAInstallButton />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 