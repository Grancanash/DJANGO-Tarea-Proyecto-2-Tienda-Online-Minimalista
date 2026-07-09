import { useState } from 'react';
import {
    Sprout, Shield, User, Key, Clock, X, Copy, Check,
} from 'lucide-react';

const STORAGE_KEY = 'xenoflora_welcome_dismissed';

interface WelcomeModalProps {
    /** Si es true, el modal se abre forzado (botón de info en navbar) */
    forceOpen?: boolean;
    onClose: () => void;
}

const WelcomeModal = ({ forceOpen, onClose }: WelcomeModalProps) => {
    const [dismissed, setDismissed] = useState(
        () => !!localStorage.getItem(STORAGE_KEY)
    );
    const [copied, setCopied] = useState<'user' | 'pass' | null>(null);

    // Visible si el padre lo fuerza O si el usuario nunca lo ha cerrado
    const visible = forceOpen || !dismissed;

    const handleDismiss = () => {
        localStorage.setItem(STORAGE_KEY, '1');
        setDismissed(true);
        onClose();
    };

    const copyToClipboard = async (text: string, type: 'user' | 'pass') => {
        await navigator.clipboard.writeText(text);
        setCopied(type);
        setTimeout(() => setCopied(null), 1500);
    };

    if (!visible) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                onClick={handleDismiss}
            />

            {/* Modal */}
            <div className="relative bg-base-100 rounded-3xl shadow-2xl border border-base-300 max-w-lg w-full p-8 space-y-6 animate-in zoom-in-95 duration-200">
                {/* Botón cerrar */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 btn btn-ghost btn-sm btn-circle"
                    title="Cerrar"
                >
                    <X size={18} />
                </button>

                {/* Cabecera */}
                <div className="text-center space-y-2">
                    <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                        <Sprout size={32} className="text-primary" />
                    </div>
                    <h2 className="text-2xl font-black tracking-tighter">
                        ¡Bienvenido a <span className="text-primary">XenoFlora</span>!
                    </h2>
                    <p className="text-sm opacity-60 max-w-sm mx-auto">
                        Una tienda ficticia de plantas alienígenas creada como demo
                        FullStack (Django + React + Tailwind CSS).
                    </p>
                </div>

                <div className="divider my-1"></div>

                {/* Zona admin */}
                <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-black">
                        <Shield size={18} className="text-primary" />
                        Zona de administración
                    </div>
                    <p className="text-xs opacity-60">
                        Accede al panel de administración para gestionar productos,
                        categorías y pedidos. Haz clic en tu avatar y selecciona
                        <span className="font-bold"> "Administración"</span>.
                    </p>

                    {/* Credenciales */}
                    <div className="bg-base-200 rounded-xl p-4 space-y-2 font-mono text-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <User size={14} className="opacity-50" />
                                <span className="opacity-60">Usuario:</span>
                                <span className="font-bold">demo</span>
                            </div>
                            <button
                                className="btn btn-ghost btn-xs"
                                onClick={() => copyToClipboard('demo', 'user')}
                            >
                                {copied === 'user' ? (
                                    <Check size={14} className="text-success" />
                                ) : (
                                    <Copy size={14} />
                                )}
                            </button>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Key size={14} className="opacity-50" />
                                <span className="opacity-60">Contraseña:</span>
                                <span className="font-bold">123456</span>
                            </div>
                            <button
                                className="btn btn-ghost btn-xs"
                                onClick={() => copyToClipboard('123456', 'pass')}
                            >
                                {copied === 'pass' ? (
                                    <Check size={14} className="text-success" />
                                ) : (
                                    <Copy size={14} />
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="divider my-1"></div>

                {/* Reset diario */}
                <div className="flex items-start gap-3 bg-warning/10 border border-warning/20 rounded-xl p-4">
                    <Clock size={20} className="text-warning mt-0.5 flex-shrink-0" />
                    <div className="text-sm space-y-1">
                        <p className="font-bold text-warning">Reset diario automático</p>
                        <p className="opacity-60">
                            Cada noche a las 00:00 la tienda vuelve a su estado original.
                            ¡Haz todas las pruebas que quieras sin miedo!
                        </p>
                    </div>
                </div>

                {/* Botón empezar */}
                <button
                    onClick={handleDismiss}
                    className="btn btn-primary w-full rounded-2xl gap-2"
                >
                    <Sprout size={18} />
                    Explorar la tienda
                </button>
            </div>
        </div>
    );
};

export default WelcomeModal;
