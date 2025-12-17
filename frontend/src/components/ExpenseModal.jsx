import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function ExpenseModal({ isOpen, onClose, onSave }) {
    const [formData, setFormData] = useState({
        category: 'OTHER',
        description: '',
        amount: '',
        expense_date: new Date().toISOString().split('T')[0]
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave({
            ...formData,
            amount: parseFloat(formData.amount)
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-gray-800">Yeni Gider Ekle</h2>
                    <button onClick={onClose}><X size={24} className="text-gray-400 hover:text-gray-600" /></button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Gider Türü</label>
                        <select 
                            className="w-full p-2 border rounded-lg"
                            value={formData.category}
                            onChange={(e) => setFormData({...formData, category: e.target.value})}
                        >
                            <option value="RENT">Kira</option>
                            <option value="SALARY">Maaş / Personel</option>
                            <option value="ELECTRICITY">Elektrik Faturası</option>
                            <option value="WATER">Su Faturası</option>
                            <option value="INTERNET">İnternet / Telefon</option>
                            <option value="LOAN">Kredi Ödemesi</option>
                            <option value="PREMIUM">Prim</option>
                            <option value="TAX">Vergi</option>
                            <option value="MARKETING">Reklam / Pazarlama</option>
                            <option value="OTHER">Diğer</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tutar (₺)</label>
                        <input 
                            type="number" step="0.01" required
                            className="w-full p-2 border rounded-lg font-bold text-red-600"
                            placeholder="0.00"
                            value={formData.amount}
                            onChange={(e) => setFormData({...formData, amount: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tarih</label>
                        <input 
                            type="date" required
                            className="w-full p-2 border rounded-lg"
                            value={formData.expense_date}
                            onChange={(e) => setFormData({...formData, expense_date: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Açıklama (Opsiyonel)</label>
                        <textarea 
                            className="w-full p-2 border rounded-lg"
                            rows="2"
                            value={formData.description}
                            onChange={(e) => setFormData({...formData, description: e.target.value})}
                        />
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">İptal</button>
                        <button type="submit" className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Kaydet</button>
                    </div>
                </form>
            </div>
        </div>
    );
}