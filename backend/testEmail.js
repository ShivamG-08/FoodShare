const { sendEmail, testEmailConfig } = require('./utils/sendEmail');

async function testEmailSystem() {
  console.log('🔧 Testing Email Configuration...\n');
  
  // Check environment variables
  console.log('📧 Email Configuration:');
  console.log('EMAIL_USER:', process.env.EMAIL_USER || 'NOT SET');
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS ? '***SET***' : 'NOT SET');
  console.log('');
  
  // Test email service configuration
  const isConfigured = await testEmailConfig();
  if (!isConfigured) {
    console.log('❌ Email service not configured properly');
    console.log('💡 Please set EMAIL_USER and EMAIL_PASS in .env file');
    return;
  }
  
  // Test sending email
  console.log('📤 Testing email sending...');
  const testEmail = 'test@example.com'; // Replace with actual email for testing
  
  const result = await sendEmail(testEmail, 'approved', {
    name: 'Test User',
    loginUrl: 'http://localhost:3000/login'
  });
  
  if (result.success) {
    console.log('✅ Test email sent successfully!');
    console.log('📧 Message ID:', result.messageId);
  } else {
    console.log('❌ Test email failed:', result.error);
  }
}

testEmailSystem().catch(console.error);
