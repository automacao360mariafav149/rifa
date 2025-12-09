import React, { createContext, useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import Admin from './pages/Admin';
import RafflePage from './pages/RafflePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { supabase } from './supabaseClient';

export const RaffleContext = createContext();

export const RaffleProvider = ({ children }) => {
    // Current Raffle Data (loaded by ID or Admin context)
    const [raffleData, setRaffleData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [session, setSession] = useState(null);

    // Auth Subscription
    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Load Raffle by ID (Public View)
    const loadRaffleById = async (id) => {
        setLoading(true);
        try {
            // Get Config
            const { data: config, error } = await supabase
                .from('raffle_config')
                .select('*')
                .eq('id', id)
                .single();

            if (error || !config) {
                console.error("Raffle not found", error);
                setRaffleData(null);
                setLoading(false);
                return;
            }

            // Get Tickets
            const { data: tickets } = await supabase
                .from('tickets')
                .select('*')
                .eq('raffle_id', id);

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
                title: config.title,
                description: config.description,
                price: Number(config.price),
                totalNumbers: config.total_numbers,
                drawDate: config.draw_date,
                itemImages: config.item_images,
                qrCode: config.qr_code,
                numbers: numbersMap
            });

            // Subscribe to this specific raffle tickets
            subscribeToRaffle(id);

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const subscribeToRaffle = (id) => {
        const channel = supabase
            .channel(`public:tickets:raffle_id=eq.${id}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'tickets', filter: `raffle_id=eq.${id}` }, payload => {
                const newTicket = payload.new;
                setRaffleData(prev => {
                    if (!prev || prev.id !== id) return prev;
                    return {
                        ...prev,
                        numbers: {
                            ...prev.numbers,
                            [newTicket.number]: {
                                status: newTicket.status,
                                name: newTicket.name,
                                phone: newTicket.phone
                            }
                        }
                    }
                });
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    };

    // --- Admin Actions ---

    // Load User's Raffle (For Admin Dashboard - simplified for now, loads FIRST raffle found)
    const loadAdminRaffle = async () => {
        if (!session) return;
        setLoading(true);
        try {
            // Get First Raffle created by user
            const { data: config } = await supabase
                .from('raffle_config')
                .select('*')
                .eq('user_id', session.user.id)
                .limit(1)
                .single();

            if (config) {
                // Determine ID and load full data
                await loadRaffleById(config.id);
            } else {
                // Create Default if first time
                const { data: newConfig } = await supabase
                    .from('raffle_config')
                    .insert([{
                        title: '',
                        price: 0,
                        total_numbers: 100,
                        user_id: session.user.id
                    }])
                    .select()
                    .single();

                if (newConfig) await loadRaffleById(newConfig.id);
            }
        } catch (e) {
            console.error(e);
            if (e.message && e.message.includes('user_id')) {
                alert("ERRO CRÍTICO NO BANCO DE DADOS:\n\nA coluna 'user_id' não foi encontrada.\nVocê precisa rodar o SQL no Supabase para corrigir isso.");
            } else if (e.code === '400') {
                alert("Erro de Conexão (400):\nProvavelmente o banco de dados está desatualizado (Falta coluna user_id).\nRode o SQL no Supabase!");
            }
        } finally {
            setLoading(false);
        }
    };


    const updateRaffleConfig = async (newConfig) => {
        // Optimistic update
        setRaffleData(prev => ({ ...prev, ...newConfig }));

        // DB Update
        if (raffleData && raffleData.id) {
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
        if (!raffleData) return;

        const ticketsToInsert = selectedNumbers.map(num => ({
            raffle_id: raffleData.id, // Important: Link to specific raffle
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
            // Optimistic / Manual Update to ensure instant UI feedback
            setRaffleData(prev => {
                if (!prev) return prev;
                const newNumbers = { ...prev.numbers };
                ticketsToInsert.forEach(t => {
                    newNumbers[t.number] = {
                        status: 'sold',
                        name: t.name,
                        phone: t.phone
                    };
                });
                return { ...prev, numbers: newNumbers };
            });
        }
    };

    const checkMyNumbers = async (phone) => {
        // Check globally or within this raffle? Usually within this raffle.
        // But if we want global... stick to current raffle for now.
        if (!raffleData) return [];

        const found = [];
        Object.entries(raffleData.numbers).forEach(([num, data]) => {
            if (data.phone === phone && data.status === 'sold') {
                found.push(num);
            }
        });
        return found;
    };

    // Admin only
    const resetRaffle = async () => {
        if (!raffleData) return;
        if (confirm('Tem certeza? Isso apagará todos os dados tickets desta rifa!')) {
            await supabase.from('tickets').delete().eq('raffle_id', raffleData.id);
            setRaffleData(prev => ({ ...prev, numbers: {} }));
        }
    };

    return (
        <RaffleContext.Provider value={{
            raffleData,
            updateRaffleConfig,
            reserveNumbers,
            resetRaffle,
            loading,
            checkMyNumbers,
            session,
            loadAdminRaffle,
            loadRaffleById
        }}>
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

// Wrapper to load data for public raffle route
const PublicRaffleRoute = () => {
    const { id } = useParams();
    const { loadRaffleById, raffleData, loading } = useContext(RaffleContext);

    useEffect(() => {
        if (id) loadRaffleById(id);
    }, [id]);

    if (loading) return <div className="text-center p-8 text-white">Carregando rifa...</div>;
    if (!raffleData) return <div className="text-center p-8 text-white">Rifa não encontrada.</div>;

    return <RafflePage />;
};

// Protected Admin Route
const ProtectedAdminRoute = ({ children }) => {
    const { session, loadAdminRaffle, raffleData } = useContext(RaffleContext);

    // Load admin data if logged in and not loaded
    useEffect(() => {
        if (session && !raffleData) {
            loadAdminRaffle();
        }
    }, [session, raffleData]);

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    // Wait for data load? 
    // For now, render children, Admin component handles loading state if needed
    return children;
};

function App() {
    return (
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <RaffleProvider>
                <Layout>
                    <Routes>
                        <Route path="/login" element={<LoginPage />} />
                        <Route path="/admin/register" element={<RegisterPage />} />

                        {/* Admin Dashboard / Editor */}
                        <Route
                            path="/admin"
                            element={
                                <ProtectedAdminRoute>
                                    <Admin />
                                </ProtectedAdminRoute>
                            }
                        />

                        {/* Public Raffle Route by ID */}
                        <Route path="/r/:id" element={<PublicRaffleRoute />} />

                        {/* Fallback / Landing - For now redirect to login or show generic */}
                        <Route path="/" element={<Navigate to="/login" />} />
                    </Routes>
                </Layout>
            </RaffleProvider>
        </Router>
    );
}

export default App;
