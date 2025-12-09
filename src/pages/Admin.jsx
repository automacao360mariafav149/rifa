import React, { useContext, useState, useEffect } from 'react';
import { RaffleContext } from '../App';
import { Upload, Trash2, Save, Users, X } from 'lucide-react';
import { supabase } from '../supabaseClient';

const Admin = () => {
    const { raffleData, updateRaffleConfig, loading } = useContext(RaffleContext);
    const [formData, setFormData] = useState(null);
    const [msg, setMsg] = useState('');
    const [showSoldModal, setShowSoldModal] = useState(false);

    // Ensure state is synced when data loads
    useEffect(() => {
        if (raffleData) {
            setFormData({ ...raffleData });
        }
    }, [raffleData]);

    if (loading) {
        return <div className="p-8 text-center text-white">Carregando dados...</div>;
    }

    if (!formData) {
        // Should not happen if loading is correct, but safe guard
        return <div className="p-8 text-center text-white">Inicializando painel...</div>;
    }

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleImageUpload = (e, field) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, [field]: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleMultiImageUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const currentImages = formData.itemImages || [];
        const remainingSlots = 6 - currentImages.length;
        const filesToProcess = files.slice(0, remainingSlots);

        filesToProcess.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({
                    ...prev,
                    itemImages: [...(prev.itemImages || []), reader.result]
                }));
            };
            reader.readAsDataURL(file);
        });
    };

    const handleDateChange = (e) => {
        const dateStr = e.target.value;
        // Validation removed to allow any date
        setFormData(prev => ({ ...prev, drawDate: dateStr + 'T20:00' }));
    };

    const handleSave = () => {
        // Validation
        if (!formData.title || !formData.title.trim()) {
            alert('O título da rifa é obrigatório.');
            return;
        }
        if (!formData.price || formData.price <= 0) {
            alert('O valor por número é obrigatório.');
            return;
        }
        if (!formData.totalNumbers || formData.totalNumbers <= 0) {
            alert('A quantidade de números é obrigatória.');
            return;
        }
        if (!formData.qrCode) {
            alert('O QR Code de pagamento é obrigatório.');
            return;
        }
        if (!formData.itemImages || formData.itemImages.length === 0) {
            alert('Pelo menos uma foto do prêmio é obrigatória.');
            return;
        }
        if (!formData.drawDate) {
            alert('A data do sorteio é obrigatória.');
            return;
        }

        updateRaffleConfig(formData);
        setMsg('Configurações salvas com sucesso!');
        setTimeout(() => setMsg(''), 3000);
    };

    return (
        <div className="p-4 animate-fade-in">
            <div className="flex justify-between items-center mb-6">
                <h1>Admin Rifa</h1>
                <button onClick={() => {
                    supabase.auth.signOut().then(() => window.location.href = '/login');
                }}
                    className="text-xs text-red-400 hover:text-red-300"
                >
                    Sair
                </button>
            </div>

            {/* Share Link Section */}
            <div className="card mb-6 bg-gradient-to-r from-gray-900 to-gray-800 border-l-4 border-primary">
                <h3 className="text-sm text-gray-400 mb-2 font-bold uppercase tracking-wider">Seu Link de Vendas</h3>
                <div className="flex gap-2">
                    <input
                        readOnly
                        value={`${window.location.origin}/r/${formData.id}`}
                        className="input text-sm bg-black/50 text-white font-mono"
                    />
                    <button
                        onClick={() => {
                            navigator.clipboard.writeText(`${window.location.origin}/r/${formData.id}`);
                            setMsg('Link copiado!');
                            setTimeout(() => setMsg(''), 2000);
                        }}
                        className="btn secondary"
                        style={{ width: 'auto', whiteSpace: 'nowrap' }}
                    >
                        Copiar Link
                    </button>
                    <button
                        onClick={() => window.open(`/r/${formData.id}`, '_blank')}
                        className="btn outline"
                        style={{ width: 'auto', whiteSpace: 'nowrap' }}
                    >
                        Abrir
                    </button>
                </div>
                <p className="text-xs text-gray-500 mt-2">Envie este link para seus clientes comprarem os números.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
                <button
                    onClick={() => setShowSoldModal(true)}
                    className="btn bg-orange-600 hover:bg-orange-700"
                >
                    <Users size={20} /> Números Vendidos
                </button>
            </div>

            <div className="card mb-4 flex flex-col gap-4">
                <div>
                    <label className="text-sm text-muted">Título da Rifa (Obrigatório)</label>
                    <input
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        className="input"
                        placeholder="Ex: iPhone 15 Pro Max"
                    />
                </div>

                <div>
                    <label className="text-sm text-muted">Descrição</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        className="textarea"
                        rows="3"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-sm text-muted">Valor por Número (R$)</label>
                        <input
                            name="price"
                            type="number"
                            value={formData.price}
                            onChange={handleInputChange}
                            className="input"
                        />
                    </div>
                    <div>
                        <label className="text-sm text-muted">Qtd. Números</label>
                        <input
                            name="totalNumbers"
                            type="number"
                            value={formData.totalNumbers}
                            onChange={handleInputChange}
                            className="input"
                        />
                    </div>
                </div>

                <div>
                    <label className="text-sm text-muted">Data do Sorteio</label>
                    <input
                        name="drawDate"
                        type="date"
                        value={formData.drawDate ? formData.drawDate.split('T')[0] : ''}
                        onChange={handleDateChange}
                        className="input"
                    />
                    <div className="text-xs text-muted mt-1">
                        Nota: Sorteios da Federal correm Quarta e Sábado às 20h (mas você pode escolher qualquer data).
                    </div>
                </div>
            </div>

            {/* Images Section */}
            <div className="card mb-4 flex flex-col gap-4">
                <h2>Imagens (Obrigatório)</h2>

                <div>
                    <label className="text-sm text-muted mb-2 block">Fotos do Item (Máx 6)</label>
                    <div className="grid grid-cols-3 gap-2 mb-2">
                        {/* Existing Images */}
                        {(formData.itemImages || []).map((img, idx) => (
                            <div key={idx} className="relative aspect-square">
                                <img src={img} alt={`Item ${idx}`} className="w-full h-full object-cover rounded-lg border border-gray-700" />
                                <button
                                    onClick={() => setFormData(prev => ({
                                        ...prev,
                                        itemImages: prev.itemImages.filter((_, i) => i !== idx)
                                    }))}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        ))}

                        {/* Upload Button */}
                        {(!formData.itemImages || formData.itemImages.length < 6) && (
                            <div className="aspect-square border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center hover:border-primary cursor-pointer transition-colors relative">
                                <input
                                    type="file"
                                    multiple
                                    onChange={handleMultiImageUpload}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    accept="image/*"
                                />
                                <div className="text-center p-2">
                                    <Upload size={20} className="mx-auto mb-1 text-muted" />
                                    <span className="text-[10px] text-muted">Adicionar (Várias)</span>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div>
                    <label className="text-sm text-muted mb-2 block">QR Code para Pagamento (Pix)</label>
                    {formData.qrCode ? (
                        <div className="relative">
                            <img src={formData.qrCode} alt="QR Code" className="img-preview mb-2" style={{ objectFit: 'contain' }} />
                            <button
                                onClick={() => setFormData(prev => ({ ...prev, qrCode: null }))}
                                className="btn secondary absolute top-2 right-2"
                                style={{ width: 'auto', padding: '0.5rem' }}
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center">
                            <input type="file" onChange={(e) => handleImageUpload(e, 'qrCode')} className="hidden" id="qr-upload" accept="image/*" />
                            <label htmlFor="qr-upload" className="cursor-pointer flex flex-col items-center gap-2 text-muted">
                                <Upload size={24} />
                                <span>Enviar QR Code Pix</span>
                            </label>
                        </div>
                    )}
                </div>
            </div>

            <div className="flex flex-col gap-2">
                <button onClick={handleSave} className="btn">
                    <Save size={20} /> Salvar Configurações
                </button>
                {/* Reset button removed as requested */}
            </div>

            {msg && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg animate-fade-in">
                    {msg}
                </div>
            )}

            {/* Sold Numbers Modal */}
            {showSoldModal && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowSoldModal(false)}>
                    <div className="modal-content h-[80vh] flex flex-col">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h2 className="text-xl font-bold mb-1">Números Vendidos</h2>
                                <div className="text-sm text-muted">
                                    Total Arrecadado: <span className="text-green-500 font-bold text-lg">
                                        R$ {(Object.values(formData.numbers || {}).filter(n => n.status === 'sold').length * formData.price).toFixed(2)}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setShowSoldModal(false)} className="text-muted hover:text-white p-2">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto pr-2">
                            {Object.entries(formData.numbers || {})
                                .filter(([_, data]) => data.status === 'sold')
                                .length === 0 ? (
                                <div className="text-center text-muted p-8">Nenhum número vendido ainda.</div>
                            ) : (
                                <table className="w-full text-left text-sm">
                                    <thead className="text-muted border-b border-gray-700 sticky top-0 bg-[#1a1a1a] z-10">
                                        <tr>
                                            <th className="py-2 pl-2 w-16">Nº</th>
                                            <th className="py-2">Nome</th>
                                            <th className="py-2 text-right pr-2">Tel</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-800">
                                        {Object.entries(formData.numbers || {})
                                            .filter(([_, data]) => data.status === 'sold')
                                            .sort((a, b) => Number(a[0]) - Number(b[0]))
                                            .map(([num, data]) => (
                                                <tr key={num} className="hover:bg-white/5 transition-colors">
                                                    <td className="py-3 pl-2 font-bold text-primary">{num}</td>
                                                    <td className="py-3">{data.name}</td>
                                                    <td className="py-3 text-right font-mono text-xs pr-2">{data.phone}</td>
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Admin;
