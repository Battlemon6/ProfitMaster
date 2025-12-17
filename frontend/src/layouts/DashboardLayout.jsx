import React from 'react';
import { LayoutDashboard, Upload, Package, Wallet } from 'lucide-react';
import { Link, Outlet } from 'react-router-dom';


const SidebarItem = ({ icon: Icon, label, to }) => (
  <Link to={to} className="flex items-center gap-3 p-3 text-gray-300 hover:bg-gray-800 hover:text-white rounded-lg transition-colors">
    <Icon size={20} />
    <span className="font-medium">{label}</span>
  </Link>
);

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-gray-900 text-white p-6">
        <h1 className="text-2xl font-bold mb-10 text-blue-400">ProfitMaster</h1>
        <nav className="space-y-2">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" to="/" />
          <SidebarItem icon={Upload} label="Excel Yükle" to="/upload" />
          <SidebarItem icon={Wallet} label="Finans & Satışlar" to="/finance" />
          <SidebarItem icon={Package} label="Ürünler" to="/products" />
          <SidebarItem icon={Package} label="Giderler" to="/expenses" />
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        <div className="p-8">
            {/* Burası değişen kısım olacak (Outlet) */}
            <Outlet /> 
        </div>
      </div>
    </div>
  );
}