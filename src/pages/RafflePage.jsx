import React, { useContext, useState, useMemo } from 'react';
import { RaffleContext } from '../App';
import { Check, X, ShoppingCart, Info, Calendar } from 'lucide-react';

const RafflePage = () => {
    const { raffleData, reserveNumbers } = useContext(RaffleContext);
    const [selectedNumbers, setSelectedNumbers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [buyerInfo, setBuyerInfo] = useState({ name: '', phone: '' });
    const [showMultiBuy, setShowMultiBuy] = useState(false);
    const [multiBuyCount, setMultiBuyCount] = useState('');

    const [isMultiSelectionMode, setIsMultiSelectionMode] = useState(false);

    // Generate numbers array based on total
    const allNumbers = useMemo(() => {
        return Array.from({ length: raffleData.totalNumbers }, (_, i) => i + 1);
    }, [raffleData.totalNumbers]);

    const handleNumberClick = (num) => {
        if (raffleData.numbers[num]) return; // Já vendido

        if (isMultiSelectionMode) {
            // Toggle selection
            setSelectedNumbers(prev => {
                if (prev.includes(num)) return prev.filter(n => n !== num);
                return [...prev, num];
            });
        } else {
            // Instant buy mode
            setSelectedNumbers([num]);
            setIsModalOpen(true);
        }
    };

    const handleModalClose = () => {
        setIsModalOpen(false);
        setSelectedNumbers([]); // Clear selection on cancel
    };

    const handlePurchase = () => {
        if (selectedNumbers.length === 0) return;
        setIsModalOpen(true);
    };

    const confirmPurchase = () => {
        if (!buyerInfo.name || !buyerInfo.phone) {
            alert('Por favor, preencha nome e telefone.');
            return;
        }
        reserveNumbers(selectedNumbers, buyerInfo);
        setIsModalOpen(false);
        setSelectedNumbers([]);
        setBuyerInfo({ name: '', phone: '' });
        alert('Compra registrada! Seus números foram reservados.');
    };

    const selectRandom = () => {
        const count = parseInt(multiBuyCount);
        if (!count || count <= 0) return;

        let available = allNumbers.filter(n => !raffleData.numbers[n] && !selectedNumbers.includes(n));
        if (available.length < count) {
            alert(`Só restam ${available.length} números disponíveis.`);
            return;
        }

        // Shuffle and pick
        const shuffled = available.sort(() => 0.5 - Math.random());
        const picked = shuffled.slice(0, count);

        setSelectedNumbers(picked);
        setIsModalOpen(true); // Open modal immediately
        setShowMultiBuy(false);
        setMultiBuyCount('');
    };

    const totalPrice = selectedNumbers.length * raffleData.price;

    return (
        <div className="pb-24"> {/* Padding for bottom interaction */}
            {/* Header */}
            {/* Header / Carousel */}
            <div className="relative h-72 bg-gray-800 overflow-hidden">
                {/* Image Container with Scroll Snap */}
                <div className="flex overflow-x-auto snap-x snap-mandatory h-full w-full scrollbar-hide">
                    {(raffleData.itemImages && raffleData.itemImages.length > 0) ? (
                        raffleData.itemImages.map((img, idx) => (
                            <img
                                key={idx}
                                src={img}
                                alt={`Prêmio ${idx + 1}`}
                                className="w-full h-full object-cover flex-shrink-0 snap-center"
                            />
                        ))
                    ) : raffleData.itemImage ? (
                        <img src={raffleData.itemImage} alt="Prêmio" className="w-full h-full object-cover flex-shrink-0 snap-center" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted flex-shrink-0 snap-center">
                            Sem foto do prêmio
                        </div>
                    )}
                </div>

                {/* Dots / Indicators */}
                {raffleData.itemImages && raffleData.itemImages.length > 1 && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                        {raffleData.itemImages.map((_, idx) => (
                            <div key={idx} className="w-2 h-2 rounded-full bg-white/50 backdrop-blur-sm" />
                        ))}
                    </div>
                )}

                <div className="absolute top-4 right-4 bg-primary text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg" style={{ backgroundColor: 'var(--primary)' }}>
                    R$ {raffleData.price},00 / nº
                </div>
            </div>

            <div className="p-4">
                <h1 className="mb-2 text-2xl">{raffleData.title}</h1>
                <p className="text-muted mb-4">{raffleData.description}</p>

                {raffleData.drawDate && (
                    <div className="flex items-center gap-2 text-orange-400 mb-6 bg-gray-900 p-3 rounded-lg border border-orange-500/30">
                        <Calendar size={18} color="var(--primary)" />
                        <span className="text-sm">Sorteio: <strong>{new Date(raffleData.drawDate).toLocaleDateString('pt-BR')}</strong> (Loteria Federal)</span>
                    </div>
                )}

                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg">Números</h2>
                </div>

                <div className="card mb-4 p-3 animate-fade-in flex flex-col gap-3">
                    <div className="flex gap-2">
                        <input
                            type="number"
                            placeholder="Qtd."
                            className="input"
                            style={{ width: '70px' }}
                            value={multiBuyCount}
                            onChange={(e) => setMultiBuyCount(e.target.value)}
                        />
                        <button onClick={selectRandom} className="btn secondary text-sm" style={{ flex: 1 }}>
                            Selecionar Aleatórios
                        </button>
                    </div>

                    <button
                        onClick={() => {
                            if (!isMultiSelectionMode) {
                                setIsMultiSelectionMode(true);
                            } else if (selectedNumbers.length > 0) {
                                handlePurchase();
                            } else {
                                setIsMultiSelectionMode(false);
                            }
                        }}
                        className={`btn ${isMultiSelectionMode && selectedNumbers.length > 0 ? 'animate-pulse' : 'outline'}`}
                    >
                        {!isMultiSelectionMode ? 'Selecionar Vários' :
                            selectedNumbers.length > 0 ? `Pagar R$ ${totalPrice.toFixed(2)}` : 'Selecione os números...'}
                    </button>
                </div>

                {/* Grid */}
                <div className="raffle-grid">
                    {allNumbers.map(num => {
                        const isSold = !!raffleData.numbers[num];
                        const isSelected = selectedNumbers.includes(num);

                        return (
                            <div
                                key={num}
                                onClick={() => handleNumberClick(num)}
                                className={`number-badge ${isSelected ? 'selected' : ''} ${isSold ? 'taken' : ''}`}
                                style={{ opacity: isMultiSelectionMode && !isSelected && !isSold ? 0.6 : 1 }}
                            >
                                {isSold ? <Check size={16} /> : num}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Floating Action Bar removed */}

            {/* Payment Modal */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && handleModalClose()}>
                    <div className="modal-content">
                        <div className="flex justify-between items-center mb-6">
                            <h2>Finalizar Compra</h2>
                            <button onClick={handleModalClose} className="text-muted"><X /></button>
                        </div>

                        <div className="text-center mb-6">
                            <div className="text-muted text-sm mb-2">Faça o PIX no valor de</div>
                            <div className="text-3xl font-bold text-primary mb-4">R$ {totalPrice.toFixed(2)}</div>

                            {raffleData.qrCode ? (
                                <div className="bg-white p-2 rounded-lg inline-block mb-2">
                                    <img src={raffleData.qrCode} alt="PIX" className="w-48 h-48 object-contain" />
                                </div>
                            ) : (
                                <div className="bg-gray-800 p-8 rounded text-muted mb-2">
                                    Admin não cadastrou QR Code
                                </div>
                            )}
                            <div className="text-xs text-muted">Escaneie o QR Code acima</div>
                        </div>

                        <div className="flex flex-col gap-3 mb-6">
                            <input
                                className="input"
                                placeholder="Seu Nome Completo"
                                value={buyerInfo.name}
                                onChange={e => setBuyerInfo({ ...buyerInfo, name: e.target.value })}
                            />
                            <input
                                className="input"
                                placeholder="Seu Whatsapp / Telefone"
                                type="tel"
                                value={buyerInfo.phone}
                                onChange={e => setBuyerInfo({ ...buyerInfo, phone: e.target.value })}
                            />
                        </div>

                        <button onClick={confirmPurchase} className="btn">
                            <Check size={20} /> Já feito
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RafflePage;
