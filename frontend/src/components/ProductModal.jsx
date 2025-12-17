import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function ProductModal({ isOpen, onClose, onSave, productToEdit }) {
    // Form Verileri
    const [formData, setFormData] = useState({
        sku: '',
        name: '',
        buying_price: '',
        stock_quantity: ''
    });

    // Modal açıldığında: Düzenleme ise verileri doldur, Ekleme ise boşalt
    useEffect(() => {
        if (productToEdit) {
            setFormData({
                sku: productToEdit.sku,
                name: productToEdit.name,
                buying_price: productToEdit.buying_price,
                stock_quantity: productToEdit.stock_quantity
            });
        } else {
            setFormData({ sku: '', name: '', buying_price: '', stock_quantity: '' });
        }
    }, [productToEdit, isOpen]);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(formData); // Veriyi üst bileşene gönder
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">
                        {productToEdit ? 'Ürünü Düzenle' : 'Yeni Ürün Ekle'}
                    </h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">SKU (Stok Kodu)</label>
                        <input 
                            type="text" 
                            required
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={formData.sku}
                            onChange={(e) => setFormData({...formData, sku: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ürün Adı</label>
                        <input 
                            type="text" 
                            required
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Alış Fiyatı (₺)</label>
                            <input 
                                type="number" 
                                step="0.01"
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formData.buying_price}
                                onChange={(e) => setFormData({...formData, buying_price: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Stok Adedi</label>
                            <input 
                                type="number" 
                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                value={formData.stock_quantity}
                                onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                            İptal
                        </button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Kaydet
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}