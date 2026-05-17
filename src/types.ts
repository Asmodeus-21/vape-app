export interface Product {
    id: number;
    name: string;
    brand: string;
    flavor: string;
    nicotine: string;
    price: number;
    originalPrice?: number;
    discountPercentage?: number;
    rating: number;
    reviews: number;
    image: string;
    category: string;
    isExpressDelivery: boolean;
    isBestSeller?: boolean;
    isNewArrival?: boolean;
    description: string;
    stockQty: number;
    storeId?: number | null;
    vendorId?: number | null;
}

export interface ParentVariantGroup {
    key: string;
    parentName: string;
    brand: string;
    category: string;
    variants: Product[];
}

export interface UserOrderItem {
    id: number;
    product: Product;
    quantity: number;
    priceAtTime: number;
}

export interface UserOrder {
    id: number;
    status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
    totalAmount: number;
    shippingAddress: string;
    createdAt: string;
    items: UserOrderItem[];
}

export interface Store {
    id: number;
    name: string;
    address?: string | null;
    owner_id?: number | null;
    owner_name?: string | null;
    owner_email?: string | null;
    total_sales?: number;
    total_orders?: number;
}

export interface User {
    id: string;
    role: 'customer' | 'vendor' | 'admin' | 'store_manager' | 'super_admin';
    email: string;
    name?: string;
    store_id?: number | null;
    storeId?: number | null;
    ageVerified: boolean;
    verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
    verificationMethod?: 'id_upload' | 'database_check' | 'manual';
}

export interface FlavorPreference {
    profile: string;
    nicotineLevel: string;
    deviceType: string;
}
