import { config } from 'dotenv';
import nodemailer from 'nodemailer';

// Load env variables
config();
config({ path: '.env.local' });

async function main() {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtpout.secureserver.net',
        port: Number(process.env.SMTP_PORT) || 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });

    try {
        console.log('Sending test email to pruthviraj.work21@gmail.com...');
        const info = await transporter.sendMail({
            from: `"Banana Leaf Store" <${process.env.SMTP_USER}>`,
            to: 'pruthviraj.work21@gmail.com',
            subject: 'Test Email from Banana Leaf Store',
            text: 'Hello! This is a test email to verify your SMTP configuration. If you are reading this in your inbox, your setup is working perfectly!',
            html: '<b>Hello!</b><br><br>This is a test email to verify your SMTP configuration. If you are reading this in your inbox, your setup is working perfectly!',
        });

        console.log('Message sent successfully!');
        console.log('Message ID: %s', info.messageId);
    } catch (error) {
        console.error('Error sending email:', error);
    }
}

main();
