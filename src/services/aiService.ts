import { GoogleGenAI } from '@google/genai';

// ─── Gemini client ────────────────────────────────────────────────────────────
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env.GEMINI_API_KEY : '');
const genai = API_KEY ? new GoogleGenAI({ apiKey: API_KEY }) : null;

// ─── Store context the AI knows about ────────────────────────────────────────
const STORE_CONTEXT = `
You are "Leaf", the friendly AI shopping assistant for Banana Leaf Store — a premium vape, nicotine pouch, and lifestyle products shop.

STORE PRODUCTS (use these when making recommendations):
- Geekbar Pulse X Series: Disposable vapes with flavors including Cool Mint, Blue Razz, Strawberry Kiwi Ice, Blackberry B-Burst, Pair of Thieves, Grapefruit Refresher, Tobacco, Jam Edition
- Foger Pods: Pre-filled replacement pods with flavors including Miami Mint, Sour Blue Dust, Gummy Bear, Cherry Bomb, Watermelon Bubblegum, Triple Berry, Kiwi Dragon Berry
- Foger Switch Pro: Device kit for pods
- Utbar Disposables: Aloe Grape Watermelon, Blue Rancher, Strawberry Blast, White Gummy, Watermelon Icy
- Flum Mello: Cool Mint, Sour Apple Icy, Watermelon Peach Lime, Blue Razz Icy
- Zyns (Nicotine Pouches): Wintergreen, Peppermint, Citrus, Cool Mint, Cinnamon — tobacco-free
- Blues (Kratom): 35mg, 55mg, 75mg, 100mg
- Hydroxie (7-OH): 10-15mg, 10-30mg, 5-15mg

PERSONALITY:
- Friendly, warm, and conversational — NOT robotic or technical
- Use normal everyday language, no jargon
- Keep responses short and easy to read (2-4 sentences max unless listing products)
- Use emojis sparingly but naturally 😊
- You care about finding the perfect product for the customer

DATA COLLECTION FLOW (only on first interaction):
1. Greet the user warmly and ask their name
2. Once you have their name, ask what they're looking for (flavor preference, nicotine level, device type)
3. After gathering their preference, make a tailored recommendation
4. Offer to answer follow-up questions

IMPORTANT RULES:
- NEVER recommend products to underage users (always mention age verification is required)
- If someone asks about something unrelated to the store, politely redirect
- Remember the user's name and preferences throughout the conversation
- If you already know their name, use it naturally
`;

// ─── Conversation types ───────────────────────────────────────────────────────
export interface ChatMessage {
    role: 'user' | 'ai';
    text: string;
}

interface ConversationState {
    userName: string | null;
    hasGreeted: boolean;
    hasAskedPreferences: boolean;
    collectedPreferences: string[];
    history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>;
}

// ─── State (module-level, persists during session) ────────────────────────────
const conversationState: ConversationState = {
    userName: null,
    hasGreeted: false,
    hasAskedPreferences: false,
    collectedPreferences: [],
    history: [],
};

