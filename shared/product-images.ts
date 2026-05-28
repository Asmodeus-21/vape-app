export interface ProductImageContext {
    image?: string | null;
    brand?: string | null;
    category?: string | null;
    name?: string | null;
    flavor?: string | null;
}

const EXTERNAL_PLACEHOLDER_PATTERN = /placehold\.co|source\.unsplash\.com|images\.unsplash\.com|picsum\.photos/i;

const PRODUCT_NAME_IMAGE_MAP: Array<{ pattern: RegExp; image: string }> = [

    { pattern: /^zyns?\s*(?:-\s*wintergreen)?$/i, image: '/images/products/zyns/wintergreen.jpeg' },
    { pattern: /^zyn\s*-\s*wintergreen/i, image: '/images/products/zyns/wintergreen.jpeg' },
    { pattern: /^zyn\s*-\s*peppermint/i,  image: '/images/products/zyns/peppermint.jpeg' },
    { pattern: /^zyn\s*-\s*citrus/i,      image: '/images/products/zyns/citrus.jpeg' },
    { pattern: /^zyn\s*-\s*cool.?mint/i,  image: '/images/products/zyns/cool-mint.jpeg' },
    { pattern: /^zyn\s*-\s*cinnamon/i,    image: '/images/products/zyns/cinnamon.jpeg' },
    { pattern: /^hydroxie\s*(?:\(7-oh\))?\s*-\s*10-15mg$/i, image: '/images/products/hydroxie/10-15mg.jpg' },
    { pattern: /^hydroxie\s*(?:\(7-oh\))?\s*-/i, image: '/images/products/hydroxie/10-15mg.jpg' },
    // Numbz — mg-specific variant image lookup by product name
    { pattern: /numbz.*berry.*burst.*300mg/i,     image: '/images/numbz/berry-burst-300mg.jpg' },
    { pattern: /numbz.*berry.*burst.*500mg/i,     image: '/images/numbz/berry-burst-500mg.jpg' },
    { pattern: /numbz.*watermelon.*rush.*300mg/i, image: '/images/numbz/watermelon-rush-300mg.jpg' },
    { pattern: /numbz.*watermelon.*rush.*500mg/i, image: '/images/numbz/watermelon-rush-500mg.jpg' },
];

const BRAND_IMAGE_MAP: Array<{ pattern: RegExp; image: string }> = [
    // Geek Bar Pulse X
    { pattern: /^geek bar pulse x$/i,    image: '/images/products/geekbar-pulse-x/hero.png' },
    { pattern: /geekbar|geek.?bar/i,     image: '/images/products/geekbar-pulse-x/hero.png' },
    // Fogger Pods
    { pattern: /^fogger pods?$/i,        image: '/images/products/foger-pods/miami-mint.webp' },
    { pattern: /^fogger kit$/i,          image: '/images/products/foger-pods/gummy-bear.webp' },
    // Float/Flum Mellow
    { pattern: /float.*flum|flum.*mellow|float.*mellow/i, image: '/images/products/flum-mello/watermelon-icy.png' },
    { pattern: /flum|float mello/i,      image: '/images/products/flum-mello/watermelon-icy.png' },
    // UT Bar
    { pattern: /^ut bar$/i,              image: '/images/products/utbar/aloe-grape-watermelon.webp' },
    { pattern: /utbar/i,                 image: '/images/products/utbar/aloe-grape-watermelon.webp' },
    // Numbz
    { pattern: /^numbz$/i,               image: '/images/2023-05-11.webp' },
];

