import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { supabase } from '../supabaseClient';

const RegisterPage = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMsg('');

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });

        if (error) {
            setError('Erro ao criar conta: ' + error.message);
            setLoading(false);
        } else {
            setMsg('Conta criada com sucesso! Faça login.');
            setLoading(false);
            setTimeout(() => navigate('/login'), 2000);
        }
    };

    return (
        <div className="container flex items-center justify-center p-4">
            <div className="card w-full max-w-sm p-6 animate-fade-in">
                <div className="flex flex-col items-center mb-6 text-primary">
                    <div className="p-4 rounded-full bg-gray-800 mb-2">
                        <UserPlus size={32} />
                    </div>
                    <h1 className="text-xl font-bold text-white">Criar Usuário</h1>
                </div>

                <form onSubmit={handleRegister} className="flex flex-col gap-4">
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
                            placeholder="Senha (min 6 caracteres)"
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

                    {msg && (
                        <div className="text-success text-sm text-center bg-green-500/10 p-2 rounded">
                            {msg}
                        </div>
                    )}

                    <button type="submit" className="btn mt-2" disabled={loading}>
                        {loading ? 'Criando...' : 'Criar Conta'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="text-muted text-sm hover:text-white transition-colors"
                    >
                        Voltar para Login
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
