import React, { createContext, useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Admin from './pages/Admin';
import RafflePage from './pages/RafflePage';
import { supabase } from './supabaseClient';

export const RaffleContext = createContext();

export const RaffleProvider = ({ children }) => {
    const [raffleData, setRaffleData] = useState({
        id: null, // Config ID from DB
        title: 'Carregando...',
        description: '',
        price: 0,
        totalNumbers: 100,
        drawDate: '',
        itemImages: [],
        qrCode: null,
        numbers: {} // { 1: { status: 'sold', name: '...', phone: '...' } }
    });

    const [loading, setLoading] = useState(true);

    // Initial Load
    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Get Config
                let { data: config, error: configError } = await supabase
                    .from('raffle_config')
                    .select('*')
                    .limit(1)
                    .single();

                if (!config) {
                    // Create default if not exists
                    const { data: newConfig } = await supabase
                        .from('raffle_config')
                        .insert([{ title: 'Nova Rifa', price: 10, total_numbers: 100 }])
                        .select()
                        .single();
                    config = newConfig;
                }

                // 2. Get Tickets
                const { data: tickets, error: ticketsError } = await supabase
                    .from('tickets')
                    .select('*');

                // Transform tickets array to object map
                const numbersMap = {};
                if (tickets) {
                    tickets.forEach(t => {
                        numbersMap[t.number] = {
                            status: t.status,
                            name: t.name,
                            phone: t.phone
                        };
                    });
                }

                setRaffleData({
                    id: config.id,
                    title: config.title || 'Nova Rifa',
                    description: config.description || '',
                    price: Number(config.price) || 0,
                    totalNumbers: config.total_numbers || 100,
                    drawDate: config.draw_date || '',
                    itemImages: config.item_images || [],
                    qrCode: config.qr_code,
                    numbers: numbersMap
                });

            } catch (error) {
                console.error("Error loading data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();

        // 3. Realtime Subscription for Tickets
        const channel = supabase
            .channel('public:tickets')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets' }, payload => {
                const newTicket = payload.new;
                setRaffleData(prev => ({
                    ...prev,
                    numbers: {
                        ...prev.numbers,
                        [newTicket.number]: {
                            status: newTicket.status,
                            name: newTicket.name,
                            phone: newTicket.phone
                        }
                    }
                }));
            })
            .subscribe();

        // Realtime Subscription for Config
        const configChannel = supabase
            .channel('public:raffle_config')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'raffle_config' }, payload => {
                const newConfig = payload.new;
                setRaffleData(prev => ({
                    ...prev,
                    title: newConfig.title,
                    description: newConfig.description,
                    price: Number(newConfig.price),
                    totalNumbers: newConfig.total_numbers,
                    drawDate: newConfig.draw_date,
                    itemImages: newConfig.item_images,
                    qrCode: newConfig.qr_code
                }));
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            supabase.removeChannel(configChannel);
        };
    }, []);

    const updateRaffleConfig = async (newConfig) => {
        // Optimistic update
        setRaffleData(prev => ({ ...prev, ...newConfig }));

        // DB Update
        if (raffleData.id) {
            const { error } = await supabase
                .from('raffle_config')
                .update({
                    title: newConfig.title,
                    description: newConfig.description,
                    price: newConfig.price,
                    total_numbers: newConfig.totalNumbers,
                    draw_date: newConfig.drawDate,
                    item_images: newConfig.itemImages,
                    qr_code: newConfig.qrCode
                })
                .eq('id', raffleData.id);

            if (error) console.error("Error updating config:", error);
        }
    };

    const reserveNumbers = async (selectedNumbers, buyerInfo) => {
        // Optimistic UI update handled by subscription usually, but for speed we can do it locally too.
        // However, subscription is safer to avoid collisions. 
        // We will just Insert and let the subscription update the UI.

        const ticketsToInsert = selectedNumbers.map(num => ({
            number: num,
            name: buyerInfo.name,
            phone: buyerInfo.phone,
            status: 'sold'
        }));

        const { error } = await supabase
            .from('tickets')
            .insert(ticketsToInsert);

        if (error) {
            alert('Erro ao reservar números. Tente novamente.');
            console.error(error);
        } else {
            // Success handled by subscription
        }
    };

    const resetRaffle = async () => {
        if (confirm('Tem certeza? Isso apagará todos os dados da rifa do banco de dados!')) {
            // Delete all tickets
            await supabase.from('tickets').delete().neq('id', 0); // Hack to delete all
            // Reset config if needed, or just keep tickets clear
            setRaffleData(prev => ({ ...prev, numbers: {} }));
        }
    };

    return (
        <RaffleContext.Provider value={{ raffleData, updateRaffleConfig, reserveNumbers, resetRaffle, loading }}>
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
