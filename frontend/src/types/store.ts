export interface Category {
    id: number;
    name: string;
}

export interface Product {
    id: number;
    name: string;
    summary: string;
    description: string;
    price: number;
    stock: number;
    featured: boolean;
    image: string | null;
    image2: string | null;
    image3: string | null;
    image4: string | null;
    category: number;
    category_name?: string;
}

export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

export interface CartItem extends Product {
    quantity: number;
}

export interface Order {
    id: number;
    user: number | null;
    user_username: string | null;
    user_email: string | null;
    created_at: string;
    total_price: number;
    is_paid: boolean;
}

// ─── Guest Checkout ───

export interface ShippingInfo {
    guest_email: string;
    first_name: string;
    last_name: string;
    address_line1: string;
    address_line2: string;
    postal_code: string;
    city: string;
    province: string;
    phone: string;
    delivery_notes: string;
}

export interface GuestOrderPayload extends ShippingInfo {
    items: Array<{ product: number; quantity: number; price: number }>;
    total_price: number;
}

export interface OrderConfirmation {
    id: number;
    guest_email: string | null;
    first_name: string | null;
    last_name: string | null;
    total_price: number;
    is_paid: boolean;
    created_at: string;
    items: Array<{
        id: number;
        product: number;
        product_name: string;
        price: number;
        quantity: number;
    }>;
}

export interface RegisterFromOrderResponse {
    message: string;
    email: string;
    username: string;
    temporary_password: string;
}

export interface ShippingProfileData {
    first_name: string;
    last_name: string;
    address_line1: string;
    postal_code: string;
    city: string;
    province: string;
    phone: string;
}