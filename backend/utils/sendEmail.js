const nodemailer = require('nodemailer');

// Create transporter with Gmail SMTP
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Email templates
const emailTemplates = {
  approved: {
    subject: 'FoodShare - Account Approved! Welcome! 🎉',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: #28a745; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">FoodShare</h1>
          <p style="margin: 5px 0 0; font-size: 16px;">Account Approved!</p>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #28a745; margin-bottom: 20px;">Congratulations! 🎉</h2>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Dear <strong>{{name}}</strong>,
          </p>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Your FoodShare account has been <strong style="color: #28a745;">approved</strong>! You can now access your dashboard and start using our platform.
          </p>
          <div style="background-color: #e8f5e8; padding: 15px; border-left: 4px solid #28a745; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 14px;">
              <strong>Next Steps:</strong><br>
              1. Login to your account<br>
              2. Complete your profile<br>
              3. Start using FoodShare services
            </p>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <a href="{{loginUrl}}" style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Login to Dashboard
            </a>
          </div>
          <p style="font-size: 14px; color: #6c757d; margin-top: 30px; text-align: center;">
            Thank you for joining FoodShare! Together we can reduce food waste and help those in need.
          </p>
        </div>
        <div style="text-align: center; padding: 20px; font-size: 12px; color: #6c757d;">
          <p style="margin: 0;">© 2026 FoodShare. All rights reserved.</p>
          <p style="margin: 5px 0 0;">This is an automated email. Please do not reply.</p>
        </div>
      </div>
    `
  },
  
  rejected: {
    subject: 'FoodShare - Account Status Update',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: #dc3545; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">FoodShare</h1>
          <p style="margin: 5px 0 0; font-size: 16px;">Account Status Update</p>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #dc3545; margin-bottom: 20px;">Account Status Update</h2>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            Dear <strong>{{name}}</strong>,
          </p>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            We regret to inform you that your FoodShare account registration could not be <strong style="color: #dc3545;">approved</strong> at this time.
          </p>
          <div style="background-color: #f8d7da; padding: 15px; border-left: 4px solid #dc3545; margin-bottom: 20px;">
            <p style="margin: 0; font-size: 14px;">
              <strong>What to do next:</strong><br>
              • Please contact our support team for more information<br>
              • You can re-apply with updated documentation<br>
              • Review our terms and conditions
            </p>
          </div>
          <div style="text-align: center; margin-top: 30px;">
            <a href="{{supportUrl}}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Contact Support
            </a>
          </div>
          <p style="font-size: 14px; color: #6c757d; margin-top: 30px; text-align: center;">
            We appreciate your interest in FoodShare and wish you the best.
          </p>
        </div>
        <div style="text-align: center; padding: 20px; font-size: 12px; color: #6c757d;">
          <p style="margin: 0;">© 2026 FoodShare. All rights reserved.</p>
          <p style="margin: 5px 0 0;">This is an automated email. Please do not reply.</p>
        </div>
      </div>
    `
  },

  newDonation: {
    subject: 'FoodShare - New Food Donation Available! 🍽️',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
        <div style="background-color: #17a2b8; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">FoodShare</h1>
          <p style="margin: 5px 0 0; font-size: 16px;">New Donation Alert!</p>
        </div>
        <div style="background-color: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <h2 style="color: #17a2b8; margin-bottom: 20px;">New Food Donation Available! 🍽️</h2>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            A new food donation has been posted and is available for pickup/delivery!
          </p>
          
          <div style="background-color: #d1ecf1; padding: 20px; border-left: 4px solid #17a2b8; margin-bottom: 20px;">
            <h3 style="margin: 0 0 15px 0; color: #17a2b8;">Donation Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6; font-weight: bold;">Food Type:</td>
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">{{foodType}}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6; font-weight: bold;">Quantity:</td>
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">{{quantity}}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6; font-weight: bold;">Location:</td>
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">{{location}}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6; font-weight: bold;">Donor:</td>
                <td style="padding: 8px; border-bottom: 1px solid #dee2e6;">{{donorName}} ({{donorEmail}})</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Posted:</td>
                <td style="padding: 8px;">{{timestamp}}</td>
              </tr>
            </table>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="{{loginUrl}}" style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; display: inline-block;">
              Login to Accept Donation
            </a>
          </div>
          
          <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin-top: 20px;">
            <p style="margin: 0; font-size: 14px;">
              <strong>⚡ Quick Action:</strong> This donation is available on a first-come, first-served basis. Login immediately to secure it!
            </p>
          </div>
          
          <p style="font-size: 14px; color: #6c757d; margin-top: 30px; text-align: center;">
            Thank you for being part of the FoodShare community!
          </p>
        </div>
        <div style="text-align: center; padding: 20px; font-size: 12px; color: #6c757d;">
          <p style="margin: 0;">© 2026 FoodShare. All rights reserved.</p>
          <p style="margin: 5px 0 0;">This is an automated email. Please do not reply.</p>
        </div>
      </div>
    `
  }
};

// Send email function
const sendEmail = async (to, template, data = {}) => {
  try {
    // Get template
    const emailTemplate = emailTemplates[template];
    if (!emailTemplate) {
      throw new Error(`Email template '${template}' not found`);
    }

    // Replace placeholders with actual data
    let html = emailTemplate.html;
    Object.keys(data).forEach(key => {
      const placeholder = `{{${key}}}`;
      html = html.replace(new RegExp(placeholder, 'g'), data[key] || '');
    });

    // Send email
    const mailOptions = {
      from: `"FoodShare" <${process.env.EMAIL_USER}>`,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject: emailTemplate.subject,
      html: html
    };

    const result = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}: ${result.messageId}`);
    return { success: true, messageId: result.messageId };
    
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    return { success: false, error: error.message };
  }
};

// Test email configuration
const testEmailConfig = async () => {
  try {
    await transporter.verify();
    console.log('✅ Email service is configured and ready');
    return true;
  } catch (error) {
    console.error('❌ Email service configuration error:', error);
    return false;
  }
};

module.exports = {
  sendEmail,
  testEmailConfig,
  emailTemplates
};
