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
    const subject = 'Your Verification Code - Banana Leaf';
    const text = `Welcome to Banana Leaf!\n\nHello ${name || 'there'},\n\nYour verification code is: ${code}\n\nThis code will expire in 10 minutes.\n\nThank you,\nThe Banana Leaf Team`;
    const html = `
        <div style="font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #1e293b; line-height: 1.6; max-width: 500px; margin: 0 auto; padding: 32px 20px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
            <div style="text-align: center; margin-bottom: 32px;">
                <h1 style="font-size: 24px; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.5px;">🍌 Banana Leaf</h1>
            </div>
            
            <p style="font-size: 16px; margin-bottom: 24px;">Hello <strong>${name || 'there'}</strong>,</p>
            
            <p style="font-size: 16px; margin-bottom: 24px;">Welcome to Banana Leaf! Please use the verification code below to securely access your account.</p>
            
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 24px; border-radius: 12px; text-align: center; margin: 32px 0;">
                <div style="font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #3b82f6;">
                    ${code}
                </div>
            </div>
            
            <p style="font-size: 14px; color: #64748b; margin-bottom: 32px; text-align: center;">
                For your security, this code will expire in <strong>10 minutes</strong>.
            </p>
            
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 32px 0;" />
            
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">
                If you didn't request this code, you can safely ignore this email. Someone may have typed your email address by mistake.
            </p>
        </div>
    `;

    // Try to send via SMTP/Resend first
    if (smtpTransporter || resendClient) {
        await sendRawEmail(to, subject, text, html);
    }
    
    // Always fire webhook to GHL as a backup/tracker
    await sendWebhookEvent('otp_verification', {
        email: to,
        otp_code: code,
        name: name || undefined
    });
}
