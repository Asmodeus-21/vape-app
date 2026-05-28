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

const toImageSlug = (value: string): string =>
    value
        .toLowerCase()
        .replace(/[/\\]/g, '-')
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

const buildProductImagePath = (brand: string, flavor: string): string =>
    `/images/products/${toImageSlug(brand)}/${toImageSlug(flavor)}.png`;

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
        baseDescription?: string;
        featuredFlavors?: Record<string, string>;
        imagePathBuilder?: (brand: string, flavor: string) => string;
    }
): SeedProduct[] => {
    const rating = options?.rating ?? 4.7;
    const reviews = options?.reviews ?? 120;
    const stockQty = options?.stockQty ?? 10;
    const express = options?.express ?? true;
    const bestseller = options?.bestseller ?? false;
    const newArrival = options?.newArrival ?? true;
    const imagePathBuilder = options?.imagePathBuilder ?? buildProductImagePath;

    return flavors.map((flavor) => {
        const featuredDesc = options?.featuredFlavors?.[flavor];
        const baseDesc = options?.baseDescription ?? `Premium ${brand} disposable vape in ${flavor}.`;
        const description = featuredDesc ? `${baseDesc}\n\n**${flavor}**: ${featuredDesc}` : baseDesc;

        return {
            name: `${brand} - ${flavor}`,
            brand,
            flavor,
            nicotine,
            // ⚠️ PRICE PENDING — update retail price below for each brand before going live
            price,
            rating,
            reviews,
            image: resolveCatalogImage({
                image: imagePathBuilder(brand, flavor),
                brand,
                category,
                name: `${brand} - ${flavor}`,
                flavor,
            }),
            category,
            description,
            stock_qty: stockQty,
            is_express_delivery: express ? 1 : 0,
            is_bestseller: bestseller ? 1 : 0,
            is_new_arrival: newArrival ? 1 : 0,
        };
    });
};

// ─── MASTER INVENTORY ────────────────────────────────────────────────────────
// All stock counts: 10 units each (as per Banana Leaf inventory list)
// ⚠️ PRICES MARKED AS 0 ARE PENDING — set final retail prices before going live
// ─────────────────────────────────────────────────────────────────────────────

// ─── 1. Geek Bar Pulse X ─────────────────────────────────────────────────────
// Market Retail: $29.90 | Current Sale: $24.90
const geekBarPulseXPrice = 24.90;

