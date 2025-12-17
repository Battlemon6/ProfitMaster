import React, { useState, useEffect } from 'react';

export default function EditableCell({ value, rowId, field, onUpdate, type = "text", prefix = "" }) {
    const [isEditing, setIsEditing] = useState(false);
    const [currentValue, setCurrentValue] = useState(value);

    // Dışarıdan veri değişirse güncelle
    useEffect(() => {
        setCurrentValue(value);
    }, [value]);

    const handleBlur = () => {
        setIsEditing(false);
        // Eğer değer değiştiyse Backend'e gönder
        if (currentValue != value) {
            onUpdate(rowId, field, currentValue);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleBlur();
        }
    };

    if (isEditing) {
        return (
            <input
                autoFocus
                type={type}
                className="w-full p-1 border-2 border-blue-500 rounded outline-none bg-white text-gray-900"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
            />
        );
    }

    return (
        <div 
            onClick={() => setIsEditing(true)}
            className="cursor-pointer hover:bg-yellow-50 hover:border hover:border-blue-200 border border-transparent rounded px-2 py-1 transition-all flex items-center min-h-[30px]"
            title="Düzenlemek için tıklayın"
        >
            <span className="text-gray-500 mr-1">{prefix}</span>
            <span className="truncate max-w-[200px]">{type === 'number' ? parseFloat(currentValue).toFixed(2) : currentValue}</span>
        </div>
    );
}