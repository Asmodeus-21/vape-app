import nodemailer from 'nodemailer';
import { Resend } from 'resend';

const GHL_WEBHOOK_URL = process.env.GHL_WEBHOOK_URL || 'https://services.leadconnectorhq.com/hooks/YtBszBQY2oMblsvgLGUG/webhook-trigger/b583c244-f625-47a5-9b01-3cdf13ef59c8';
const RESEND_API_KEY = process.env.RESEND_API_KEY?.trim();

const smtpTransporter = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 465,
        secure: true,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    })
    : null;

const resendClient = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

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

function getEmailFrom(): string {
    return process.env.EMAIL_FROM || `Banana Leaf Store <${process.env.SMTP_USER || 'orders@bananaleaf.com'}>`;
}

async function sendRawEmail(to: string, subject: string, text: string, html: string): Promise<void> {
    if (smtpTransporter) {
        try {
            await smtpTransporter.sendMail({
                from: getEmailFrom(),
                to,
                subject,
                text,
                html,
            });
            console.log(`[email] Order email sent via SMTP to ${to}`);
            return;
        } catch (err) {
            console.error(`[email] Failed to send order email via SMTP to ${to}:`, err);
        }
    }

    if (resendClient) {
        try {
            await resendClient.emails.send({
                from: getEmailFrom(),
                to,
                subject,
                text,
                html,
            });
            console.log(`[email] Order email sent via Resend to ${to}`);
            return;
        } catch (err) {
            console.error(`[email] Failed to send order email via Resend to ${to}:`, err);
        }
    }
}

export async function sendOrderConfirmation(to: string, orderId: number, total: number): Promise<void> {
    const formattedTotal = total.toFixed(2);
    const subject = `Your Banana Leaf order #${orderId} is confirmed`;
    const text = `Thanks for your purchase!\n\nOrder #${orderId} has been received and is now being processed.\nTotal: $${formattedTotal}\n\nWe will notify you when your order ships.\n\nThank you for shopping with Banana Leaf Store.`;
    const html = `
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; line-height: 1.5;">
            <h1 style="font-size: 20px; margin-bottom: 0.5rem;">Order Confirmed!</h1>
            <p style="margin: 0 0 1rem;">Thanks for your purchase. Your order <strong>#${orderId}</strong> has been received and is now being processed.</p>
            <p style="margin: 0 0 0.5rem;"><strong>Total:</strong> $${formattedTotal}</p>
            <p style="margin: 0 0 1rem;">We will notify you again when your order ships.</p>
            <p style="margin: 0;">Thank you for shopping with <strong>Banana Leaf Store</strong>.</p>
        </div>
    `;

    await sendRawEmail(to, subject, text, html);
    await sendWebhookEvent('order_confirmation', { email: to, orderId, total });
}

export async function sendDeliveredNotification(to: string, orderId: number): Promise<void> {
    const subject = `Your Banana Leaf order #${orderId} has been delivered`;
    const text = `Your order #${orderId} has been delivered. Thank you for choosing Banana Leaf Store.`;
    const html = `
        <div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #0f172a; line-height: 1.5;">
            <h1 style="font-size: 20px; margin-bottom: 0.5rem;">Order Delivered</h1>
            <p>Your order <strong>#${orderId}</strong> has been delivered. Thank you for choosing Banana Leaf Store.</p>
        </div>
    `;

    await sendRawEmail(to, subject, text, html);
    await sendWebhookEvent('order_delivered', { email: to, orderId });
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
