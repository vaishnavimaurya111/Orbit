ORBIT – Smart Subscription Management Platform

Simplify subscriptions. Automate recurring billing. Understand your revenue.

ORBIT is a smart subscription management and recurring billing platform designed to help businesses manage customers, products, subscription plans, invoices, payments, and recurring revenue from one centralized dashboard.

It streamlines the complete subscription lifecycle — from customer onboarding and quotation creation to subscription activation, invoice generation, payment tracking, and renewals.

---

🌟 Key Features

📊 1. Smart Dashboard & Analytics

- Overview of total customers and active subscriptions.
- Monitor Monthly Recurring Revenue (MRR) and Annual Recurring Revenue (ARR).
- Track total revenue and pending payments.
- Visualize subscription and revenue trends.
- Get a quick overview of business performance.

📦 2. Product & Plan Management

- Create, update, and manage products.
- Define multiple subscription plans.
- Configure monthly and yearly billing cycles.
- Manage product variants and pricing.

👥 3. Customer Management

- Add and manage customer information.
- Maintain customer subscription history.
- Track customer-specific invoices and payments.
- Access customer details from a centralized dashboard.

📝 4. Quotation Management

- Generate quotations for customers.
- Add products, quantities, pricing, taxes, and discounts.
- Convert accepted quotations into subscriptions.
- Track quotation status.

🔄 5. Subscription Management

- Create and manage subscriptions.
- Track active, pending, cancelled, and expired subscriptions.
- Manage subscription start and end dates.
- Support recurring billing cycles.
- Generate upcoming invoices during renewal.

🧾 6. Invoice Management

- Generate invoices for subscriptions.
- Track paid, unpaid, overdue, and partially paid invoices.
- Maintain invoice history.
- Calculate applicable taxes and discounts.

💳 7. Payment Tracking

- Record customer payments.
- Support partial and full payment tracking.
- Update invoice payment status.
- Maintain payment history.

🔐 8. Authentication & Security

- Secure login and registration.
- JWT-based authentication.
- Password hashing using bcrypt.
- Role-based access control.
- Protected API routes.

---

🛠️ Tech Stack

Layer| Technologies
Frontend| React.js, Vite, JavaScript
Styling| Tailwind CSS
Backend| Node.js, Express.js
Database| PostgreSQL
Database Library| pg
Authentication| JWT, bcrypt
Charts & Analytics| Recharts
Icons| Lucide React
Automation| node-cron
API Communication| Axios
Development Tools| VS Code, Git, GitHub

---

🏗️ System Architecture

                    ORBIT
                      |
          +-----------+-----------+
          |                       |
       Frontend                Backend
     React + Vite          Node.js + Express
          |                       |
          |                  REST APIs
          |                       |
          +-----------+-----------+
                      |
                  PostgreSQL
                      |
       Customers, Products, Plans,
       Subscriptions, Invoices,
       Payments & Analytics

---

📁 Project Structure

ORBIT/
│
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── layouts/
│       ├── services/
│       ├── hooks/
│       ├── assets/
│       └── App.jsx
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── routes/
│   ├── services/
│   ├── utils/
│   └── server.js
│
├── database/
│   ├── schema.sql
│   └── seed.sql
│
├── .gitignore
└── README.md

Note: Folder structure may evolve as development progresses.

---

⚙️ Installation & Setup

1. Clone the Repository

git clone https://github.com/YOUR_USERNAME/ORBIT.git
cd ORBIT

2. Install Frontend Dependencies

cd frontend
npm install

3. Install Backend Dependencies

Open another terminal:

cd backend
npm install

4. Configure PostgreSQL

- Install PostgreSQL on your system.
- Create a database named "orbit".
- Open the database using pgAdmin or psql.
- Execute the SQL files in the following order:

database/schema.sql
database/seed.sql

5. Configure Environment Variables

Create a ".env" file inside the "backend" directory:

PORT=5000
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/orbit

JWT_SECRET=your_secure_secret_key
NODE_ENV=development

Replace "YOUR_PASSWORD" with your PostgreSQL password.

6. Start the Backend

cd backend
npm run dev

7. Start the Frontend

cd frontend
npm run dev

Open the local URL displayed by Vite in your browser.

---

🔌 API Modules

Module| Endpoint
Authentication| "/api/auth"
Users| "/api/users"
Products| "/api/products"
Product Variants| "/api/variants"
Plans| "/api/plans"
Customers| "/api/customers"
Quotations| "/api/quotations"
Subscriptions| "/api/subscriptions"
Billing| "/api/billing"
Invoices| "/api/invoices"
Payments| "/api/payments"
Taxes| "/api/taxes"
Discounts| "/api/discounts"
Analytics| "/api/analytics"
Reports| "/api/reports"

---

💡 How ORBIT Works

1. Create a Product: Admin adds products and defines their pricing.
2. Create a Plan: Configure subscription plans and billing cycles.
3. Add a Customer: Store customer information.
4. Generate a Quotation: Create a quotation with products, taxes, and discounts.
5. Activate Subscription: Convert an accepted quotation into a subscription.
6. Generate Invoice: Create an invoice for the subscription.
7. Track Payment: Record full or partial payments.
8. Automate Renewal: Generate the next billing invoice when the subscription renews.
9. Analyze Revenue: View updated business metrics through the dashboard.

---

🎯 Project Objective

The main objective of ORBIT is to simplify subscription-based business operations by bringing subscription management, recurring billing, invoice generation, payment tracking, and revenue analytics into a single platform.

It aims to reduce manual work, improve billing accuracy, and provide businesses with better visibility into their recurring revenue.

---

🔮 Future Enhancements

- Email notifications for upcoming renewals and overdue invoices.
- Payment gateway integration.
- PDF invoice and quotation downloads.
- Advanced customer churn prediction.
- Subscription recommendations.
- Advanced revenue forecasting.
- Multi-currency support.
- Customer self-service portal.

---

👩‍💻 Team & Contributions

Built as a collaborative hackathon project.

We aim to combine practical business automation with a clean, scalable, and user-friendly SaaS experience.

---

📌 Project Status

Development in Progress 🚧

ORBIT is being developed with a focus on secure subscription workflows, automated recurring billing, and meaningful business analytics.

---

⭐ If you find this project interesting, consider giving the repository a star!

ORBIT – Manage Smarter. Bill Automatically. Grow Faster.
