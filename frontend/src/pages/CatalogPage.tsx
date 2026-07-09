import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../api/axios';
import type { Product, Category, PaginatedResponse } from '../types/store';
import { ShoppingCart, Eye } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const PAGE_SIZE = 12;

const CatalogPage = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [nextPage, setNextPage] = useState<string | null>(null);
    const { addToCart, cart } = useCart();

    const sentinelRef = useRef<HTMLDivElement | null>(null);

    // Cargar categorías solo una vez
    useEffect(() => {
        api.get<Category[]>('categories/')
            .then(res => setCategories(res.data))
            .catch(console.error);
    }, []);

    // Al cambiar de categoría, reseteamos y cargamos la primera página
    useEffect(() => {
        const fetchFirstPage = async () => {
            setLoading(true);
            setProducts([]);
            setNextPage(null);
            try {
                const params = new URLSearchParams();
                params.set('page', '1');
                params.set('page_size', String(PAGE_SIZE));
                if (selectedCategory) params.set('category', selectedCategory);

                const res = await api.get<PaginatedResponse<Product>>(`products/?${params.toString()}`);
                setProducts(res.data.results);
                setNextPage(res.data.next);
            } catch (error) {
                console.error("Error al cargar el catálogo", error);
            } finally {
                setLoading(false);
            }
        };
        fetchFirstPage();
    }, [selectedCategory]);

    // Cargar página siguiente (scroll infinito)
    const loadMore = useCallback(async () => {
        if (!nextPage || loadingMore) return;
        setLoadingMore(true);
        try {
            // Django devuelve next como URL absoluta (http://...), necesitamos relativa
            const relativeUrl = nextPage.replace(/^https?:\/\/[^/]+\/api/, '');
            const res = await api.get<PaginatedResponse<Product>>(relativeUrl);
            setProducts(prev => [...prev, ...res.data.results]);
            setNextPage(res.data.next);
        } catch (error) {
            console.error("Error al cargar más productos", error);
        } finally {
            setLoadingMore(false);
        }
    }, [nextPage, loadingMore]);

    // IntersectionObserver para el sentinel
    useEffect(() => {
        const sentinel = sentinelRef.current;
        if (!sentinel) return;

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting && nextPage && !loadingMore) {
                    loadMore();
                }
            },
            { rootMargin: '200px' }
        );

        observer.observe(sentinel);
        return () => observer.disconnect();
    }, [loadMore, nextPage, loadingMore]);

    return (
        <div className="space-y-10">
            {/* ─── Cabecera ─── */}
            <section className="text-center py-8">
                <h1 className="text-4xl font-black tracking-tighter mb-4">
                    CATÁLOGO <span className="text-primary">COMPLETO</span>
                </h1>
                <p className="opacity-60 max-w-md mx-auto">
                    Explora todas nuestras especies xeno-botánicas.
                </p>
            </section>

            {/* ─── Filtro de Categorías ─── */}
            <div className="flex flex-wrap justify-center gap-2">
                <button
                    onClick={() => setSelectedCategory('')}
                    className={`btn rounded-full text-base ${selectedCategory === '' ? 'btn-primary' : 'btn-ghost'}`}
                >
                    Todos
                </button>
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id.toString())}
                        className={`btn rounded-full text-base ${selectedCategory === cat.id.toString() ? 'btn-primary' : 'btn-ghost'}`}
                    >
                        {cat.name}
                    </button>
                ))}
            </div>

            {/* ─── Grid de Productos ─── */}
            {loading ? (
                <div className="flex justify-center py-20">
                    <span className="loading loading-spinner loading-lg text-primary"></span>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                        {products.map(product => (
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

                    {/* ─── Sentinel para scroll infinito ─── */}
                    <div ref={sentinelRef} className="flex justify-center py-10">
                        {loadingMore && (
                            <span className="loading loading-spinner loading-md text-primary"></span>
                        )}
                        {!nextPage && products.length > 0 && (
                            <p className="text-sm opacity-40 italic">— Has llegado al final del catálogo —</p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default CatalogPage;
