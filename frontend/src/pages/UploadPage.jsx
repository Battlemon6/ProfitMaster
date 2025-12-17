import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle } from 'lucide-react';
import { uploadService } from '../services/api';

export default function UploadPage() {
    const [file, setFile] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, uploading, success, error
    const [message, setMessage] = useState('');
    const [marketplaceId, setMarketplaceId] = useState('1'); // Şimdilik 1 (Trendyol) varsayılan
    const [fileType, setFileType] = useState('SALES');

    // Sürükle-Bırak Mantığı
    const onDrop = useCallback(acceptedFiles => {
        if (acceptedFiles?.length > 0) {
            setFile(acceptedFiles[0]);
            setStatus('idle');
            setMessage('');
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
        onDrop,
        accept: {
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
            'application/vnd.ms-excel': ['.xls']
        },
        maxFiles: 1
    });

    // Gönderme İşlemi
    const handleUpload = async () => {
        if (!file) return;

        setStatus('uploading');
        const formData = new FormData();
        formData.append('file', file);
        formData.append('marketplace_id', marketplaceId);
        formData.append('file_type', fileType);

        try {
            const response = await uploadService.uploadExcel(formData);
            setStatus('success');
            // Backend'den gelen detaylı mesajı göster (kaç satır eklendi vs.)
            const detailMsg = `Başarılı! ${response.data.detaylar.created_count} satır işlendi.`;
            setMessage(detailMsg);
        } catch (error) {
            setStatus('error');
            // Backend'den gelen hatayı yakala
            const errorMsg = error.response?.data?.error || error.response?.data?.message || "Bir hata oluştu.";
            setMessage(errorMsg);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 mb-8">Excel Entegrasyonu</h1>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                
                {/* 1. Ayarlar */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Pazaryeri</label>
                        <select 
                            value={marketplaceId}
                            onChange={(e) => setMarketplaceId(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="1">Trendyol</option>
                            <option value="2">Hepsiburada</option>
                            {/* İleride burası dinamik olacak */}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Dosya Türü</label>
                        <select 
                            value={fileType}
                            onChange={(e) => setFileType(e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        >
                            <option value="SALES">Satış / Hakediş Raporu</option>
                            <option value="STOCK">Stok Raporu</option>
                        </select>
                    </div>
                </div>

                {/* 2. Dropzone Alanı */}
                <div 
                    {...getRootProps()} 
                    className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
                        ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
                        ${file ? 'bg-green-50 border-green-400' : ''}
                    `}
                >
                    <input {...getInputProps()} />
                    
                    {file ? (
                        <div className="flex flex-col items-center text-green-700">
                            <FileSpreadsheet size={48} className="mb-2" />
                            <p className="font-semibold text-lg">{file.name}</p>
                            <p className="text-sm opacity-75">Dosya yüklemeye hazır</p>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center text-gray-500">
                            <Upload size={48} className="mb-2" />
                            <p className="font-semibold text-lg">Excel dosyasını buraya sürükleyin</p>
                            <p className="text-sm">veya seçmek için tıklayın</p>
                        </div>
                    )}
                </div>

                {/* 3. Durum Mesajları ve Buton */}
                <div className="mt-6 flex items-center justify-between">
                    <div className="flex-1 mr-4">
                        {status === 'error' && (
                            <div className="flex items-center text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                                <AlertCircle size={18} className="mr-2" />
                                {message}
                            </div>
                        )}
                        {status === 'success' && (
                            <div className="flex items-center text-green-600 bg-green-50 p-3 rounded-lg text-sm">
                                <CheckCircle size={18} className="mr-2" />
                                {message}
                            </div>
                        )}
                    </div>

                    <button
                        onClick={handleUpload}
                        disabled={!file || status === 'uploading'}
                        className={`px-6 py-3 rounded-lg font-semibold text-white transition-all
                            ${!file || status === 'uploading' 
                                ? 'bg-gray-300 cursor-not-allowed' 
                                : 'bg-blue-600 hover:bg-blue-700 shadow-lg hover:shadow-blue-500/30'}
                        `}
                    >
                        {status === 'uploading' ? 'Yükleniyor...' : 'Yüklemeyi Başlat'}
                    </button>
                </div>
            </div>
        </div>
    );
}