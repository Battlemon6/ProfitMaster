import React, { useState, useEffect } from 'react';

export default function EditableCell({ value, rowId, field, onUpdate, type = "text", prefix = "", charLimit = 100 }) {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);

    // Dışarıdan veri (Excel yüklemesi vb.) değişirse local state'i güncelle
    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    const handleBlur = () => {
        setIsEditing(false);
        // Eğer değer gerçekten değiştiyse Backend'e gönder
        if (currentValue != value) {
            onUpdate(rowId, field, currentValue);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') handleBlur();
        if (e.key === 'Escape') {
            setCurrentValue(value);
            setIsEditing(false);
        }
    };

    // --- Görüntüleme Mantığı (Beyaz ekran hatasını önleyen ve 100 karakter sınırını koyan yer) ---
    const renderDisplayValue = () => {
        // Değer boşsa tire göster
        if (currentValue === null || currentValue === undefined || currentValue === "") {
            return "-";
        }

        // Sayısal alanlar için (Fiyat/Stok)
        if (type === 'number') {
            const num = parseFloat(currentValue);
            return isNaN(num) ? "0.00" : num.toFixed(2);
        }

        // Metin alanları için (İsim/Nitelik)
        const strValue = String(currentValue);
        // Eğer 100 karakterden uzunsa kes ve ... ekle
        if (strValue.length > charLimit) {
            return strValue.substring(0, charLimit) + "...";
        }
        return strValue;
    };

    if (isEditing) {
        return (
            <input
                autoFocus
                type={type}
                className="w-full p-1 border-2 border-blue-500 rounded outline-none bg-white text-gray-900 text-sm"
                value={currentValue ?? ''}
                onChange={(e) => setCurrentValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
            />
        );
    }

    return (
        <div 
            onClick={() => setIsEditing(true)}
            // Truncate ve max-width kaldırıldı. whitespace-normal metnin alt satıra geçmesini sağlar.
            className="cursor-pointer hover:bg-blue-50 border border-transparent hover:border-blue-200 rounded px-2 py-1 transition-all flex items-start min-h-[32px] w-full"
            title="Düzenlemek için tıklayın"
        >
            {prefix && <span className="text-gray-400 mr-1 text-xs shrink-0">{prefix}</span>}
            <span className="text-gray-700 text-sm whitespace-normal break-words leading-tight">
                {renderDisplayValue()}
            </span>
        </div>
    );
}