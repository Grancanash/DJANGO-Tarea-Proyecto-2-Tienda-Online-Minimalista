import * as reactRouterDom from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

const CartPage = () => {
    const { cart, addToCart, decreaseQuantity, removeFromCart, totalPrice, totalItems } = useCart();

    if (cart.length === 0) {
        return (
            <div className="text-center py-20">
                <div className="bg-base-200 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 opacity-40">
                    <ShoppingBag size={40} />
                </div>
                <h2 className="text-3xl font-black mb-2">Contenedor Vacío</h2>
                <p className="opacity-50 mb-8">Parece que aún no has seleccionado ninguna especie xeno-botánica.</p>
                <reactRouterDom.Link to="/" className="btn btn-primary rounded-xl px-8">
                    Explorar Catálogo
                </reactRouterDom.Link>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto">
            <h1 className="text-4xl font-black tracking-tighter mb-10 text-center md:text-left">
                CONTENEDOR DE <span className="text-primary">CARGA</span>
            </h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                {/* LISTADO DE PRODUCTOS (Columna Izquierda) */}
                <div className="lg:col-span-2 space-y-6">
                    {cart.map((item) => (
                        <div key={item.id} className="flex flex-col sm:flex-row items-center gap-6 bg-base-100 p-4 rounded-2xl border border-base-200 hover:shadow-lg transition-shadow">
                            {/* Imagen */}
                            <div className="w-24 h-24 rounded-xl overflow-hidden bg-base-200 shrink-0">
                                {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
                            </div>

                            {/* Info */}
                            <div className="flex-1 text-center sm:text-left">
                                <h3 className="font-bold text-lg">{item.name}</h3>
                                <p className="text-xs opacity-50 uppercase tracking-widest font-bold mb-2">{item.category_name}</p>
                                <p className="font-black text-primary">{item.price} €</p>
                            </div>

                            {/* Controles de Cantidad + Borrar */}
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-3 bg-base-200 rounded-xl p-1">
                                    <button
                                        onClick={() => decreaseQuantity(item.id)}
                                        className="btn btn-ghost btn-xs btn-square hover:bg-white"
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="font-bold w-6 text-center">{item.quantity}</span>
                                    <button
                                        onClick={() => addToCart(item)}
                                        className="btn btn-ghost btn-xs btn-square hover:bg-white"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                                <button
                                    onClick={() => removeFromCart(item.id)}
                                    className="btn btn-ghost btn-sm btn-circle text-error"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* RESUMEN DE PAGO (Columna Derecha) */}
                <div className="lg:col-span-1">
                    <div className="card bg-base-100 border border-base-200 shadow-xl sticky top-24">
                        <div className="card-body">
                            <h2 className="card-title text-xl mb-4 font-black">RESUMEN</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between opacity-60">
                                    <span>Especies seleccionadas</span>
                                    <span>{totalItems}</span>
                                </div>
                                <div className="flex justify-between opacity-60 border-b pb-3">
                                    <span>Gastos de transporte espacial</span>
                                    <span className="text-success font-bold">GRATIS</span>
                                </div>
                                <div className="flex justify-between text-2xl font-black pt-2">
                                    <span>TOTAL</span>
                                    <span className="text-primary">{totalPrice.toFixed(2)} €</span>
                                </div>
                            </div>
                            <div className="card-actions mt-8">
                                <Link to="/checkout" className="btn btn-primary btn-lg w-full rounded-2xl gap-2 shadow-xl shadow-primary/20">
                                    Proceder al Checkout
                                    <ArrowRight size={20} />
                                </Link>
                                <reactRouterDom.Link to="/catalog" className="btn btn-ghost btn-sm w-full opacity-50 mt-2">
                                    Seguir comprando
                                </reactRouterDom.Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CartPage;