// ─── Extract user name from message ──────────────────────────────────────────
function extractName(text: string): string | null {
    const patterns = [
        /(?:i'?m|my name is|call me|i am)\s+([A-Za-z]+)/i,
        /^([A-Za-z]{2,15})(?:[,!.]?\s*(?:here|hi|hello))?$/i,
    ];
    for (const pattern of patterns) {
        const match = text.match(pattern);
        if (match?.[1] && match[1].length >= 2) return match[1];
    }
    return null;
}

// ─── Fallback responses (no API key) ─────────────────────────────────────────
function getFallbackResponse(userText: string, state: ConversationState): string {
    const lower = userText.toLowerCase();

    if (!state.hasGreeted) {
        state.hasGreeted = true;
        return "Hey there! 👋 I'm Leaf, your Banana Leaf Store assistant. What's your name?";
    }

    const name = state.userName;
    const greeting = name ? `${name}, ` : '';

    if (!state.userName) {
        const extracted = extractName(userText);
        if (extracted) {
            state.userName = extracted;
            state.hasAskedPreferences = true;
            return `Nice to meet you, ${extracted}! 😊 Are you looking for disposable vapes, nicotine pouches, or something else? And do you prefer fruity, minty, or other flavours?`;
        }
        return "I didn't catch your name — what should I call you? 😊";
    }

    if (!state.hasAskedPreferences) {
        state.hasAskedPreferences = true;
        return `What are you looking for today, ${name}? Disposables, pods, or nicotine pouches? Any favourite flavours?`;
    }

    // Flavour-based recommendations
    if (/mint|menthol|cool|icy|ice/.test(lower)) return `Great choice, ${greeting}minty flavours are super popular! I'd recommend the **Geekbar Pulse X - Cool Mint** or **Foger Pods - Miami Mint**. Both are really fresh and smooth. 🌿`;
    if (/mango|tropical|fruit/.test(lower)) return `Tropical fan! 🥭 Check out the **Geekbar Pulse X - Pair of Thieves** (mango passion) or **Utbar - Strawmelon Peach**. Really refreshing.`;
    if (/berry|blue razz|strawberry|blueberry/.test(lower)) return `Berry lover! 🫐 The **Geekbar Pulse X - Blue Razz** and **Foger Pods - Triple Berry** are both amazing. The Blue Razz is one of our bestsellers!`;
    if (/watermelon/.test(lower)) return `Watermelon is always a hit! 🍉 Try the **Utbar - Aloe Grape Watermelon** or **Flum Mello - Watermelon Peach Lime**.`;
    if (/pouch|nicotine pouch|tobacco.free|zyn/.test(lower)) return `Perfect — Zyns are great for a discreet nicotine hit without vaping! We have Wintergreen, Peppermint, Citrus, Cool Mint, and Cinnamon. Which sounds good, ${name}?`;
    if (/price|cheap|cost|afford/.test(lower)) return `Our disposables start from around $14.99. Pods and pouches vary — want me to point you to a specific product?`;
    if (/shipping|delivery|how long/.test(lower)) return `Standard delivery is 3–5 business days and free! Express is 1–2 days for £5.99. 📦`;

    return `Happy to help, ${greeting}let me know more about what you're after — flavour, product type, nicotine strength — and I'll find the perfect match! 😊`;
}

// ─── Main AI response function ────────────────────────────────────────────────
export async function getChatbotResponse(userText: string): Promise<string> {
    const state = conversationState;

    // First message — greeting
    if (!state.hasGreeted) {
        state.hasGreeted = true;
        const opening = "Hey there! 👋 I'm Leaf, your personal shopping assistant at Banana Leaf Store. I'm here to help you find exactly what you're looking for. What's your name?";

        if (genai) {
            state.history.push({ role: 'user', parts: [{ text: '__INIT__' }] });
            state.history.push({ role: 'model', parts: [{ text: opening }] });
        }
        return opening;
    }

    // Try to extract name if we don't have it yet
    if (!state.userName) {
        const extracted = extractName(userText);
        if (extracted) state.userName = extracted;
    }

    if (!genai) {
        // No API key — use smart fallback
        state.history.push({ role: 'user', parts: [{ text: userText }] });
        const resp = getFallbackResponse(userText, state);
        state.history.push({ role: 'model', parts: [{ text: resp }] });
        return resp;
    }

    // ── Use Gemini API ──
    try {
        state.history.push({ role: 'user', parts: [{ text: userText }] });

        const contextPrompt = `${STORE_CONTEXT}

CONVERSATION SO FAR:
${state.history.slice(0, -1).map(m => `${m.role === 'user' ? 'Customer' : 'Leaf'}: ${m.parts[0].text}`).join('\n')}

${state.userName ? `Customer's name: ${state.userName}` : 'Name: not yet collected'}
${state.collectedPreferences.length ? `Known preferences: ${state.collectedPreferences.join(', ')}` : ''}

Customer just said: "${userText}"

Respond as Leaf, keeping your reply short (2-4 sentences), friendly, and helpful. Use their name if you know it.`;

        const response = await genai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{ role: 'user', parts: [{ text: contextPrompt }] }],
        });

        const aiText = response.text?.trim() || getFallbackResponse(userText, state);
        state.history.push({ role: 'model', parts: [{ text: aiText }] });

        // Extract preferences from both user message and AI response for future context
        if (/mint|icy|fruit|berry|mango|watermelon|dessert|tobacco|pouch/.test(userText.toLowerCase())) {
            state.collectedPreferences.push(userText);
        }

        return aiText;
    } catch (err) {
        console.error('Gemini API error:', err);
        const fallback = getFallbackResponse(userText, state);
        state.history.push({ role: 'model', parts: [{ text: fallback }] });
        return fallback;
    }
}

// ─── Reset conversation (when chat is closed and reopened) ────────────────────
export function resetChatbot(): void {
    conversationState.userName = null;
    conversationState.hasGreeted = false;
    conversationState.hasAskedPreferences = false;
    conversationState.collectedPreferences = [];
    conversationState.history = [];
}

// ─── Legacy exports (keep compatibility with vendor bots) ────────────────────
export const SYSTEM_INSTRUCTIONS = {
    FLAVOR_EXPERT: 'flavor_expert',
    CUSTOMER_SUPPORT: 'customer_support',
    VENDOR_STRATEGIST: 'vendor_strategist',
    REVIEW_SUMMARIZER: 'review_summarizer',
    INVENTORY_ANALYST: 'inventory_analyst',
    MARKET_TREND_BOT: 'market_trend_bot',
    REPORT_GENERATOR: 'report_generator',
};

export function getSmartAiResponse(prompt: string, _systemInstruction: string): string {
    return getFallbackResponse(prompt, conversationState);
}

export const vapeosAI = {
    async generateResponse(prompt: string, systemInstruction: string): Promise<string> {
        if (systemInstruction === SYSTEM_INSTRUCTIONS.FLAVOR_EXPERT) {
            return getChatbotResponse(prompt);
        }
        return getSmartAiResponse(prompt, systemInstruction);
    },
};
