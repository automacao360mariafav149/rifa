import React, { useContext, useState } from 'react';
import { RaffleContext } from '../App';
import { Upload, Trash2, Save, RefreshCw } from 'lucide-react';

const Admin = () => {
    const { raffleData, updateRaffleConfig, resetRaffle } = useContext(RaffleContext);
    const [formData, setFormData] = useState({ ...raffleData });
    const [msg, setMsg] = useState('');

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

    const handleSave = () => {
        updateRaffleConfig(formData);
        setMsg('Configurações salvas com sucesso!');
        setTimeout(() => setMsg(''), 3000);
    };

    return (
        <div className="p-4 animate-fade-in">
            <div className="flex justify-between items-center mb-4">
                <h1>Admin Rifa</h1>
                <button onClick={() => window.open('/', '_blank')} className="btn outline" style={{ width: 'auto' }}>
                    Ver Rifa
                </button>
            </div>

            <div className="card mb-4 flex flex-col gap-4">
                <div>
                    <label className="text-sm text-muted">Título da Rifa</label>
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
                    <label className="text-sm text-muted">Data do Sorteio (Loteria Federal)</label>
                    <input
                        name="drawDate"
                        type="date"
                        value={formData.drawDate}
                        onChange={handleInputChange}
                        className="input"
                    />
                </div>
            </div>

            {/* Images Section */}
            <div className="card mb-4 flex flex-col gap-4">
                <h2>Imagens</h2>

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
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    itemImages: [...(prev.itemImages || []), reader.result]
                                                }));
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    accept="image/*"
                                />
                                <div className="text-center p-2">
                                    <Upload size={20} className="mx-auto mb-1 text-muted" />
                                    <span className="text-[10px] text-muted">Adicionar</span>
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

                <button onClick={resetRaffle} className="btn secondary text-danger">
                    <RefreshCw size={20} /> Zerar Rifa (Cuidado!)
                </button>
            </div>

            {msg && (
                <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg animate-fade-in">
                    {msg}
                </div>
            )}
        </div>
    );
};

export default Admin;
