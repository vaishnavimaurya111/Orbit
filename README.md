# SubscriptIQ 🚀

> **Smart Subscription Management & Recurring Billing Platform**  
> A production-grade full-stack SaaS application built for the **Orbit Hackathon**.

---

## ✨ Features

- 🔐 **JWT Authentication** with 3 roles: Admin, Staff, Customer
- 📦 **Product & Plan Management** with variants and pricing
- 👥 **Customer CRM** with full profile and history
- 📄 **Quotation Workflow** → Convert to Subscription
- ⚡ **Subscription Lifecycle** — Draft → Confirmed → Active → Paused → Closed
- 🤖 **Automated Billing Engine** — daily cron job generates invoices automatically
- 📃 **Invoice Management** with full print view
- 💳 **Payment Recording** — cash, UPI, bank transfer, card, cheque
- 💰 **Tax & Discount Rules** with flexible configuration
- 📊 **Analytics Dashboard** — MRR, ARR, revenue charts, subscription status breakdown
- 📈 **Reports** — revenue, subscriptions, customer growth, outstanding with CSV export
- 🧑‍💻 **Customer Portal** — self-service view of subscriptions, invoices, payment history

---

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Router v6, Recharts, Lucide React, Axios |
| Backend | Node.js, Express.js, REST API, JWT, bcrypt, node-cron |
| Database | PostgreSQL (direct SQL via `pg` pool, no ORM) |

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js 18+
- PostgreSQL (or a cloud PostgreSQL connection string)

### 2. Database Setup
```bash
# Run the schema
psql -U postgres -d your_database < database/schema.sql

# Load seed data (demo accounts + sample data)
psql -U postgres -d your_database < database/seed.sql
```

### 3. Backend Setup
```bash
cd backend
npm install

# Copy and fill in the environment file
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET

npm run dev
```

### 4. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

Frontend: http://localhost:5173  
Backend API: http://localhost:5000/api

---

## 🔑 Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@subscriptiq.com | password |
| Staff | staff@subscriptiq.com | password |
| Customer | customer1@example.com | password |

---

## 📁 Project Structure

```
subscriptiq/
├── backend/
│   ├── config/          # PostgreSQL pool
│   ├── controllers/     # Business logic
│   ├── jobs/            # Cron billing scheduler
│   ├── middleware/       # Auth, error handler
│   ├── routes/          # Express routes
│   └── server.js        # Entry point
├── frontend/
│   └── src/
│       ├── components/  # Reusable UI components
│       ├── context/     # Auth context
│       ├── layouts/     # AdminLayout
│       ├── pages/       # All page components
│       └── services/    # Axios API client
└── database/
    ├── schema.sql       # Full DB schema
    └── seed.sql         # Demo seed data
```

---

## 🏗 API Endpoints

| Module | Base Path |
|--------|-----------|
| Auth | `/api/auth` |
| Customers | `/api/customers` |
| Products | `/api/products` |
| Plans | `/api/plans` |
| Quotations | `/api/quotations` |
| Subscriptions | `/api/subscriptions` |
| Billing | `/api/billing` |
| Invoices | `/api/invoices` |
| Payments | `/api/payments` |
| Taxes | `/api/taxes` |
| Discounts | `/api/discounts` |
| Analytics | `/api/analytics` |

---

## 📜 License

MIT — Built for **Project Orbit** Hackathon Demo.
