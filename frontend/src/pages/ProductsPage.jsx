import React, { useEffect, useState } from 'react';
import { productService } from '../services/api';
import { Search, Package, Plus, Edit2, CheckCircle, ArrowUpDown, Trash2 } from 'lucide-react'; // Trash2 eklendi
import ProductModal from '../components/ProductModal';
import EditableCell from '../components/EditableCell';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Sıralama State'i
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Modal State'leri
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [lastSavedId, setLastSavedId] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll();
      setProducts(response.data);
    } catch (error) {
      console.error("Ürünler çekilemedi", error);
    } finally {
      setLoading(false);
    }
  };

  // --- SİLME FONKSİYONU ---
  const handleDeleteClick = async (id) => {
      // 1. Güvenlik Sorusu
      if (!window.confirm("Bu ürünü silmek istediğinize emin misiniz? \n(Dikkat: Bu işlem geri alınamaz!)")) {
          return;
      }

      // 2. Silme İsteği
      try {
          await productService.delete(id);
          
          // 3. Listeden Çıkarma (Sayfa yenilemeden)
          setProducts(products.filter(product => product.id !== id));
          alert("Ürün başarıyla silindi.");
      } catch (error) {
          console.error("Silme hatası:", error);
          // Eğer ürünün satışı varsa Django silmeye izin vermeyebilir (Protected Error)
          alert("Hata: Bu ürün silinemedi. (Geçmiş satış kaydı olan ürünler finansal tutarlılık için silinemez.)");
      }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const handleInlineUpdate = async (id, field, value) => {
      const oldProducts = [...products];
      const updatedProducts = products.map(p => 
          p.id === id ? { ...p, [field]: value } : p
      );
      setProducts(updatedProducts);

      try {
          await productService.patch(id, { [field]: value });
          setLastSavedId(id);
          setTimeout(() => setLastSavedId(null), 2000);
      } catch (error) {
          console.error("Hata:", error);
          alert("Güncelleme başarısız oldu!");
          setProducts(oldProducts);
      }
  };

  const handleSaveProduct = async (formData) => {
    try {
        if (editingProduct) {
            await productService.update(editingProduct.id, formData);
        } else {
            await productService.create(formData);
        }
        fetchProducts();
        setIsModalOpen(false);
        setEditingProduct(null);
    } catch (error) {
        alert("İşlem sırasında hata oluştu.");
    }
  };

  const handleEditClick = (product) => {
      setEditingProduct(product);
      setIsModalOpen(true);
  };

  const handleAddClick = () => {
      setEditingProduct(null);
      setIsModalOpen(true);
  };

  // Filtreleme ve Sıralama
  const processedProducts = [...products]
    .filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
        if (!sortConfig.key) return 0;

        let aValue = a[sortConfig.key];
        let bValue = b[sortConfig.key];

        if (sortConfig.key === 'buying_price' || sortConfig.key === 'stock_quantity') {
            aValue = parseFloat(aValue);
            bValue = parseFloat(bValue);
        } else {
            aValue = aValue.toString().toLowerCase();
            bValue = bValue.toString().toLowerCase();
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

  const getSortIcon = (columnKey) => {
      if (sortConfig.key !== columnKey) return <ArrowUpDown size={14} className="text-gray-400 opacity-50" />;
      return <ArrowUpDown size={14} className={sortConfig.direction === 'asc' ? "text-blue-600" : "text-blue-600 rotate-180"} />;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Package className="text-blue-600" /> Ürün Envanteri
        </h1>
        
        <div className="flex gap-3">
            <div className="relative">
                <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Ara..." 
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-64"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <button 
                onClick={handleAddClick}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
            >
                <Plus size={20} /> Yeni Ürün
            </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-gray-600 font-medium border-b">
              <tr>
                <th className="p-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('sku')}>
                    <div className="flex items-center gap-2">SKU {getSortIcon('sku')}</div>
                </th>
                <th className="p-4 cursor-pointer hover:bg-gray-100 transition-colors" onClick={() => handleSort('name')}>
                    <div className="flex items-center gap-2">Ürün Adı {getSortIcon('name')}</div>
                </th>
                <th className="p-4 cursor-pointer hover:bg-gray-100 transition-colors text-right" onClick={() => handleSort('buying_price')}>
                    <div className="flex items-center justify-end gap-2">Alış Fiyatı {getSortIcon('buying_price')}</div>
                </th>
                <th className="p-4 cursor-pointer hover:bg-gray-100 transition-colors text-center" onClick={() => handleSort('stock_quantity')}>
                    <div className="flex items-center justify-center gap-2">Stok {getSortIcon('stock_quantity')}</div>
                </th>
                <th className="p-4 text-center">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="5" className="p-6 text-center text-gray-500">Yükleniyor...</td></tr>
              ) : processedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="p-4 font-mono text-sm text-blue-600">
                        <EditableCell value={product.sku} rowId={product.id} field="sku" onUpdate={handleInlineUpdate} />
                    </td>
                    <td className="p-4 font-medium text-gray-800">
                        <EditableCell value={product.name} rowId={product.id} field="name" onUpdate={handleInlineUpdate} />
                    </td>
                    <td className="p-4 text-right text-gray-600">
                        <div className="flex justify-end">
                            <EditableCell value={product.buying_price} rowId={product.id} field="buying_price" type="number" prefix="₺" onUpdate={handleInlineUpdate} />
                        </div>
                    </td>
                    <td className="p-4">
                        <div className="flex justify-center">
                            <div className="w-20 text-center">
                                <EditableCell value={product.stock_quantity} rowId={product.id} field="stock_quantity" type="number" onUpdate={handleInlineUpdate} />
                            </div>
                        </div>
                    </td>
                    <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                            {lastSavedId === product.id && (
                                <span className="text-green-500 flex items-center text-xs font-bold animate-pulse">
                                    <CheckCircle size={14} className="mr-1"/> Kaydedildi
                                </span>
                            )}
                            
                            {/* DÜZENLE BUTONU */}
                            <button 
                                onClick={() => handleEditClick(product)}
                                className="text-gray-400 hover:text-blue-600 transition-colors p-2"
                                title="Detaylı Düzenle"
                            >
                                <Edit2 size={18} />
                            </button>

                            {/* SİLME BUTONU (YENİ) */}
                            <button 
                                onClick={() => handleDeleteClick(product.id)}
                                className="text-gray-400 hover:text-red-600 transition-colors p-2"
                                title="Ürünü Sil"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>

      <ProductModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveProduct}
        productToEdit={editingProduct}
      />
    </div>
  );
}