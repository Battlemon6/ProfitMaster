import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardPage from './pages/DashboardPage'; 
import UploadPage from './pages/UploadPage';       
import ProductsPage from './pages/ProductsPage';   
import FinancePage from './pages/FinancePage';
import ExpensePage from './pages/ExpensePage'; // <--- 1. IMPORT EKLENDİ

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Ana Layout (Sidebar ve Üst Bar burada bulunur) */}
        <Route path="/" element={<DashboardLayout />}>
          
          {/* Sayfalar */}
          <Route index element={<DashboardPage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="finance" element={<FinancePage />} />
          
          {/* <--- 2. ROTA EKLENDİ: URL 'expenses' olunca ExpensePage açılacak */}
          <Route path="expenses" element={<ExpensePage />} />

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;