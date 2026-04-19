export interface ProductImageContext {
    image?: string | null;
    brand?: string | null;
    category?: string | null;
    name?: string | null;
    flavor?: string | null;
}

const EXTERNAL_PLACEHOLDER_PATTERN = /placehold\.co|source\.unsplash\.com|images\.unsplash\.com|picsum\.photos/i;

const PRODUCT_NAME_IMAGE_MAP: Array<{ pattern: RegExp; image: string }> = [
    { pattern: /^blues\s*(?:-\s*35mg)?$/i, image: '/images/2023-05-11.webp' },
    { pattern: /^zyns?\s*(?:-\s*wintergreen)?$/i, image: '/images/2023-05-11.webp' },
    { pattern: /^hydroxie\s*(?:\(7-oh\))?\s*-\s*10-15mg$/i, image: '/images/2023-05-11.webp' },
];

const BRAND_IMAGE_MAP: Array<{ pattern: RegExp; image: string }> = [
    { pattern: /^geekbar pulse x$/i, image: '/images/geek-bar-pulse-x-25000-clear.jpg' },
    { pattern: /^geek bar pulse x 25k$/i, image: '/images/geek-bar-pulse-x-25000-clear.jpg' },
    // Foger Pods: use a real flavor photo as the representative brand card image
    { pattern: /^foger pods?$/i, image: '/images/products/foger-pods/miami-mint.webp' },
    { pattern: /^foger switch pro pods?$/i, image: '/images/products/foger-pods/sour-blue-dust.webp' },
    { pattern: /^foger switch pro$/i, image: '/images/products/foger-pods/gummy-bear.webp' },
    { pattern: /^utbar ut 50k$/i, image: '/images/products/utbar/aloe-grape-watermelon.webp' },
    { pattern: /^utbar$/i, image: '/images/products/utbar/aloe-grape-watermelon.webp' },
    { pattern: /^float mello pro 50k$/i, image: '/images/products/flum-mello/watermelon-icy.png' },
    { pattern: /^flum mello$/i, image: '/images/products/flum-mello/watermelon-icy.png' },
    // Zyns: use real product photo instead of generic stock
    { pattern: /^zyns?$/i, image: '/images/products/zyns/wintergreen.jpeg' },
    // Hydroxie & Blues: no product photos yet — keep generic until assets arrive
    { pattern: /^hydroxie$/i, image: '/images/2023-05-11.webp' },
    { pattern: /^hydroxie \(7-oh\)$/i, image: '/images/2023-05-11.webp' },
    { pattern: /^blues$/i, image: '/images/2023-05-11.webp' },
];

const CATEGORY_IMAGE_MAP: Array<{ pattern: RegExp; image: string }> = [
    { pattern: /^disposables$/i, image: '/images/devices/elf-bar-bc5000.png' },
    { pattern: /^nicotine pouches$/i, image: '/images/2023-05-11.webp' },
    { pattern: /^supplements$/i, image: '/images/2023-05-11.webp' },
    { pattern: /^pod systems$/i, image: '/images/devices/uwell-caliburn-g2.webp' },
    { pattern: /^mods$/i, image: '/images/devices/geekvape-aegis-legend.jpg' },
    { pattern: /^devices$/i, image: '/images/devices/pngtree-a-sleek-vaping-device-with-transparent-tank-glowing-orange-light-and-png-image_15912369.png' },
    { pattern: /^accessories$/i, image: '/images/accessories/cotton-bacon-prime.jpg' },
    { pattern: /^glass$/i, image: '/images/cookies-flame-beaker.JPG' },
    { pattern: /^rolling$/i, image: '/images/backwoods-honey-berry.jpg' },
    { pattern: /^e-liquids$/i, image: '/images/devices/smok-nord-4-kit.jpg' },
    { pattern: /^nic salts$/i, image: '/images/devices/smok-nord-4-kit.jpg' },
];

export const DEFAULT_CATALOG_IMAGE = '/images/devices/pngtree-a-sleek-vaping-device-with-transparent-tank-glowing-orange-light-and-png-image_15912369.png';
const PLACEHOLDER_LOCAL_IMAGE_PATHS = new Set(['/images/2023-05-11.webp']);

