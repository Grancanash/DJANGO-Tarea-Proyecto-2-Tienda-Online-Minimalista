export interface LoginResponse {
    access: string;
    refresh: string;
}

export interface AuthState {
    token: string | null;
    isAuthenticated: boolean;
}

export interface OrderItem {
    id: number;
    product: number;
    product_name: string;
    price: number;
    quantity: number;
}

export interface Order {
    id: number;
    user: number;
    user_username: string;
    user_email: string;
    created_at: string;
    total_price: number;
    is_paid: boolean;
    items: OrderItem[];
}