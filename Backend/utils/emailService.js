const nodemailer = require('nodemailer');

const isMailConfigured = !!(
  process.env.SMTP_HOST &&
  process.env.SMTP_PORT &&
  process.env.SMTP_USER &&
  process.env.SMTP_PASS
);

const sendEmail = async (options) => {
  if (isMailConfigured) {
    // Create reusable transporter object using the default SMTP transport
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const message = {
      from: `${process.env.FROM_EMAIL || 'noreply@apexcart.com'}`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html,
    };

    const info = await transporter.sendMail(message);
    console.log('Email sent successfully: %s', info.messageId);
    return info;
  } else {
    // Elegant fallback: Log email content to the console
    console.log('\n=================== MOCK EMAIL SERVICE ===================');
    console.log(`To:      ${options.email}`);
    console.log(`Subject: ${options.subject}`);
    console.log(`Body:\n${options.message || options.html}`);
    console.log('==========================================================\n');
    return { mock: true, messageId: 'mock-email-id-' + Date.now() };
  }
};

module.exports = sendEmail;
