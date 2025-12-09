import React, { useContext, useState, useMemo, useRef } from 'react';
import { RaffleContext } from '../App';
import { Check, X, ShoppingCart, Info, Calendar } from 'lucide-react';

const RafflePage = () => {

    const { raffleData, reserveNumbers, checkMyNumbers } = useContext(RaffleContext);
    const [selectedNumbers, setSelectedNumbers] = useState([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [buyerInfo, setBuyerInfo] = useState({ name: '', phone: '' });
    const [showMultiBuy, setShowMultiBuy] = useState(false);
    const [multiBuyCount, setMultiBuyCount] = useState('');

    const [isMultiSelectionMode, setIsMultiSelectionMode] = useState(false);

    // State for "My Numbers" removed

    const scrollRef = useRef(null);

    // Generate numbers array based on total
    const allNumbers = useMemo(() => {
        return Array.from({ length: raffleData.totalNumbers }, (_, i) => i + 1);
    }, [raffleData.totalNumbers, raffleData]);

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
        setShowSuccessModal(true); // Show custom modal instead of alert
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
        setIsMultiSelectionMode(true); // Switch to multi-mode so the "Pay" button appears
        // setIsModalOpen(true); // Removed: User must click "Pay" manually now
        setShowMultiBuy(false);
        setMultiBuyCount('');
    };

    const totalPrice = selectedNumbers.length * raffleData.price;

    const scroll = (direction) => {
        if (scrollRef.current) {
            const { clientWidth } = scrollRef.current;
            const scrollAmount = direction === 'left' ? -clientWidth : clientWidth;
            scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
        }
    };

    return (
        <div className="pb-24">
            {/* Header / Carousel - Instagram Style */}
            <div className="relative aspect-square w-full bg-gray-900 group">
                {/* Image Container with Scroll Snap */}
                <div
                    ref={scrollRef}
                    className="flex overflow-x-auto snap-x snap-mandatory h-full w-full scrollbar-hide"
                >
                    {(raffleData.itemImages && raffleData.itemImages.length > 0) ? (
                        raffleData.itemImages.map((img, idx) => (
                            <img
                                key={idx}
                                src={img}
                                alt={`Prêmio ${idx + 1}`}
                                className="w-full h-full object-cover flex-shrink-0 snap-center block"
                            />
                        ))
                    ) : raffleData.itemImage ? (
                        <img src={raffleData.itemImage} alt="Prêmio" className="w-full h-full object-cover flex-shrink-0 snap-center block" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted flex-shrink-0 snap-center">
                            Sem foto do prêmio
                        </div>
                    )}
                </div>

                {/* Arrows */}
                {raffleData.itemImages && raffleData.itemImages.length > 1 && (
                    <>
                        <button
                            onClick={() => scroll('left')}
                            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6" /></svg>
                        </button>
                        <button
                            onClick={() => scroll('right')}
                            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-sm"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6" /></svg>
                        </button>
                    </>
                )}

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

                {/* Payment Modal */}
                <h1 className="mb-2 text-2xl">{raffleData.title}</h1>
                <p className="text-muted mb-4">{raffleData.description}</p>

                {raffleData.drawDate && (
                    <div className="flex items-center gap-2 text-orange-400 mb-6 bg-gray-900 p-3 rounded-lg border border-orange-500/30">
                        <Calendar size={18} color="var(--primary)" />
                        <span className="text-sm">Sorteio: <strong>{new Date(raffleData.drawDate).toLocaleDateString('pt-BR')} às 20h</strong> (Loteria Federal)</span>
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
                        const isSold = !!raffleData.numbers && raffleData.numbers[num] && raffleData.numbers[num].status === 'sold';
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

            {/* Success Modal */}
            {showSuccessModal && (
                <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
                    <div className="modal-content text-center">
                        <div className="flex justify-center mb-4">
                            <div className="bg-green-500/20 p-4 rounded-full">
                                <Check size={48} className="text-green-500" />
                            </div>
                        </div>
                        <h2 className="text-2xl font-bold mb-2">Reserva Realizada!</h2>
                        <p className="text-gray-300 mb-6 leading-relaxed">
                            O prêmio será entregue mediante o comprovante do Pix feito nesta hora e data da escolha do número.
                            <br /><br />
                            <strong className="text-orange-500">Favor guardar seu comprovante.</strong>
                        </p>
                        <button
                            onClick={() => setShowSuccessModal(false)}
                            className="btn bg-gray-700 hover:bg-gray-600 w-full"
                        >
                            Entendido
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RafflePage;
