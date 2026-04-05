import { Resend } from 'resend';

const FROM_EMAIL = process.env.EMAIL_FROM || 'VapesHub <orders@vapeshub.com>';

function isEmailConfigured(): boolean {
    return Boolean(process.env.RESEND_API_KEY?.trim());
}

function getResendClient(): Resend {
    const key = process.env.RESEND_API_KEY?.trim();
    if (!key) {
        throw new Error('RESEND_API_KEY is missing');
    }
    return new Resend(key);
}

export async function sendOrderConfirmation(to: string, orderId: number, total: number): Promise<void> {
    if (!isEmailConfigured()) {
        console.log(`[email] RESEND_API_KEY not set — skipping order confirmation email to ${to}`);
        return;
    }
    try {
        const resend = getResendClient();
        await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject: `VapesHub — Order #${orderId} Confirmed`,
            html: `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background: #f8fafc; padding: 32px;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    <div style="background: #0f172a; padding: 32px; text-align: center;">
      <h1 style="color: #10b981; margin: 0; font-size: 28px; letter-spacing: -1px;">VapesHub<span style="color: #fff;">.</span></h1>
      <p style="color: rgba(255,255,255,0.5); font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin: 8px 0 0;">Order Protocol Initiated</p>
    </div>
    <div style="padding: 40px 32px;">
      <h2 style="color: #0f172a; font-size: 22px; margin: 0 0 8px;">Order Confirmed ✓</h2>
      <p style="color: #64748b; font-size: 14px; margin: 0 0 24px;">Your order has been received and is being processed.</p>
      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px; border: 1px solid #e2e8f0;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
          <span style="color: #64748b; font-size: 13px;">Order ID</span>
          <span style="color: #0f172a; font-weight: 700; font-size: 13px;">#${orderId}</span>
        </div>
        <div style="display: flex; justify-content: space-between;">
          <span style="color: #64748b; font-size: 13px;">Total</span>
          <span style="color: #10b981; font-weight: 900; font-size: 20px;">$${total.toFixed(2)}</span>
        </div>
      </div>
      <p style="color: #94a3b8; font-size: 12px; text-align: center;">You'll receive another email when your order ships.</p>
    </div>
  </div>
</body>
</html>`,
        });
    } catch (err) {
        console.error('[email] sendOrderConfirmation failed:', err);
    }
}

export async function sendDeliveredNotification(to: string, orderId: number): Promise<void> {
    if (!isEmailConfigured()) {
        console.log(`[email] RESEND_API_KEY not set — skipping delivered notification email to ${to}`);
        return;
    }
    try {
        const resend = getResendClient();
        await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject: `VapesHub — Order #${orderId} Delivered 🎉`,
            html: `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background: #f8fafc; padding: 32px;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    <div style="background: #0f172a; padding: 32px; text-align: center;">
      <h1 style="color: #10b981; margin: 0; font-size: 28px; letter-spacing: -1px;">VapesHub<span style="color: #fff;">.</span></h1>
      <p style="color: rgba(255,255,255,0.5); font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin: 8px 0 0;">Delivery Confirmed</p>
    </div>
    <div style="padding: 40px 32px; text-align: center;">
      <div style="font-size: 56px; margin-bottom: 16px;">📦</div>
      <h2 style="color: #0f172a; font-size: 22px; margin: 0 0 8px;">Your Order Arrived!</h2>
      <p style="color: #64748b; font-size: 14px; margin: 0 0 24px;">Order <strong>#${orderId}</strong> has been delivered successfully.</p>
      <p style="color: #94a3b8; font-size: 12px;">Enjoy your purchase! If you have any issues, contact our support team.</p>
    </div>
  </div>
</body>
</html>`,
        });
    } catch (err) {
        console.error('[email] sendDeliveredNotification failed:', err);
    }
}

export async function sendOtpEmail(to: string, code: string): Promise<void> {
    if (!isEmailConfigured()) {
        console.log(`[email] RESEND_API_KEY not set — OTP for ${to}: ${code}`);
        return;
    }
    try {
        const resend = getResendClient();
        await resend.emails.send({
            from: FROM_EMAIL,
            to,
            subject: `VapesHub — Your Verification Code: ${code}`,
            html: `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background: #f8fafc; padding: 32px;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    <div style="background: #0f172a; padding: 32px; text-align: center;">
      <h1 style="color: #10b981; margin: 0; font-size: 28px; letter-spacing: -1px;">VapesHub<span style="color: #fff;">.</span></h1>
      <p style="color: rgba(255,255,255,0.5); font-size: 11px; letter-spacing: 3px; text-transform: uppercase; margin: 8px 0 0;">Identity Verification</p>
    </div>
    <div style="padding: 40px 32px; text-align: center;">
      <p style="color: #64748b; font-size: 14px; margin: 0 0 24px;">Your one-time verification code is:</p>
      <div style="background: #f8fafc; border: 2px dashed #10b981; border-radius: 16px; padding: 24px; margin: 0 auto 24px; max-width: 240px;">
        <span style="font-size: 40px; font-weight: 900; letter-spacing: 8px; color: #0f172a;">${code}</span>
      </div>
      <p style="color: #94a3b8; font-size: 12px;">This code expires in <strong>10 minutes</strong>.<br>Do not share this code with anyone.</p>
    </div>
  </div>
</body>
</html>`,
        });
    } catch (err) {
        console.error('[email] sendOtpEmail failed:', err);
    }
}
