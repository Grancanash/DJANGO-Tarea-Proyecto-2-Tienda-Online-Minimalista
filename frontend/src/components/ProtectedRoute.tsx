import { Navigate, Outlet } from 'react-router-dom';

function decodeJwt<T = Record<string, unknown>>(token: string): T | null {
    try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload));
    } catch {
        return null;
    }
}

const ProtectedRoute = () => {
    const token = localStorage.getItem('token');

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    const payload = decodeJwt<{ is_store_admin?: boolean }>(token);

    // Solo administradores de la tienda (is_store_admin=true) acceden al panel
    if (!payload?.is_store_admin) {
        localStorage.removeItem('token');
        localStorage.removeItem('refresh');
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export default ProtectedRoute;
