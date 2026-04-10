const GREETING_RESPONSE = 'Welcome to Banana Leaf Store. I can help you find the perfect flavor profile. Are you looking for Fruity, Icy, or Desserts?';

const FLAVOR_RESPONSE_MAP: Array<{ keywords: string[]; response: string }> = [
    {
        keywords: ['mint', 'menthol', 'icy', 'ice', 'cool mint'],
        response: 'Analysis Complete: I recommend the Geekbar Pulse X - Cool Mint for your profile.',
    },
    {
        keywords: ['mango', 'tropical'],
        response: 'Analysis Complete: I recommend the Geekbar Pulse X - Mango Burst for your profile.',
    },
    {
        keywords: ['dessert', 'vanilla', 'cream', 'custard'],
        response: 'Analysis Complete: I recommend the Geekbar Pulse X - Vanilla Cream for your profile.',
    },
    {
        keywords: ['fruit', 'fruity', 'berry', 'blueberry', 'strawberry', 'watermelon'],
        response: 'Analysis Complete: I recommend the Geekbar Pulse X - Blue Razz for your profile.',
    },
];

function normalizePrompt(prompt: string) {
    return prompt.trim().toLowerCase();
}

function getFlavorExpertResponse(prompt: string) {
    const normalizedPrompt = normalizePrompt(prompt);

    if (!normalizedPrompt) {
        return GREETING_RESPONSE;
    }

    for (const entry of FLAVOR_RESPONSE_MAP) {
        if (entry.keywords.some((keyword) => normalizedPrompt.includes(keyword))) {
            return entry.response;
        }
    }

    if (/\b(hi|hello|hey)\b/.test(normalizedPrompt)) {
        return GREETING_RESPONSE;
    }

    return 'Analysis Complete: Based on your profile, I recommend exploring the Geekbar Pulse X line, starting with Blue Razz, Cool Mint, Mango Burst, and Vanilla Cream.';
}

function getGenericResponse(systemInstruction: string) {
    if (systemInstruction === SYSTEM_INSTRUCTIONS.VENDOR_STRATEGIST) {
        return 'Operational Signal: Prioritize disposables, cool mint profiles, and fast-moving pod systems for the next reorder cycle.';
    }

    if (systemInstruction === SYSTEM_INSTRUCTIONS.REVIEW_SUMMARIZER) {
        return 'Review Summary: Customers are responding best to clean mint, mango, and blue razz profiles with quick fulfillment and consistent stock.';
    }

    if (systemInstruction === SYSTEM_INSTRUCTIONS.INVENTORY_ANALYST) {
        return 'Inventory Analysis Complete: Restock Geekbar Pulse X, mint-forward disposables, and premium pod systems first.';
    }

    if (systemInstruction === SYSTEM_INSTRUCTIONS.MARKET_TREND_BOT) {
        return 'Trend Signal: Icy fruit blends, cool mint, and compact disposables are leading current demand.';
    }

    if (systemInstruction === SYSTEM_INSTRUCTIONS.REPORT_GENERATOR) {
        return 'Executive Summary: Performance remains strongest in disposable hardware, flavor-led discovery, and fast-turnover inventory.';
    }

    return GREETING_RESPONSE;
}

export function getSmartAiResponse(prompt: string, systemInstruction: string): string {
    if (systemInstruction === SYSTEM_INSTRUCTIONS.FLAVOR_EXPERT) {
        return getFlavorExpertResponse(prompt);
    }

    return getGenericResponse(systemInstruction);
}

export const vapeosAI = {
    async generateResponse(prompt: string, systemInstruction: string): Promise<string> {
        try {
            return getSmartAiResponse(prompt, systemInstruction);
        } catch (error) {
            console.error('Banana Leaf AI Error:', error);
            return getSmartAiResponse(prompt, systemInstruction);
        }
    }
};

export const SYSTEM_INSTRUCTIONS = {
    FLAVOR_EXPERT: `You are the Banana Leaf Store Flavor Recommendation AI. You help customers find the perfect flavor based on their preferences. 
  When a user describes their preferences, you should:
  1. Analyze their flavor profile (sweet, icy, fruity, dessert, tobacco).
  2. Consider their nicotine level and device type.
  3. Recommend 2-3 specific products (you can invent realistic names if needed, or use: Cloud King Pro, Neon Stick 5000, Arctic Breeze Juice, Zen Pod System).
  4. Provide a detailed explanation for WHY you recommended each product.
  5. Format your response clearly with bold titles and bullet points.`,
    CUSTOMER_SUPPORT: "You are the Banana Leaf Store Customer Support AI. You handle order tracking, shipping questions, and troubleshooting. Be professional, helpful, and concise.",
    VENDOR_STRATEGIST: "You are the Banana Leaf Store Vendor Intelligence AI. You help store owners optimize sales, pricing, and inventory. Provide data-driven insights and actionable recommendations. Keep responses concise and actionable.",
    REVIEW_SUMMARIZER: "You are the Banana Leaf Store Review Analyst AI. Your job is to analyze customer reviews for products and provide a concise summary of the sentiment, common pros, and common cons. Help vendors understand what customers love and what needs improvement. Be brief — 3-4 sentences max.",
    INVENTORY_ANALYST: "You are the Banana Leaf Store Inventory Optimization AI. You analyze sales trends and stock levels to provide precise restock recommendations, identify slow-moving items, and predict future demand. Be brief and actionable.",
    MARKET_TREND_BOT: "You are the Banana Leaf Store Market Trends AI in Ukiah, California. You monitor local and national industry trends, new flavor crazes, and regulatory changes to give vendors a competitive edge. Mention specific product categories and flavor trends. Be brief.",
    REPORT_GENERATOR: "You are the Banana Leaf Store Executive Report AI. You take complex business data and summarize it into clear, actionable executive reports for store owners. Keep reports scannable with bullet points.",
};
