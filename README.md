# FASHION WORLD — Premium Fashion E-Commerce Platform

A $100,000-grade, production-ready luxury fashion e-commerce application with a full consumer storefront and agent (admin) dashboard.

---

## 📦 Tech Stack

| Layer           | Technology                                             |
|-----------------|--------------------------------------------------------|
| Frontend        | Vite + React 18 + TypeScript                          |
| Styling         | Tailwind CSS + shadcn/ui (Radix UI)                   |
| Backend         | Node.js + Express + TypeScript                        |
| Database        | MongoDB + Mongoose                                    |
| Authentication  | JWT + bcrypt + HTTP-only cookies                      |
| File Uploads    | Cloudinary (local /public fallback for demo)          |
| State           | Zustand (cart, auth) + React Query                    |
| Payments        | Stripe + M-Pesa STK Push simulation                   |
| Email           | Nodemailer (console simulation)                       |
| PWA             | Vite PWA plugin                                       |

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or MongoDB Atlas)
- Git

### 1. Clone & Install

```bash
git clone https://github.com/yourorg/fashion-world.git
cd fashion-world

# Install backend deps
cd backend && npm install

# Install frontend deps
cd ../frontend && npm install
```

### 2. Configure Environment

**Backend** — copy and fill:
```bash
cd backend
cp .env.example .env
```

Edit `backend/.env`:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fashion-world
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
MPESA_CONSUMER_KEY=your_mpesa_key
MPESA_CONSUMER_SECRET=your_mpesa_secret
MPESA_SHORTCODE=174379
MPESA_PASSKEY=your_passkey
MPESA_CALLBACK_URL=https://yourdomain.com/api/payments/mpesa/callback
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@email.com
EMAIL_PASS=your_app_password
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
AGENT_INVITE_CODE=AGENT2026
```

**Frontend** — copy and fill:
```bash
cd frontend
cp .env.example .env
```

Edit `frontend/.env`:
```
VITE_API_URL=http://localhost:5000/api
VITE_STRIPE_PUBLIC_KEY=pk_test_...
VITE_GTM_ID=GTM-XXXXXXX
```

### 3. Seed Demo Data

```bash
cd backend
npm run seed
```

This seeds:
- 5 consumer accounts + 5 agent accounts
- 24 products across all categories
- 5 brand logos
- 3 hero banners
- 6 testimonials
- 10 sample orders

**Demo Credentials:**
| Role     | Email                    | Password    |
|----------|--------------------------|-------------|
| Consumer | alice@example.com        | Password123 |
| Consumer | bob@example.com          | Password123 |
| Agent    | admin@fashionworld.com      | Admin123!   |
| Agent    | manager@fashionworld.com    | Admin123!   |

**Agent Invite Code:** `AGENT2026`

### 4. Run Development

```bash
# Terminal 1 – Backend
cd backend && npm run dev

# Terminal 2 – Frontend
cd frontend && npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5000/api
- API Health: http://localhost:5000/api/health

---

## 🗂️ Project Structure

```
fashion-world/
├── backend/
│   ├── src/
│   │   ├── index.ts            # Entry point
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── products.ts
│   │   │   ├── orders.ts
│   │   │   ├── banners.ts
│   │   │   └── customers.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Product.ts
│   │   │   ├── Order.ts
│   │   │   └── Banner.ts
│   │   └── middleware/
│   │       ├── auth.ts
│   │       └── upload.ts
│   ├── seed.ts
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Header.tsx
    │   │   ├── Footer.tsx
    │   │   ├── BannerCarousel.tsx
    │   │   ├── ProductCard.tsx
    │   │   ├── CartDrawer.tsx
    │   │   └── Testimonials.tsx
    │   ├── pages/
    │   │   ├── Home.tsx
    │   │   ├── Shop.tsx
    │   │   ├── ProductDetail.tsx
    │   │   ├── Cart.tsx
    │   │   ├── Checkout.tsx
    │   │   ├── account/
    │   │   │   ├── Login.tsx
    │   │   │   └── Register.tsx
    │   │   └── dashboard/
    │   │       ├── Overview.tsx
    │   │       ├── Orders.tsx
    │   │       ├── Products.tsx
    │   │       ├── Banners.tsx
    │   │       └── Customers.tsx
    │   ├── store/
    │   │   ├── cartStore.ts
    │   │   └── authStore.ts
    │   ├── lib/
    │   │   └── api.ts
    │   └── styles/
    │       └── globals.css
    ├── package.json
    └── .env.example
```

---

## 🔐 Security Notes

- JWT tokens stored in **HTTP-only cookies** (XSS-safe)
- Passwords hashed with **bcrypt** (12 rounds)
- **Rate limiting**: 100 req/15min general, 5 req/15min for auth
- **Helmet.js** for security headers (CSP, HSTS, X-Frame-Options)
- Input sanitization via **express-validator**
- CORS restricted to `FRONTEND_URL`
- File uploads: type & size validation, virus-scan hook (Cloudinary)
- Agent routes protected by `role: "agent"` middleware

---

## 🌍 Deployment

### Frontend → Vercel
```bash
cd frontend
npm run build
vercel deploy --prod
```
Set env vars in Vercel dashboard.

### Backend → Render
1. Create a new **Web Service** on render.com
2. Connect your GitHub repo, set root to `/backend`
3. Build command: `npm install && npm run build`
4. Start command: `npm start`
5. Add all env vars from `.env.example`

### Database → MongoDB Atlas
1. Create free cluster at mongodb.com/atlas
2. Whitelist `0.0.0.0/0` for Render IPs
3. Replace `MONGODB_URI` with Atlas connection string

### File Storage → Cloudinary
1. Sign up at cloudinary.com (free tier: 25GB)
2. Add Cloud Name, API Key, API Secret to backend env

---

## 📊 Performance Targets
- LCP < 2.5s
- CLS < 0.1
- Images: WebP, lazy-loaded, srcset
- Code splitting via dynamic imports
- CDN-ready static assets

## ♿ Accessibility
- WCAG 2.1 AA compliant
- All interactive elements keyboard navigable
- `aria-label` on all icon buttons
- Color contrast ratios ≥ 4.5:1
- Focus visible indicators

## 📱 PWA
- Service worker with offline fallback
- Installable on mobile (Add to Home Screen)
- App manifest with icons

---

## 🧪 Testing (extend as needed)
```bash
cd backend && npm test
cd frontend && npm test
```

---

## 📄 License
MIT — Built for demonstration purposes. Replace all API keys before production use.
