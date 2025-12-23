import React, { useEffect, useState, useRef } from 'react';
import { productService } from '../services/api';
import { Search, Package, Plus, Edit2, CheckCircle, ArrowUpDown, Trash2, Settings2, Check } from 'lucide-react';
import ProductModal from '../components/ProductModal';
import EditableCell from '../components/EditableCell';

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [lastSavedId, setLastSavedId] = useState(null);
  
  // --- SÜTUN GÖRÜNÜRLÜK STATE'İ ---
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleCols, setVisibleCols] = useState({
    sku: true,
    name: true,
    description: true,
    barcode: true,
    buying_price: true,
    stock_quantity: true,
    actions: true
  });

  // --- SÜTUN GENİŞLİK STATE'İ ---
  const [colWidths, setColWidths] = useState({
    sku: 20,
    name: 500,
    description: 80,
    barcode: 160,
    buying_price: 130,
    stock_quantity: 100,
    actions: 100
  });

  const resizerRef = useRef({ activeCol: null, startX: 0, startWidth: 0 });

  useEffect(() => { fetchProducts(); }, []);

  const fetchProducts = async () => {
    try {
      const response = await productService.getAll();
      setProducts(response.data);
    } catch (error) { console.error("Ürünler çekilemedi", error); }
    finally { setLoading(false); }
  };

  // --- RESIZING MANTIK ---
  const handleMouseDown = (e, col) => {
    resizerRef.current = { activeCol: col, startX: e.pageX, startWidth: colWidths[col] };
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'col-resize';
  };

  const handleMouseMove = (e) => {
    const { activeCol, startX, startWidth } = resizerRef.current;
    if (activeCol) {
      const diff = e.pageX - startX;
      setColWidths(prev => ({ ...prev, [activeCol]: Math.max(80, startWidth + diff) }));
    }
  };

  const handleMouseUp = () => {
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    document.body.style.cursor = 'default';
  };

  const toggleColumn = (col) => {
    setVisibleCols(prev => ({ ...prev, [col]: !prev[col] }));
  };

  const handleInlineUpdate = async (id, field, value) => {
    const oldProducts = [...products];
    setProducts(products.map(p => p.id === id ? { ...p, [field]: value } : p));
    try {
      await productService.patch(id, { [field]: value });
      setLastSavedId(id);
      setTimeout(() => setLastSavedId(null), 2000);
    } catch (error) {
      setProducts(oldProducts);
      alert("Güncelleme başarısız!");
    }
  };

  const handleSaveProduct = async (formData) => {
    try {
      if (editingProduct) await productService.update(editingProduct.id, formData);
      else await productService.create(formData);
      fetchProducts();
      setIsModalOpen(false);
    } catch (error) { alert("Hata oluştu."); }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={14} className="text-gray-400 opacity-50" />;
    return <ArrowUpDown size={14} className={`text-blue-600 ${sortConfig.direction === 'desc' ? 'rotate-180' : ''}`} />;
  };

  const processedProducts = [...products]
    .filter(p => 
      (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
      (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => {
      if (!sortConfig.key) return 0;
      let aVal = a[sortConfig.key] || '', bVal = b[sortConfig.key] || '';
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

  const columns = [
    { key: 'sku', label: 'SKU' },
    { key: 'name', label: 'Ürün Adı' },
    { key: 'description', label: 'Nitelikler' },
    { key: 'barcode', label: 'Barkod' },
    { key: 'buying_price', label: 'Alış Fiyatı', align: 'text-right' },
    { key: 'stock_quantity', label: 'Stok', align: 'text-center' },
    { key: 'actions', label: 'İşlem', align: 'text-center', noSort: true }
  ];

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
          <Package className="text-blue-600" /> Ürün Envanteri
        </h1>
        
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Ara..." 
              className="pl-10 pr-4 py-2 border rounded-lg w-full md:w-64 focus:ring-2 focus:ring-blue-500 outline-none"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* SÜTUN YÖNETİM BUTONU */}
          <div className="relative">
            <button 
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              className="p-2 border rounded-lg bg-white hover:bg-gray-50 text-gray-600 flex items-center gap-2"
              title="Sütunları Yönet"
            >
              <Settings2 size={20} />
              <span className="hidden sm:inline">Sütunlar</span>
            </button>
            
            {showColumnMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border rounded-xl shadow-xl z-50 p-2">
                <div className="text-xs font-bold text-gray-400 px-3 py-1 uppercase">Görünür Sütunlar</div>
                {columns.map(col => (
                  <label key={col.key} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      className="hidden"
                      checked={visibleCols[col.key]}
                      onChange={() => toggleColumn(col.key)}
                    />
                    <div className={`w-5 h-5 border rounded flex items-center justify-center transition-colors ${visibleCols[col.key] ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                      {visibleCols[col.key] && <Check size={14} className="text-white" />}
                    </div>
                    <span className={`text-sm ${visibleCols[col.key] ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>{col.label}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <button onClick={() => { setEditingProduct(null); setIsModalOpen(true); }} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
            <Plus size={20} /> <span className="hidden sm:inline">Yeni Ürün</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="text-left border-collapse" style={{ tableLayout: 'fixed', width: 'max-content', minWidth: '100%' }}>
            <thead className="bg-gray-50 text-gray-600 font-semibold border-b">
              <tr>
                {columns.map(col => visibleCols[col.key] && (
                  <th 
                    key={col.key} 
                    className={`relative p-4 border-r border-gray-100 last:border-r-0 ${col.align || ''}`}
                    style={{ width: colWidths[col.key] }}
                  >
                    <div 
                      className={`flex items-center gap-1 ${col.noSort ? 'justify-center' : (col.align === 'text-right' ? 'justify-end' : 'justify-start')} ${!col.noSort && 'cursor-pointer'}`}
                      onClick={() => !col.noSort && handleSort(col.key)}
                    >
                      {col.label} {!col.noSort && getSortIcon(col.key)}
                    </div>
                    <div onMouseDown={(e) => handleMouseDown(e, col.key)} className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-blue-400" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="7" className="p-10 text-center text-gray-400">Veriler yükleniyor...</td></tr>
              ) : processedProducts.map((product) => (
                <tr key={product.id} className="hover:bg-blue-50/20 transition-colors">
                  {visibleCols.sku && <td className="p-4 border-r border-gray-50 font-mono text-sm text-blue-600"><EditableCell value={product.sku} rowId={product.id} field="sku" onUpdate={handleInlineUpdate} /></td>}
                  {visibleCols.name && <td className="p-4 border-r border-gray-50 font-medium text-gray-800"><EditableCell value={product.name} rowId={product.id} field="name" onUpdate={handleInlineUpdate} /></td>}
                  {visibleCols.description && <td className="p-4 border-r border-gray-50 text-xs text-gray-500 italic"><EditableCell value={product.description} rowId={product.id} field="description" onUpdate={handleInlineUpdate} /></td>}
                  {visibleCols.barcode && <td className="p-4 border-r border--50 text-xs font-mono text-gray-400"><EditableCell value={product.barcode} rowId={product.id} field="barcode" onUpdate={handleInlineUpdate} /></td>}
                  {visibleCols.buying_price && <td className="p-4 border-r border-gray-50 text-right text-gray-600"><div className="flex justify-end"><EditableCell value={product.buying_price} rowId={product.id} field="buying_price" type="number" prefix="₺" onUpdate={handleInlineUpdate} /></div></td>}
                  {visibleCols.stock_quantity && <td className="p-4 border-r border-gray-50"><div className="flex justify-center"><EditableCell value={product.stock_quantity} rowId={product.id} field="stock_quantity" type="number" onUpdate={handleInlineUpdate} /></div></td>}
                  {visibleCols.actions && (
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        {lastSavedId === product.id && <CheckCircle size={16} className="text-green-500" />}
                        <button onClick={() => { setEditingProduct(product); setIsModalOpen(true); }} className="text-gray-400 hover:text-blue-600 p-1"><Edit2 size={16} /></button>
                        <button onClick={() => { if(window.confirm("Silinsin mi?")) productService.delete(product.id).then(() => fetchProducts()) }} className="text-gray-400 hover:text-red-600 p-1"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveProduct} productToEdit={editingProduct} />
    </div>
  );
}