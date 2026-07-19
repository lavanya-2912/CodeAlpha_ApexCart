# ApexCart - Full Stack Premium E-Commerce Application

ApexCart is a high-performance, responsive, full-stack e-commerce web application. Built with **Node.js, Express.js, MongoDB (Mongoose)** on the backend, and a reactive **Vanilla JavaScript Single Page Application (SPA)** framework on the frontend.

---

## Key Features

### 🛍️ Customer Experience
- **Fluid Router:** Fast client-side hash routing matching parameterized page links seamlessly.
- **Dynamic Catalog Filters:** Refine by price boundaries, star ratings, categories, brand tags, and availability.
- **Instant Search:** Dynamic query matching with search terms memory.
- **Interactive Cart & Wishlist:** Real-time quantity adjustments, saved-for-later queues, and coupon validation (`SAVE10`).
- **Order timelines:** Custom progressive checkmarks tracking order statuses.
- **Stripe & COD:** Integrated credit card checkouts and cash-on-delivery.
- **Invoice PDF downloads:** Automatic professional layout drawings generated on the fly.
- **Notifications Hub:** Dynamic push messages regarding order statuses.

### 🛡️ Security & Performance
- **Headers Protection:** `helmet` locks down content sources and iframe bounds.
- **Rate Limiter:** Limits endpoint queries to block brute-force scripts.
- **Injection Sanitization:** Sanitizes inputs to prevent NoSQL and XSS injections.
- **Token Authorization:** JWT encryption utilizing secured cookie and header checks.
- **Compression:** GZip response streams compress data transfers.
- **Visual Skeletons:** Pulse placeholders cover loading states cleanly.

### 📊 Administrative Panel
- **Charts Integration:** Displays analytical Canvas charts (`Chart.js`) showing category revenues and order statistics.
- **Product CRUD:** Full CRUD operations supporting multipart form image uploads and key-value technical specifications maps.
- **Category & Brand Management:** Create, delete, and list catalog groupings.
- **Orders Registry:** Track placed orders and adjust tracking progress.
- **Coupon Manager:** Create and configure active promo codes.
- **User Settings:** Account promote and deactivate triggers.

---

## Technology Stack

- **Frontend:** HTML5, CSS3, JavaScript (ES6+ Modules), Bootstrap 5, Chart.js, Fetch API.
- **Backend:** Node.js, Express.js, Mongoose (MongoDB).
- **Security:** Helmet, Express Rate Limit, bcryptjs, JSON Web Tokens (JWT).
- **Utilities:** Multer (image uploads), Cloudinary (optional cloud storage), Nodemailer (emails), PDFKit (invoice printing).

---

## Directory Structure

```
CodeAlpha_ApexCart/
├── Client/                     # Frontend SPA code
│   ├── index.html              # Main HTML entry
│   ├── css/                    # Custom themes & animations
│   │   └── styles.css
│   ├── js/                     # JS Modules
│   │   ├── app.js              # Routing & boots
│   │   ├── state.js            # Subscriber state
│   │   ├── components/         # Common UI objects (Navbar, Cards, Skeletons)
│   │   ├── pages/              # View renderers (Landing, Shop, Dashboards)
│   │   └── services/           # Fetch API network handlers
│   └── assets/                 # Local images & logos
├── Backend/                    # Backend server code
│   ├── app.js                  # Express middleware setup
│   ├── server.js               # Port listener & DB startup
│   ├── config/                 # DB & Cloudinary configuration
│   ├── models/                 # Mongoose collection schemas
│   ├── controllers/            # Route controllers logic
│   ├── routes/                 # REST endpoints mappings
│   ├── middlewares/            # Auth guards, errors, upload parsers
│   ├── utils/                  # Seeder, mailing, and PDF generators
│   └── uploads/                # Local uploads fallback directory
├── package.json
├── .env.example
└── README.md
```

---

## Installation & Startup

### 1. Prerequisite
- **Node.js** (v18.0.0 or higher recommended)
- **MongoDB** running locally (`mongodb://127.0.0.1:27017/apexcart`)

### 2. Install Packages
Navigate to the root directory and install dependencies:
```bash
npm install
```

### 3. Setup Configuration
Copy `.env.example` into a new `.env` file and customize parameters if needed:
```bash
cp .env.example .env
```
*(Note: Cloudinary, Stripe, and Mail credentials are optional. If left blank, the app runs gracefully with simulated local storage and payment fallbacks.)*

### 4. Seed Database
Purge and populate your database with categories, brands, products, coupons, and test users:
```bash
npm run seed
```

### 5. Launch Application
Start the development server:
```bash
npm run dev
```
Navigate to **[http://localhost:5000](http://localhost:5000)** in your browser.

---

## Default User Accounts

Use these pre-loaded accounts to test user interfaces:

| Role | Username / Email | Password | Features |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@apexcart.com` | `adminpassword` | Full Admin CRUD, user promotions, analytical graphs |
| **Customer** | `john@gmail.com` | `password123` | Cart, wishlist, profile uploads, orders timeline |
