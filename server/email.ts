import { Resend } from 'resend';

const FROM_EMAIL = process.env.EMAIL_FROM || 'BananaLeaf <orders@bananaleaf.com>';

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
            subject: `BananaLeaf — Order #${orderId} Confirmed`,
            html: `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background: #f8fafc; padding: 32px;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    <div style="background: #0f172a; padding: 32px; text-align: center;">
      <h1 style="color: #10b981; margin: 0; font-size: 28px; letter-spacing: -1px;">BananaLeaf<span style="color: #fff;">.</span></h1>
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
            subject: `BananaLeaf — Order #${orderId} Delivered 🎉`,
            html: `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background: #f8fafc; padding: 32px;">
  <div style="max-width: 560px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    <div style="background: #0f172a; padding: 32px; text-align: center;">
      <h1 style="color: #10b981; margin: 0; font-size: 28px; letter-spacing: -1px;">BananaLeaf<span style="color: #fff;">.</span></h1>
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
            subject: `🔐 Your Banana Leaf Verification Code: ${code}`,
            html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; margin: 0; padding: 0; background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);">
  <div style="padding: 32px 16px;">
    <div style="max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); overflow: hidden;">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 40px 32px; text-align: center; position: relative; overflow: hidden;">
        <div style="position: absolute; top: -50px; right: -50px; width: 200px; height: 200px; background: #4AB1F4; border-radius: 50%; opacity: 0.1;"></div>
        <div style="position: relative; z-index: 1;">
          <div style="display: inline-block; background: #4AB1F4; padding: 12px 16px; border-radius: 12px; margin-bottom: 16px;">
            <span style="font-size: 24px;">🔐</span>
          </div>
          <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -0.5px;">BananaLeaf<span style="color: #4AB1F4;">.</span></h1>
          <p style="color: rgba(255,255,255,0.6); font-size: 12px; letter-spacing: 2px; text-transform: uppercase; margin: 12px 0 0; font-weight: 600;">Verification Protocol</p>
        </div>
      </div>
      <!-- Content -->
      <div style="padding: 48px 32px; text-align: center;">
        <h2 style="color: #0f172a; font-size: 24px; font-weight: 900; margin: 0 0 8px; letter-spacing: -0.5px;">Verify Your Identity</h2>
        <p style="color: #64748b; font-size: 14px; margin: 0 0 32px; line-height: 1.6;">Enter this code in seconds to unlock your Hub.</p>
        
        <!-- Code Box -->
        <div style="background: linear-gradient(135deg, #4AB1F4 0%, #0f172a 100%); border-radius: 16px; padding: 32px; margin: 0 auto 32px; max-width: 280px; position: relative; overflow: hidden;">
          <div style="position: absolute; inset: 0; opacity: 0.1; background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px);"></div>
          <span style="font-size: 56px; font-weight: 900; letter-spacing: 12px; color: #ffffff; position: relative; z-index: 1; display: block; font-family: 'Courier New', monospace;">${code}</span>
          <p style="color: rgba(255,255,255,0.7); font-size: 11px; font-weight: 600; margin: 16px 0 0; letter-spacing: 1px; text-transform: uppercase;">Tap to copy</p>
        </div>
        
        <!-- Details -->
        <div style="background: #f8fafc; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
          <p style="color: #64748b; font-size: 13px; margin: 0; line-height: 1.6;">
            <strong style="color: #0f172a;">⏱️ Expires in 10 minutes</strong><br>
            <span style="color: #94a3b8;">This code is unique and one-time use only.</span>
          </p>
        </div>
        
        <!-- Security Note -->
        <div style="background: #fee9e9; border-left: 4px solid #dc2626; border-radius: 8px; padding: 12px 16px; text-align: left; margin-bottom: 24px;">
          <p style="color: #7c2d12; font-size: 12px; margin: 0; font-weight: 500;">
            <strong>🛡️ Security Reminder:</strong> Never share this code with anyone, including Banana Leaf staff.
          </p>
        </div>
        
        <!-- Footer -->
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          Questions? <a href="https://bananaleaf.com/support" style="color: #4AB1F4; text-decoration: none; font-weight: 600;">Contact Support</a>
        </p>
      </div>
      <!-- Footer Brand -->
      <div style="background: #f8fafc; padding: 24px 32px; text-align: center; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 11px; margin: 0; line-height: 1.6;">
          <strong style="color: #0f172a;">Banana Leaf Store</strong><br>
          Premium Vape Products & Trusted Retailer Platform
        </p>
      </div>
    </div>
  </div>
</body>
</html>`,
        });
        console.log(`[email] OTP sent to ${to}`);
    } catch (err) {
        console.error('[email] sendOtpEmail failed:', err);
    }
}
