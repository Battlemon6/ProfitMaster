import React, { useEffect, useState } from 'react';
import { financeService } from '../services/api';
import { 
    TrendingUp, TrendingDown, DollarSign, Wallet, 
    ArrowUpRight, ArrowDownRight, Calendar, Activity
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('daily'); // 'daily' veya 'monthly'
  
  // Dashboard Verileri
  const [stats, setStats] = useState({
    total_sales: 0,
    gross_profit: 0,
    total_expenses: 0,
    net_profit: 0,
    chart_data: [],
    recent_transactions: []
  });

  const fetchDashboardData = async () => {
    try {
      // Backend'e period bilgisini (daily/monthly) gönderiyoruz
      const response = await financeService.getDashboardStats(period);
      setStats(response.data);
    } catch (error) {
      console.error("Dashboard verileri alınamadı:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // 1. Sayfa açılınca veriyi çek
    fetchDashboardData();

    // 2. LIVE TRACKING: Her 5 saniyede bir veriyi arka planda yenile
    const interval = setInterval(() => {
        fetchDashboardData();
    }, 5000); // 5000ms = 5 saniye

    // 3. Sayfadan çıkınca sayacı durdur (Performans için şart)
    return () => clearInterval(interval);
  }, [period]); // Period değişirse de tetiklenir

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  if (loading && !stats.total_sales) {
      return (
        <div className="flex items-center justify-center h-screen text-gray-500">
            Veriler yükleniyor...
        </div>
      );
  }

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      
      {/* 1. BAŞLIK & LIVE GÖSTERGESİ */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Genel Bakış</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            <p className="text-gray-500 text-sm">Canlı Finansal Takip</p>
          </div>
        </div>
        <div className="bg-blue-50 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold">
          Bugün: {new Date().toLocaleDateString('tr-TR')}
        </div>
      </div>

      {/* 2. KARTLAR */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Ciro */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between">
                <div><p className="text-sm text-gray-500 font-medium">Toplam Ciro</p><h3 className="text-2xl font-bold text-gray-800 mt-2">{formatCurrency(stats.total_sales)}</h3></div>
                <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><DollarSign size={24}/></div>
            </div>
        </div>
        {/* Satış Kârı */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between">
                <div><p className="text-sm text-gray-500 font-medium">Satış Kârı (Brüt)</p><h3 className="text-2xl font-bold text-emerald-600 mt-2">+{formatCurrency(stats.gross_profit)}</h3></div>
                <div className="p-3 bg-emerald-50 rounded-xl text-emerald-600"><TrendingUp size={24}/></div>
            </div>
            <div className="mt-4 flex items-center text-xs text-emerald-600 bg-emerald-50 w-fit px-2 py-1 rounded-lg"><ArrowUpRight size={14} className="mr-1" /><span>Komisyon/Kargo düşülmüş</span></div>
        </div>
        {/* Giderler */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-red-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between">
                <div><p className="text-sm text-gray-500 font-medium">Genel Giderler</p><h3 className="text-2xl font-bold text-red-600 mt-2">-{formatCurrency(stats.total_expenses)}</h3></div>
                <div className="p-3 bg-red-50 rounded-xl text-red-600"><TrendingDown size={24}/></div>
            </div>
            <div className="mt-4 flex items-center text-xs text-red-600 font-medium"><ArrowDownRight size={14} className="mr-1" /><span>Kira, Fatura, Personel vb.</span></div>
        </div>
        {/* Net Kâr */}
        <div className={`p-6 rounded-2xl shadow-sm border hover:shadow-md transition-shadow ${stats.net_profit >= 0 ? 'bg-gradient-to-br from-green-50 to-white border-green-200' : 'bg-gradient-to-br from-red-50 to-white border-red-200'}`}>
            <div className="flex justify-between">
                <div><p className="text-sm font-bold text-gray-600">NET KÂR (Cepte Kalan)</p><h3 className={`text-2xl font-extrabold mt-2 ${stats.net_profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>{formatCurrency(stats.net_profit)}</h3></div>
                <div className={`p-3 rounded-xl ${stats.net_profit >= 0 ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}><Wallet size={24}/></div>
            </div>
            <div className="mt-4 text-xs text-gray-500 font-medium border-t border-gray-200 pt-2">= Satış Kârı - Genel Giderler</div>
        </div>
      </div>

      {/* 3. GRAFİK VE TABLO */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Grafik */}
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                      <TrendingUp size={20} className="text-blue-600"/>
                      {period === 'daily' ? 'Son 30 Günlük Kâr' : 'Son 12 Aylık Kâr'}
                  </h3>
                  <div className="bg-gray-100 p-1 rounded-lg flex text-sm shadow-inner">
                      <button onClick={() => setPeriod('daily')} className={`px-3 py-1.5 rounded-md transition-all text-xs font-medium ${period === 'daily' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Günlük</button>
                      <button onClick={() => setPeriod('monthly')} className={`px-3 py-1.5 rounded-md transition-all text-xs font-medium ${period === 'monthly' ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>Aylık</button>
                  </div>
              </div>
              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={stats.chart_data}>
                        <defs><linearGradient id="colorProfit" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient></defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} tickFormatter={(value) => `₺${value}`} />
                        <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} formatter={(value) => [`₺${value}`, "Net Kâr"]} />
                        <Area type="monotone" dataKey="profit" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorProfit)" animationDuration={1000} />
                    </AreaChart>
                </ResponsiveContainer>
              </div>
          </div>

          {/* Son İşlemler */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2"><Calendar size={20} className="text-orange-500"/>Son İşlemler</h3>
              <div className="space-y-3 overflow-y-auto max-h-[320px] pr-2 custom-scrollbar">
                  {stats.recent_transactions.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-gray-400"><Activity className="mb-2 opacity-50"/><p>Henüz işlem yok.</p></div>
                  ) : (
                      stats.recent_transactions.map((tx) => (
                          <div key={tx.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors border border-gray-100 group">
                              <div className="flex items-center gap-3">
                                  <div className={`w-2 h-10 rounded-full flex-shrink-0 ${tx.transaction_type === 'SALE' ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                  <div className="overflow-hidden">
                                      <p className="font-medium text-gray-800 text-sm truncate w-32 md:w-40" title={tx.product_details?.name}>{tx.product_details?.name || 'Bilinmeyen Ürün'}</p>
                                      <p className="text-xs text-gray-500">{new Date(tx.transaction_date).toLocaleDateString('tr-TR')}</p>
                                  </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                  <p className={`font-bold text-sm ${tx.transaction_type === 'SALE' ? 'text-green-600' : 'text-red-600'}`}>{tx.transaction_type === 'SALE' ? '+' : '-'}{formatCurrency(tx.sale_price)}</p>
                                  <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full inline-block mt-1">{tx.marketplace_details?.name || '-'}</span>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </div>
      </div>
    </div>
  );
}