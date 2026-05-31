const fs = require('fs');
const path = require('path');
const Product = require('../models/Product');

const generateSitemap = async (domain = 'https://loharautogarage.com') => {
  try {
    const products = await Product.find({ isActive: true }).select('slug updatedAt');
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Static Pages -->
  <url>
    <loc>${domain}/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${domain}/pages/products.html</loc>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${domain}/pages/auth.html</loc>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
`;

    // Dynamic Product Pages
    for (const p of products) {
      const lastMod = p.updatedAt ? new Date(p.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
      xml += `  <url>
    <loc>${domain}/pages/product-detail.html?slug=${p.slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
`;
    }

    xml += `</urlset>`;

    // Save to root directory
    const destPath = path.join(__dirname, '../..', 'sitemap.xml');
    fs.writeFileSync(destPath, xml, 'utf8');
    console.log(`✅ Sitemap successfully generated at: ${destPath}`);
    return xml;
  } catch (err) {
    console.error('❌ Failed to generate sitemap:', err.message);
    throw err;
  }
};

module.exports = { generateSitemap };
