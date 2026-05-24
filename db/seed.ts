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
        baseDescription?: string;
        featuredFlavors?: Record<string, string>;
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

    return flavors.map((flavor) => {
        let desc = '';
        if (options?.baseDescription) {
            desc = options.baseDescription;
            const featuredFlavorDesc = options.featuredFlavors?.[flavor];
            if (featuredFlavorDesc) {
                desc += `\n\n**Featured Flavor (${flavor})**: ${featuredFlavorDesc}`;
            }
        } else {
            desc = `${descriptionPrefix} ${brand} profile in ${flavor}.`;
        }

        return {
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
            description: desc,
            stock_qty: stockQty,
            is_express_delivery: express ? 1 : 0,
            is_bestseller: bestseller ? 1 : 0,
            is_new_arrival: newArrival ? 1 : 0,
        };
    });
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

const descZyns = {
    baseDescription: "The Pitch: The gold standard in smoke-free, spit-free nicotine satisfaction. Zyn oral nicotine pouches are completely white, highly discreet, and meticulously formulated to provide a clean, steady release of nicotine over 30–45 minutes. Perfect for hands-free use anywhere.\n\nSpecs: 6mg Nicotine Strength | 15 Pouches Per Can | Slim, Comfortable Fit | Non-Staining Formula.",
    featuredFlavors: {
        "Wintergreen": "A crisp, bold, and traditional woodsy mint with a deep throat tingle.",
        "Peppermint": "A sharp, icy burst of pure peppermint oil that refreshes instantly.",
        "Citrus": "A bright, slightly sweet lemon-lime flavor profile with zero bitterness."
    }
};

const descGeekbarPulseX = {
    baseDescription: "The Pitch: Experience the world’s first 3D curved screen disposable. The Geekbar Pulse X delivers an unparalleled visual experience alongside powerhouse performance, featuring a dual mesh coil system and an advanced dual-core processor.\n\nPerformance Modes: Switch between Regular Mode for a massive 25,000 puffs or activate Pulse Mode for intensified flavor and cloud production up to 15,000 puffs.\n\nSpecs: 18mL Pre-filled E-liquid | 5% (50mg) Nicotine Strength | Type-C Rechargeable | Dynamic LED Display.",
    featuredFlavors: {
        "Blackberry B Burst": "A deep, sweet explosion of wild blackberries with a candy-like finish.",
        "Blue Rancher": "A nostalgic, tangy blue raspberry hard candy vape.",
        "Miami Mint": "A sophisticated, crisp spearmint with a cooling oceanic breeze."
    }
};

const descGeekBarPulseX25K = {
    baseDescription: "The Pitch: The legendary Pulse X design, optimized with an updated selection of the industry's most requested flavor profiles. Features the signature cosmic starry-sky display screen and dual-mode functionality.\n\nSpecs: 25,000 Puffs (Regular) / 15,000 Puffs (Pulse) | 5% Nicotine | Dual Mesh Coils.",
    featuredFlavors: {
        "Blackberry B-Pop": "A dark berry juice base layered over a sweet, classic lollipop core.",
        "Sour Apple Ice": "Tart green apple candy with a sharp, freezing throat hit.",
        "Watermelon Ice": "Lush, juicy watermelon slices chilled to absolute perfection."
    }
};

const descUtbar = {
    baseDescription: "The Pitch: Sleek, ergonomic, and highly dependable, the Utbar series focuses on smooth airflow delivery and hyper-realistic fruit profiles. Designed for vapers who want consistent performance without the bulk.\n\nSpecs: High-capacity reservoir | 5% Nicotine | Premium Mesh Coil | Ergonomic mouthpiece.",
    featuredFlavors: {
        "Aloe Grape/Watermelon": "A unique, refreshing blend of soothing aloe vera, sweet purple grapes, and crisp watermelon.",
        "Root Vanilla Soda": "A rich, effervescent take on classic root beer laced with creamy vanilla bean.",
        "White Peach Lemon Head": "Juicy white peaches collided with an aggressive, sour lemonade candy twist."
    }
};

const descUtbarUT50K = {
    baseDescription: "The Pitch: Break free from frequent replacements with the massive Utbar UT 50K. Engineered with a revolutionary Dual Tank System and a giant 2.01-inch smart display screen, this device lets you monitor battery life, juice levels, and power output at a glance.\n\nPerformance Modes: Eco Mode delivers up to 50,000 smooth puffs, while Turbo Mode opens up airflow for 25,000 high-intensity cloud pulls.\n\nSpecs: 50,000 Max Puffs | Dual Tank Architecture | 5% Nicotine | Type-C Fast Charging.",
    featuredFlavors: {
        "Banana Smoothy/Strawberry": "A rich, velvety banana smoothie base swirled with ripe summer strawberries.",
        "Blue Razz Ice/Triple Berry": "A complex berry fusion pairing sharp blue raspberry ice with a deep, dark triple berry blend."
    }
};

