const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// MongoDB connection
const MONGO_URL = 'mongodb://127.0.0.1:27017/rapid_capsule?directConnection=true';

// New password to set
const NEW_PASSWORD = 'Admin@123';

async function resetAdminPassword() {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGO_URL);
    console.log('Connected to MongoDB');

    // Hash the new password
    const hashedPassword = await bcrypt.hash(NEW_PASSWORD, 10);
    console.log('Password hashed successfully');

    // Update admin user password
    const result = await mongoose.connection.db.collection('admins').updateOne(
      { email: 'admin@rapidcapsule.com' },
      { $set: { password: hashedPassword, updated_at: new Date() } }
    );

    if (result.modifiedCount > 0) {
      console.log('\n✅ Admin password reset successfully!');
      console.log('\nAdmin Login Credentials:');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('Email:    admin@rapidcapsule.com');
      console.log('Password: Admin@123');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } else {
      console.log('❌ No admin user found or password already set');
    }

    // Close connection
    await mongoose.connection.close();
    console.log('Connection closed');
  } catch (error) {
    console.error('Error resetting password:', error);
    process.exit(1);
  }
}

resetAdminPassword();
