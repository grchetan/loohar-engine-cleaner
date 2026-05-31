# Lohar Auto Garage — Full-Stack E-Commerce Platform

> **Professional Cleaning Solutions For Every Engine**  
> A complete e-commerce upgrade from static website to full-stack production platform.

---

## 🗂 Project Structure

```
Loohar Engine/
├── index.html              ← Main homepage (preserved + upgraded)
├── style.css               ← Brand stylesheet (preserved)
├── script.js               ← Homepage animations (preserved)
├── pages/                  ← New frontend pages
│   ├── auth.html           ← Login / Register / Forgot Password
│   ├── admin/
│   │   └── index.html      ← Admin dashboard
│   └── ...                 ← More pages
├── js/                     ← Frontend modules
│   ├── api.js              ← Centralized API client
│   ├── auth.js             ← Firebase Auth + JWT
│   ├── cart.js             ← Cart management
│   └── notifications.js    ← Toast system
├── css/
│   └── pages.css           ← Extended page styles
├── assets/images/          ← Product images
├── server/                 ← Node.js backend
│   ├── index.js            ← Express server entry
│   ├── config/             ← DB, Firebase, Razorpay
│   ├── models/             ← MongoDB schemas
│   ├── routes/             ← API routes
│   ├── middleware/         ← Auth, admin, upload
│   └── services/           ← Email, invoice
├── .env                    ← Environment variables (DO NOT COMMIT)
├── .env.example            ← Template for env vars
└── package.json
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- npm

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
```bash
# Copy the example file
copy .env.example .env

# Edit .env with your real values
notepad .env
```

**Required env vars for basic functionality:**
- `MONGODB_URI` — MongoDB connection string
- `JWT_SECRET` — Any long random string

### 3. Seed Database (First Time)
```bash
npm run seed
```
This creates the admin user + 4 products + sample coupons.

### 4. Start Development Server
```bash
npm run dev
```
Open: http://localhost:5000

---

## 🔑 Third-Party Services Setup

### MongoDB Atlas (Free)
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create free cluster → Connect → Get connection string
3. Set `MONGODB_URI` in `.env`

### Firebase Auth
1. [console.firebase.google.com](https://console.firebase.google.com) → New Project
2. Authentication → Enable **Email/Password** and **Google**
3. Project Settings → Service Accounts → Generate new private key
4. Copy values to `.env` Firebase section
5. Also copy client-side config values (apiKey, authDomain, etc.)

### Razorpay
1. Sign up at [razorpay.com](https://razorpay.com)
2. Dashboard → Settings → API Keys → Generate Test Key
3. Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `.env`

### Cloudinary (Image Upload)
1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Dashboard → API Keys
3. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`

### Gmail SMTP (Order Emails)
1. Enable 2-Step Verification on your Google Account
2. My Account → Security → App Passwords → Create
3. Set `EMAIL_USER` and `EMAIL_PASS` (use App Password, not real password)

---

## 📡 API Reference

| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| POST | `/api/auth/register` | Register user | Public |
| POST | `/api/auth/login` | Login | Public |
| POST | `/api/auth/firebase` | Google login | Public |
| GET | `/api/auth/me` | Get profile | User |
| GET | `/api/products` | List products | Public |
| POST | `/api/products` | Create product | Admin |
| GET | `/api/cart` | Get cart | Optional |
| POST | `/api/cart/add` | Add to cart | Optional |
| POST | `/api/payment/create-order` | Razorpay order | User |
| POST | `/api/payment/verify` | Verify payment | User |
| POST | `/api/payment/cod` | Place COD order | User |
| GET | `/api/orders` | Order history | User |
| GET | `/api/orders/:id` | Order detail | User |
| POST | `/api/orders/:id/cancel` | Cancel order | User |
| GET | `/api/orders/:id/invoice` | Download PDF | User |
| POST | `/api/coupons/validate` | Validate coupon | User |
| POST | `/api/dealer/inquiry` | Dealer inquiry | Public |
| GET | `/api/admin/dashboard` | Admin stats | Admin |
| GET | `/api/orders/admin/all` | All orders | Admin |
| PUT | `/api/orders/:id/status` | Update status | Admin |

---

## 🛒 Sample Coupons (after seed)

| Code | Discount | Min Order |
|------|----------|-----------|
| `WELCOME10` | 10% off | ₹200 |
| `LOHAR20` | 20% off | ₹500 |
| `FLAT50` | ₹50 off | ₹300 |
| `FREESHIP` | Free shipping | Any |

---

## 👤 Admin Access

After running `npm run seed`:
- URL: `http://localhost:5000/pages/admin/`
- Email: `admin@loharautogarage.com`
- Password: `Admin@Lohar2024!`

---

## 🌐 Deployment (Render.com)

1. Create account at [render.com](https://render.com)
2. New → Web Service → Connect your GitHub repo
3. **Build Command**: `npm install`
4. **Start Command**: `node server/index.js`
5. Add all `.env` variables in Render → Environment
6. MongoDB: Use Atlas connection string
7. Set `NODE_ENV=production` and `FRONTEND_URL=https://your-app.onrender.com`

---

## 🔒 Security Features

- ✅ JWT authentication (httpOnly cookies)
- ✅ Role-based access control (customer / admin)
- ✅ Rate limiting (200 req/15min global, 15 req/15min auth)
- ✅ Helmet security headers
- ✅ HTTP parameter pollution prevention (HPP)
- ✅ Input validation (express-validator)
- ✅ CORS whitelist
- ✅ Password hashing (bcrypt, 12 rounds)
- ✅ Razorpay HMAC signature verification
- ✅ Image upload validation (type + size)

---

## 🐛 Known Placeholders to Fill

Before going live, update these in `index.html` and `.env`:

- [ ] Real phone number (replace `+91 99999 99999`)
- [ ] Real WhatsApp number (replace `919999999999`)
- [ ] Real address in contact section
- [ ] Real Google Maps link/embed
- [ ] Instagram and Facebook profile links in footer
- [ ] Real Flipkart/Meesho product page links
- [ ] Product IDs in `index.html` Add to Cart buttons (after seeding DB, use real MongoDB IDs)
- [ ] Firebase configuration values
- [ ] Razorpay live keys (for production)
- [ ] Cloudinary credentials

---

## 📦 Dependencies

```json
{
  "express": "Web framework",
  "mongoose": "MongoDB ODM",
  "firebase-admin": "Firebase Admin SDK",
  "razorpay": "Payment gateway",
  "nodemailer": "Email sending",
  "pdfkit": "PDF invoice generation",
  "bcryptjs": "Password hashing",
  "jsonwebtoken": "JWT tokens",
  "multer": "File uploads",
  "cloudinary": "Image hosting",
  "helmet": "Security headers",
  "cors": "Cross-origin requests",
  "express-rate-limit": "Rate limiting",
  "express-validator": "Input validation",
  "hpp": "Parameter pollution prevention",
  "morgan": "Request logging"
}
```

---

*Built for Lohar Auto Garage — Professional Cleaning Solutions For Every Engine 🇮🇳*
