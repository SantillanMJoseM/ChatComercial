import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/layout/Layout';
import OrdersPage from './pages/OrdersPage';
import ChatPage from './pages/ChatPage';
import TrainingPage from './pages/TrainingPage';
import ProductsPage from './pages/ProductsPage';
import CustomersPage from './pages/CustomersPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';

function RequireAuth({ children }) {
  return localStorage.getItem('chatcomercial_token') ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={
            <RequireAuth>
              <Layout>
                <Routes>
                  <Route path="/" element={<OrdersPage />} />
                  <Route path="/chat" element={<ChatPage />} />
                  <Route path="/training" element={<TrainingPage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/customers" element={<CustomersPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                </Routes>
              </Layout>
            </RequireAuth>
          } />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}