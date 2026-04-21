const nodemailer = require('nodemailer');

// Create a transporter using Gmail (you can configure this for your email service)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'foodshare.notification@gmail.com', // Replace with your email
    pass: process.env.EMAIL_PASS || 'your-app-password' // Replace with your email password/app password
  }
});

// Email templates
const emailTemplates = {
  approved: {
    subject: 'FoodShare - Account Approved! Welcome!',
    html: (userName) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">FoodShare</h1>
          <p style="margin: 5px 0 0 0;">Connecting Surplus Food with Those in Need</p>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
          <h2 style="color: #10b981; margin: 0 0 20px 0;">Congratulations! Your Account Has Been Approved</h2>
          <p style="color: #374151; line-height: 1.6;">Dear <strong>${userName}</strong>,</p>
          <p style="color: #374151; line-height: 1.6;">Great news! Your FoodShare account has been approved and is now active. You can now log in and start using our platform to make a difference in your community.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #10b981;">
            <h3 style="color: #2563eb; margin: 0 0 10px 0;">What You Can Do Now:</h3>
            <ul style="color: #374151; line-height: 1.8; margin: 0;">
              <li>Log in to your FoodShare dashboard</li>
              <li>Start donating or receiving food</li>
              <li>Connect with your local community</li>
              <li>Help reduce food waste</li>
            </ul>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:3000/login" style="background: #2563eb; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block; font-weight: bold;">
              Log In Now
            </a>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin: 30px 0 0 0;">Thank you for joining FoodShare and helping us create a more sustainable future!</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
          <p>© 2024 FoodShare. All rights reserved.</p>
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `
  },
  rejected: {
    subject: 'FoodShare - Account Status Update',
    html: (userName) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0;">FoodShare</h1>
          <p style="margin: 5px 0 0 0;">Connecting Surplus Food with Those in Need</p>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e5e7eb;">
          <h2 style="color: #dc2626; margin: 0 0 20px 0;">Account Status Update</h2>
          <p style="color: #374151; line-height: 1.6;">Dear <strong>${userName}</strong>,</p>
          <p style="color: #374151; line-height: 1.6;">We regret to inform you that your FoodShare account registration could not be approved at this time.</p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="color: #dc2626; margin: 0 0 10px 0;">Next Steps:</h3>
            <ul style="color: #374151; line-height: 1.8; margin: 0;">
              <li>Please contact our support team for more information</li>
              <li>You may need to provide additional verification documents</li>
              <li>Review our registration requirements and try again</li>
            </ul>
          </div>
          <div style="background: #fef3c7; padding: 15px; border-radius: 6px; margin: 20px 0; border-left: 4px solid #f59e0b;">
            <p style="color: #92400e; margin: 0;"><strong>Contact Support:</strong> foodshare.support@example.com</p>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin: 30px 0 0 0;">We appreciate your interest in FoodShare and hope to assist you further.</p>
        </div>
        <div style="text-align: center; padding: 20px; color: #6b7280; font-size: 12px;">
          <p>© 2024 FoodShare. All rights reserved.</p>
          <p>This is an automated message. Please do not reply to this email.</p>
        </div>
      </div>
    `
  }
};

// Send email function
const sendEmail = async (to, template, userName) => {
  try {
    const emailConfig = emailTemplates[template];
    if (!emailConfig) {
      throw new Error('Invalid email template');
    }

    const mailOptions = {
      from: process.env.EMAIL_USER || 'foodshare.notification@gmail.com',
      to: to,
      subject: emailConfig.subject,
      html: emailConfig.html(userName)
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('Email server is ready to send messages');
    return true;
  } catch (error) {
    console.error('Email server configuration error:', error);
    return false;
  }
};

module.exports = {
  sendEmail,
  testEmailConfig,
  emailTemplates
};
