import nodemailer from 'nodemailer';

const GHL_WEBHOOK_URL = 'https://services.leadconnectorhq.com/hooks/YtBszBQY2oMblsvgLGUG/webhook-trigger/b583c244-f625-47a5-9b01-3cdf13ef59c8';

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtpout.secureserver.net',
    port: Number(process.env.SMTP_PORT) || 465,
    secure: true,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});

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
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
            await transporter.sendMail({
                from: `"Banana Leaf Store" <${process.env.SMTP_USER}>`,
                to,
                subject: 'Your Login OTP - Banana Leaf Store',
                text: `Hello ${name || 'there'},\n\nYour OTP for Banana Leaf Store is: ${code}\n\nThis code will expire in 10 minutes.\n\nThank you!`,
                html: `<p>Hello ${name || 'there'},</p><p>Your OTP for Banana Leaf Store is: <strong>${code}</strong></p><p>This code will expire in 10 minutes.</p><p>Thank you!</p>`
            });
            console.log(`[email] OTP email sent to ${to} via SMTP`);
        } catch (err) {
            console.error(`[email] Failed to send OTP email via SMTP to ${to}:`, err);
        }
    } else {
        await sendWebhookEvent('otp_verification', {
            email: to,
            otp_code: code,
            name: name || undefined
        });
    }
}
