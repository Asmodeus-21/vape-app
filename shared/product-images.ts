export interface ProductImageContext {
    image?: string | null;
    brand?: string | null;
    category?: string | null;
    name?: string | null;
}

const EXTERNAL_PLACEHOLDER_PATTERN = /placehold\.co|source\.unsplash\.com|images\.unsplash\.com|picsum\.photos/i;

const BRAND_IMAGE_MAP: Array<{ pattern: RegExp; image: string }> = [
    { pattern: /^geekbar pulse x$/i, image: '/images/geek-bar-pulse-x-25000-clear.jpg' },
    { pattern: /^foger pods?$/i, image: '/images/devices/uwell-caliburn-g2.webp' },
    { pattern: /^utbar$/i, image: '/images/ut-bar-clear-no-flavor.jpg' },
    { pattern: /^flum mello$/i, image: '/images/devices/elf-bar-bc5000.png' },
    { pattern: /^hydroxie \(7-oh\)$/i, image: '/images/2023-05-11.webp' },
    { pattern: /^blues$/i, image: '/images/2023-05-11.webp' },
    { pattern: /^zyns?$/i, image: '/images/2023-05-11.webp' },
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

export const isLocalCatalogImage = (imageUrl: string | null | undefined): boolean => Boolean(imageUrl && imageUrl.startsWith('/images/'));

export const isExternalPlaceholderImage = (imageUrl: string | null | undefined): boolean => Boolean(imageUrl && EXTERNAL_PLACEHOLDER_PATTERN.test(imageUrl));

export function resolveCatalogImage(context: ProductImageContext): string {
    if (isLocalCatalogImage(context.image)) {
        return context.image as string;
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
        return context.image;
    }

    return DEFAULT_CATALOG_IMAGE;
}