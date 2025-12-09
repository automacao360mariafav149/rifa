import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { supabase } from '../supabaseClient';

const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            setError(error.message || 'Erro ao entrar');
            setLoading(false);
        } else {
            navigate('/admin');
        }
    };

    return (
        <div className="container flex items-center justify-center p-4">
            <div className="card w-full max-w-sm p-6 animate-fade-in">
                <div className="flex flex-col items-center mb-6 text-primary">
                    <div className="p-4 rounded-full bg-gray-800 mb-2">
                        <Lock size={32} />
                    </div>
                    <h1 className="text-xl font-bold text-white">Área Restrita</h1>
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div>
                        <input
                            type="email"
                            placeholder="Email"
                            className="input text-center"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div>
                        <input
                            type="password"
                            placeholder="Senha"
                            className="input text-center"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center bg-red-500/10 p-2 rounded">
                            {error}
                        </div>
                    )}

                    <button type="submit" className="btn mt-2" disabled={loading}>
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

                {/* Hidden Register Link for Admin Setup */}
                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/register')}
                        className="text-muted text-[10px] hover:text-white transition-colors"
                    >
                        Criar conta (Restrito)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
