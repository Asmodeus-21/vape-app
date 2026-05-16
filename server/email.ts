const GHL_WEBHOOK_URL = process.env.GHL_WEBHOOK_URL?.trim() || process.env.GOHIGHLEVEL_WEBHOOK_URL?.trim();

function isWebhookConfigured(): boolean {
    return Boolean(GHL_WEBHOOK_URL);
}

async function sendWebhookEvent(eventType: string, payload: any): Promise<void> {
    if (!isWebhookConfigured()) {
        console.log(`[email] GHL_WEBHOOK_URL not set — skipping ${eventType} webhook`);
        return;
    }
    
    try {
        const response = await fetch(GHL_WEBHOOK_URL!, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: eventType,
                timestamp: new Date().toISOString(),
                ...payload
            }),
        });
        
        if (!response.ok) {
            console.error(`[email] Webhook failed for ${eventType}: ${response.status} ${response.statusText}`);
        } else {
            console.log(`[email] Webhook sent for ${eventType}`);
        }
    } catch (err) {
        console.error(`[email] sendWebhookEvent failed for ${eventType}:`, err);
    }
}

export async function sendOrderConfirmation(to: string, orderId: number, total: number): Promise<void> {
    await sendWebhookEvent('order_confirmation', {
        email: to,
        orderId,
        total
    });
}

export async function sendDeliveredNotification(to: string, orderId: number): Promise<void> {
    await sendWebhookEvent('order_delivered', {
        email: to,
        orderId
    });
}

export async function sendOtpEmail(to: string, code: string, name?: string): Promise<void> {
    await sendWebhookEvent('otp_verification', {
        email: to,
        otp_code: code,
        name: name || undefined
    });
}
