const fs = require('fs');
const path = require('path');

const pagesDir = path.join(__dirname, '..', 'pages');

const replacements = [
  { from: 'href="/"', to: 'href="../index.html"' },
  { from: 'href="/#about"', to: 'href="../index.html#about"' },
  { from: 'href="/#contact"', to: 'href="../index.html#contact"' },
  { from: 'href="/#dealer"', to: 'href="../index.html#dealer"' },
  { from: 'href="/#results"', to: 'href="../index.html#results"' },
  { from: 'href="/pages/products.html"', to: 'href="products.html"' },
  { from: 'href="/pages/auth.html"', to: 'href="auth.html"' },
  { from: 'href="/pages/checkout.html"', to: 'href="checkout.html"' },
  { from: 'href="/pages/profile.html"', to: 'href="profile.html"' },
  { from: 'href="/pages/orders.html"', to: 'href="orders.html"' },
  { from: 'href="/pages/wishlist.html"', to: 'href="wishlist.html"' },
];

const fixFile = (filePath) => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  replacements.forEach((r) => {
    // Replace both double quotes and single quotes occurrences
    const regex1 = new RegExp(r.from, 'g');
    content = content.replace(regex1, r.to);

    const singleQuoteFrom = r.from.replace(/"/g, "'");
    const singleQuoteTo = r.to.replace(/"/g, "'");
    const regex2 = new RegExp(singleQuoteFrom, 'g');
    content = content.replace(regex2, singleQuoteTo);
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed links in: ${path.basename(filePath)}`);
  }
};

const walk = (dir) => {
  const files = fs.readdirSync(dir);
  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'admin') {
        walk(filePath);
      }
    } else if (filePath.endsWith('.html')) {
      fixFile(filePath);
    }
  });
};

console.log('Starting navigation links fix...');
walk(pagesDir);
console.log('Navigation links fix completed successfully!');
