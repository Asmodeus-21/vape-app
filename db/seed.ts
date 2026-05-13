import { resolveCatalogImage } from '../shared/product-images.js';

type SeedProduct = {
    name: string;
    brand: string;
    flavor: string;
    nicotine: string;
    price: number;
    rating: number;
    reviews: number;
    image: string;
    category: string;
    description: string;
    stock_qty: number;
    is_express_delivery: number;
    is_bestseller: number;
    is_new_arrival: number;
};

const makePlaceholderImage = (brand: string, variant: string): string => {
    return resolveCatalogImage({ brand, name: `${brand} - ${variant}` });
};

const toImageSlug = (value: string): string => value
    .toLowerCase()
    .replace(/[/\\]/g, '-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

const buildProductImagePath = (brand: string, flavor: string): string => {
    return `/images/products/${toImageSlug(brand)}/${toImageSlug(flavor)}.png`;
};

const createProducts = (
    brand: string,
    category: string,
    nicotine: string,
    price: number,
    flavors: string[],
    options?: {
        rating?: number;
        reviews?: number;
        stockQty?: number;
        express?: boolean;
        bestseller?: boolean;
        newArrival?: boolean;
        descriptionPrefix?: string;
        imagePathBuilder?: (brand: string, flavor: string) => string;
    }
): SeedProduct[] => {
    const rating = options?.rating ?? 4.7;
    const reviews = options?.reviews ?? 120;
    const stockQty = options?.stockQty ?? 120;
    const express = options?.express ?? true;
    const bestseller = options?.bestseller ?? false;
    const newArrival = options?.newArrival ?? false;
    const descriptionPrefix = options?.descriptionPrefix ?? 'Premium';
    const imagePathBuilder = options?.imagePathBuilder;

    return flavors.map((flavor) => ({
        name: `${brand} - ${flavor}`,
        brand,
        flavor,
        nicotine,
        price,
        rating,
        reviews,
        image: resolveCatalogImage({
            image: imagePathBuilder ? imagePathBuilder(brand, flavor) : makePlaceholderImage(brand, flavor),
            brand,
            category,
            name: `${brand} - ${flavor}`,
        }),
        category,
        description: `${descriptionPrefix} ${brand} profile in ${flavor}.`,
        stock_qty: stockQty,
        is_express_delivery: express ? 1 : 0,
        is_bestseller: bestseller ? 1 : 0,
        is_new_arrival: newArrival ? 1 : 0,
    }));
};

const zynFlavors = ['Wintergreen', 'Peppermint', 'Citrus', 'Cool Mint', 'Cinnamon'];

const geekbarPulseXFlavors = [
    'Blackberry B Burst',
    'Blackberry B-Pop',
    'Blue Rancher',
    'Blue Razz Ice',
    'Miami Mint',
    'Cool Mint',
    'Strawberry Kiwi Ice',
    'Pink Berry Lemonade',
    'Pair of Thieves',
    'Pear of Thieves',
    'Strawberry B Burst',
    'Sour Straws',
    'Sour Fucking Fab',
    'Raspberry Peach Lime',
    'Orange Fucking Fab',
    'Raspberry Jam',
    'Blueberry Jam',
    'Jam Edition',
    'Tobacco Flavour',
];

const fogerPodFlavors = [
    'Sour Blue Dust',
    'Miami Mint',
    'Blue Ranger Blowup',
    'OMG Blow Pop',
    'Watermelon Bubblegum',
    'Frozen Lemon',
    'Gummy Bear',
    'White Gummy',
    'Triple Berry',
    'Cherry Bomb',
    'Sour Apple Ice',
    'Watermelon Ice',
    'Kiwi Dragon Berry',
    'Red Velvet Cupcake',
    'Pineapple Coconut',
    'Blueberry Watermelon',
    'Gum Mint',
    'Cool Mint',
];

const utbarFlavors = [
    'Aloe Grape/Watermelon',
    'Blue Red Ice',
    'Cool Mint',
    'Miami Mint',
    'Mango Strawberry',
    'Root Vanilla Soda',
    'Pink Berry Lemonade',
    'White Peach Lemon Head',
    'Blue Razz Lemonade',
    'Blue Rancher Lemonade',
    'Wildberry Drop',
    'Passion Kiwi Pineapple',
    'Banana Smoothie Strawberry',
    'Watermelon Blow Pop',
    // New flavors with dedicated images
    'Blue Rancher',
    'Blue Razz Icy',
    'Double Green Pop',
    'Frozen Blackberry Fab',
    'Grape Pop Icy',
    'Sour Pop',
    'Strawberry Blast',
    'Strawmelon Peach',
    'Watermelon Blueberry',
    'Watermelon Icy',
    'White Gummy',
];

const flumMelloFlavors = [
    'Watermelon Icy',
    'Sour Apple Icy',
    'Sour Mango Pineapple',
    'Straw Melon',
    'Watermelon Peach Lime',
    'White Gummy',
    'Cool Mint',
    'Miami Mint',
    // New flavors with dedicated images
    'Blue Razz Icy',
    'Peach Icy',
    'Spearmint Watermelon',
];

const geekBarPulseX25KFlavors = [
    'Blackberry B-Pop',
    'Blue Razz Ice',
    'Miami Mint',
    'Sour Apple Ice',
    'Watermelon Ice',
];

const utbarUT50KFlavors = [
    'Banana Smoothy/Strawberry',
    'Blue Razz Ice/Triple Berry',
    'Green Apple/Fuji Apple',
    'Watermelon/B-Pop',
];

const floatMelloPro50KFlavors = [
    'Blue Razz Icy',
    'Sour Apple Icy',
    'Sour Mango Pineapple',
    'Watermelon Peach Lime',
];

const fogerSwitchProKitFlavors = [
    'Blue Rancher B-Pop',
    'Gummy Bear',
    'Miami Mint',
    'Sour Blue Dust',
    'Strawberry Kiwi',
];

const fogerSwitchProPodFlavors = [
    'Cherry Slush',
    'Cola Slush',
    'Mexico Mango',
    'OMG B-Pop',
    'Pink Lemonade',
];

const geekBarPulseXSeriesFlavors = [
    'Raspberry Peach Lime',
    'Pink Berry Lemonade',
    'Raspberry Jam',
    'Strawberry Kiwi Ice',
    'Sour Straws',
    'Strawberry Bee Burst',
    'Sour Fab',
    'Cool Mint',
    'Peach Jam',
    'Blue Razz Ice',
    'Blackberry Burst',
    'Miami Mint',
    'Blue Rancher',
];

const foggerPodsOriginalsFlavors = [
    'Kiwi Dragon Berry',
    'Strawberry Cupcake',
    'Sour Blue Dust',
    'Mexico Mango',
    'Gummy Bear',
    'Sour Fab',
    'Blue Rancher',
    'Bee Pop',
    'Watermelon Bubble Gum',
    'Cherry Bomb',
    'Strawberry Banana',
    'Meta Moon',
    'White Gummy',
    'Blueberry Watermelon',
];

const foggerKitFlavors = [
    'Gummy Bear',
    'Blue Rancher',
    'Juicy Peach Ice',
    'Cool Mint',
    'Blue Razz Ice',
];

const flumMellowOriginalsFlavors = [
    'Straw Melon',
    'Cool Mint',
    'Peach Icy',
    'Blue Razz Icy',
    'Straw Guava',
    'Miami Mint',
    'Watermelon Icy',
    'Watermelon Peach Lime',
    'Sour Mango Mint',
    'Blue Razz Ice',
    'Strawberry Watermelon',
    'Sour Peach',
    'Mexico Mango',
    'White Gummy',
    'Cherry',
    'Blue Rancher Lemonade',
    'Cola Ice',
    'Watermelon Ice',
    'Wild Berry Drop',
    'Passion Fruit Mango',
];

const numbzOriginalsFlavors = [
    '500mg Berry Burst (Pack)',
    '300mg Watermelon Rush (5-pack)',
];

const hydroxieStrengths = ['10-15mg', '10-30mg', '5-15mg', '5-30mg', '5-60mg'];
const bluesStrengths = ['35mg', '55mg', '75mg', '100mg', '120mg'];

export const seedProducts: SeedProduct[] = [
    ...createProducts('Zyns', 'Nicotine Pouches', '6mg', 5.99, zynFlavors, {
        rating: 4.8,
        reviews: 320,
        stockQty: 250,
        express: true,
        bestseller: true,
        newArrival: false,
        descriptionPrefix: 'Juicefly-matched'
    }),
    ...createProducts('Geekbar Pulse X', 'Disposables', '5%', 24.90, geekbarPulseXFlavors, {
        rating: 4.7,
        reviews: 410,
        stockQty: 180,
        express: true,
        bestseller: true,
        newArrival: true,
        descriptionPrefix: 'Juicefly-matched'
    }),
    ...createProducts('Foger Pods', 'Disposables', '5%', 14.98, fogerPodFlavors, {
        rating: 4.7,
        reviews: 220,
        stockQty: 180,
        express: true,
        bestseller: false,
        newArrival: true,
        descriptionPrefix: 'Juicefly-matched'
    }),
    ...createProducts('Utbar', 'Disposables', '5%', 23.99, utbarFlavors, {
        rating: 4.6,
        reviews: 170,
        stockQty: 150,
        express: true,
        bestseller: true,
        newArrival: true,
        descriptionPrefix: 'Juicefly-matched'
    }),
    ...createProducts('Flum Mello', 'Disposables', '5%', 19.92, flumMelloFlavors, {
        rating: 4.6,
        reviews: 145,
        stockQty: 140,
        express: true,
        bestseller: false,
        newArrival: true,
        descriptionPrefix: 'Juicefly-matched'
    }),
    ...createProducts('Hydroxie (7-OH)', 'Supplements', '7-OH', 34.99, hydroxieStrengths, {
        rating: 4.7,
        reviews: 95,
        stockQty: 90,
        express: false,
        bestseller: false,
        newArrival: true,
        descriptionPrefix: 'Strength-specific'
    }),
    ...createProducts('Blues', 'Supplements', '7-OH', 19.99, bluesStrengths, {
        rating: 4.6,
        reviews: 80,
        stockQty: 90,
        express: false,
        bestseller: true,
        newArrival: true,
        descriptionPrefix: 'Strength-specific'
    }),
    ...createProducts('Geek Bar Pulse X 25K', 'Disposables', '5%', 15.99, geekBarPulseX25KFlavors, {
        rating: 4.8,
        reviews: 310,
        stockQty: 200,
        express: true,
        bestseller: true,
        newArrival: true,
        descriptionPrefix: '25,000 Puffs | 18mL | 3D Curved Screen | Dual Mesh Coil | Pulse & Regular Modes —'
    }),
    ...createProducts('Utbar UT 50K', 'Disposables', '5%', 22.99, utbarUT50KFlavors, {
        rating: 4.7,
        reviews: 195,
        stockQty: 160,
        express: true,
        bestseller: true,
        newArrival: true,
        descriptionPrefix: '50,000 Puffs (Eco) / 25,000 (Turbo) | 2.01" Display | Dual Tank | Dual Mesh Coil —'
    }),
    ...createProducts('Float Mello Pro 50K', 'Disposables', '5%', 20.99, floatMelloPro50KFlavors, {
        rating: 4.7,
        reviews: 155,
        stockQty: 150,
        express: true,
        bestseller: false,
        newArrival: true,
        descriptionPrefix: '50,000 Max Puffs | Mesh Coils | Eco/Turbo Modes | Digital Display | Soft-Bite Mouthpiece —'
    }),
    ...createProducts('Foger Switch Pro', 'Disposables', '5%', 17.99, fogerSwitchProKitFlavors, {
        rating: 4.6,
        reviews: 130,
        stockQty: 160,
        express: true,
        bestseller: true,
        newArrival: true,
        descriptionPrefix: '30,000 Puffs | 19mL | Rechargeable Base + Replaceable Pod System —'
    }),
    ...createProducts('Foger Switch Pro Pods', 'Disposables', '5%', 13.99, fogerSwitchProPodFlavors, {
        rating: 4.6,
        reviews: 115,
        stockQty: 180,
        express: true,
        bestseller: false,
        newArrival: true,
        descriptionPrefix: '30,000 Puffs | Pre-filled 19mL Replacement Pods | Mesh Coil —'
    }),
    ...createProducts('Geek Bar Pulse X', 'Pulse X Series', '5%', 17.99, geekBarPulseXSeriesFlavors, {
        rating: 4.8,
        reviews: 260,
        stockQty: 10,
        express: true,
        bestseller: true,
        newArrival: true,
        descriptionPrefix: 'Batch inventory add',
        imagePathBuilder: buildProductImagePath,
    }),
    ...createProducts('Fogger Pods', 'The Originals', '5%', 13.99, foggerPodsOriginalsFlavors, {
        rating: 4.7,
        reviews: 190,
        stockQty: 10,
        express: true,
        bestseller: true,
        newArrival: true,
        descriptionPrefix: 'Batch inventory add',
        imagePathBuilder: buildProductImagePath,
    }),
    ...createProducts('Fogger Kit', 'The Kits', '5%', 16.99, foggerKitFlavors, {
        rating: 4.7,
        reviews: 140,
        stockQty: 10,
        express: true,
        bestseller: true,
        newArrival: true,
        descriptionPrefix: 'Batch inventory add',
        imagePathBuilder: buildProductImagePath,
    }),
    ...createProducts('Flum Mellow', 'The Originals', '5%', 21.99, flumMellowOriginalsFlavors, {
        rating: 4.6,
        reviews: 170,
        stockQty: 10,
        express: true,
        bestseller: false,
        newArrival: true,
        descriptionPrefix: 'Batch inventory add',
        imagePathBuilder: buildProductImagePath,
    }),
    ...createProducts('Numbz', 'The Originals', '5%', 21.99, numbzOriginalsFlavors, {
        rating: 4.5,
        reviews: 65,
        stockQty: 10,
        express: true,
        bestseller: false,
        newArrival: true,
        descriptionPrefix: 'Specialty batch inventory add',
        imagePathBuilder: buildProductImagePath,
    }),
];
