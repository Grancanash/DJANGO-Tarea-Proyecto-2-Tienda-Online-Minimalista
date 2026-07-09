import { useState, useEffect } from 'react';
import api from '../api/axios';
import type { Product, PaginatedResponse } from '../types/store';
import { ShoppingCart, Eye, ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import fotoHero from '../assets/img/planta-hero.png';

const HomePage = () => {
    const [featured, setFeatured] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const { addToCart, cart } = useCart();

    useEffect(() => {
        const fetchFeatured = async () => {
            setLoading(true);
            try {
                const res = await api.get<PaginatedResponse<Product>>('products/?featured=1');
                setFeatured(res.data.results);
            } catch (error) {
                console.error("Error al cargar destacados", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFeatured();
    }, []);

    return (
        <div className="space-y-12">

            {/* ─── Hero Section ─── */}
            <section className="hero bg-base-200 rounded-3xl overflow-hidden min-h-[60vh]">
                <div className="hero-content flex-col md:flex-row-reverse gap-12 p-10 md:p-16 w-full max-w-none">

                    <div className="w-full md:w-1/2 flex items-center justify-center relative aspect-square md:aspect-auto">
                    {/* Decoración de fondo (se mantiene igual) */}
                    <div className="absolute inset-0 bg-primary/5 rounded-3xl transform rotate-3 scale-105"></div>

                    {/* La "Tarjeta" (contenedor con sombra y rotación, se mantiene igual) */}
                    <div className="relative bg-white p-6 shadow-2xl rounded-3xl border border-base-300 w-4/5 transform -rotate-2 hover:rotate-0 transition-transform duration-500">
                        
                        {/* Contenedor de la Imagen (reemplaza el marcador de posición anterior) */}
                        <div className="aspect-[4/5] rounded-xl overflow-hidden border border-base-200 bg-base-100 flex items-center justify-center">
                            {/* 1. Imagen de planta exótica (usando la previsualización generada) */}
                            <img 
                                src={fotoHero} 
                                alt="Espécimen Botánico Xenforme Alpha-7" 
                                className="w-full h-full object-cover" 
                            />
                        </div>

                        {/* Texto descriptivo (reemplaza las líneas de esqueleto para mayor realismo) */}
                        <div className="mt-4 text-center">
                            <h3 className="font-bold text-lg text-neutral">Xenoflora Espécimen Alpha-7</h3>
                            <p className="text-sm opacity-60">Edición Especial • Aclimatación Garantizada</p>
                        </div>
                    </div>

                    {/* Decoración de fondo (blur, se mantiene igual) */}
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-secondary/10 rounded-full blur-3xl"></div>
                </div>

                    <div className="w-full md:w-1/2 text-center md:text-left flex flex-col items-center md:items-start">
                        <div className="badge badge-primary badge-outline mb-4 px-4 py-3 font-medium tracking-wide">ESPECIES VIVAS DE OTRA GALAXIA</div>
                        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter leading-[0.95] mb-6">
                            BOTÁNICA <br />
                            <span className="text-primary relative inline-block">
                                XENOFORME
                                <span className="absolute -bottom-2 left-0 w-full h-2 bg-secondary rounded-full opacity-80"></span>
                            </span>
                        </h1>
                        <p className="text-xl opacity-70 max-w-lg mb-10 leading-relaxed">
                            Buscamos y seleccionamos las plantas más extraordinarias del mercado. Ejemplares de gran impacto visual, bajo mantenimiento y con envío seguro garantizado a tu puerta.
                        </p>
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                            <Link to="/catalog" className="btn btn-primary btn-lg rounded-full px-10 shadow-lg shadow-primary/20 group">
                                Ver Catálogo
                                <ArrowRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* ─── Sección Destacados ─── */}
            <section className="space-y-8">
                <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-2 text-primary">
                        <Sparkles size={24} />
                        <h2 className="text-3xl font-black tracking-tighter">DESTACADOS</h2>
                        <Sparkles size={24} />
                    </div>
                    <p className="opacity-50 max-w-md mx-auto">
                        Nuestras especies más exclusivas, seleccionadas para ti.
                    </p>
                </div>

                {loading ? (
                    <div className="flex justify-center py-20">
                        <span className="loading loading-spinner loading-lg text-primary"></span>
                    </div>
                ) : featured.length === 0 ? (
                    <div className="text-center py-16 opacity-50">
                        <p className="text-lg">No hay productos destacados en este momento.</p>
                        <Link to="/catalog" className="btn btn-ghost mt-4">Ver catálogo completo</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {featured.map(product => (
                        <div key={product.id} className="group flex flex-col h-full">
                            <Link to={`/product/${product.id}`} className="relative aspect-3/4 overflow-hidden rounded-2xl bg-base-200 mb-4 block">
                                {product.image ? (
                                    <img
                                        src={product.image}
                                        alt={product.name}
                                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-base-300 font-bold italic">
                                        Sin imagen
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="btn btn-circle bg-white text-black border-none shadow-xl scale-90 group-hover:scale-100 transition-transform">
                                        <Eye size={20} />
                                    </div>
                                </div>
                            </Link>

                            <div className="space-y-1 flex-1">
                                <Link to={`/product/${product.id}`} className="block">
                                    <h3 className="font-bold text-lg hover:text-primary transition-colors leading-tight">
                                        {product.name}
                                    </h3>
                                </Link>
                                <p className="text-sm opacity-50 line-clamp-2 min-h-10">{product.summary}</p>
                            </div>

                            <div className="flex items-center justify-between mt-4">
                                <p className="font-black text-xl">{product.price} €</p>
                                <div className="relative">
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            addToCart(product);
                                        }}
                                        className="btn btn-primary btn-sm btn-circle shadow-lg"
                                        title="Añadir al carrito"
                                    >
                                        <ShoppingCart size={18} />
                                    </button>
                                    {(() => {
                                        const cartItem = cart.find(item => item.id === product.id);
                                        return cartItem && cartItem.quantity > 0 ? (
                                            <span className="absolute -top-1.5 -right-1.5 bg-error text-error-content text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center shadow pointer-events-none">
                                                {cartItem.quantity}
                                            </span>
                                        ) : null;
                                    })()}
                                </div>
                            </div>
                        </div>
                        ))}
                    </div>
                )}

                <div className="text-center">
                    <Link to="/catalog" className="btn btn-outline rounded-full px-8">
                        Ver catálogo completo
                        <ArrowRight size={18} />
                    </Link>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
