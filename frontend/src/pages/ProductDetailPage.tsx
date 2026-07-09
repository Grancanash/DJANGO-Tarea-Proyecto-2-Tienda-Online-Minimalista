import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
import type { Product } from '../types/store';
import { ShoppingCart, ArrowLeft, CheckCircle2, AlertCircle, Plus, Minus } from 'lucide-react';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const ProductDetailPage = () => {
    const { id } = useParams(); // Obtenemos el ID de la URL
    const { addToCart } = useCart();
    const [product, setProduct] = useState<Product | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [mainImage, setMainImage] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await api.get<Product>(`products/${id}/`);
                setProduct(res.data);
                setMainImage(res.data.image); // La imagen principal por defecto
            } catch (err) {
                console.error("Error al cargar el producto", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id]);

    if (loading) return (
        <div className="flex justify-center py-40">
            <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
    );

    if (!product) return (
        <div className="text-center py-40">
            <h2 className="text-2xl font-bold">Planta no encontrada en los registros</h2>
            <Link to="/catalog" className="btn btn-primary mt-4">Volver al catálogo</Link>
        </div>
    );

    const increaseQty = () => {
        if (quantity < product!.stock) setQuantity(prev => prev + 1);
        else toast.error("Límite de stock alcanzado");
    };

    const decreaseQty = () => {
        if (quantity > 1) setQuantity(prev => prev - 1);
    };

    // Creamos un array con las imágenes existentes para la galería
    const gallery = [product.image, product.image2, product.image3, product.image4].filter(img => img !== null);

    return (
        <div className="max-w-6xl mx-auto">
            {/* Botón Volver */}
            <Link to="/catalog" className="btn btn-ghost btn-sm mb-8 gap-2 opacity-50 hover:opacity-100">
                <ArrowLeft size={16} /> Volver al catálogo
            </Link>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* COLUMNA IZQUIERDA: Galería */}
                <div className="space-y-4">
                    <div className="aspect-square rounded-3xl overflow-hidden bg-base-200 border border-base-200">
                        {mainImage ? (
                            <img src={mainImage} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center italic opacity-20">Sin imagen</div>
                        )}
                    </div>
                    
                    {/* Miniaturas */}
                    <div className="grid grid-cols-4 gap-4">
                        {gallery.map((img, index) => (
                            <button 
                                key={index}
                                onClick={() => setMainImage(img)}
                                className={`aspect-square rounded-xl overflow-hidden border-2 transition-all 
                                ${mainImage === img ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'}`}
                            >
                                <img src={img as string} className="w-full h-full object-cover" alt={`Vista ${index + 1}`} />
                            </button>
                        ))}
                    </div>
                </div>

                {/* COLUMNA DERECHA: Información */}
                <div className="flex flex-col">
                    <div className="badge badge-outline mb-4 opacity-50 uppercase tracking-widest text-[10px] font-bold">
                        {product.category_name || 'Exótico'}
                    </div>
                    
                    <h1 className="text-5xl font-black tracking-tighter mb-2">{product.name}</h1>
                    <p className="text-xl text-primary font-bold mb-6">{product.price} €</p>
                    
                    <div className="bg-base-200/50 p-6 rounded-2xl mb-8">
                        <h3 className="font-bold mb-2 uppercase text-[10px] opacity-40">Resumen de especie</h3>
                        <p className="text-lg leading-relaxed">{product.summary}</p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <h3 className="font-bold mb-2 uppercase text-[10px] opacity-40">Descripción Detallada</h3>
                            <p className="opacity-70 whitespace-pre-line">{product.description}</p>
                        </div>

                        {/* Estado del Stock */}
                        <div className="flex items-center gap-2 text-sm">
                            {product.stock > 0 ? (
                                <><CheckCircle2 size={16} className="text-success" /> <span>En stock: {product.stock} unidades disponibles</span></>
                            ) : (
                                <><AlertCircle size={16} className="text-error" /> <span className="text-error font-bold">Agotado temporalmente</span></>
                            )}
                        </div>

                        {/* Selector de Cantidad y Botón de Compra */}
                        <div className="flex flex-col sm:flex-row gap-4 items-center mt-8">
                            
                            {/* Selector +/- */}
                            <div className="flex items-center bg-base-200 p-1 rounded-2xl border border-base-300 w-full sm:w-auto justify-between sm:justify-start">
                                <button 
                                    onClick={decreaseQty}
                                    className="btn btn-ghost btn-circle btn-sm"
                                    disabled={product.stock === 0}
                                >
                                    <Minus size={18} />
                                </button>
                                
                                <span className="font-black text-xl px-6 w-12 text-center">
                                    {product.stock === 0 ? 0 : quantity}
                                </span>
                                
                                <button 
                                    onClick={increaseQty}
                                    className="btn btn-ghost btn-circle btn-sm"
                                    disabled={product.stock === 0}
                                >
                                    <Plus size={18} />
                                </button>
                            </div>

                            {/* Botón Principal */}
                            <button 
                                className="btn btn-primary btn-lg flex-1 rounded-2xl gap-3 shadow-xl shadow-primary/20 w-full"
                                disabled={product.stock === 0}
                                onClick={() => addToCart(product, quantity)} // Enviamos la cantidad elegida
                            >
                                <ShoppingCart size={24} />
                                Añadir al contenedor
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductDetailPage;