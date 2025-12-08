import React, { createContext, useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import Admin from './pages/Admin';
import RafflePage from './pages/RafflePage';

// Context for global state (simulating database)
export const RaffleContext = createContext();

export const RaffleProvider = ({ children }) => {
    const [raffleData, setRaffleData] = useState(() => {
        const saved = localStorage.getItem('raffleData');
        return saved ? JSON.parse(saved) : {
            title: 'Rifa Exclusiva',
            description: 'Participe e concorra!',
            price: 10,
            totalNumbers: 100,
            drawDate: '',
            itemImage: null,
            qrCode: null,
            numbers: {} // { 1: { status: 'paid', name: 'Lucas', phone: '...' }, ... }
        };
    });

    useEffect(() => {
        localStorage.setItem('raffleData', JSON.stringify(raffleData));
    }, [raffleData]);

    const updateRaffleConfig = (newConfig) => {
        setRaffleData(prev => ({ ...prev, ...newConfig }));
    };

    const reserveNumbers = (selectedNumbers, buyerInfo) => {
        setRaffleData(prev => {
            const newNumbers = { ...prev.numbers };
            selectedNumbers.forEach(num => {
                // Marcamos como 'pending' ou 'sold' (laranja)
                // O usuário pediu que fique laranja (vamos considerar 'sold' para simplificar o visual)
                newNumbers[num] = {
                    status: 'sold',
                    name: buyerInfo.name,
                    phone: buyerInfo.phone,
                    timestamp: new Date().toISOString()
                };
            });
            return { ...prev, numbers: newNumbers };
        });
    };

    const resetRaffle = () => {
        if (confirm('Tem certeza? Isso apagará todos os dados da rifa!')) {
            setRaffleData({
                title: 'Nova Rifa',
                description: '',
                price: 10,
                totalNumbers: 100,
                drawDate: '',
                itemImage: null,
                qrCode: null,
                numbers: {}
            });
        }
    };

    return (
        <RaffleContext.Provider value={{ raffleData, updateRaffleConfig, reserveNumbers, resetRaffle }}>
            {children}
        </RaffleContext.Provider>
    );
};

const Layout = ({ children }) => {
    return (
        <div className="container">
            {children}
        </div>
    )
}

function App() {
    return (
        <Router>
            <RaffleProvider>
                <Layout>
                    <Routes>
                        <Route path="/admin" element={<Admin />} />
                        <Route path="/" element={<RafflePage />} />
                    </Routes>
                </Layout>
            </RaffleProvider>
        </Router>
    );
}

export default App;