const descFogerPods = {
    baseDescription: "The Pitch: The ultimate sweet spot between device longevity and eco-friendly design. Foger Pods offer a highly efficient airflow layout engineered to preserve flavor purity from the first hit to the very last.\n\nSpecs: High-capacity puff count | 5% Nicotine | Advanced anti-leak construction | Optimized mesh core.",
    featuredFlavors: {
        "Sour Blue Dust": "A mouth-puckering explosion of sour blue raspberry crystals.",
        "OMG Blow Pop": "A mysterious, sweet fruit punch blend that perfectly mimics a classic bubblegum lollipop.",
        "Red Velvet Cupcake": "A rare dessert profile serving up rich cocoa layers and sweet cream frosting notes."
    }
};

const descFogerSwitchPro = {
    baseDescription: "The Pitch: Stop throwing away batteries. The Foger Switch Pro Kit introduces a premium, rechargeable device base paired with a detachable pod system. Keep the base, switch the flavors, and enjoy up to 30,000 puffs per pod.\n\nSpecs: 19mL Capacity Pod Included | Rechargeable Base Unit | 5% Nicotine | Sustainable Modular Design.",
    featuredFlavors: {
        "Blue Rancher B-Pop": "Tangy blue raspberry candy with a sweet lollipop undertone.",
        "Gummy Bear": "A perfect replication of chewy, sweet, multi-flavored gummy candy."
    }
};

const descFogerSwitchProPods = {
    baseDescription: "The Pitch: Keep the performance, swap your style. These pre-filled replacement pods drop seamlessly right into your existing Foger Switch Pro base unit.\n\nSpecs: 19mL Pre-filled Capacity | Up to 30,000 Puffs | Integrated Mesh Coil | Quick-Connect connection.",
    featuredFlavors: {
        "Cherry Slush": "An icy, nostalgic bright red cherry slushie.",
        "Cola Slush": "Fizzy, syrup-sweet classic cola served over crushed ice.",
        "Mexico Mango": "Pure, unadulterated sweet Mexican mango juice with a warm tropical finish."
    }
};

const descFlumMello = {
    baseDescription: "The Pitch: True to its name, the Flum Mello delivers an ultra-smooth, velvety draw. Known for its elegant, minimalist matte design and subtle, balanced flavor mixing, it's built for those who appreciate premium aesthetic and refined flavor profiles.\n\nSpecs: 20,000 Puffs | 5% Nicotine | Soft-touch outer chassis | Dynamic smart power indicator.",
    featuredFlavors: {
        "Watermelon Peach Lime": "A brilliant three-part blend hitting sweet watermelon, soft peach, and a bright, zesty lime finish.",
        "Straw Melon": "A timeless, refreshing collision of field strawberries and watermelons.",
        "White Gummy": "Clear pineapple-infused gummy bears straight out of the bag."
    }
};

const descFloatMelloPro50K = {
    baseDescription: "The Pitch: Combining massive capacity with unparalleled comfort. The Float Mello Pro features a unique, food-grade Soft-Bite Mouthpiece for a more natural feel, backed by a dual-core firing system that maintains rich flavor profile integrity even at 50,000 puffs.\n\nSpecs: 50,000 Puffs (Eco) | 5% Nicotine | Soft-Bite Silicone Mouthpiece | Dual Core Mesh Firing.",
    featuredFlavors: {
        "Blue Razz Icy": "A clean, crisp blue raspberry profile accented by an aggressive sub-zero cooling kick.",
        "Sour Mango Pineapple": "Exotic, tangy mango chunks drenched in sour pineapple nectar."
    }
};

const descHydroxie = {
    baseDescription: "The Pitch: A premium, targeted wellness supplement designed for advanced alkaloid rotation. Meticulously extracted and calibrated for high-purity profile consistency, providing tailored serving configurations for experienced enthusiasts seeking premium standard options.\n\nFormulations Available: 10-15mg | 10-30mg | 5-15mg | 5-30mg | 5-60mg.",
    featuredFlavors: {}
};

const descBlues = {
    baseDescription: "The Pitch: Engineered for high-performance lifestyle optimization. The Blues supplement lineup features clean, variable-strength extractions designed to support cognitive focus, endurance, and physical balance.\n\nStrengths Available: 35mg | 55mg | 75mg | 100mg | 120mg.",
    featuredFlavors: {}
};