const CATEGORY_IMAGE_MAP: Array<{ pattern: RegExp; image: string }> = [
    { pattern: /^disposables$/i, image: '/images/products/geekbar-pulse-x/hero.png' },
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
const PLACEHOLDER_LOCAL_IMAGE_PATHS = new Set([
    '/images/2023-05-11.webp',
]);

// ─── Per-flavor image map ─────────────────────────────────────────────────────
// Keys are `${brandSlug}:${flavorSlug}` where slugs are lowercase-hyphenated.
// Used by resolveFlavorImage() to drive dynamic flavor switching in ProductDetail.
const FLAVOR_IMAGE_MAP: Readonly<Record<string, string>> = {
    // Zyns / ZYN — 5 flavors (both 'zyns' and 'zyn' brand slugs)
    'zyns:wintergreen': '/images/products/zyns/wintergreen.jpeg',
    'zyns:peppermint':  '/images/products/zyns/peppermint.jpeg',
    'zyns:citrus':      '/images/products/zyns/citrus.jpeg',
    'zyns:cool-mint':   '/images/products/zyns/cool-mint.jpeg',
    'zyns:cinnamon':    '/images/products/zyns/cinnamon.jpeg',
    'zyn:wintergreen':  '/images/products/zyns/wintergreen.jpeg',
    'zyn:peppermint':   '/images/products/zyns/peppermint.jpeg',
    'zyn:citrus':       '/images/products/zyns/citrus.jpeg',
    'zyn:cool-mint':    '/images/products/zyns/cool-mint.jpeg',
    'zyn:cinnamon':     '/images/products/zyns/cinnamon.jpeg',

    // Hydroxie (7-OH) — real product photos
    'hydroxie-7-oh:10-15mg': '/images/products/hydroxie/10-15mg.jpg',
    'hydroxie-7-oh:10-30mg': '/images/products/hydroxie/10-15mg.jpg',
    'hydroxie-7-oh:5-15mg': '/images/products/hydroxie/10-15mg.jpg',
    'hydroxie-7-oh:5-30mg': '/images/products/hydroxie/10-15mg.jpg',
    'hydroxie-7-oh:5-60mg': '/images/products/hydroxie/10-15mg.jpg',



    // Geekbar Pulse X — full flavor set
    'geekbar-pulse-x:blackberry-b-burst': '/images/products/geekbar-pulse-x/blackberry-b-burst.png',
    'geekbar-pulse-x:blackberry-b-pop': '/images/products/geekbar-pulse-x/blackberry-b-pop.png',
    'geekbar-pulse-x:blue-rancher': '/images/products/geekbar-pulse-x/blue-rancher.png',
    'geekbar-pulse-x:cool-mint': '/images/products/geekbar-pulse-x/cool-mint.png',
    'geekbar-pulse-x:pair-of-thieves': '/images/products/geekbar-pulse-x/pair-of-thieves.png',
    'geekbar-pulse-x:pear-of-thieves': '/images/products/geekbar-pulse-x/pear-of-thieves.png',
    'geekbar-pulse-x:strawberry-kiwi-ice': '/images/products/geekbar-pulse-x/strawberry-kiwi-ice.png',
    'geekbar-pulse-x:jam-edition': '/images/products/geekbar-pulse-x/jam-edition.png',
    'geekbar-pulse-x:tobacco-flavour': '/images/products/geekbar-pulse-x/tobacco-flavour.png',
    'geekbar-pulse-x:grapefruit-refresher': '/images/products/geekbar-pulse-x/grapefruit-refresher.webp',

    // Foger Pods — full flavor set
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
    'foger-pods:blue-rancher-b-pop': '/images/products/foger-pods/blue-rancher-b-pop.webp',
    'foger-pods:omg-b-pop': '/images/products/foger-pods/omg-b-pop.webp',

    // Foger Switch Pro — updated with new images
    'foger-switch-pro:blue-rancher-b-pop': '/images/products/foger-pods/blue-rancher-b-pop.webp',
    'foger-switch-pro:gummy-bear': '/images/products/foger-pods/gummy-bear.webp',
    'foger-switch-pro:miami-mint': '/images/products/foger-pods/miami-mint.webp',
    'foger-switch-pro:sour-blue-dust': '/images/products/foger-pods/sour-blue-dust.webp',
    'foger-switch-pro:strawberry-kiwi': '/images/products/foger-pods/sour-apple-ice.webp',

    // Foger Switch Pro Pods — updated with new images
    'foger-switch-pro-pods:omg-b-pop': '/images/products/foger-pods/omg-b-pop.webp',
    'foger-switch-pro-pods:cherry-slush': '/images/products/foger-pods/cherry-bomb.webp',
    'foger-switch-pro-pods:pink-lemonade': '/images/products/foger-pods/pineapple-coconut.webp',

    // Utbar — existing 3 + 11 new flavors
    'utbar:aloe-grape-watermelon': '/images/products/utbar/aloe-grape-watermelon.webp',
    'utbar:blue-rancher-lemonade': '/images/products/utbar/blue-rancher-lemonade.png',
    'utbar:blue-razz-lemonade': '/images/products/utbar/blue-razz-lemonade.png',
    'utbar:blue-rancher': '/images/products/utbar/blue-rancher.png',
    'utbar:blue-razz-icy': '/images/products/utbar/blue-razz-icy.png',
    'utbar:double-green-pop': '/images/products/utbar/double-green-pop.png',
    'utbar:frozen-blackberry-fab': '/images/products/utbar/frozen-blackberry-fab.png',
    'utbar:grape-pop-icy': '/images/products/utbar/grape-pop-icy.png',
    'utbar:sour-pop': '/images/products/utbar/sour-pop.png',
    'utbar:strawberry-blast': '/images/products/utbar/strawberry-blast.png',
    'utbar:strawmelon-peach': '/images/products/utbar/strawmelon-peach.png',
    'utbar:watermelon-blueberry': '/images/products/utbar/watermelon-blueberry.png',
    'utbar:watermelon-icy': '/images/products/utbar/watermelon-icy.png',
    'utbar:white-gummy': '/images/products/utbar/white-gummy.png',

    // Flum Mello — existing 4 + 3 new flavors
    'flum-mello:cool-mint': '/images/products/flum-mello/cool-mint.png',
    'flum-mello:sour-apple-icy': '/images/products/flum-mello/sour-apple-icy.png',
    'flum-mello:watermelon-icy': '/images/products/flum-mello/watermelon-icy.png',
    'flum-mello:watermelon-peach-lime': '/images/products/flum-mello/watermelon-peach-lime.png',
    'flum-mello:blue-razz-icy': '/images/products/flum-mello/blue-razz-icy.png',
    'flum-mello:peach-icy': '/images/products/flum-mello/peach-icy.png',
    'flum-mello:spearmint-watermelon': '/images/products/flum-mello/spearmint-watermelon.png',

    // Numbz — default flavor image (mg-specific images resolved via PRODUCT_NAME_IMAGE_MAP)
    'numbz:berry-burst':     '/images/numbz/berry-burst-500mg.jpg',
    'numbz:watermelon-rush': '/images/numbz/watermelon-rush-500mg.jpg',
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