const { v4: uuidv4 } = require('uuid');

/**
 * Generate a unique order ID like: LAG-2024-A3F7K9
 */
const generateOrderId = () => {
  const year = new Date().getFullYear();
  const suffix = uuidv4().replace(/-/g, '').substring(0, 6).toUpperCase();
  return `LAG-${year}-${suffix}`;
};

module.exports = { generateOrderId };
