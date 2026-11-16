import nodemailer from 'nodemailer';

/**
 * Sends an email or logs to console if SMTP credentials are not configured.
 * @param {Object} options - { to, subject, html, text, token, resetUrl }
 */
export const sendEmail = async ({ to, subject, html, text, resetUrl }) => {
  const isSmtpConfigured =
    process.env.EMAIL_SERVICE === 'smtp' &&
    process.env.EMAIL_USER &&
    process.env.EMAIL_PASS &&
    process.env.EMAIL_USER !== 'your_email@gmail.com';

  if (isSmtpConfigured) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.EMAIL_PORT) || 587,
        secure: process.env.EMAIL_PORT === '465',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

      const info = await transporter.sendMail({
        from: process.env.EMAIL_FROM || 'StockWise Support <support@stockwise.trade>',
        to,
        subject,
        text,
        html,
      });

      console.log(`[Email Service] Message sent successfully via SMTP: ${info.messageId}`);
      return { success: true, mode: 'smtp', messageId: info.messageId };
    } catch (err) {
      console.error(`[Email Service Error] Failed to send via SMTP: ${err.message}`);
      console.log(`[Email Fallback] Password Reset Link for ${to}: ${resetUrl}`);
      return { success: true, mode: 'fallback_console', resetUrl };
    }
  } else {
    // Development fallback: clearly log reset details
    console.log(`\n================== [STOCKWISE EMAIL NOTIFICATION] ==================`);
    console.log(`Recipient: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Notice: SMTP service credentials pending in .env (EMAIL_SERVICE=console)`);
    console.log(`Password Reset Link:`);
    console.log(`  ${resetUrl}`);
    console.log(`===================================================================\n`);

    return {
      success: true,
      mode: 'console_logged',
      resetUrl,
      notice: 'Email logged to server console (SMTP unconfigured)',
    };
  }
};
