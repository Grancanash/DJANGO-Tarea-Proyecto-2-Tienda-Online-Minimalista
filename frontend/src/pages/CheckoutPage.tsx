import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import api from '../api/axios';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Rocket, ShieldCheck, User, Mail, Phone, MapPin, ClipboardList, CreditCard } from 'lucide-react';
import type { ShippingInfo, GuestOrderPayload, OrderConfirmation, ShippingProfileData } from '../types/store';

type FormErrors = Partial<Record<keyof (ShippingInfo & { items: unknown; total_price: unknown }), string>>;

const initialForm: ShippingInfo = {
    guest_email: '',
    first_name: '',
    last_name: '',
    address_line1: '',
    address_line2: '',
    postal_code: '',
    city: '',
    province: '',
    phone: '',
    delivery_notes: '',
};

const CheckoutPage = () => {
    const { cart, totalPrice, clearCart } = useCart();
    const [form, setForm] = useState<ShippingInfo>(initialForm);
    const [errors, setErrors] = useState<FormErrors>({});
    const [loading, setLoading] = useState(false);
    const [orderPlaced, setOrderPlaced] = useState(false);
    const navigate = useNavigate();

    // Prerellenar con datos de envío y email del perfil si el usuario está logueado
    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) return;

        // Cargar email del usuario
        api.get<{ username: string; email: string }>('users/me/')
            .then(res => {
                if (res.data.email) {
                    setForm(prev => ({ ...prev, guest_email: res.data.email }));
                }
            })
            .catch(() => {});

        // Cargar datos de envío guardados
        api.get<ShippingProfileData>('users/shipping-profile/')
            .then(res => {
                const data = res.data;
                setForm(prev => ({
                    ...prev,
                    first_name: data.first_name || prev.first_name,
                    last_name: data.last_name || prev.last_name,
                    address_line1: data.address_line1 || prev.address_line1,
                    postal_code: data.postal_code || prev.postal_code,
                    city: data.city || prev.city,
                    province: data.province || prev.province,
                    phone: data.phone || prev.phone,
                }));
            })
            .catch(() => {});
    }, []);

    if (!orderPlaced && cart.length === 0) {
        navigate('/cart');
        return null;
    }

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (errors[e.target.name as keyof FormErrors]) {
            setErrors(prev => ({ ...prev, [e.target.name]: undefined }));
        }
    };

    const validate = (): boolean => {
        const newErrors: FormErrors = {};
        if (!form.first_name.trim()) newErrors.first_name = 'Requerido';
        if (!form.last_name.trim()) newErrors.last_name = 'Requerido';
        if (!form.address_line1.trim()) newErrors.address_line1 = 'Requerida';
        if (!form.postal_code.trim()) newErrors.postal_code = 'Requerido';
        if (!form.city.trim()) newErrors.city = 'Requerida';
        if (!form.province.trim()) newErrors.province = 'Requerida';
        if (!form.guest_email.trim()) newErrors.guest_email = 'Requerido';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.guest_email)) newErrors.guest_email = 'Email inválido';
        if (form.phone.trim() && !/^[\d\s\-+()]{7,20}$/.test(form.phone)) newErrors.phone = 'Teléfono inválido';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        const payload: GuestOrderPayload = {
            ...form,
            items: cart.map(item => ({
                product: item.id,
                quantity: item.quantity,
                price: item.price,
            })),
            total_price: totalPrice,
        };

        try {
            const res = await api.post<OrderConfirmation>('orders/guest-checkout/', payload);
            setOrderPlaced(true);
            clearCart();
            navigate('/thank-you', { state: { order: res.data } });
        } catch (err) {
            let msg = 'Error al procesar el pedido';
            if (axios.isAxiosError(err)) {
                msg = err.response?.data?.detail
                    || Object.values(err.response?.data || {}).flat().join(', ')
                    || err.message;
            }
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const inputClass = (field: keyof ShippingInfo) =>
        `input input-bordered w-full ${errors[field] ? 'input-error' : ''}`;

    return (
        <div className="max-w-3xl mx-auto">
            <h1 className="text-3xl font-black tracking-tighter mb-8 text-center">
                FINALIZAR <span className="text-primary">PEDIDO</span>
            </h1>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* ── Datos personales ── */}
                <div className="card bg-base-100 border border-base-200 shadow-xl">
                    <div className="card-body gap-4">
                        <h2 className="card-title text-lg font-black gap-2">
                            <User size={20} className="text-primary" />
                            Datos de contacto
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label label-text font-bold">Nombre *</label>
                                <input name="first_name" value={form.first_name} onChange={handleChange}
                                    className={inputClass('first_name')} placeholder="Tu nombre" />
                                {errors.first_name && <span className="label-text-alt text-error">{errors.first_name}</span>}
                            </div>
                            <div className="form-control">
                                <label className="label label-text font-bold">Apellidos *</label>
                                <input name="last_name" value={form.last_name} onChange={handleChange}
                                    className={inputClass('last_name')} placeholder="Tus apellidos" />
                                {errors.last_name && <span className="label-text-alt text-error">{errors.last_name}</span>}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="form-control">
                                <label className="label label-text font-bold gap-1">
                                    <Mail size={14} /> Email *
                                </label>
                                <input name="guest_email" type="email" value={form.guest_email} onChange={handleChange}
                                    className={inputClass('guest_email')} placeholder="tu@email.com" />
                                {errors.guest_email && <span className="label-text-alt text-error">{errors.guest_email}</span>}
                            </div>
                            <div className="form-control">
                                <label className="label label-text font-bold gap-1">
                                    <Phone size={14} /> Teléfono
                                </label>
                                <input name="phone" type="tel" value={form.phone} onChange={handleChange}
                                    className={inputClass('phone')} placeholder="+34 600 000 000" />
                                {errors.phone && <span className="label-text-alt text-error">{errors.phone}</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Dirección de envío ── */}
                <div className="card bg-base-100 border border-base-200 shadow-xl">
                    <div className="card-body gap-4">
                        <h2 className="card-title text-lg font-black gap-2">
                            <MapPin size={20} className="text-primary" />
                            Dirección de envío
                        </h2>
                        <div className="form-control">
                            <label className="label label-text font-bold">Dirección *</label>
                            <input name="address_line1" value={form.address_line1} onChange={handleChange}
                                className={inputClass('address_line1')} placeholder="Calle y número" />
                            {errors.address_line1 && <span className="label-text-alt text-error">{errors.address_line1}</span>}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            <div className="form-control">
                                <label className="label label-text font-bold">Cód. Postal *</label>
                                <input name="postal_code" value={form.postal_code} onChange={handleChange}
                                    className={inputClass('postal_code')} placeholder="28001" />
                                {errors.postal_code && <span className="label-text-alt text-error">{errors.postal_code}</span>}
                            </div>
                            <div className="form-control">
                                <label className="label label-text font-bold">Ciudad *</label>
                                <input name="city" value={form.city} onChange={handleChange}
                                    className={inputClass('city')} placeholder="Madrid" />
                                {errors.city && <span className="label-text-alt text-error">{errors.city}</span>}
                            </div>
                            <div className="form-control">
                                <label className="label label-text font-bold">Provincia *</label>
                                <input name="province" value={form.province} onChange={handleChange}
                                    className={inputClass('province')} placeholder="Madrid" />
                                {errors.province && <span className="label-text-alt text-error">{errors.province}</span>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Notas ── */}
                <div className="card bg-base-100 border border-base-200 shadow-xl">
                    <div className="card-body gap-4">
                        <h2 className="card-title text-lg font-black gap-2">
                            <ClipboardList size={20} className="text-primary" />
                            Notas adicionales
                        </h2>
                        <div className="form-control">
                            <label className="label label-text">Notas para el repartidor</label>
                            <textarea name="delivery_notes" value={form.delivery_notes} onChange={handleChange}
                                className="textarea textarea-bordered w-full h-24"
                                placeholder="Indicaciones extra para la entrega..." />
                        </div>
                    </div>
                </div>

                {/* ── Datos de pago (simulado) ── */}
                <div className="card bg-base-100 border border-base-200 shadow-xl">
                    <div className="card-body gap-4">
                        <h2 className="card-title text-lg font-black gap-2">
                            <CreditCard size={20} className="text-primary" />
                            Datos de pago
                        </h2>
                        <p className="text-xs opacity-50 -mt-2">Pasarela simulada — no se realiza ningún cobro real.</p>
                        <div className="form-control">
                            <input type="text" placeholder="Titular de la tarjeta" className="input input-bordered" defaultValue="Xeno Explorer" />
                        </div>
                        <div className="form-control">
                            <input type="text" placeholder="0000 0000 0000 0000" className="input input-bordered" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <input type="text" placeholder="MM/YY" className="input input-bordered" />
                            <input type="text" placeholder="CVC" className="input input-bordered" />
                        </div>
                    </div>
                </div>

                {/* ── Resumen + Pago ── */}
                <div className="card bg-base-100 border border-base-200 shadow-2xl">
                    <div className="card-body gap-6">
                        <div className="flex justify-between items-center p-4 bg-base-200 rounded-2xl">
                            <span className="font-bold opacity-60">Total a transferir:</span>
                            <span className="text-2xl font-black text-primary">{totalPrice.toFixed(2)} €</span>
                        </div>

                        <div className="flex items-start gap-3 opacity-60 text-xs italic">
                            <ShieldCheck className="text-success flex-shrink-0" size={18} />
                            <p>Tu conexión está encriptada. La flora alienígena será enviada a tu coordenada terrestre tras la confirmación.</p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn btn-primary btn-lg w-full rounded-2xl gap-3 mt-4"
                        >
                            {loading ? (
                                <span className="loading loading-spinner"></span>
                            ) : (
                                <><Rocket size={22} /> Confirmar Pedido</>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default CheckoutPage;
