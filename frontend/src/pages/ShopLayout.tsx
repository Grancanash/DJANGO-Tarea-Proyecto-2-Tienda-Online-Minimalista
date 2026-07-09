import { useState, useMemo } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import {
    ShoppingCart, User, Sprout, LogOut, Shield, Info,
    Menu, X, Home, Search,
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import WelcomeModal from '../components/WelcomeModal';

const ShopLayout = () => {
    const { totalItems } = useCart();
    const token = localStorage.getItem('token');
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [welcomeOpen, setWelcomeOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const navigate = useNavigate();

    const isStaff = useMemo(() => {
        if (!token) return false;
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload?.is_store_admin === true;
        } catch {
            return false;
        }
    }, [token]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        setDropdownOpen(false);
        setMobileMenuOpen(false);
        navigate(0);
    };

    const closeMobileMenu = () => setMobileMenuOpen(false);

    return (
        <div className="min-h-screen bg-white font-sans">
            {/* ─── Modal de bienvenida (primera visita o botón info) ─── */}
            <WelcomeModal
                forceOpen={welcomeOpen}
                onClose={() => setWelcomeOpen(false)}
            />

            {/* ─── Overlay del menú móvil ─── */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm sm:hidden"
                    onClick={closeMobileMenu}
                />
            )}

            {/* ─── Panel lateral móvil ─── */}
            <div
                className={`fixed top-0 right-0 z-50 h-full w-72 bg-base-100 shadow-2xl transform transition-transform duration-300 ease-in-out sm:hidden ${
                    mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex items-center justify-between p-4 border-b border-base-200">
                    <span className="font-black text-lg tracking-tighter">
                        <Sprout className="text-primary inline" size={20} /> Menú
                    </span>
                    <button
                        className="btn btn-ghost btn-sm btn-circle"
                        onClick={closeMobileMenu}
                    >
                        <X size={20} />
                    </button>
                </div>

                <ul className="menu p-4 gap-1 text-base">
                    <li>
                        <Link to="/" onClick={closeMobileMenu}>
                            <Home size={18} /> Inicio
                        </Link>
                    </li>
                    <li>
                        <Link to="/catalog" onClick={closeMobileMenu}>
                            <Search size={18} /> Catálogo
                        </Link>
                    </li>
                    <li>
                        <button
                            onClick={() => { closeMobileMenu(); setWelcomeOpen(true); }}
                        >
                            <Info size={18} /> Acerca de la tienda
                        </button>
                    </li>
                    <div className="divider my-1"></div>
                    <li>
                        <Link to="/cart" onClick={closeMobileMenu}>
                            <ShoppingCart size={18} />
                            Carrito
                            {totalItems > 0 && (
                                <span className="badge badge-sm badge-primary ml-auto">{totalItems}</span>
                            )}
                        </Link>
                    </li>
                    {token ? (
                        <>
                            <li>
                                <Link to="/profile" onClick={closeMobileMenu}>
                                    <User size={18} /> Mi Perfil
                                </Link>
                            </li>
                            {isStaff && (
                                <li>
                                    <Link to="/admin" onClick={closeMobileMenu}>
                                        <Shield size={18} /> Administración
                                    </Link>
                                </li>
                            )}
                            <div className="divider my-1"></div>
                            <li>
                                <button onClick={handleLogout}>
                                    <LogOut size={18} /> Cerrar Sesión
                                </button>
                            </li>
                        </>
                    ) : (
                        <li>
                            <Link to="/login" onClick={closeMobileMenu}>
                                <User size={18} /> Iniciar Sesión
                            </Link>
                        </li>
                    )}
                </ul>
            </div>

            {/* Navbar Pública */}
            <header className="navbar bg-base-100 shadow-md px-4 sm:px-10 py-3 min-h-[4rem] sticky top-0 z-30">
                <div className="flex-1">
                    <Link to="/" className="flex items-center gap-2 text-xl sm:text-2xl font-black tracking-tighter">
                        <Sprout className="text-primary" size={26} strokeWidth={2.5} />
                        <span className="hidden sm:inline">XENO<span className="text-primary">FLORA</span></span>
                    </Link>
                </div>

                {/* Enlaces de escritorio */}
                <Link to="/" className="btn btn-ghost text-base font-bold hidden sm:flex">
                    Inicio
                </Link>
                <Link to="/catalog" className="btn btn-ghost text-base font-bold hidden sm:flex">
                    Catálogo
                </Link>

                <div className="flex-none gap-1 flex items-center">
                    {/* Info (escritorio y móvil) */}
                    <button
                        className="btn btn-ghost btn-circle hidden sm:flex"
                        title="Acerca de la tienda"
                        onClick={() => setWelcomeOpen(true)}
                    >
                        <Info size={22} />
                    </button>

                    {/* Carrito */}
                    <Link to="/cart" className="btn btn-ghost btn-circle">
                        <div className="indicator">
                            <ShoppingCart size={22} />
                            {totalItems > 0 && (
                                <span className="badge badge-sm badge-primary indicator-item">
                                    {totalItems}
                                </span>
                            )}
                        </div>
                    </Link>

                    {/* Usuario (escritorio) */}
                    <div className="hidden sm:block">
                        {token ? (
                            <div className={`dropdown dropdown-end ${dropdownOpen ? 'dropdown-open' : ''}`}>
                                <button
                                    className="btn btn-ghost btn-circle"
                                    title="Mi cuenta"
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    onBlur={() => setTimeout(() => setDropdownOpen(false), 150)}
                                >
                                    <User size={22} />
                                </button>
                                <ul className="dropdown-content menu p-2 shadow-lg bg-base-100 rounded-box w-48 mt-2 z-50 border border-base-200">
                                    <li>
                                        <Link to="/profile" onClick={() => setDropdownOpen(false)}>
                                            <User size={16} /> Mi Perfil
                                        </Link>
                                    </li>
                                    {isStaff && (
                                        <li>
                                            <Link to="/admin" onClick={() => setDropdownOpen(false)}>
                                                <Shield size={16} /> Administración
                                            </Link>
                                        </li>
                                    )}
                                    <li>
                                        <button onClick={handleLogout}>
                                            <LogOut size={16} /> Cerrar Sesión
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        ) : (
                            <Link to="/login" className="btn btn-ghost btn-circle" title="Iniciar Sesión">
                                <User size={22} />
                            </Link>
                        )}
                    </div>

                    {/* Hamburguesa (móvil) */}
                    <button
                        className="btn btn-ghost btn-circle sm:hidden"
                        onClick={() => setMobileMenuOpen(true)}
                        title="Menú"
                    >
                        <Menu size={24} />
                    </button>
                </div>
            </header>

            {/* Contenido Principal */}
            <main className="max-w-7xl mx-auto px-4 py-8">
                <Outlet />
            </main>

            {/* Footer Minimalista */}
            <footer className="footer footer-center p-10 bg-base-200 text-base-content mt-20">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Sprout className="text-primary" size={24} />
                        <p className="font-black text-2xl tracking-tighter">XENO<span className="text-primary">FLORA</span></p>
                    </div>
                    <p className="opacity-60 italic">Botánica del más allá para hogares terrestres.</p>
                    <p className="text-xs mt-4 opacity-40">Copyright © {new Date().getFullYear()} - Todos los derechos reservados</p>
                </div>
            </footer>
        </div>
    );
};

export default ShopLayout;
