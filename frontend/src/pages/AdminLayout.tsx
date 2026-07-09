import { Sprout } from 'lucide-react';
import { Link, useNavigate, Outlet } from 'react-router-dom';

const AdminLayout = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        navigate(0); // recarga la página actual
    };

    return (
        <div className="min-h-screen bg-base-200 font-sans">
            {/* Navbar Única para todo el Admin */}
            {/* <div className="navbar bg-base-100 shadow-md px-8 mb-8 gap-4"> */}
            <header className="navbar bg-base-100 shadow-md px-8 mb-8 sticky top-0 z-50 gap-4">
                <div className="flex-1">
                    <Link to="/admin" className="flex items-center gap-2 text-2xl font-black tracking-tighter">
                        <Sprout className="text-primary" size={30} strokeWidth={2.5} />
                        <span>XENO<span className="text-primary">FLORA</span></span>
                    </Link>
                </div>
                <div className="flex-none flex gap-4">
                    <Link to="/admin" className="btn btn-ghost">Inventario</Link>
                    <Link to="/admin/categories" className="btn btn-ghost">Catgorías</Link>
                    <Link to="/admin/orders" className="btn btn-ghost">Pedidos</Link> 
                    <Link to="/admin/profile" className="btn btn-ghost">Mi Perfil</Link>
                    <button onClick={handleLogout} className="btn btn-secondary">
                        Salir
                    </button>
                </div>
            </header>

            {/* Aquí se renderizarán las páginas (Inventario o Perfil) */}
            <main className="max-w-7xl mx-auto px-4 pb-20">
                <Outlet />
            </main>
        </div>
    );
};

export default AdminLayout;