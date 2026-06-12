require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../server/models/User');
const connectDB = require('../server/config/db');
const { generateToken } = require('../server/middleware/auth');

async function testFullLoginFlow() {
  try {
    console.log('Connecting to database...');
    await connectDB();
    
    const email = process.env.ADMIN_EMAIL || 'admin@loharautogarage.com';
    const password = process.env.ADMIN_PASSWORD || 'Admin@Lohar2024!';
    
    console.log(`Finding user by email: ${email}`);
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      console.log('User not found!');
      process.exit(1);
    }
    
    console.log('Comparing password...');
    const isMatch = await user.comparePassword(password);
    console.log('Password match:', isMatch);
    if (!isMatch) {
      console.log('Password mismatch!');
      process.exit(1);
    }
    
    console.log('Updating lastLogin and saving user...');
    user.lastLogin = new Date();
    await user.save();
    console.log('User saved successfully.');
    
    console.log('Generating JWT token...');
    const token = generateToken(user._id);
    console.log('Generated token length:', token.length);
    console.log('Full login flow completed successfully without any errors.');
    
  } catch (err) {
    console.error('Error in login flow:', err);
  }
  process.exit(0);
}

testFullLoginFlow();
