require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('../config/db');

const User = require('../models/User');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');

const seed = async () => {
  await connectDB();
  console.log('🌱 Starting database seed...\n');

  // ---- Admin User ----
  const adminExists = await User.findOne({ email: process.env.ADMIN_EMAIL });
  if (!adminExists) {
    await User.create({
      name: 'Lohar Admin',
      email: process.env.ADMIN_EMAIL || 'admin@loharautogarage.com',
      password: process.env.ADMIN_PASSWORD || 'Admin123!',
      role: 'admin',
      phone: '+919999999999',
    });
    console.log('✅ Admin user created');
  } else {
    console.log('ℹ️  Admin user already exists');
  }

  // ---- Products ----
  const products = [
    {
      name: 'Lohar Engine Degreaser',
      slug: 'lohar-engine-degreaser',
      category: 'Engine Care',
      description: 'Our flagship product — a heavy-duty engine degreaser that cuts through the toughest grease, oil and carbon deposits in minutes. Trusted by garages and mechanics across India.',
      features: [
        'Removes heavy grease & engine oil deposits',
        'Quick cleaning action — works in minutes',
        'Suitable for bikes, cars & trucks',
        'Professional garage quality',
        'Easy spray application',
        'Biodegradable & safer formulation',
      ],
      howToUse: 'Spray on engine surface, wait 2–3 minutes, rinse with water. For heavy deposits, apply and agitate with a brush before rinsing.',
      price: 349,
      mrp: 499,
      stock: 500,
      sku: 'LAG-ED-001',
      hsn: '3402',
      weight: 0.5,
      tags: ['engine', 'degreaser', 'cleaning', 'grease', 'oil'],
      isFeatured: true,
      isBestseller: true,
      images: ['/assets/images/hero_bottle.png'],
    },
    {
      name: 'Lohar Engine Cleaner',
      slug: 'lohar-engine-cleaner',
      category: 'Engine Care',
      description: 'A powerful solvent-based engine cleaner that dissolves oil residue and restores engine surfaces to like-new condition. Safe on all engine metals.',
      features: [
        'Deep penetrating formula',
        'Removes oil residue & deposits',
        'Safe on engine metals & gaskets',
        'Professional & DIY friendly',
        'Fast action formula',
      ],
      howToUse: 'Apply to engine surfaces, allow 5 minutes to penetrate, then wipe or rinse clean.',
      price: 299,
      mrp: 399,
      stock: 350,
      sku: 'LAG-EC-002',
      hsn: '3402',
      weight: 0.5,
      tags: ['engine', 'cleaner', 'oil', 'degreaser'],
      isFeatured: true,
      images: ['/assets/images/engine_cleaner.png'],
    },
    {
      name: 'Lohar Tyre Shine',
      slug: 'lohar-tyre-shine',
      category: 'Exterior Care',
      description: 'Give tyres a deep black, glossy finish. Our tyre shine formula also protects rubber from cracking and UV damage. Long-lasting results.',
      features: [
        'Long-lasting gloss finish',
        'UV & cracking protection',
        'Suitable for all tyre types',
        'Quick & easy application',
        'Water-resistant formula',
      ],
      howToUse: 'Clean tyre surface first. Spray or apply with applicator, spread evenly and allow to dry for 2 minutes.',
      price: 249,
      mrp: 349,
      stock: 400,
      sku: 'LAG-TS-003',
      hsn: '3405',
      weight: 0.4,
      tags: ['tyre', 'shine', 'rubber', 'exterior', 'care'],
      images: ['/assets/images/tyre_cleaner.png'],
    },
    {
      name: 'Lohar Interior Cleaner',
      slug: 'lohar-interior-cleaner',
      category: 'Interior Care',
      description: 'A gentle yet effective multi-surface interior cleaner for dashboards, seats and plastic trims. Anti-static formula leaves a fresh, clean finish without residue.',
      features: [
        'Safe on all interior surfaces',
        'Anti-static formula',
        'Fresh long-lasting fragrance',
        'No residue formula',
        'Dashboard, seat & trim safe',
      ],
      howToUse: 'Spray on surface, wipe with clean microfiber cloth. No rinsing required.',
      price: 279,
      mrp: 399,
      stock: 300,
      sku: 'LAG-IC-004',
      hsn: '3402',
      weight: 0.4,
      tags: ['interior', 'dashboard', 'cleaner', 'car', 'inside'],
      images: ['/assets/images/dashboard_cleaner.png'],
    },
    {
      name: 'Lohar Glass Cleaner',
      slug: 'lohar-glass-cleaner',
      category: 'Exterior Care',
      description: 'Get crystal clear visibility with our premium Lohar Glass Cleaner. Specially formulated to remove road grime, bug splatter, and water spots without leaving streaks. Safe for all tinted windows.',
      features: [
        'Crystal clear glass visibility',
        'Streak-free professional finish',
        'Removes tough bug splatter & grime',
        'Safe on tinted windows',
        'Water repellent action',
      ],
      howToUse: 'Spray directly on glass, wipe with a clean microfiber cloth, then buff with a dry side for a streak-free shine.',
      price: 199,
      mrp: 299,
      stock: 450,
      sku: 'LAG-GC-005',
      hsn: '3402',
      weight: 0.5,
      tags: ['glass', 'window', 'cleaner', 'streak-free', 'exterior'],
      images: ['/assets/images/tyre_cleaner.png'],
    },
    {
      name: 'Lohar Scratch Remover',
      slug: 'lohar-scratch-remover',
      category: 'Exterior Care',
      description: "Easily remove surface scratches, swirl marks, and minor paint blemishes with Lohar Scratch Remover. Restores your car's paint finish to its original gloss.",
      features: [
        'Removes paint scratches & swirls',
        'Restores paint color & gloss',
        'Safe on all clear coat finishes',
        'Hand or machine application friendly',
        'Micro-abrasive technology',
      ],
      howToUse: 'Apply a small amount on a soft applicator pad, rub gently in circular motions over scratch, allow to dry slightly, then buff clean with microfiber.',
      price: 399,
      mrp: 599,
      stock: 250,
      sku: 'LAG-SR-006',
      hsn: '3405',
      weight: 0.3,
      tags: ['scratch', 'remover', 'paint', 'polish', 'exterior'],
      images: ['/assets/images/dashboard_cleaner.png'],
    },
  ];

  for (const p of products) {
    const exists = await Product.findOne({ slug: p.slug });
    if (!exists) {
      await Product.create(p);
      console.log(`✅ Product created: ${p.name}`);
    } else {
      console.log(`ℹ️  Product already exists: ${p.name}`);
    }
  }

  // Set related products
  const [degreaser, cleaner, tyre, interior, glass, scratch] = await Promise.all(
    ['lohar-engine-degreaser', 'lohar-engine-cleaner', 'lohar-tyre-shine', 'lohar-interior-cleaner', 'lohar-glass-cleaner', 'lohar-scratch-remover']
      .map(slug => Product.findOne({ slug }))
  );

  if (degreaser && cleaner && tyre && interior && glass && scratch) {
    degreaser.relatedProducts = [cleaner._id, tyre._id, interior._id];
    cleaner.relatedProducts = [degreaser._id, tyre._id, interior._id];
    tyre.relatedProducts = [degreaser._id, cleaner._id, glass._id];
    interior.relatedProducts = [degreaser._id, cleaner._id, scratch._id];
    glass.relatedProducts = [tyre._id, scratch._id, degreaser._id];
    scratch.relatedProducts = [tyre._id, glass._id, interior._id];
    
    await Promise.all([
      degreaser.save(),
      cleaner.save(),
      tyre.save(),
      interior.save(),
      glass.save(),
      scratch.save()
    ]);
    console.log('✅ Related products linked');
  }

  // ---- Coupons ----
  const coupons = [
    { code: 'WELCOME10', discountType: 'percent', value: 10, description: 'Welcome discount - 10% off', minOrderAmount: 200, maxUses: 1000 },
    { code: 'LOHAR20', discountType: 'percent', value: 20, description: '20% off on orders above ₹500', minOrderAmount: 500, maxUses: 500 },
    { code: 'FLAT50', discountType: 'flat', value: 50, description: '₹50 off on orders above ₹300', minOrderAmount: 300, maxUses: 200 },
    { code: 'FREESHIP', discountType: 'flat', value: 60, description: 'Free shipping coupon', minOrderAmount: 0, maxUses: 300 },
  ];

  for (const c of coupons) {
    const exists = await Coupon.findOne({ code: c.code });
    if (!exists) {
      await Coupon.create(c);
      console.log(`✅ Coupon created: ${c.code}`);
    }
  }

  console.log('\n🎉 Database seeded successfully!');
  console.log('\nAdmin credentials:');
  console.log(`  Email: ${process.env.ADMIN_EMAIL || 'admin@loharautogarage.com'}`);
  console.log(`  Password: ${process.env.ADMIN_PASSWORD || 'Admin123!'}`);
  console.log('\n💡 Sample coupons: WELCOME10, LOHAR20, FLAT50, FREESHIP\n');
  process.exit(0);
};

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