const geekBarPulseXFlavors = [
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

const descGeekBarPulseX = {
    baseDescription:
        "Experience the world's first 3D curved screen disposable. The Geek Bar Pulse X delivers an unparalleled visual experience alongside powerhouse performance, featuring a dual mesh coil system and an advanced dual-core processor. Switch between Regular Mode for a massive 25,000 puffs or activate Pulse Mode for intensified flavor.\n\nSpecs: 18mL Pre-filled | 5% (50mg) Nicotine | Type-C Rechargeable | Dynamic LED Display.",
    featuredFlavors: {
        'Raspberry Peach Lime': 'A vivid trio of tart raspberries, soft summer peach, and a bright citrus lime finish.',
        'Pink Berry Lemonade': 'Juicy mixed pink berries blended into a sweet, tangy lemonade base.',
        'Raspberry Jam': 'Rich, dark raspberry preserve — smooth, sweet, and intensely fruity.',
        'Strawberry Kiwi Ice': 'Ripe strawberries and tropical kiwi chilled with a frosty menthol exhale.',
        'Sour Straws': 'A dead-on replication of sour candy straws — sweet, tangy, and addictive.',
        'Strawberry Bee Burst': 'Honey-kissed strawberries with a burst of sweet nectar on the exhale.',
        'Sour Fab': 'A lip-puckering, sour fruit candy blend with a satisfying sweet finish.',
        'Cool Mint': 'A clean, crisp spearmint profile with a smooth, refreshing cooling effect.',
        'Peach Jam': 'Slow-cooked, jammy white peach with a warm, sweet, and velvety finish.',
        'Blue Razz Ice': 'Sharp blue raspberry candy flavour blasted with an icy sub-zero chill.',
        'Blackberry Burst': 'Bold wild blackberries with a sweet, candy-like burst on every inhale.',
        'Miami Mint': 'A sophisticated blend of spearmint and cool menthol with an oceanic breeze.',
        'Blue Rancher': 'A nostalgic, sweet-tangy blue raspberry hard candy — just like the real thing.',
    },
};

// ─── 2. Fogger Pods ──────────────────────────────────────────────────────────
// Market Retail: $21.99 | Current Sale: $19.90 (Replacement Pod Unit)
const foggerPodsPrice = 19.90;

const foggerPodsFlavors = [
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

const descFoggerPods = {
    baseDescription:
        "The ultimate sweet spot between device longevity and eco-friendly design. Fogger Pods offer a highly efficient airflow layout engineered to preserve flavor purity from the first hit to the very last, delivering rich, consistent clouds throughout their lifespan.\n\nSpecs: High-capacity puff count | 5% Nicotine | Advanced anti-leak construction | Optimized mesh core.",
    featuredFlavors: {
        'Kiwi Dragon Berry': 'Tropical kiwi meets exotic dragon fruit with a wild mixed berry backbone.',
        'Strawberry Cupcake': 'Sweet, frosted strawberry cupcake with a soft, buttery pastry base note.',
        'Sour Blue Dust': 'A mouth-puckering explosion of sour blue raspberry crystals.',
        'Mexico Mango': 'Pure, unadulterated sweet Mexican mango juice with a warm tropical finish.',
        'Gummy Bear': 'A perfect replication of chewy, sweet, multi-flavored gummy candy.',
        'Sour Fab': 'A punchy, sour fruit candy with layers of sweetness underneath.',
        'Blue Rancher': 'Tangy blue raspberry candy with a classic hard-candy sweetness.',
        'Bee Pop': 'A honey-sweet lollipop flavour with a gentle floral nectar undertone.',
        'Watermelon Bubble Gum': 'Fresh, juicy watermelon fused with a sweet, classic bubblegum finish.',
        'Cherry Bomb': 'An intense, dark wild cherry explosion with a sweet candy coating.',
        'Strawberry Banana': 'Ripe strawberries blended with creamy, smooth banana — a timeless classic.',
        'Meta Moon': 'A mysterious, cool cosmic fruit blend with a hint of menthol clarity.',
        'White Gummy': 'Clear, pineapple-infused white gummy bear flavour — sweet and tropical.',
        'Blueberry Watermelon': 'Plump summer blueberries layered over cool, crisp watermelon.',
    },
};

// ─── 3. Fogger Kit ───────────────────────────────────────────────────────────
// Market Standard Retail: $23.99 (Full Modular Kit with Power Dock)
const foggerKitPrice = 23.99;

const foggerKitFlavors = [
    'Gummy Bear',
    'Blue Rancher',
    'Juicy Peach Ice',
    'Cool Mint',
    'Blue Razz Ice',
];

const descFoggerKit = {
    baseDescription:
        "The Fogger Kit is the perfect all-in-one starter experience. Featuring a rechargeable base device paired with a pre-filled pod, it delivers premium flavor performance with the convenience of a disposable and the sustainability of a reusable system.\n\nSpecs: 5% Nicotine | Rechargeable Base | Quick-Connect Pod | Integrated Mesh Coil.",
    featuredFlavors: {
        'Gummy Bear': 'Sweet, chewy multi-fruit gummy bear candy — an instant classic.',
        'Blue Rancher': 'Bold, tangy blue raspberry hard candy with an authentic confectionery sweetness.',
        'Juicy Peach Ice': 'Sun-ripened, dripping juicy peaches blasted with an icy menthol chill.',
        'Cool Mint': 'A smooth, clean, refreshingly cool spearmint profile.',
        'Blue Razz Ice': 'Punchy blue raspberry flavour topped off with a freezing, icy exhale.',
    },
};

// ─── 4. Float/Flum Mellow ────────────────────────────────────────────────────
// Market Retail: $29.99 | Current Sale: $22.99
const floatFlumMellowPrice = 22.99;

const floatFlumMellowFlavors = [
    'Straw Melon',
    'Cool Mint',
    'Peach Icy',
    'Blue Razz Icy',
    'Straw Guava',
    'Miami Mint',
    'Watermelon Icy',
    'Watermelon Peach Lime',
    'Sour Mango Pineapple',
];

const descFloatFlumMellow = {
    baseDescription:
        "True to its name, the Float/Flum Mellow delivers an ultra-smooth, velvety draw. Built with an elegant, minimalist matte design and subtle, balanced flavor mixing, it's crafted for vapers who appreciate premium aesthetics and refined flavor profiles.\n\nSpecs: 20,000 Puffs | 5% Nicotine | Soft-touch outer chassis | Dynamic smart power indicator.",
    featuredFlavors: {
        'Straw Melon': 'A timeless, refreshing collision of field-fresh strawberries and juicy watermelon.',
        'Cool Mint': 'A clean, crisp spearmint profile with layered cooling on every exhale.',
        'Peach Icy': 'Soft, ripe white peaches with a satisfying icy menthol finish.',
        'Blue Razz Icy': 'Clean, crisp blue raspberry accented by an aggressive sub-zero cooling kick.',
        'Straw Guava': 'Sweet ripe strawberries fused with exotic, fragrant tropical guava.',
        'Miami Mint': 'A sophisticated spearmint breeze with a cooling, oceanic menthol finish.',
        'Watermelon Icy': 'Lush, hydrating watermelon chilled to absolute icy perfection.',
        'Watermelon Peach Lime': 'A brilliant three-part blend of sweet watermelon, soft peach, and zesty lime.',
        'Sour Mango Pineapple': 'Exotic, tangy mango chunks drenched in sour tropical pineapple nectar.',
    },
};

// ─── 5. UT Bar ───────────────────────────────────────────────────────────────
// Market Retail: $23.99 | Current Sale: $19.19 (50K Puffs Dual-Tank Edition)
const utBarPrice = 19.19;

const utBarFlavors = [
    'Blue Razz Ice',
    'Strawberry Watermelon',
    'Watermelon Sour Peach',
    'Mexico Mango',
    'White Gummy Cherry',
    'Blue Rancher Lemonade',
    'Cola Cherry Ice',
    'Watermelon Ice',
    'Wild Berry Drop',
    'Passion Fruit Mango',
    'Miami Mint',
];

const descUtBar = {
    baseDescription:
        "Sleek, ergonomic, and highly dependable, the UT Bar series focuses on smooth airflow delivery and hyper-realistic fruit profiles. Designed for vapers who want consistent, premium performance in a compact, pocket-friendly form factor.\n\nSpecs: High-capacity reservoir | 5% Nicotine | Premium Mesh Coil | Ergonomic mouthpiece.",
    featuredFlavors: {
        'Blue Razz Ice': 'Sharp, bright blue raspberry candy flavour chilled to a perfect icy exhale.',
        'Strawberry Watermelon': 'A classic pairing of ripe field strawberries and cool, refreshing watermelon.',
        'Watermelon Sour Peach': 'Crisp watermelon collides with a tangy sour peach candy edge.',
        'Mexico Mango': 'Authentic, sun-warmed Mexican mango — sweet, juicy, and intensely tropical.',
        'White Gummy Cherry': 'A sweet-tart white gummy bear base infused with bright, fresh cherry notes.',
        'Blue Rancher Lemonade': 'Tangy blue raspberry candy swirled into a cold, refreshing lemonade.',
        'Cola Cherry Ice': 'Classic fizzy cola fused with sweet dark cherry and a cool icy finish.',
        'Watermelon Ice': 'Pure, lush summer watermelon slices served over a bed of crushed ice.',
        'Wild Berry Drop': 'A dynamic mix of wild blueberries, raspberries, and blackberries in a sweet candy drop.',
        'Passion Fruit Mango': 'Exotic, floral passion fruit layered over rich, velvety tropical mango.',
        'Miami Mint': 'A cool, breezy spearmint profile with sophisticated menthol undertones.',
    },
};

// ─── 6. Numbz ────────────────────────────────────────────────────────────────
// Standard Retail Benchmark for Numbz Botanicals / 7-Hydroxymitragynine specialty lines
const numbz300mgPrice = 59.99;  // Berry Burst 300mg & Watermelon Rush 300mg
const numbz500mgPrice = 79.99;  // Berry Burst 500mg & Watermelon Rush 500mg

const descNumbzBerryBurst300 = {
    baseDescription:
        "Numbz Berry Burst 300mg — a precisely portioned, single-serve infused piece delivering a bold burst of sweet mixed berries with a clean, measured release. Perfect for on-the-go use and consistent session control.\n\nSpecs: 300mg Total | Single-Serve Format | High-Purity Extract | Berry Burst Flavour Profile.",
};

const descNumbzBerryBurst500 = {
    baseDescription:
        "Numbz Berry Burst 500mg — a premium, full-strength infused pack engineered for a rich, full-spectrum berry experience. Made with high-purity extraction and consistent per-serving dosing, delivering reliable, calibrated performance every time.\n\nSpecs: 500mg Total | High-Purity Extract | Berry Burst Flavour Profile.",
};

const descNumbzWatermelonRush300 = {
    baseDescription:
        "Numbz Watermelon Rush 300mg — a single-serve, precisely dosed piece bursting with juicy, sweet watermelon flavour. Designed for flexible, session-based use with a clean and measured release every time.\n\nSpecs: 300mg Total | Single-Serve Format | Watermelon Rush Flavour Profile.",
};

const descNumbzWatermelonRush500 = {
    baseDescription:
        "Numbz Watermelon Rush 500mg — a premium, high-strength infused pack for those seeking a more intense experience. Each pack delivers a rich, sweet watermelon profile with a potent, full-spectrum extract and smooth release.\n\nSpecs: 500mg Total | High-Purity Extract | Watermelon Rush Flavour Profile.",
};

// ─── 7. ZYN Nicotine Pouches ─────────────────────────────────────────────────
const zyn3mgPrice = 8.99;   // ZYN 3mg (mini/light strength)
const zyn6mgPrice = 14.99;  // ZYN 6mg (regular strength)

const zynFlavors = [
    'Wintergreen',
    'Peppermint',
    'Citrus',
    'Cool Mint',
    'Cinnamon',
];

const descZyn = {
    baseDescription:
        "The gold standard in smoke-free, spit-free nicotine satisfaction. ZYN oral nicotine pouches are completely white, highly discreet, and meticulously formulated to provide a clean, steady release of nicotine over 30–45 minutes. Tobacco-leaf free, non-staining, and perfect for hands-free use anywhere.\n\nSpecs: 15 Pouches Per Can | Slim, Comfortable Fit | Non-Staining Formula | Tobacco-Leaf Free.",
    featuredFlavors: {
        'Wintergreen': 'A crisp, bold, and traditional woodsy mint with a deep, satisfying throat tingle.',
        'Peppermint': 'A sharp, icy burst of pure peppermint oil that refreshes and cools instantly.',
        'Citrus': 'A bright, slightly sweet lemon-lime flavour profile with zero bitterness.',
        'Cool Mint': 'A smooth, clean, refreshingly cool spearmint with a mild menthol finish.',
        'Cinnamon': 'A warm, spicy cinnamon with a gentle sweet heat that lingers satisfyingly.',
    },
};

// ─── MASTER EXPORT ───────────────────────────────────────────────────────────
export const seedProducts: SeedProduct[] = [

    // 1. Geek Bar Pulse X — 13 flavors, 10 stock each
    ...createProducts('Geek Bar Pulse X', 'Disposables', '5%', geekBarPulseXPrice, geekBarPulseXFlavors, {
        rating: 4.8,
        reviews: 260,
        stockQty: 10,
        express: true,
        bestseller: true,
        newArrival: true,
        ...descGeekBarPulseX,
    }),

    // 2. Fogger Pods — 14 flavors, 10 stock each
    ...createProducts('Fogger Pods', 'Disposables', '5%', foggerPodsPrice, foggerPodsFlavors, {
        rating: 4.7,
        reviews: 190,
        stockQty: 10,
        express: true,
        bestseller: true,
        newArrival: true,
        ...descFoggerPods,
    }),

    // 3. Fogger Kit — 5 flavors, 10 stock each
    ...createProducts('Fogger Kit', 'Kits', '5%', foggerKitPrice, foggerKitFlavors, {
        rating: 4.7,
        reviews: 140,
        stockQty: 10,
        express: true,
        bestseller: false,
        newArrival: true,
        ...descFoggerKit,
    }),

    // 4. Float/Flum Mellow — 9 flavors, 10 stock each
    ...createProducts('Float/Flum Mellow', 'Disposables', '5%', floatFlumMellowPrice, floatFlumMellowFlavors, {
        rating: 4.6,
        reviews: 170,
        stockQty: 10,
        express: true,
        bestseller: false,
        newArrival: true,
        ...descFloatFlumMellow,
    }),

    // 5. UT Bar — 11 flavors, 10 stock each
    ...createProducts('UT Bar', 'Disposables', '5%', utBarPrice, utBarFlavors, {
        rating: 4.7,
        reviews: 195,
        stockQty: 10,
        express: true,
        bestseller: true,
        newArrival: true,
        ...descUtBar,
    }),

    // 6. Numbz — 4 specialty items, 10 stock each (Berry Burst & Watermelon Rush in 300mg and 500mg)

    // Berry Burst 300mg
    {
        name: 'Numbz - Berry Burst (300mg)',
        brand: 'Numbz',
        flavor: 'Berry Burst',
        nicotine: '300mg',
        price: numbz300mgPrice,
        rating: 4.5,
        reviews: 58,
        image: '/images/numbz/berry-burst-300mg.jpg',
        category: 'Specialty',
        description: descNumbzBerryBurst300.baseDescription,
        stock_qty: 10,
        is_express_delivery: 1,
        is_bestseller: 0,
        is_new_arrival: 1,
    },
    // Berry Burst 500mg
    {
        name: 'Numbz - Berry Burst (500mg)',
        brand: 'Numbz',
        flavor: 'Berry Burst',
        nicotine: '500mg',
        price: numbz500mgPrice,
        rating: 4.6,
        reviews: 72,
        image: '/images/numbz/berry-burst-500mg.jpg',
        category: 'Specialty',
        description: descNumbzBerryBurst500.baseDescription,
        stock_qty: 10,
        is_express_delivery: 1,
        is_bestseller: 0,
        is_new_arrival: 1,
    },
    // Watermelon Rush 300mg
    {
        name: 'Numbz - Watermelon Rush (300mg)',
        brand: 'Numbz',
        flavor: 'Watermelon Rush',
        nicotine: '300mg',
        price: numbz300mgPrice,
        rating: 4.5,
        reviews: 55,
        image: '/images/numbz/watermelon-rush-300mg.jpg',
        category: 'Specialty',
        description: descNumbzWatermelonRush300.baseDescription,
        stock_qty: 10,
        is_express_delivery: 1,
        is_bestseller: 0,
        is_new_arrival: 1,
    },
    // Watermelon Rush 500mg
    {
        name: 'Numbz - Watermelon Rush (500mg)',
        brand: 'Numbz',
        flavor: 'Watermelon Rush',
        nicotine: '500mg',
        price: numbz500mgPrice,
        rating: 4.6,
        reviews: 68,
        image: '/images/numbz/watermelon-rush-500mg.jpg',
        category: 'Specialty',
        description: descNumbzWatermelonRush500.baseDescription,
        stock_qty: 10,
        is_express_delivery: 1,
        is_bestseller: 0,
        is_new_arrival: 1,
    },

    // 7. ZYN 3mg — 5 flavors, 10 stock each
    ...createProducts('ZYN', 'Nicotine Pouches', '3mg', zyn3mgPrice, zynFlavors, {
        rating: 4.8,
        reviews: 320,
        stockQty: 10,
        express: true,
        bestseller: true,
        newArrival: false,
        ...descZyn,
        imagePathBuilder: (brand, flavor) =>
            `/images/products/zyns/${flavor.toLowerCase().replace(/\s+/g, '-')}.jpeg`,
    }),

    // 8. ZYN 6mg — 5 flavors, 10 stock each
    ...createProducts('ZYN', 'Nicotine Pouches', '6mg', zyn6mgPrice, zynFlavors, {
        rating: 4.8,
        reviews: 320,
        stockQty: 10,
        express: true,
        bestseller: true,
        newArrival: false,
        ...descZyn,
        imagePathBuilder: (brand, flavor) =>
            `/images/products/zyns/${flavor.toLowerCase().replace(/\s+/g, '-')}.jpeg`,
    }),
];
