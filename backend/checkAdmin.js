const User = require('./models/User');

async function checkAdminCredentials() {
  console.log('🔍 Checking admin credentials...\n');
  
  try {
    // Find admin user
    const adminUser = await User.findOne({ role: 'admin' });
    
    if (adminUser) {
      console.log('✅ Admin account found:');
      console.log('📧 Email:', adminUser.email);
      console.log('📧 Name:', adminUser.name);
      console.log('📧 Status:', adminUser.status);
      console.log('📧 Custom ID:', adminUser.customId);
      console.log('📧 Created:', adminUser.createdAt);
      
      // Check if password matches (for verification)
      console.log('\n💡 To test admin login:');
      console.log('📧 Use email:', adminUser.email);
      console.log('📧 Use password: [your current admin password]');
      console.log('📧 Admin login URL: http://localhost:3000/admin-login');
      
    } else {
      console.log('❌ No admin account found in database');
      console.log('💡 Admin account should be created automatically on server start');
    }
    
    // List all users for debugging
    const allUsers = await User.find({});
    console.log('\n📊 All users in database:');
    console.log('Total users:', allUsers.length);
    
    allUsers.forEach(user => {
      console.log(`- ${user.name} (${user.role}) - ${user.email} - Status: ${user.status}`);
    });
    
  } catch (error) {
    console.error('❌ Error checking admin credentials:', error);
  }
  
  process.exit(0);
}

checkAdminCredentials();
