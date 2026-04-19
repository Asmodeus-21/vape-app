import { ParentVariantGroup, Product } from '../types';

const BASE: Omit<Product, 'id' | 'name' | 'flavor' | 'nicotine' | 'price' | 'category' | 'brand'> = {
    rating: 4.8,
    reviews: 0,
    image: '',
    isExpressDelivery: true,
    isBestSeller: true,
    description: 'Premium quality product.',
    stockQty: 50,
    originalPrice: undefined,
    discountPercentage: undefined,
    isNewArrival: undefined,
    storeId: null,
    vendorId: null,
};

export const FALLBACK_PRODUCTS: Product[] = [
    { ...BASE, id: 9001, name: 'Geekbar Pulse X 25000 - Watermelon Ice', flavor: 'Watermelon Ice', nicotine: '5%', price: 24.99, category: 'Disposables', brand: 'Geekbar' },
    { ...BASE, id: 9002, name: 'Geekbar Pulse X 25000 - Blue Razz Lemon', flavor: 'Blue Razz', nicotine: '5%', price: 24.99, category: 'Disposables', brand: 'Geekbar' },
    { ...BASE, id: 9003, name: 'Geekbar Pulse X 25000 - Strawberry Kiwi', flavor: 'Strawberry Kiwi', nicotine: '5%', price: 24.99, category: 'Disposables', brand: 'Geekbar' },
    { ...BASE, id: 9004, name: 'Foger Ultra 15000 - Mango Peach', flavor: 'Mango Peach', nicotine: '5%', price: 19.99, category: 'Disposables', brand: 'Foger' },
    { ...BASE, id: 9005, name: 'Foger Ultra 15000 - Berry Blast', flavor: 'Berry Blast', nicotine: '5%', price: 19.99, category: 'Disposables', brand: 'Foger' },
    { ...BASE, id: 9006, name: 'Foger Ultra 15000 - Kiwi Passionfruit', flavor: 'Kiwi Passionfruit', nicotine: '5%', price: 19.99, category: 'Disposables', brand: 'Foger' },
    { ...BASE, id: 9007, name: 'Utbar 5500 - Lychee Mint', flavor: 'Lychee Mint', nicotine: '5%', price: 12.99, category: 'Disposables', brand: 'Utbar' },
    { ...BASE, id: 9008, name: 'Utbar 5500 - Tropical Mix', flavor: 'Tropical Mix', nicotine: '5%', price: 12.99, category: 'Disposables', brand: 'Utbar' },
    { ...BASE, id: 9009, name: 'Flum Mello 20000 - Peach Lemonade', flavor: 'Peach Lemonade', nicotine: '5%', price: 22.99, category: 'Disposables', brand: 'Flum' },
    { ...BASE, id: 9010, name: 'Flum Mello 20000 - Strawberry Ice', flavor: 'Strawberry Ice', nicotine: '5%', price: 22.99, category: 'Disposables', brand: 'Flum' },
    { ...BASE, id: 9011, name: 'Zyns - Wintergreen', flavor: 'Wintergreen', nicotine: '6mg', price: 7.99, category: 'Nicotine Pouches', brand: 'Zyns' },
    { ...BASE, id: 9012, name: 'Zyns - Cool Mint', flavor: 'Cool Mint', nicotine: '6mg', price: 7.99, category: 'Nicotine Pouches', brand: 'Zyns' },
    { ...BASE, id: 9013, name: 'Hydroxie (7-OH) - 10-15mg', flavor: '10-15mg', nicotine: '7-OH', price: 14.99, category: 'Supplements', brand: 'Hydroxie (7-OH)' },
    { ...BASE, id: 9014, name: 'Hydroxie (7-OH) - 10-30mg', flavor: '10-30mg', nicotine: '7-OH', price: 24.99, category: 'Supplements', brand: 'Hydroxie (7-OH)' },
    { ...BASE, id: 9015, name: 'Blues - 35mg', flavor: '35mg', nicotine: '7-OH', price: 12.00, category: 'Supplements', brand: 'Blues' },
    { ...BASE, id: 9016, name: 'Foger Pods Refillable - Clear', flavor: 'Clear', nicotine: '5%', price: 16.99, category: 'Disposables', brand: 'Foger' },
    { ...BASE, id: 9017, name: 'Foger Pods Refillable - Tobacco', flavor: 'Tobacco', nicotine: '5%', price: 16.99, category: 'Disposables', brand: 'Foger' },
];

export const HOMEPAGE_FALLBACK_GROUPS: ParentVariantGroup[] = [
    { key: 'mock-geekbar-pulse', parentName: 'Geekbar Pulse X 25000', brand: 'Geekbar', category: 'Disposables', variants: FALLBACK_PRODUCTS.slice(0, 3) },
    { key: 'mock-foger-ultra', parentName: 'Foger Ultra 15000', brand: 'Foger', category: 'Disposables', variants: FALLBACK_PRODUCTS.slice(3, 6) },
    { key: 'mock-utbar-5500', parentName: 'Utbar 5500', brand: 'Utbar', category: 'Disposables', variants: FALLBACK_PRODUCTS.slice(6, 8) },
    { key: 'mock-flum-mello', parentName: 'Flum Mello 20000', brand: 'Flum', category: 'Disposables', variants: FALLBACK_PRODUCTS.slice(8, 10) },
    { key: 'mock-zyns', parentName: 'Zyns Nicotine Pouches', brand: 'Zyns', category: 'Nicotine Pouches', variants: FALLBACK_PRODUCTS.slice(10, 12) },
    { key: 'mock-hydroxie', parentName: 'Hydroxie (7-OH)', brand: 'Hydroxie (7-OH)', category: 'Supplements', variants: FALLBACK_PRODUCTS.slice(12, 14) },
    { key: 'mock-blues', parentName: 'Blues', brand: 'Blues', category: 'Supplements', variants: FALLBACK_PRODUCTS.slice(14, 15) },
    { key: 'mock-foger-pods', parentName: 'Foger Pods Refillable', brand: 'Foger', category: 'Disposables', variants: FALLBACK_PRODUCTS.slice(15, 17) },
];