// ─── Per-flavor image map ─────────────────────────────────────────────────────
// Keys are `${brandSlug}:${flavorSlug}` where slugs are lowercase-hyphenated.
// Used by resolveFlavorImage() to drive dynamic flavor switching in ProductDetail.
const FLAVOR_IMAGE_MAP: Readonly<Record<string, string>> = {
    // Zyns — 5/5 flavors
    'zyns:wintergreen': '/images/products/zyns/wintergreen.jpeg',
    'zyns:peppermint': '/images/products/zyns/peppermint.jpeg',
    'zyns:citrus': '/images/products/zyns/citrus.jpeg',
    'zyns:cool-mint': '/images/products/zyns/cool-mint.jpeg',
    'zyns:cinnamon': '/images/products/zyns/cinnamon.jpeg',

    // Geekbar Pulse X — 5/15 flavors
    'geekbar-pulse-x:blackberry-b-burst': '/images/products/geekbar-pulse-x/blackberry-b-burst.png',
    'geekbar-pulse-x:blue-rancher': '/images/products/geekbar-pulse-x/blue-rancher.png',
    'geekbar-pulse-x:cool-mint': '/images/products/geekbar-pulse-x/cool-mint.png',
    'geekbar-pulse-x:pair-of-thieves': '/images/products/geekbar-pulse-x/pair-of-thieves.png',
    'geekbar-pulse-x:strawberry-kiwi-ice': '/images/products/geekbar-pulse-x/strawberry-kiwi-ice.png',

    // Foger Pods — 16/18 flavors (Gum Mint + Watermelon Ice assets still needed)
    'foger-pods:sour-blue-dust': '/images/products/foger-pods/sour-blue-dust.webp',
    'foger-pods:miami-mint': '/images/products/foger-pods/miami-mint.webp',
    'foger-pods:blue-ranger-blowup': '/images/products/foger-pods/blue-ranger-blowup.webp',
    'foger-pods:omg-blow-pop': '/images/products/foger-pods/omg-blow-pop.webp',
    'foger-pods:watermelon-bubblegum': '/images/products/foger-pods/watermelon-bubblegum.webp',
    'foger-pods:frozen-lemon': '/images/products/foger-pods/frozen-lemon.webp',
    'foger-pods:gummy-bear': '/images/products/foger-pods/gummy-bear.webp',
    'foger-pods:white-gummy': '/images/products/foger-pods/white-gummy.webp',
    'foger-pods:triple-berry': '/images/products/foger-pods/triple-berry.webp',
    'foger-pods:cherry-bomb': '/images/products/foger-pods/cherry-bomb.webp',
    'foger-pods:sour-apple-ice': '/images/products/foger-pods/sour-apple-ice.webp',
    'foger-pods:kiwi-dragon-berry': '/images/products/foger-pods/kiwi-dragon-berry.webp',
    'foger-pods:red-velvet-cupcake': '/images/products/foger-pods/red-velvet-cupcake.webp',
    'foger-pods:pineapple-coconut': '/images/products/foger-pods/pineapple-coconut.webp',
    'foger-pods:blueberry-watermelon': '/images/products/foger-pods/blueberry-watermelon.webp',
    'foger-pods:cool-mint': '/images/products/foger-pods/cool-mint.webp',

    // Utbar — 3/14 flavors
    'utbar:aloe-grape-watermelon': '/images/products/utbar/aloe-grape-watermelon.webp',
    'utbar:blue-rancher-lemonade': '/images/products/utbar/blue-rancher-lemonade.png',
    'utbar:blue-razz-lemonade': '/images/products/utbar/blue-razz-lemonade.png',

    // Flum Mello — 4/8 flavors (Sour Mango Pineapple, Straw Melon, White Gummy, Miami Mint still needed)
    'flum-mello:cool-mint': '/images/products/flum-mello/cool-mint.png',
    'flum-mello:sour-apple-icy': '/images/products/flum-mello/sour-apple-icy.png',
    'flum-mello:watermelon-icy': '/images/products/flum-mello/watermelon-icy.png',
    'flum-mello:watermelon-peach-lime': '/images/products/flum-mello/watermelon-peach-lime.png',
};

function toFlavorSlug(value: string): string {
    return value
        .toLowerCase()
        .replace(/[/\\]/g, '-')     // "Aloe Grape/Watermelon" → "aloe-grape-watermelon"
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

function toBrandSlug(brand: string): string {
    return brand
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
}

/**
 * Returns the flavor-specific product image path, or null if no asset exists.
 * Callers should fall back to resolveCatalogImage() when this returns null.
 */
const IMAGE_VERSION = '?v=1.1';

export function resolveFlavorImage(brand: string | null | undefined, flavor: string | null | undefined): string | null {
    if (!brand || !flavor || flavor === 'N/A') {
        return null;
    }
    const key = `${toBrandSlug(brand)}:${toFlavorSlug(flavor)}`;
    const path = FLAVOR_IMAGE_MAP[key];
    return path ? `${path}${IMAGE_VERSION}` : null;
}

const matchMappedImage = (value: string | null | undefined, rules: Array<{ pattern: RegExp; image: string }>): string | null => {
    if (!value) {
        return null;
    }

    const normalizedValue = value.trim();
    if (!normalizedValue) {
        return null;
    }

    return rules.find((rule) => rule.pattern.test(normalizedValue))?.image ?? null;
};

export const isLocalCatalogImage = (imageUrl: string | null | undefined): boolean => Boolean(imageUrl && imageUrl.startsWith('/'));

export const isExternalPlaceholderImage = (imageUrl: string | null | undefined): boolean => Boolean(imageUrl && EXTERNAL_PLACEHOLDER_PATTERN.test(imageUrl));

export function resolveCatalogImage(context: ProductImageContext): string {
    // Check flavor-specific image first so product cards show the real flavor photo
    const flavorSpecific = resolveFlavorImage(context.brand, context.flavor);
    if (flavorSpecific) {
        return flavorSpecific;
    }

    const productNameMatch = matchMappedImage(context.name, PRODUCT_NAME_IMAGE_MAP);
    if (productNameMatch) {
        return productNameMatch;
    }

    const brandMatch = matchMappedImage(context.brand, BRAND_IMAGE_MAP);
    if (brandMatch) {
        return brandMatch;
    }

    const categoryMatch = matchMappedImage(context.category, CATEGORY_IMAGE_MAP);
    if (categoryMatch) {
        return categoryMatch;
    }

    if (context.image && !isExternalPlaceholderImage(context.image)) {
        const normalizedImage = context.image.trim().toLowerCase();
        if (!PLACEHOLDER_LOCAL_IMAGE_PATHS.has(normalizedImage) || !isLocalCatalogImage(context.image)) {
            return context.image;
        }
    }

    return DEFAULT_CATALOG_IMAGE;
}