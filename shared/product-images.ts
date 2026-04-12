export interface ProductImageContext {
    image?: string | null;
    brand?: string | null;
    category?: string | null;
    name?: string | null;
}

const EXTERNAL_PLACEHOLDER_PATTERN = /placehold\.co|source\.unsplash\.com|images\.unsplash\.com|picsum\.photos/i;

const PRODUCT_NAME_IMAGE_MAP: Array<{ pattern: RegExp; image: string }> = [
    { pattern: /^blues\s*(?:-\s*35mg)?$/i, image: '/blues-35mg.jpg' },
    { pattern: /^zyns?\s*(?:-\s*wintergreen)?$/i, image: '/zyns-wintergreen.png' },
    { pattern: /^hydroxie\s*(?:\(7-oh\))?\s*-\s*10-15mg$/i, image: '/hydroxie-7oh-10-15mg.jpg' },
];

const BRAND_IMAGE_MAP: Array<{ pattern: RegExp; image: string }> = [
    { pattern: /^geekbar pulse x$/i, image: '/images/geek-bar-pulse-x-25000-clear.jpg' },
    { pattern: /^foger pods?$/i, image: '/images/devices/uwell-caliburn-g2.webp' },
    { pattern: /^utbar$/i, image: '/images/ut-bar-clear-no-flavor.jpg' },
    { pattern: /^flum mello$/i, image: '/images/devices/elf-bar-bc5000.png' },
    { pattern: /^hydroxie$/i, image: '/hydroxie-7oh-10-15mg.jpg' },
    { pattern: /^hydroxie \(7-oh\)$/i, image: '/hydroxie-7oh-10-15mg.jpg' },
    { pattern: /^blues$/i, image: '/blues-35mg.jpg' },
    { pattern: /^zyns?$/i, image: '/zyns-wintergreen.png' },
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

const DEFAULT_CATALOG_IMAGE = '/images/devices/pngtree-a-sleek-vaping-device-with-transparent-tank-glowing-orange-light-and-png-image_15912369.png';
const PLACEHOLDER_LOCAL_IMAGE_PATHS = new Set(['/images/2023-05-11.webp']);

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