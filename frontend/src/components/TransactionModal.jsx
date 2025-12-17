import React, { useState, useEffect } from 'react';
import { X, RefreshCw } from 'lucide-react'; // İkon ekledik
import { productService, marketplaceService } from '../services/api';

export default function TransactionModal({ isOpen, onClose, onSave }) {
    const [marketplaces, setMarketplaces] = useState([]);
    const [products, setProducts] = useState([]);
    
    // Komisyon Modu: 'AMOUNT' (Tutar ₺) veya 'RATE' (Oran %)
    const [commissionMode, setCommissionMode] = useState('AMOUNT'); 
    const [commissionRate, setCommissionRate] = useState(''); // Oran bilgisini burada tutacağız

    const [formData, setFormData] = useState({
        marketplace: '',
        product: '',
        transaction_type: 'SALE',
        order_number: '',
        quantity: 1,
        sale_price: '',
        commission_amount: '', // Backend'e gidecek asıl tutar
        shipping_cost: '',
        transaction_date: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (isOpen) {
            loadData();
        }
    }, [isOpen]);

    const loadData = async () => {
        const [mpRes, prodRes] = await Promise.all([
            marketplaceService.getAll(),
            productService.getAll()
        ]);
        setMarketplaces(mpRes.data);
        setProducts(prodRes.data);
    };

    // --- AKILLI HESAPLAMA MANTIĞI ---

    // 1. Satış Fiyatı Değişince
    const handlePriceChange = (value) => {
        const price = parseFloat(value) || 0;
        
        // Eğer 'Oran' modundaysak, yeni fiyata göre komisyon tutarını güncelle
        let newCommissionAmount = formData.commission_amount;
        if (commissionMode === 'RATE' && commissionRate) {
            const rate = parseFloat(commissionRate) || 0;
            newCommissionAmount = (price * rate / 100).toFixed(2);
        }

        setFormData({ 
            ...formData, 
            sale_price: value,
            commission_amount: newCommissionAmount
        });
    };

    // 2. Komisyon Oranı Değişince (%)
    const handleRateChange = (value) => {
        setCommissionRate(value);
        const price = parseFloat(formData.sale_price) || 0;
        const rate = parseFloat(value) || 0;
        
        // Tutarı hesapla ve forma yaz
        const calculatedAmount = (price * rate / 100).toFixed(2);
        setFormData({ ...formData, commission_amount: calculatedAmount });
    };

    // 3. Komisyon Tutarı Değişince (₺)
    const handleAmountChange = (value) => {
        setFormData({ ...formData, commission_amount: value });
        // Tutar değişince oranı da güncelle (Bilgi amaçlı)
        const price = parseFloat(formData.sale_price) || 0;
        const amount = parseFloat(value) || 0;
        if (price > 0) {
            setCommissionRate(((amount / price) * 100).toFixed(2));
        }
    };

    // 4. Mod Değiştirme (₺ <-> %)
    const toggleCommissionMode = () => {
        const newMode = commissionMode === 'AMOUNT' ? 'RATE' : 'AMOUNT';
        setCommissionMode(newMode);
        
        // Geçiş sırasında mevcut değerleri koru
        // (Zaten state'ler senkronize olduğu için ekstra işleme gerek yok,
        //  inputlar doğru değeri gösterecek)
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const cleanData = {
            ...formData,
            product: formData.product && formData.product !== "" ? formData.product : null,
            marketplace: parseInt(formData.marketplace),
            quantity: parseInt(formData.quantity) || 1,
            sale_price: parseFloat(formData.sale_price) || 0,
            commission_amount: parseFloat(formData.commission_amount) || 0,
            shipping_cost: parseFloat(formData.shipping_cost) || 0,
        };
        onSave(cleanData);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Manuel İşlem Ekle</h2>
                    <button onClick={onClose}><X size={24} className="text-gray-400 hover:text-gray-600" /></button>
                </div>

                <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-4">
                    {/* Üst Kısım (Aynı) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Pazaryeri</label>
                        <select 
                            required
                            className="w-full p-2 border rounded-lg"
                            value={formData.marketplace}
                            onChange={(e) => setFormData({...formData, marketplace: e.target.value})}
                        >
                            <option value="">Seçiniz</option>
                            {marketplaces.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                        <input 
                            type="date" 
                            required
                            className="w-full p-2 border rounded-lg"
                            value={formData.transaction_date}
                            onChange={(e) => setFormData({...formData, transaction_date: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">İşlem Tipi</label>
                        <select 
                            className="w-full p-2 border rounded-lg"
                            value={formData.transaction_type}
                            onChange={(e) => setFormData({...formData, transaction_type: e.target.value})}
                        >
                            <option value="SALE">Satış</option>
                            <option value="RETURN">İade</option>
                            <option value="CANCEL">İptal</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Sipariş / Belge No</label>
                        <input 
                            type="text" 
                            required
                            className="w-full p-2 border rounded-lg"
                            value={formData.order_number}
                            onChange={(e) => setFormData({...formData, order_number: e.target.value})}
                        />
                    </div>

                    <div className="col-span-2 grid grid-cols-3 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Ürün</label>
                            <select 
                                className="w-full p-2 border rounded-lg"
                                value={formData.product}
                                onChange={(e) => setFormData({...formData, product: e.target.value})}
                            >
                                <option value="">Ürün Seçiniz (Opsiyonel)</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.sku} - {p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Adet</label>
                            <input 
                                type="number" 
                                min="1"
                                className="w-full p-2 border rounded-lg"
                                value={formData.quantity}
                                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                            />
                        </div>
                    </div>

                    {/* Fiyatlar */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Satış Fiyatı (Toplam ₺)</label>
                        <input 
                            type="number" step="0.01" required
                            className="w-full p-2 border rounded-lg"
                            value={formData.sale_price}
                            onChange={(e) => handlePriceChange(e.target.value)}
                        />
                    </div>

                    {/* --- GELİŞMİŞ KOMİSYON ALANI --- */}
                    <div>
                        <div className="flex justify-between items-center mb-1">
                            <label className="block text-sm font-medium text-gray-700">
                                Komisyon {commissionMode === 'AMOUNT' ? '(Tutar ₺)' : '(Oran %)'}
                            </label>
                            <button 
                                type="button" 
                                onClick={toggleCommissionMode}
                                className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded transition-colors"
                            >
                                <RefreshCw size={10} />
                                {commissionMode === 'AMOUNT' ? 'Oran Gir (%)' : 'Tutar Gir (₺)'}
                            </button>
                        </div>

                        {commissionMode === 'RATE' ? (
                            <div className="relative">
                                <input 
                                    type="number" step="0.01"
                                    className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-blue-50"
                                    placeholder="Örn: 20"
                                    value={commissionRate}
                                    onChange={(e) => handleRateChange(e.target.value)}
                                />
                                <span className="absolute right-3 top-2 text-gray-400 font-bold">%</span>
                                <div className="text-xs text-gray-500 mt-1 text-right">
                                    Hesaplanan: <strong>{formData.commission_amount} ₺</strong>
                                </div>
                            </div>
                        ) : (
                            <div className="relative">
                                <input 
                                    type="number" step="0.01"
                                    className="w-full p-2 border rounded-lg"
                                    value={formData.commission_amount}
                                    onChange={(e) => handleAmountChange(e.target.value)}
                                />
                                <span className="absolute right-3 top-2 text-gray-400 font-bold">₺</span>
                            </div>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Kargo Tutarı (₺)</label>
                        <input 
                            type="number" step="0.01"
                            className="w-full p-2 border rounded-lg"
                            value={formData.shipping_cost}
                            onChange={(e) => setFormData({...formData, shipping_cost: e.target.value})}
                        />
                    </div>

                    <div className="col-span-2 flex justify-end gap-3 mt-4 border-t pt-4">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">İptal</button>
                        <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">Kaydet</button>
                    </div>
                </form>
            </div>
        </div>
    );
}