export const seedProducts: SeedProduct[] = [
    ...createProducts('Zyns', 'Nicotine Pouches', '6mg', 5.99, zynFlavors, {
        rating: 4.8,
        reviews: 320,
        stockQty: 250,
        express: true,
        bestseller: true,
        newArrival: false,
        ...descZyns
    }),
    ...createProducts('Geekbar Pulse X', 'Disposables', '5%', 24.90, geekbarPulseXFlavors, {
        rating: 4.7,
        reviews: 410,
        stockQty: 180,
        express: true,
        bestseller: true,
        newArrival: true,
        ...descGeekbarPulseX
    }),
    ...createProducts('Foger Pods', 'Disposables', '5%', 14.98, fogerPodFlavors, {
        rating: 4.7,
        reviews: 220,
        stockQty: 180,
        express: true,
        bestseller: false,
        newArrival: true,
        ...descFogerPods
    }),
    ...createProducts('Utbar', 'Disposables', '5%', 25.99, utbarFlavors, {
        rating: 4.6,
        reviews: 170,
        stockQty: 150,
        express: true,
        bestseller: true,
        newArrival: true,
        ...descUtbar
    }),
    ...createProducts('Flum Mello', 'Disposables', '5%', 20.00, flumMelloFlavors, {
        rating: 4.6,
        reviews: 145,
        stockQty: 140,
        express: true,
        bestseller: false,
        newArrival: true,
        ...descFlumMello
    }),
    ...createProducts('Hydroxie (7-OH)', 'Specialty', '7-OH', 29.99, hydroxieStrengths, {
        rating: 4.7,
        reviews: 95,
        stockQty: 90,
        express: false,
        bestseller: false,
        newArrival: true,
        ...descHydroxie
    }),
    ...createProducts('Blues', 'Specialty', '7-OH', 34.99, bluesStrengths, {
        rating: 4.6,
        reviews: 80,
        stockQty: 90,
        express: false,
        bestseller: true,
        newArrival: true,
        ...descBlues
    }),
    ...createProducts('Geek Bar Pulse X 25K', 'Disposables', '5%', 15.99, geekBarPulseX25KFlavors, {
        rating: 4.8,
        reviews: 310,
        stockQty: 200,
        express: true,
        bestseller: true,
        newArrival: true,
        ...descGeekBarPulseX25K
    }),
    ...createProducts('Utbar UT 50K', 'Disposables', '5%', 22.99, utbarUT50KFlavors, {
        rating: 4.7,
        reviews: 195,
        stockQty: 160,
        express: true,
        bestseller: true,
        newArrival: true,
        ...descUtbarUT50K
    }),
    ...createProducts('Float Mello Pro 50K', 'Disposables', '5%', 20.99, floatMelloPro50KFlavors, {
        rating: 4.7,
        reviews: 155,
        stockQty: 150,
        express: true,
        bestseller: false,
        newArrival: true,
        ...descFloatMelloPro50K
    }),
    ...createProducts('Foger Switch Pro', 'Disposables', '5%', 17.99, fogerSwitchProKitFlavors, {
        rating: 4.6,
        reviews: 130,
        stockQty: 160,
        express: true,
        bestseller: true,
        newArrival: true,
        ...descFogerSwitchPro
    }),
    ...createProducts('Foger Switch Pro Pods', 'Disposables', '5%', 13.99, fogerSwitchProPodFlavors, {
        rating: 4.6,
        reviews: 115,
        stockQty: 180,
        express: true,
        bestseller: false,
        newArrival: true,
        ...descFogerSwitchProPods
    }),
    ...createProducts('Geek Bar Pulse X', 'Pulse X Series', '5%', 21.90, geekBarPulseXSeriesFlavors, {
        rating: 4.8,
        reviews: 260,
        stockQty: 10,
        express: true,
        bestseller: true,
        newArrival: true,
        imagePathBuilder: buildProductImagePath,
        ...descGeekbarPulseX
    }),
    ...createProducts('Fogger Pods', 'The Originals', '5%', 14.99, foggerPodsOriginalsFlavors, {
        rating: 4.7,
        reviews: 190,
        stockQty: 10,
        express: true,
        bestseller: true,
        newArrival: true,
        imagePathBuilder: buildProductImagePath,
        ...descFogerPods
    }),
    ...createProducts('Fogger Kit', 'The Kits', '5%', 24.99, foggerKitFlavors, {
        rating: 4.7,
        reviews: 140,
        stockQty: 10,
        express: true,
        bestseller: true,
        newArrival: true,
        imagePathBuilder: buildProductImagePath,
        ...descFogerPods
    }),
    ...createProducts('Flum Mellow', 'The Originals', '5%', 20.00, flumMellowOriginalsFlavors, {
        rating: 4.6,
        reviews: 170,
        stockQty: 10,
        express: true,
        bestseller: false,
        newArrival: true,
        imagePathBuilder: buildProductImagePath,
        ...descFlumMello
    }),
    ...createProducts('Numbz', 'Specialty', '5%', 19.99, numbzOriginalsFlavors, {
        rating: 4.5,
        reviews: 65,
        stockQty: 10,
        express: true,
        bestseller: false,
        newArrival: true,
        descriptionPrefix: 'Specialty Infused Packs',
        imagePathBuilder: buildProductImagePath,
    }),
];
