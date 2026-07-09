import { useState, type SyntheticEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import type { LoginResponse } from '../types/auth';
import GoogleLoginButton from '../components/GoogleLoginButton';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e: SyntheticEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await api.post<LoginResponse>('token/', { username, password });
            localStorage.setItem('token', response.data.access);
            localStorage.setItem('refresh', response.data.refresh);
            navigate('/');
        } catch {
            setError('Usuario o contraseña incorrectos');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-md mx-auto py-12">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-black tracking-tighter">
                    Iniciar <span className="text-primary">Sesión</span>
                </h2>
                <p className="text-sm opacity-50 mt-1">Accede a tu cuenta de XenoFlora</p>
            </div>

            <div className="card bg-base-100 shadow-xl border border-base-200">
                <form onSubmit={handleSubmit} className="card-body gap-5">
                    <div className="form-control">
                        <label className="label label-text font-bold">Usuario</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="input input-bordered w-full"
                            placeholder="Tu usuario o email"
                            required
                        />
                    </div>

                    <div className="form-control">
                        <label className="label label-text font-bold">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="input input-bordered w-full"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    {error && (
                        <div className="alert alert-error text-sm">
                            <span>{error}</span>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn btn-primary w-full rounded-2xl mt-2"
                    >
                        {loading ? <span className="loading loading-spinner loading-sm"></span> : 'Entrar'}
                    </button>

                    <div className="divider text-xs opacity-40">o</div>

                    <GoogleLoginButton
                        onSuccess={() => navigate('/')}
                        label="Continuar con Google"
                    />
                </form>
            </div>

            <p className="text-center text-sm opacity-50 mt-6">
                ¿No tienes cuenta? <Link to="/profile" className="text-primary font-bold hover:underline">Crear cuenta</Link>
            </p>
        </div>
    );
};

export default LoginPage;
