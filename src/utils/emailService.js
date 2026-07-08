import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG, EMAILJS_ENABLED } from '../config/emailjs.config';

/**
 * Generates a cryptographically random 6-digit OTP
 */
export function generateOTP() {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  // Ensure it's exactly 6 digits: 100000 – 999999
  return String(100000 + (array[0] % 900000));
}

/**
 * Sends an OTP email via EmailJS.
 * Falls back gracefully if EmailJS is not configured.
 *
 * @param {string} toEmail  - Recipient email address
 * @param {string} toName   - Recipient display name
 * @param {string} otpCode  - The 6-digit OTP string
 * @returns {Promise<{ success: boolean, error?: string }>}
 */
export async function sendOTPEmail(toEmail, toName, otpCode) {
  if (!EMAILJS_ENABLED) {
    // Dev mode: log to console instead of sending
    console.info(
      `[EmailJS - DEV MODE]\n` +
      `To: ${toEmail} (${toName})\n` +
      `OTP Code: ${otpCode}\n\n` +
      `To enable real email delivery, fill in your credentials in:\n` +
      `src/config/emailjs.config.js`
    );
    return { success: true, devMode: true };
  }

  try {
    await emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      {
        to_email: toEmail,
        to_name:  toName  || toEmail.split('@')[0],
        otp_code: otpCode,
        app_name: 'FlowTodo',
      },
      { publicKey: EMAILJS_CONFIG.PUBLIC_KEY }
    );
    return { success: true };
  } catch (err) {
    console.error('EmailJS send error:', err);
    return { success: false, error: err?.text || err?.message || 'Failed to send email.' };
  }
}
