const Razorpay = require('razorpay');

let razorpayInstance;

const getRazorpay = () => {
  if (razorpayInstance) return razorpayInstance;

  if (
    !process.env.RAZORPAY_KEY_ID ||
    !process.env.RAZORPAY_KEY_SECRET ||
    process.env.RAZORPAY_KEY_ID.includes('XXXX')
  ) {
    console.warn('⚠️  Razorpay not configured - COD only mode');
    return null;
  }

  razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
  console.log('✅ Razorpay initialized');
  return razorpayInstance;
};

module.exports = { getRazorpay };
