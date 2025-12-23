import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2, Search } from 'lucide-react';
import { productService, marketplaceService, financeService } from '../services/api';

export default function TransactionModal({ isOpen, onClose, onSave }) {
    const [marketplaces, setMarketplaces] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const [commonData, setCommonData] = useState({
        marketplace: '',
        transaction_date: new Date().toISOString().split('T')[0],
        order_number: '',
        transaction_type: 'SALE',
        shipping_cost: '0'
    });

    const [items, setItems] = useState([]);
    const [currentItem, setCurrentItem] = useState({ product: null, product_name: '', quantity: 1, sale_price: '', commission_amount: '0' });

    useEffect(() => { if (isOpen) { loadData(); resetForm(); } }, [isOpen]);

    const loadData = async () => {
        try {
            const [mpRes, prodRes] = await Promise.all([marketplaceService.getAll(), productService.getAll()]);
            setMarketplaces(mpRes.data);
            setAllProducts(prodRes.data);
            setFilteredProducts(prodRes.data);
        } catch (e) { console.error(e); }
    };

    const resetForm = () => {
        setItems([]);
        setIsSaving(false);
        setCommonData({ marketplace: '', transaction_date: new Date().toISOString().split('T')[0], order_number: '', transaction_type: 'SALE', shipping_cost: '0' });
    };

    useEffect(() => {
        const query = searchQuery.toLowerCase();
        const filtered = allProducts.filter(p => (p.name || '').toLowerCase().includes(query) || (p.description || '').toLowerCase().includes(query));
        setFilteredProducts(filtered);
    }, [searchQuery, allProducts]);

    const selectProduct = (p) => {
        setCurrentItem({ ...currentItem, product: p.id, product_name: `${p.name} - ${p.description || ''}`, sale_price: p.buying_price ? (parseFloat(p.buying_price) * 1.5).toFixed(2) : '' });
        setShowSearch(false);
        setSearchQuery('');
    };

    const addItemToList = () => {
        if (!currentItem.product || !currentItem.sale_price) return alert("Lütfen ürün ve fiyat girin.");
        setItems([...items, { ...currentItem, id: Date.now() }]);
        setCurrentItem({ product: null, product_name: '', quantity: 1, sale_price: '', commission_amount: '0' });
    };

    const handleSubmit = async () => {
        if (isSaving || items.length === 0) return;
        if (!commonData.marketplace || !commonData.order_number) return alert("Zorunlu alanlar boş.");

        setIsSaving(true);
        const payload = {
            common: commonData,
            items: items.map(it => ({ product: it.product, quantity: parseInt(it.quantity), sale_price: String(it.sale_price), commission_amount: String(it.commission_amount) }))
        };

        try {
            const res = await financeService.bulkCreate(payload);
            if (res.status === 201 || res.data.status === "ok") {
                onSave();
                onClose();
            }
        } catch (err) {
            console.error("HATA:", err.response?.data);
            alert("İşlem tamamlanamadı. Terminal loglarını kontrol edin.");
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-6 flex flex-col max-h-[90vh]">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h2 className="text-2xl font-bold text-gray-800 italic">Manuel İşlem Ekle</h2>
                    <button onClick={onClose} disabled={isSaving}><X size={28} className="text-gray-400 hover:text-red-500" /></button>
                </div>

                <div className="flex-1 overflow-y-auto pr-2">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                        <div>
                            <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Pazaryeri</label>
                            <select className="w-full p-2 border rounded-lg bg-white" value={commonData.marketplace} onChange={(e) => setCommonData({...commonData, marketplace: e.target.value})}>
                                <option value="">Seçiniz</option>
                                {marketplaces.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Belge No</label>
                            <input type="text" className="w-full p-2 border rounded-lg outline-none" value={commonData.order_number} onChange={(e) => setCommonData({...commonData, order_number: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Tarih</label>
                            <input type="date" className="w-full p-2 border rounded-lg" value={commonData.transaction_date} onChange={(e) => setCommonData({...commonData, transaction_date: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-blue-600 uppercase mb-1">Kargo (₺)</label>
                            <input type="number" className="w-full p-2 border rounded-lg" value={commonData.shipping_cost} onChange={(e) => setCommonData({...commonData, shipping_cost: e.target.value})} />
                        </div>
                    </div>

                    <div className="mb-6 border-2 border-dashed border-gray-200 p-4 rounded-xl bg-gray-50/30">
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                            <div className="md:col-span-5 relative">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Ürün (İsim / Renk / Nitelik)</label>
                                <div className="relative">
                                    <input type="text" className="w-full p-2 pl-8 border rounded-lg" placeholder="Ara..." value={currentItem.product_name || searchQuery} onFocus={() => setShowSearch(true)} onChange={(e) => {setSearchQuery(e.target.value); setCurrentItem({...currentItem, product: null, product_name: ''})}} />
                                    <Search className="absolute left-2 top-2.5 text-gray-400" size={16} />
                                </div>
                                {showSearch && (
                                    <div className="absolute z-[60] w-full mt-1 bg-white border shadow-2xl rounded-lg max-h-48 overflow-y-auto">
                                        {filteredProducts.map(p => (
                                            <div key={p.id} className="p-3 hover:bg-blue-50 cursor-pointer text-sm border-b" onClick={() => selectProduct(p)}>
                                                <strong>{p.name}</strong> <span className="text-gray-400 ml-2">({p.description || '-'})</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="md:col-span-1">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Adet</label>
                                <input type="number" className="w-full p-2 border rounded-lg" value={currentItem.quantity} onChange={(e) => setCurrentItem({...currentItem, quantity: e.target.value})} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Fiyat</label>
                                <input type="number" className="w-full p-2 border rounded-lg" value={currentItem.sale_price} onChange={(e) => setCurrentItem({...currentItem, sale_price: e.target.value})} />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-xs font-medium text-gray-500 mb-1">Komisyon</label>
                                <input type="number" className="w-full p-2 border rounded-lg" value={currentItem.commission_amount} onChange={(e) => setCurrentItem({...currentItem, commission_amount: e.target.value})} />
                            </div>
                            <button type="button" onClick={addItemToList} className="md:col-span-2 bg-blue-600 text-white p-2 rounded-lg font-bold hover:bg-blue-700 transition-all"><Plus size={18} /> Ekle</button>
                        </div>
                    </div>

                    {items.length > 0 && (
                        <div className="border rounded-xl overflow-hidden shadow-sm">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50 border-b">
                                    <tr>
                                        <th className="p-3 text-left">Ürün Detayı</th>
                                        <th className="p-3 text-center">Adet</th>
                                        <th className="p-3 text-right">Birim Fiyat</th>
                                        <th className="p-3 text-center">Sil</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {items.map(it => (
                                        <tr key={it.id} className="hover:bg-gray-50">
                                            <td className="p-3 font-medium">{it.product_name}</td>
                                            <td className="p-3 text-center">{it.quantity}</td>
                                            <td className="p-3 text-right">{it.sale_price} ₺</td>
                                            <td className="p-3 text-center"><button type="button" onClick={() => setItems(items.filter(i => i.id !== it.id))} className="text-red-400 p-1"><Trash2 size={18} /></button></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="mt-8 pt-6 border-t flex justify-between items-center">
                    <div className="text-xl font-bold text-blue-600 bg-blue-50 px-6 py-2 rounded-2xl">
                        Toplam: {items.reduce((acc, it) => acc + (parseFloat(it.sale_price || 0) * it.quantity), 0).toFixed(2)} ₺
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} disabled={isSaving} className="px-8 py-3 font-semibold text-gray-500 hover:bg-gray-100 rounded-xl">İptal</button>
                        <button onClick={handleSubmit} type="button" disabled={isSaving} className={`px-12 py-3 text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 ${isSaving ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                            {isSaving ? 'Kaydediliyor...' : 'Siparişi Kaydet'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}