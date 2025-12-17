import React, { useEffect, useState } from 'react';
import { expenseService } from '../services/api';
import { Search, TrendingDown, Plus, Calendar, Trash2 } from 'lucide-react';
import ExpenseModal from '../components/ExpenseModal';

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchExpenses();
    }, []);

    const fetchExpenses = async () => {
        try {
            const res = await expenseService.getAll();
            setExpenses(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (data) => {
        try {
            await expenseService.create(data);
            alert("Gider eklendi.");
            setIsModalOpen(false);
            fetchExpenses();
        } catch (error) {
            alert("Hata oluştu.");
        }
    };

    const handleDelete = async (id) => {
        if(!window.confirm("Bu gideri silmek istediğinize emin misiniz?")) return;
        try {
            await expenseService.delete(id);
            setExpenses(expenses.filter(e => e.id !== id));
        } catch (error) {
            alert("Silinemedi.");
        }
    };

    // Filtreleme
    const filteredExpenses = expenses.filter(e => 
        e.category_display.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (e.description && e.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Toplam Gider Hesabı
    const totalExpense = filteredExpenses.reduce((sum, item) => sum + parseFloat(item.amount), 0);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Başlık ve Özet */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
                        <TrendingDown className="text-red-600" /> Genel Giderler
                    </h1>
                    <p className="text-gray-500 mt-1">Kira, fatura ve operasyonel harcamalar</p>
                </div>
                <div className="text-right">
                    <div className="text-sm text-gray-500">Toplam Gider</div>
                    <div className="text-2xl font-bold text-red-600">-₺{totalExpense.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</div>
                </div>
            </div>

            {/* Araç Çubuğu */}
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                <div className="relative">
                    <Search className="absolute left-3 top-3 text-gray-400" size={20} />
                    <input 
                        type="text" 
                        placeholder="Gider Ara (Kira, Elektrik...)" 
                        className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none w-64"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button 
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                >
                    <Plus size={20} /> Gider Ekle
                </button>
            </div>

            {/* Liste */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 font-medium border-b">
                        <tr>
                            <th className="p-4">Tarih</th>
                            <th className="p-4">Kategori</th>
                            <th className="p-4">Açıklama</th>
                            <th className="p-4 text-right">Tutar</th>
                            <th className="p-4 text-center">İşlem</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                             <tr><td colSpan="5" className="p-6 text-center">Yükleniyor...</td></tr>
                        ) : filteredExpenses.length === 0 ? (
                            <tr><td colSpan="5" className="p-6 text-center text-gray-500">Kayıt bulunamadı.</td></tr>
                        ) : (
                            filteredExpenses.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="p-4 text-gray-600 flex items-center gap-2">
                                        <Calendar size={16} className="text-gray-400"/>
                                        {new Date(item.expense_date).toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="p-4">
                                        <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-semibold border border-red-100">
                                            {item.category_display}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-600 text-sm">
                                        {item.description || '-'}
                                    </td>
                                    <td className="p-4 text-right font-bold text-red-600">
                                        -₺{parseFloat(item.amount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })}
                                    </td>
                                    <td className="p-4 text-center">
                                        <button onClick={() => handleDelete(item.id)} className="text-gray-400 hover:text-red-600 transition-colors">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <ExpenseModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
            />
        </div>
    );
}