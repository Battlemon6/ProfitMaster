import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function ProductModal({ isOpen, onClose, onSave, productToEdit }) {
    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        barcode: '',
        description: '',
        buying_price: '',
        stock_quantity: ''
    });

    useEffect(() => {
        if (productToEdit) {
            setFormData({
                sku: productToEdit.sku || '',
                name: productToEdit.name || '',
                barcode: productToEdit.barcode || '',
                description: productToEdit.description || '',
                buying_price: productToEdit.buying_price || '',
                stock_quantity: productToEdit.stock_quantity || ''
            });
        } else {
            setFormData({ sku: '', name: '', barcode: '', description: '', buying_price: '', stock_quantity: '' });
        }
    }, [productToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData);
    };

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto border border-slate-200">
                <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-800">
                        {productToEdit ? '📦 Ürünü Düzenle' : '✨ Yeni Ürün Ekle'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div className="md:col-span-1">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">SKU (Stok Kodu)</label>
                            <input 
                                type="text" required
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                value={formData.sku}
                                onChange={(e) => setFormData({...formData, sku: e.target.value})}
                                placeholder="Örn: ABC-123"
                            />
                        </div>
                        <div className="md:col-span-1">
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Barkod / GTIN</label>
                            <input 
                                type="text"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                                value={formData.barcode}
                                onChange={(e) => setFormData({...formData, barcode: e.target.value})}
                                placeholder="869..."
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ürün Adı</label>
                        <input 
                            type="text" required
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder="Ürün tam adını giriniz"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Ürün Nitelikleri (Renk, Beden vb.)</label>
                        <textarea 
                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all resize-none placeholder:text-slate-400"
                            rows="3"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                            placeholder="Örn: Renk: Uzay Grisi, Boyut: 13-inch"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-5 pt-2">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Alış Fiyatı (₺)</label>
                            <div className="relative">
                                <span className="absolute left-4 top-2.5 text-slate-400">₺</span>
                                <input 
                                    type="number" step="0.01"
                                    className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                    value={formData.buying_price}
                                    onChange={(e) => setFormData({...formData, buying_price: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Stok Adedi</label>
                            <input 
                                type="number"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                value={formData.stock_quantity}
                                onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-10 pt-6 border-t border-slate-100">
                        <button type="button" onClick={onClose} className="px-6 py-2.5 text-slate-600 font-semibold hover:bg-slate-50 rounded-xl transition-all">
                            Vazgeç
                        </button>
                        <button type="submit" className="px-8 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 active:scale-95 transition-all">
                            Değişiklikleri Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}