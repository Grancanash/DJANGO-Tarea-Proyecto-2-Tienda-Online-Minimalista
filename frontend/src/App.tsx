import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProducts from './pages/AdminProducts';
import ProfilePage from './pages/ProfilePage';
import AdminLayout from './pages/AdminLayout';
import AdminCategories from './pages/AdminCategories';
import AdminOrders from './pages/AdminOrders';
import ShopLayout from './pages/ShopLayout';
import { Toaster } from 'react-hot-toast';
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import ThankYouPage from './pages/ThankYouPage';
import CatalogPage from './pages/CatalogPage';

function App() {
  return (
    <>
        <Toaster 
            position="top-center" 
            toastOptions={{
                className: 'font-sans',
                duration: 3000,
                style: {
                    background: '#333',
                    color: '#fff',
                },
            }} 
        />
        <BrowserRouter>
        <Routes>
            {/* ZONA PÚBLICA (Tienda) */}
            <Route element={<ShopLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/catalog" element={<CatalogPage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/thank-you" element={<ThankYouPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* ZONA PRIVADA (Administración) */}
            <Route element={<ProtectedRoute />}>
                <Route element={<AdminLayout />}>
                    <Route path="/admin" element={<AdminProducts />} />
                    <Route path="/admin/categories" element={<AdminCategories />} />
                    <Route path="/admin/orders" element={<AdminOrders />} />
                    <Route path="/admin/profile" element={<ProfilePage />} />
                </Route>
            </Route>

            {/* Redirección por defecto */}
            <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        </BrowserRouter>
    </>
  );
}

export default App;