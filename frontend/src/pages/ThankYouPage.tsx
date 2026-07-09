import { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CheckCircle, UserPlus, Sprout, ArrowRight } from 'lucide-react';
import type { OrderConfirmation, RegisterFromOrderResponse } from '../types/store';

const ThankYouPage = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const order = (location.state as { order?: OrderConfirmation })?.order;

    const [registering, setRegistering] = useState(false);
    const [registered, setRegistered] = useState(false);
    const [accountData, setAccountData] = useState<RegisterFromOrderResponse | null>(null);

    // Si no hay orden en el state, redirigimos a la tienda
    if (!order) {
        navigate('/', { replace: true });
        return null;
    }

    const handleRegister = async () => {
        setRegistering(true);
        try {
            const res = await api.post<RegisterFromOrderResponse>('users/register-from-order/', {
                order_id: order.id,
            });
            setAccountData(res.data);
            setRegistered(true);
            toast.success('¡Cuenta creada con éxito!');
        } catch (err) {
            let msg = 'No se pudo crear la cuenta';
            if (axios.isAxiosError(err)) {
                msg = typeof err.response?.data === 'string'
                    ? err.response.data
                    : Object.values(err.response?.data || {}).flat().join(', ') || err.message;
            }
            toast.error(msg);
        } finally {
            setRegistering(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto text-center space-y-10">
            {/* ─── Confirmación ─── */}
            <div className="space-y-4">
                <div className="bg-success/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle size={44} className="text-success" />
                </div>
                <h1 className="text-3xl font-black tracking-tighter">
                    ¡PEDIDO <span className="text-primary">CONFIRMADO</span>!
                </h1>
                <p className="opacity-60 max-w-md mx-auto">
                    Tu pedido <span className="font-bold">#{order.id}</span> ha sido registrado.
                    Te hemos enviado un resumen a <span className="font-bold">{order.guest_email}</span>.
                </p>
            </div>

            {/* ─── Resumen del pedido ─── */}
            <div className="card bg-base-100 border border-base-200 shadow-lg text-left">
                <div className="card-body gap-3">
                    <h2 className="card-title text-lg font-black gap-2">
                        <Sprout size={20} className="text-primary" />
                        Resumen del pedido
                    </h2>
                    <div className="divider my-0"></div>
                    <ul className="space-y-2">
                        {order.items.map(item => (
                            <li key={item.id} className="flex justify-between text-sm">
                                <span>{item.product_name} × {item.quantity}</span>
                                <span className="font-bold">{item.price} €</span>
                            </li>
                        ))}
                    </ul>
                    <div className="divider my-0"></div>
                    <div className="flex justify-between font-black text-lg">
                        <span>TOTAL</span>
                        <span className="text-primary">{Number(order.total_price).toFixed(2)} €</span>
                    </div>
                </div>
            </div>

            {/* ─── Registro post-compra ─── */}
            {!registered ? (
                <div className="card bg-base-200 border border-primary/20 shadow-lg">
                    <div className="card-body items-center text-center gap-4">
                        <UserPlus size={32} className="text-primary" />
                        <div>
                            <h3 className="font-black text-lg">¿Quieres simplificar tus próximas compras?</h3>
                            <p className="text-sm opacity-60 mt-1 max-w-sm">
                                Crea tu cuenta con un solo clic usando los datos de este pedido
                                y accede a las guías de cuidado de tus plantas.
                            </p>
                        </div>
                        <button
                            onClick={handleRegister}
                            disabled={registering}
                            className="btn btn-primary rounded-2xl gap-2"
                        >
                            {registering ? (
                                <span className="loading loading-spinner loading-sm"></span>
                            ) : (
                                <><UserPlus size={18} /> Crear mi cuenta</>
                            )}
                        </button>
                    </div>
                </div>
            ) : (
                <div className="card bg-success/10 border border-success/30 shadow-lg">
                    <div className="card-body items-center text-center gap-4">
                        <CheckCircle size={32} className="text-success" />
                        <div>
                            <h3 className="font-black text-lg text-success">¡Cuenta creada!</h3>
                            <p className="text-sm opacity-70 mt-1">
                                Tu usuario es <span className="font-bold">{accountData?.email}</span>
                            </p>
                            <p className="text-xs opacity-50 mt-1">
                                Contraseña temporal: <code className="bg-base-300 px-2 py-0.5 rounded font-mono">{accountData?.temporary_password}</code>
                            </p>
                            <p className="text-xs opacity-40 mt-2">Guarda esta contraseña. Podrás cambiarla en tu perfil.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Volver a la tienda ─── */}
            <Link to="/" className="btn btn-ghost gap-2">
                <ArrowRight size={18} />
                Seguir explorando el catálogo
            </Link>
        </div>
    );
};

export default ThankYouPage;
