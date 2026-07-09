import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { CartItem, Product } from '../types/store';
import toast from 'react-hot-toast';

interface CartContextType {
    cart: CartItem[];
    addToCart: (product: Product, amount?: number) => void;
    removeFromCart: (productId: number) => void;
    clearCart: () => void;
    totalItems: number;
    totalPrice: number;
    decreaseQuantity: (productId: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

// Separamos el componente para que Fast Refresh no dé problemas
export function CartProvider({ children }: { children: ReactNode }) {
    const [cart, setCart] = useState<CartItem[]>(() => {
        const savedCart = localStorage.getItem('xenoflora_cart');
        return savedCart ? JSON.parse(savedCart) : [];
    });

    useEffect(() => {
        localStorage.setItem('xenoflora_cart', JSON.stringify(cart));
    }, [cart]);

    const addToCart = (product: Product, amount: number = 1) => {
        // 1. Buscamos si el producto ya está en el carrito para saber cuántos tenemos
        const existingItem = cart.find(item => item.id === product.id);
        const currentQuantity = existingItem ? existingItem.quantity : 0;

        // 2. LA CLAVE: Comprobamos si hay stock disponible para añadir uno más
        if (currentQuantity + amount > product.stock) {
            toast.error(`No puedes añadir ${amount} unidades. Stock total: ${product.stock}.`);
            return; // Salimos de la función sin añadir nada
        }

        // 3. Si hay stock, procedemos con los Toasts y la actualización
        if (existingItem) {
            toast.success(`Añadidas ${amount} unidades de ${product.name}`);
        } else {
            toast.success(`${product.name} añadido al contenedor`);
        }

        setCart(prevCart => {
            const isAlreadyInCart = prevCart.find(item => item.id === product.id);
            if (isAlreadyInCart) {
                return prevCart.map(item =>
                    item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
                );
            }
            return [...prevCart, { ...product, quantity: amount }];
        });
    };

    const removeFromCart = (productId: number) => {
        setCart(prevCart => prevCart.filter(item => item.id !== productId));
        toast.error('Eliminado del contenedor');
    };

    const clearCart = () => {
        setCart([]);
        localStorage.removeItem('xenoflora_cart');
    };

    const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    const totalPrice = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);

    const decreaseQuantity = (productId: number) => {
        setCart(prevCart => {
            const item = prevCart.find(i => i.id === productId);
            // Si solo queda 1, lo eliminamos. Si hay más, restamos 1.
            if (item && item.quantity === 1) {
                return prevCart.filter(i => i.id !== productId);
            }
            return prevCart.map(i =>
                i.id === productId ? { ...i, quantity: i.quantity - 1 } : i
            );
        });
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart, totalItems, totalPrice, decreaseQuantity }}>
            {children}
        </CartContext.Provider>
    );
}

// El hook se queda aquí, pero Vite a veces advierte. 
// Si la advertencia persiste, ignórala o lo moveremos a otro archivo luego.
export const useCart = () => {
    const context = useContext(CartContext);
    if (!context) {
        throw new Error('useCart debe usarse dentro de un CartProvider');
    }
    return context;
};