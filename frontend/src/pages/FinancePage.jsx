import React, { useEffect, useState } from 'react';
import { financeService, marketplaceService } from '../services/api'; // marketplaceService eklendi
import { Search, DollarSign, Plus, ArrowUpDown, Trash2, Filter } from 'lucide-react'; // Filter ikonu eklendi
import TransactionModal from '../components/TransactionModal';

export default function FinancePage() {
  const [transactions, setTransactions] = useState([]);
  const [marketplaces, setMarketplaces] = useState([]); // Pazaryeri listesi için state
  const [loading, setLoading] = useState(true);
  
  // Filtre State'leri
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMarketplace, setSelectedMarketplace] = useState(''); // Seçili Pazaryeri ID'si

  // Diğer State'ler
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'desc' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      // Hem İşlemleri hem Pazaryerlerini aynı anda çekiyoruz
      const [transRes, mpRes] = await Promise.all([
          financeService.getAll(),
          marketplaceService.getAll()
      ]);
      
      setTransactions(transRes.data);
      setMarketplaces(mpRes.data);
      setSelectedIds([]); 
    } catch (error) {
      console.error("Veriler çekilemedi", error);
    } finally {
      setLoading(false);
    }
  };

  // Yeni Ekleme
  const handleSaveTransaction = async (formData) => {
      try {
          await financeService.create(formData);
          alert("İşlem başarıyla eklendi.");
          setIsModalOpen(false);
          fetchData();
      } catch (error) {
          console.error(error);
          let errorMsg = "Bilinmeyen hata";
          if (error.response?.data) {
              if (error.response.data.detail) errorMsg = error.response.data.detail;
              else errorMsg = Object.entries(error.response.data).map(([k, v]) => `${k.toUpperCase()}: ${v}`).join("\n");
          }
          alert("Kaydedilemedi:\n" + errorMsg);
      }
  };

  // Silme İşlemleri
  const handleDelete = async (id) => {
      if (!window.confirm("Bu kaydı silmek istediğinize emin misiniz?")) return;
      try {
          await financeService.delete(id);
          setTransactions(transactions.filter(t => t.id !== id));
          setSelectedIds(selectedIds.filter(selId => selId !== id));
      } catch (error) {
          alert("Silinemedi.");
      }
  };

  const handleBulkDelete = async () => {
      if (selectedIds.length === 0) return;
      if (!window.confirm(`Seçili ${selectedIds.length} kaydı silmek istediğinize emin misiniz?`)) return;
      try {
          await financeService.bulkDelete(selectedIds);
          alert(`${selectedIds.length} kayıt başarıyla silindi.`);
          setTransactions(transactions.filter(t => !selectedIds.includes(t.id)));
          setSelectedIds([]);
      } catch (error) {
          alert("Silme işlemi başarısız oldu.");
      }
  };

  // Seçim Mantığı
  const handleSelectAll = (e) => {
      if (e.target.checked) {
          const visibleIds = filteredData.map(t => t.id);
          setSelectedIds(visibleIds);
      } else {
          setSelectedIds([]);
      }
  };

  const handleSelectRow = (id) => {
      if (selectedIds.includes(id)) {
          setSelectedIds(selectedIds.filter(selId => selId !== id));
      } else {
          setSelectedIds([...selectedIds, id]);
      }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  // --- GELİŞMİŞ FİLTRELEME VE SIRALAMA ---
  const filteredData = [...transactions]
    .filter(t => {
        // 1. Arama Metni Kontrolü
        const matchesSearch = 
            t.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.product_name && t.product_name.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // 2. Pazaryeri Filtresi Kontrolü
        // DİKKAT: Artık 't.marketplace' DEĞİL 't.marketplace_id' kullanıyoruz!
        const matchesMarketplace = selectedMarketplace 
            ? t.marketplace_id === parseInt(selectedMarketplace) 
            : true;

        return matchesSearch && matchesMarketplace;
    })
    .sort((a, b) => {
        if (!sortConfig.key) return 0;
        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];
        
        if (['sale_price', 'net_profit', 'commission_amount', 'shipping_cost'].includes(sortConfig.key)) {
            aValue = parseFloat(aValue);
            bValue = parseFloat(bValue);
        } else if (sortConfig.key === 'profit_margin') {
            const profitA = parseFloat(a.net_profit);
            const priceA = parseFloat(a.sale_price);
            aValue = priceA > 0 ? (profitA / priceA) : -999;

            const profitB = parseFloat(b.net_profit);
            const priceB = parseFloat(b.sale_price);
            bValue = priceB > 0 ? (profitB / priceB) : -999;
        } else {
            aValue = (aValue || "").toString().toLowerCase();
            bValue = (bValue || "").toString().toLowerCase();
        }
        
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

  const getSortIcon = (columnKey) => {
      if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="text-gray-400 opacity-50 ml-1 inline" />;
      return <ArrowUpDown size={14} className={`ml-1 inline ${sortConfig.direction === 'asc' ? "text-blue-600" : "text-blue-600 rotate-180"}`} />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Üst Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <DollarSign className="text-green-600" /> Finansal Hareketler
            </h1>
            {selectedIds.length > 0 && (
                <button onClick={handleBulkDelete} className="flex items-center gap-2 bg-red-100 text-red-700 px-4 py-2 rounded-lg hover:bg-red-200 transition-colors animate-pulse font-semibold">
                    <Trash2 size={18} /> {selectedIds.length} Sil
                </button>
            )}
        </div>

        <div className="flex flex-wrap gap-3 w-full md:w-auto">
            {/* PAZARYERİ FİLTRESİ (DROPDOWN) */}
            <div className="relative">
                <Filter className="absolute left-3 top-3 text-gray-500" size={18} />
                <select 
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white w-full md:w-48 cursor-pointer"
                    value={selectedMarketplace}
                    onChange={(e) => setSelectedMarketplace(e.target.value)}
                >
                    <option value="">Tüm Pazaryerleri</option>
                    {marketplaces.map(mp => (
                        <option key={mp.id} value={mp.id}>{mp.name}</option>
                    ))}
                </select>
            </div>

            {/* Arama Kutusu */}
            <div className="relative flex-grow">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Sipariş No veya Ürün Ara..." 
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors shadow-sm whitespace-nowrap">
                <Plus size={20} /> Yeni İşlem
            </button>
        </div>
      </div>

      {/* Tablo */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b">
              <tr>
                <th className="p-4 w-10">
                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer" onChange={handleSelectAll} checked={filteredData.length > 0 && selectedIds.length === filteredData.length} />
                </th>
                <th className="p-4 cursor-pointer" onClick={() => handleSort('transaction_date')}>Tarih {getSortIcon('transaction_date')}</th>
                <th className="p-4 cursor-pointer" onClick={() => handleSort('marketplace_name')}>Pazaryeri</th>
                <th className="p-4">Sipariş / Ürün</th>
                <th className="p-4 text-right cursor-pointer" onClick={() => handleSort('sale_price')}>Satış {getSortIcon('sale_price')}</th>
                <th className="p-4 text-right text-orange-600 cursor-pointer" onClick={() => handleSort('commission_amount')}>Komisyon</th>
                <th className="p-4 text-right text-blue-600">Kom. %</th>
                <th className="p-4 text-right text-purple-600 cursor-pointer" onClick={() => handleSort('shipping_cost')}>Kargo</th>
                <th className="p-4 text-right">Maliyet</th>
                <th className="p-4 text-right cursor-pointer" onClick={() => handleSort('net_profit')}>Net Kâr {getSortIcon('net_profit')}</th>
                <th className="p-4 text-right cursor-pointer" onClick={() => handleSort('profit_margin')}>Kâr % {getSortIcon('profit_margin')}</th>
                <th className="p-4 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="12" className="p-6 text-center text-gray-500">Yükleniyor...</td></tr>
              ) : filteredData.length === 0 ? (
                <tr><td colSpan="12" className="p-6 text-center text-gray-500">Kayıt bulunamadı.</td></tr>
              ) : (
                filteredData.map((item) => {
                    const profit = parseFloat(item.net_profit);
                    const productCost = parseFloat(item.cost_at_transaction) * item.quantity;
                    const salePrice = parseFloat(item.sale_price);
                    const commission = parseFloat(item.commission_amount);
                    const shipping = parseFloat(item.shipping_cost);
                    const isSelected = selectedIds.includes(item.id);

                    const commissionRate = salePrice > 0 ? ((commission / salePrice) * 100).toFixed(1) : 0;
                    const profitMargin = salePrice > 0 ? ((profit / salePrice) * 100).toFixed(1) : 0;

                    return (
                      <tr key={item.id} className={`transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                        <td className="p-4">
                            <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer" checked={isSelected} onChange={() => handleSelectRow(item.id)} />
                        </td>
                        <td className="p-4 whitespace-nowrap text-gray-500">
                            {new Date(item.transaction_date).toLocaleDateString('tr-TR')}
                        </td>
                        <td className="p-4">
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-semibold border border-gray-200">
                                {item.marketplace_name}
                            </span>
                        </td>
                        <td className="p-4">
                            <div className="font-mono text-xs text-blue-600 mb-1">{item.order_number}</div>
                            <div className="font-medium text-gray-800 text-xs truncate max-w-[150px]" title={item.product_name}>{item.product_name || '-'}</div>
                        </td>
                        <td className="p-4 text-right font-semibold text-gray-800">
                            ₺{salePrice.toFixed(2)}
                        </td>
                        <td className="p-4 text-right text-orange-600 text-sm">
                            -₺{commission.toFixed(2)}
                        </td>
                        <td className="p-4 text-right text-blue-600 text-xs font-bold bg-blue-50">
                            %{commissionRate}
                        </td>
                        <td className="p-4 text-right text-purple-600 text-sm">
                            -₺{shipping.toFixed(2)}
                        </td>
                        <td className="p-4 text-right text-gray-400 text-sm">
                            -₺{productCost.toFixed(2)}
                        </td>
                        <td className={`p-4 text-right font-bold ${profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {profit >= 0 ? '+' : ''}₺{profit.toFixed(2)}
                        </td>
                        <td className={`p-4 text-right font-bold text-sm ${profitMargin >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            %{profitMargin}
                        </td>
                        <td className="p-4 text-center">
                            <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-600 transition-colors p-2">
                                <Trash2 size={16} />
                            </button>
                        </td>
                      </tr>
                    );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <TransactionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={() => fetchTransactions()}
      />
    </div>
  );
}