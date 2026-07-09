import { useState, type SyntheticEvent, useEffect } from 'react';
import axios from 'axios';
import api from '../api/axios';
import { Eye, EyeOff, User, Mail, LogOut, UserPlus, Sprout, MapPin, Phone, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import type { ShippingProfileData } from '../types/store';
import GoogleLoginButton from '../components/GoogleLoginButton';

const PasswordInput = ({ label, value, onChange, placeholder = "" }: {
    label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) => {
    const [show, setShow] = useState(false);
    return (
        <div className="form-control">
            <label className="label"><span className="label-text font-semibold">{label}</span></label>
            <div className="relative">
                <input type={show ? "text" : "password"} className="input input-bordered w-full pr-10"
                    value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} required />
                <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-primary transition-colors"
                    onClick={() => setShow(!show)}>
                    {show ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
            </div>
        </div>
    );
};

const emptyShipping: ShippingProfileData = {
    first_name: '', last_name: '', address_line1: '', postal_code: '', city: '', province: '', phone: '',
};

/* ─── Perfil de usuario logueado ─── */
const UserProfileSection = () => {
    const navigate = useNavigate();
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState({ type: '', text: '' });
    const [shipping, setShipping] = useState<ShippingProfileData>(emptyShipping);
    const [savingShipping, setSavingShipping] = useState(false);
    const [userInfo, setUserInfo] = useState({ username: '', email: '' });

    const isDemoAdmin = userInfo.username === 'demo';

    useEffect(() => {
        api.get<{ username: string; email: string }>('users/me/')
            .then(res => setUserInfo(res.data))
            .catch(() => {});
        api.get<ShippingProfileData>('users/shipping-profile/')
            .then(res => setShipping(res.data))
            .catch(() => {});
    }, []);

    const handlePasswordChange = async (e: SyntheticEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Las nuevas contraseñas no coinciden' }); return;
        }
        try {
            await api.post('change-password/', { old_password: oldPassword, new_password: newPassword });
            setMessage({ type: 'success', text: 'Contraseña actualizada correctamente' });
            setOldPassword(''); setNewPassword(''); setConfirmPassword('');
            toast.success('Contraseña actualizada');
        } catch (err) {
            let m = 'Error al cambiar la contraseña';
            if (axios.isAxiosError(err)) m = err.response?.data?.error || err.message;
            setMessage({ type: 'error', text: m });
        }
    };

    const handleShippingSave = async (e: SyntheticEvent) => {
        e.preventDefault();
        setSavingShipping(true);
        try {
            await api.put('users/shipping-profile/', shipping);
            toast.success('Datos de envío guardados');
        } catch {
            toast.error('Error al guardar los datos');
        } finally {
            setSavingShipping(false);
        }
    };

    const updateShipping = (field: keyof ShippingProfileData, value: string) => {
        setShipping(prev => ({ ...prev, [field]: value }));
    };

    const handleLogout = () => {
        localStorage.removeItem('token'); localStorage.removeItem('refresh');
        navigate('/');
    };

    const inputClass = "input input-bordered w-full";

    return (
        <div className="max-w-lg mx-auto space-y-8">
            {/* Datos de cuenta */}
            <div className="card bg-base-100 shadow-xl border border-base-200">
                <div className="card-body gap-4">
                    <h2 className="card-title text-2xl font-black"><User size={22} className="text-primary" /> Mi Perfil</h2>
                    <div className="space-y-3 mt-2">
                        <div className="flex items-center gap-3 p-3 bg-base-200 rounded-xl">
                            <User size={18} className="opacity-40" />
                            <div>
                                <p className="text-xs opacity-50">Usuario</p>
                                <p className="font-bold">{userInfo.username || '—'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-base-200 rounded-xl">
                            <Mail size={18} className="opacity-40" />
                            <div>
                                <p className="text-xs opacity-50">Email</p>
                                <p className="font-bold">{userInfo.email || '—'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Datos de envío (opcional) */}
            <div className="card bg-base-100 shadow-xl border border-base-200">
                <div className="card-body gap-4">
                    <h3 className="font-black text-lg flex items-center gap-2"><MapPin size={20} className="text-primary" /> Datos de envío</h3>
                    <p className="text-xs opacity-50 -mt-2">Opcional. Si los rellenas, se usarán para prerellenar el checkout.</p>
                    <form onSubmit={handleShippingSave} className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="form-control">
                                <label className="label-text text-xs font-bold">Nombre</label>
                                <input className={inputClass} value={shipping.first_name} onChange={e => updateShipping('first_name', e.target.value)} placeholder="Tu nombre" />
                            </div>
                            <div className="form-control">
                                <label className="label-text text-xs font-bold">Apellidos</label>
                                <input className={inputClass} value={shipping.last_name} onChange={e => updateShipping('last_name', e.target.value)} placeholder="Tus apellidos" />
                            </div>
                        </div>
                        <div className="form-control">
                            <label className="label-text text-xs font-bold">Dirección</label>
                            <input className={inputClass} value={shipping.address_line1} onChange={e => updateShipping('address_line1', e.target.value)} placeholder="Calle y número" />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="form-control">
                                <label className="label-text text-xs font-bold">Cód. Postal</label>
                                <input className={inputClass} value={shipping.postal_code} onChange={e => updateShipping('postal_code', e.target.value)} placeholder="28001" />
                            </div>
                            <div className="form-control">
                                <label className="label-text text-xs font-bold">Ciudad</label>
                                <input className={inputClass} value={shipping.city} onChange={e => updateShipping('city', e.target.value)} placeholder="Madrid" />
                            </div>
                            <div className="form-control">
                                <label className="label-text text-xs font-bold">Provincia</label>
                                <input className={inputClass} value={shipping.province} onChange={e => updateShipping('province', e.target.value)} placeholder="Madrid" />
                            </div>
                        </div>
                        <div className="form-control">
                            <label className="label-text text-xs font-bold flex items-center gap-1"><Phone size={12} /> Teléfono</label>
                            <input className={inputClass} value={shipping.phone} onChange={e => updateShipping('phone', e.target.value)} placeholder="+34 600 000 000" />
                        </div>
                        <button type="submit" disabled={savingShipping} className="btn btn-primary btn-sm rounded-2xl gap-2 mt-2">
                            {savingShipping ? <span className="loading loading-spinner loading-xs"></span> : <><Save size={16} /> Guardar datos de envío</>}
                        </button>
                    </form>
                </div>
            </div>

            {/* Cambiar contraseña */}
            <div className="card bg-base-100 shadow-xl border border-base-200">
                <div className="card-body">
                    <h3 className="font-black text-lg mb-2">Cambiar Contraseña</h3>

                    {isDemoAdmin ? (
                        <div className="bg-info/10 border border-info/20 rounded-xl p-4 text-sm space-y-2">
                            <p className="font-bold text-info">🔒 Cuenta demo compartida</p>
                            <p className="opacity-70">
                                Esta cuenta de demostración la comparten todos los visitantes de la tienda.
                                Para que nadie se quede sin acceso, <strong>la contraseña no se puede modificar</strong>.
                            </p>
                            <p className="opacity-50 text-xs">
                                Si quieres tu propia cuenta con contraseña personalizada, crea una nueva desde la página de registro.
                            </p>
                        </div>
                    ) : (
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <PasswordInput label="Contraseña Actual" value={oldPassword} onChange={setOldPassword} />
                            <PasswordInput label="Nueva Contraseña" value={newPassword} onChange={setNewPassword} />
                            <PasswordInput label="Confirmar Nueva Contraseña" value={confirmPassword} onChange={setConfirmPassword} />
                            {message.text && (
                                <div className={`text-sm font-bold p-3 rounded-xl ${message.type === 'error' ? 'bg-error/10 text-error border border-error/20' : 'bg-success/10 text-success border border-success/20'}`}>
                                    {message.text}
                                </div>
                            )}
                            <button type="submit" className="btn btn-primary w-full rounded-2xl">Actualizar Contraseña</button>
                        </form>
                    )}
                </div>
            </div>

            <button onClick={handleLogout} className="btn btn-ghost w-full text-error gap-2"><LogOut size={18} /> Cerrar Sesión</button>
        </div>
    );
};

/* ─── Formulario de registro ─── */
const RegisterSection = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
        if (errors[e.target.name]) setErrors(prev => ({ ...prev, [e.target.name]: '' }));
    };

    const handleSubmit = async (e: SyntheticEvent) => {
        e.preventDefault();
        if (form.password !== form.confirmPassword) { setErrors({ confirmPassword: 'Las contraseñas no coinciden' }); return; }
        setLoading(true); setErrors({});
        try {
            await api.post('users/register/', { username: form.username, email: form.email, password: form.password });
            const tokenRes = await api.post('token/', { username: form.username, password: form.password });
            localStorage.setItem('token', tokenRes.data.access); localStorage.setItem('refresh', tokenRes.data.refresh);
            toast.success('¡Cuenta creada con éxito!');
            navigate('/profile', { replace: true }); window.location.reload();
        } catch (err) {
            if (axios.isAxiosError(err) && err.response?.data) setErrors(err.response.data as Record<string, string>);
            else toast.error('Error al crear la cuenta');
        } finally { setLoading(false); }
    };

    return (
        <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
                <div className="flex items-center justify-center gap-2 text-2xl font-black tracking-tighter mb-2">
                    <Sprout className="text-primary" size={28} /><span>XENO<span className="text-primary">FLORA</span></span>
                </div>
                <h2 className="text-2xl font-black tracking-tighter mt-4">Crear <span className="text-primary">Cuenta</span></h2>
                <p className="text-sm opacity-50 mt-1">Regístrate para acceder a tu perfil, historial de pedidos y guías de cuidado.</p>
            </div>
            <div className="card bg-base-100 shadow-xl border border-base-200">
                <form onSubmit={handleSubmit} className="card-body gap-4">
                    <div className="form-control">
                        <label className="label label-text font-bold gap-1"><User size={14} /> Nombre de usuario</label>
                        <input name="username" value={form.username} onChange={handleChange} className={`input input-bordered w-full ${errors.username ? 'input-error' : ''}`} placeholder="usuario123" required />
                        {errors.username && <span className="label-text-alt text-error">{errors.username}</span>}
                    </div>
                    <div className="form-control">
                        <label className="label label-text font-bold gap-1"><Mail size={14} /> Email</label>
                        <input name="email" type="email" value={form.email} onChange={handleChange} className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`} placeholder="tu@email.com" required />
                        {errors.email && <span className="label-text-alt text-error">{errors.email}</span>}
                    </div>
                    <div className="form-control">
                        <label className="label label-text font-bold">Contraseña</label>
                        <input name="password" type="password" value={form.password} onChange={handleChange} className={`input input-bordered w-full ${errors.password ? 'input-error' : ''}`} placeholder="Mínimo 4 caracteres" required />
                        {errors.password && <span className="label-text-alt text-error">{errors.password}</span>}
                    </div>
                    <div className="form-control">
                        <label className="label label-text font-bold">Confirmar Contraseña</label>
                        <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} className={`input input-bordered w-full ${errors.confirmPassword ? 'input-error' : ''}`} placeholder="Repite la contraseña" required />
                        {errors.confirmPassword && <span className="label-text-alt text-error">{errors.confirmPassword}</span>}
                    </div>
                    <button type="submit" disabled={loading} className="btn btn-primary w-full rounded-2xl gap-2 mt-2">
                        {loading ? <span className="loading loading-spinner loading-sm"></span> : <><UserPlus size={18} /> Crear Cuenta</>}
                    </button>

                    <div className="divider text-xs opacity-40">o</div>

                    <GoogleLoginButton
                        onSuccess={() => { navigate('/profile', { replace: true }); window.location.reload(); }}
                        label="Registrarse con Google"
                    />
                </form>
            </div>
            <p className="text-center text-sm opacity-50 mt-6">¿Ya tienes cuenta? <a href="/login" className="text-primary font-bold hover:underline">Inicia sesión</a></p>
        </div>
    );
};

const ProfilePage = () => {
    const token = localStorage.getItem('token');
    if (token) return <UserProfileSection />;
    return <RegisterSection />;
};

export default ProfilePage;
