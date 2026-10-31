-- ============================================================
-- SubscriptIQ Seed Data
-- Demo credentials and realistic sample data
-- ============================================================

-- =================== USERS ===================
-- Admin: admin@subscriptiq.com / Admin@123
-- Staff: staff@subscriptiq.com / Staff@123
-- Customer: customer1@example.com / Customer@123

INSERT INTO users (id, name, email, password_hash, role) VALUES
(
    'a1000000-0000-0000-0000-000000000001',
    'Super Admin',
    'admin@subscriptiq.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Admin@123
    'admin'
),
(
    'a1000000-0000-0000-0000-000000000002',
    'Alex Staff',
    'staff@subscriptiq.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- Staff@123
    'staff'
),
(
    'a1000000-0000-0000-0000-000000000003',
    'Priya Sharma',
    'customer1@example.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'customer'
),
(
    'a1000000-0000-0000-0000-000000000004',
    'Rahul Mehta',
    'customer2@example.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'customer'
),
(
    'a1000000-0000-0000-0000-000000000005',
    'Sneha Patel',
    'customer3@example.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'customer'
)
ON CONFLICT (email) DO NOTHING;

-- =================== CUSTOMERS ===================
INSERT INTO customers (id, user_id, name, company_name, email, phone, billing_address, city, state, country, pincode, gst_number) VALUES
(
    'c1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000003',
    'Priya Sharma',
    'TechSoft Solutions Pvt Ltd',
    'customer1@example.com',
    '+91-9876543210',
    '301, Tech Tower, Whitefield',
    'Bengaluru',
    'Karnataka',
    'India',
    '560066',
    '29AABCT3518Q1ZV'
),
(
    'c1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000004',
    'Rahul Mehta',
    'Mehta Enterprises',
    'customer2@example.com',
    '+91-9123456789',
    '12, Park Street',
    'Mumbai',
    'Maharashtra',
    'India',
    '400001',
    '27AAACM9618R1ZQ'
),
(
    'c1000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000005',
    'Sneha Patel',
    'Innovate Digital Agency',
    'customer3@example.com',
    '+91-9988776655',
    '5, MG Road',
    'Ahmedabad',
    'Gujarat',
    'India',
    '380001',
    '24AAACI1234H1ZP'
),
(
    'c1000000-0000-0000-0000-000000000004',
    NULL,
    'Vikram Singh',
    'CloudOps Technologies',
    'vikram@cloudops.in',
    '+91-9001122334',
    '8th Floor, Cyber Hub',
    'Gurugram',
    'Haryana',
    'India',
    '122002',
    '06AABCC1234Q1ZT'
),
(
    'c1000000-0000-0000-0000-000000000005',
    NULL,
    'Meena Krishnan',
    'DataBridge Analytics',
    'meena@databridge.io',
    '+91-8877665544',
    '42, Anna Nagar',
    'Chennai',
    'Tamil Nadu',
    'India',
    '600040',
    '33AAACM5432H1ZR'
)
ON CONFLICT (email) DO NOTHING;

-- =================== TAX RULES ===================
INSERT INTO tax_rules (id, name, description, tax_type, rate, is_active) VALUES
(
    't1000000-0000-0000-0000-000000000001',
    'GST 18%',
    'Standard GST rate for software services',
    'percentage',
    18.0000,
    TRUE
),
(
    't1000000-0000-0000-0000-000000000002',
    'GST 12%',
    'Reduced GST rate',
    'percentage',
    12.0000,
    TRUE
),
(
    't1000000-0000-0000-0000-000000000003',
    'GST 5%',
    'Low GST rate for essential services',
    'percentage',
    5.0000,
    TRUE
)
ON CONFLICT DO NOTHING;

-- =================== DISCOUNT RULES ===================
INSERT INTO discount_rules (id, name, description, discount_type, value, min_purchase_amount, max_uses, code, valid_from, valid_until, is_active) VALUES
(
    'd1000000-0000-0000-0000-000000000001',
    'New Customer 10% Off',
    '10% discount for new customers',
    'percentage',
    10,
    0,
    100,
    'WELCOME10',
    NOW(),
    NOW() + INTERVAL '1 year',
    TRUE
),
(
    'd1000000-0000-0000-0000-000000000002',
    'Annual Plan ₹5000 Off',
    'Flat ₹5000 discount on annual plans',
    'fixed',
    5000,
    20000,
    50,
    'ANNUAL5K',
    NOW(),
    NOW() + INTERVAL '6 months',
    TRUE
),
(
    'd1000000-0000-0000-0000-000000000003',
    'Bulk 15% Off',
    '15% off on orders above ₹50000',
    'percentage',
    15,
    50000,
    NULL,
    'BULK15',
    NOW(),
    NOW() + INTERVAL '3 months',
    TRUE
)
ON CONFLICT DO NOTHING;

-- =================== PRODUCTS ===================
INSERT INTO products (id, name, description, product_type, sales_price, cost_price, unit, sku) VALUES
(
    'p1000000-0000-0000-0000-000000000001',
    'Business Software Suite',
    'Complete ERP and business management software',
    'digital',
    1000.00,
    250.00,
    'license',
    'BSS-001'
),
(
    'p1000000-0000-0000-0000-000000000002',
    'Cloud Hosting Service',
    'Managed cloud hosting with 99.9% uptime SLA',
    'service',
    2500.00,
    800.00,
    'month',
    'CHS-001'
),
(
    'p1000000-0000-0000-0000-000000000003',
    'Email Marketing Platform',
    'Advanced email marketing automation tool',
    'digital',
    1500.00,
    400.00,
    'license',
    'EMP-001'
),
(
    'p1000000-0000-0000-0000-000000000004',
    'HR Management System',
    'Complete HR and payroll management solution',
    'digital',
    3000.00,
    900.00,
    'license',
    'HRM-001'
),
(
    'p1000000-0000-0000-0000-000000000005',
    'CRM Pro',
    'Customer relationship management system',
    'digital',
    2000.00,
    600.00,
    'license',
    'CRM-001'
),
(
    'p1000000-0000-0000-0000-000000000006',
    'Premium Support',
    'Priority 24/7 technical support',
    'service',
    5000.00,
    1500.00,
    'month',
    'SUP-001'
)
ON CONFLICT DO NOTHING;

-- =================== PRODUCT VARIANTS ===================
INSERT INTO product_variants (id, product_id, name, additional_price, sku, description) VALUES
(
    'v1000000-0000-0000-0000-000000000001',
    'p1000000-0000-0000-0000-000000000001',
    'Odoo ERP',
    560.00,
    'BSS-001-ODOO',
    'Odoo-based ERP integration'
),
(
    'v1000000-0000-0000-0000-000000000002',
    'p1000000-0000-0000-0000-000000000001',
    'SAP Integration',
    1200.00,
    'BSS-001-SAP',
    'SAP integration module'
),
(
    'v1000000-0000-0000-0000-000000000003',
    'p1000000-0000-0000-0000-000000000002',
    'AWS Hosted',
    500.00,
    'CHS-001-AWS',
    'Hosting on AWS infrastructure'
),
(
    'v1000000-0000-0000-0000-000000000004',
    'p1000000-0000-0000-0000-000000000002',
    'Azure Hosted',
    450.00,
    'CHS-001-AZR',
    'Hosting on Azure infrastructure'
),
(
    'v1000000-0000-0000-0000-000000000005',
    'p1000000-0000-0000-0000-000000000003',
    'Starter - 10K emails',
    0.00,
    'EMP-001-S',
    'Up to 10,000 emails/month'
),
(
    'v1000000-0000-0000-0000-000000000006',
    'p1000000-0000-0000-0000-000000000003',
    'Professional - 100K emails',
    800.00,
    'EMP-001-P',
    'Up to 100,000 emails/month'
)
ON CONFLICT DO NOTHING;

-- =================== PLANS ===================
INSERT INTO plans (id, name, description, billing_frequency, min_quantity, allow_pause, allow_early_cancellation, auto_close_on_end, setup_fee, is_active) VALUES
(
    'pl000000-0000-0000-0000-000000000001',
    'Starter Monthly',
    'Basic monthly plan for small businesses',
    'monthly',
    1,
    TRUE,
    TRUE,
    FALSE,
    0,
    TRUE
),
(
    'pl000000-0000-0000-0000-000000000002',
    'Professional Yearly',
    'Annual plan with full feature access',
    'yearly',
    1,
    TRUE,
    FALSE,
    TRUE,
    5000,
    TRUE
),
(
    'pl000000-0000-0000-0000-000000000003',
    'Enterprise Monthly',
    'Enterprise-grade monthly subscription',
    'monthly',
    3,
    TRUE,
    TRUE,
    FALSE,
    10000,
    TRUE
),
(
    'pl000000-0000-0000-0000-000000000004',
    'Basic Weekly',
    'Pay-as-you-go weekly plan',
    'weekly',
    1,
    FALSE,
    TRUE,
    FALSE,
    0,
    TRUE
)
ON CONFLICT DO NOTHING;

-- =================== PLAN PRODUCTS ===================
INSERT INTO plan_products (plan_id, product_id, variant_id, quantity, unit_price) VALUES
('pl000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 'v1000000-0000-0000-0000-000000000001', 1, 1560.00),
('pl000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000002', NULL, 1, 2500.00),
('pl000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000001', 'v1000000-0000-0000-0000-000000000002', 1, 2200.00),
('pl000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000004', NULL, 1, 3000.00),
('pl000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000006', NULL, 1, 5000.00),
('pl000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000001', 'v1000000-0000-0000-0000-000000000001', 3, 1560.00),
('pl000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000005', NULL, 1, 2000.00),
('pl000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000006', NULL, 1, 5000.00)
ON CONFLICT DO NOTHING;

-- =================== SUBSCRIPTIONS ===================
INSERT INTO subscriptions (id, subscription_number, customer_id, plan_id, created_by, status, billing_frequency, start_date, end_date, next_billing_date, last_billing_date, payment_terms, recurring_amount, tax_id) VALUES
(
    's1000000-0000-0000-0000-000000000001',
    'SUB-2024-0001',
    'c1000000-0000-0000-0000-000000000001',
    'pl000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'active',
    'monthly',
    '2024-01-01',
    NULL,
    CURRENT_DATE,
    '2024-09-01',
    30,
    4836.00,
    't1000000-0000-0000-0000-000000000001'
),
(
    's1000000-0000-0000-0000-000000000002',
    'SUB-2024-0002',
    'c1000000-0000-0000-0000-000000000002',
    'pl000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'active',
    'yearly',
    '2024-03-15',
    '2025-03-14',
    '2025-03-15',
    '2024-03-15',
    45,
    120000.00,
    't1000000-0000-0000-0000-000000000001'
),
(
    's1000000-0000-0000-0000-000000000003',
    'SUB-2024-0003',
    'c1000000-0000-0000-0000-000000000003',
    'pl000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000002',
    'paused',
    'monthly',
    '2024-02-01',
    NULL,
    NULL,
    '2024-07-01',
    30,
    4250.00,
    't1000000-0000-0000-0000-000000000002'
),
(
    's1000000-0000-0000-0000-000000000004',
    'SUB-2024-0004',
    'c1000000-0000-0000-0000-000000000004',
    'pl000000-0000-0000-0000-000000000003',
    'a1000000-0000-0000-0000-000000000001',
    'active',
    'monthly',
    '2024-04-01',
    NULL,
    CURRENT_DATE,
    '2024-09-01',
    15,
    28320.00,
    't1000000-0000-0000-0000-000000000001'
),
(
    's1000000-0000-0000-0000-000000000005',
    'SUB-2024-0005',
    'c1000000-0000-0000-0000-000000000005',
    'pl000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000002',
    'closed',
    'monthly',
    '2023-06-01',
    '2024-05-31',
    NULL,
    '2024-05-01',
    30,
    4250.00,
    't1000000-0000-0000-0000-000000000001'
)
ON CONFLICT DO NOTHING;

-- =================== SUBSCRIPTION ITEMS ===================
INSERT INTO subscription_items (subscription_id, product_id, variant_id, quantity, unit_price, total_price) VALUES
('s1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 'v1000000-0000-0000-0000-000000000001', 1, 1560.00, 1560.00),
('s1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000002', NULL, 1, 2500.00, 2500.00),
('s1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000001', 'v1000000-0000-0000-0000-000000000002', 1, 2200.00, 2200.00),
('s1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000004', NULL, 1, 3000.00, 3000.00),
('s1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000006', NULL, 1, 5000.00, 5000.00),
('s1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000003', 'v1000000-0000-0000-0000-000000000006', 1, 2300.00, 2300.00),
('s1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000002', NULL, 1, 2500.00, 2500.00),
('s1000000-0000-0000-0000-000000000004', 'p1000000-0000-0000-0000-000000000001', 'v1000000-0000-0000-0000-000000000001', 3, 1560.00, 4680.00),
('s1000000-0000-0000-0000-000000000004', 'p1000000-0000-0000-0000-000000000005', NULL, 1, 2000.00, 2000.00),
('s1000000-0000-0000-0000-000000000004', 'p1000000-0000-0000-0000-000000000006', NULL, 1, 5000.00, 5000.00),
('s1000000-0000-0000-0000-000000000005', 'p1000000-0000-0000-0000-000000000002', NULL, 1, 2500.00, 2500.00),
('s1000000-0000-0000-0000-000000000005', 'p1000000-0000-0000-0000-000000000003', 'v1000000-0000-0000-0000-000000000005', 1, 1500.00, 1500.00)
ON CONFLICT DO NOTHING;

-- =================== INVOICES ===================
INSERT INTO invoices (id, invoice_number, customer_id, subscription_id, created_by, invoice_type, status, billing_period_start, billing_period_end, subtotal, discount_amount, tax_amount, total, amount_paid, outstanding_balance, tax_id, due_date) VALUES
(
    'i1000000-0000-0000-0000-000000000001',
    'INV-2024-0001',
    'c1000000-0000-0000-0000-000000000001',
    's1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'recurring',
    'paid',
    '2024-08-01',
    '2024-08-31',
    4100.00,
    0,
    738.00,
    4838.00,
    4838.00,
    0,
    't1000000-0000-0000-0000-000000000001',
    '2024-08-31'
),
(
    'i1000000-0000-0000-0000-000000000002',
    'INV-2024-0002',
    'c1000000-0000-0000-0000-000000000001',
    's1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000001',
    'recurring',
    'partially_paid',
    '2024-09-01',
    '2024-09-30',
    4100.00,
    0,
    738.00,
    4838.00,
    2000.00,
    2838.00,
    't1000000-0000-0000-0000-000000000001',
    CURRENT_DATE + INTERVAL '15 days'
),
(
    'i1000000-0000-0000-0000-000000000003',
    'INV-2024-0003',
    'c1000000-0000-0000-0000-000000000002',
    's1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    'recurring',
    'paid',
    '2024-03-15',
    '2025-03-14',
    101680.00,
    0,
    18302.40,
    119982.40,
    119982.40,
    0,
    't1000000-0000-0000-0000-000000000001',
    '2024-04-14'
),
(
    'i1000000-0000-0000-0000-000000000004',
    'INV-2024-0004',
    'c1000000-0000-0000-0000-000000000004',
    's1000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000001',
    'recurring',
    'overdue',
    '2024-08-01',
    '2024-08-31',
    24000.00,
    0,
    4320.00,
    28320.00,
    0,
    28320.00,
    't1000000-0000-0000-0000-000000000001',
    '2024-08-16'
),
(
    'i1000000-0000-0000-0000-000000000005',
    'INV-2024-0005',
    'c1000000-0000-0000-0000-000000000004',
    's1000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000002',
    'recurring',
    'confirmed',
    '2024-09-01',
    '2024-09-30',
    24000.00,
    0,
    4320.00,
    28320.00,
    0,
    28320.00,
    't1000000-0000-0000-0000-000000000001',
    CURRENT_DATE + INTERVAL '5 days'
),
(
    'i1000000-0000-0000-0000-000000000006',
    'INV-2024-0006',
    'c1000000-0000-0000-0000-000000000005',
    's1000000-0000-0000-0000-000000000005',
    'a1000000-0000-0000-0000-000000000002',
    'recurring',
    'paid',
    '2024-04-01',
    '2024-04-30',
    4000.00,
    0,
    720.00,
    4720.00,
    4720.00,
    0,
    't1000000-0000-0000-0000-000000000001',
    '2024-05-01'
)
ON CONFLICT DO NOTHING;

-- =================== INVOICE ITEMS ===================
INSERT INTO invoice_items (invoice_id, product_id, variant_id, description, quantity, unit_price, total_price) VALUES
('i1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 'v1000000-0000-0000-0000-000000000001', 'Business Software Suite - Odoo ERP', 1, 1560.00, 1560.00),
('i1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000002', NULL, 'Cloud Hosting Service', 1, 2500.00, 2500.00),
('i1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000001', 'v1000000-0000-0000-0000-000000000001', 'Business Software Suite - Odoo ERP', 1, 1560.00, 1560.00),
('i1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000002', NULL, 'Cloud Hosting Service', 1, 2500.00, 2500.00),
('i1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000001', 'v1000000-0000-0000-0000-000000000002', 'Business Software Suite - SAP Integration', 1, 2200.00, 2200.00),
('i1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000004', NULL, 'HR Management System', 1, 3000.00, 3000.00),
('i1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000006', NULL, 'Premium Support', 12, 5000.00, 60000.00),
('i1000000-0000-0000-0000-000000000004', 'p1000000-0000-0000-0000-000000000001', 'v1000000-0000-0000-0000-000000000001', 'Business Software Suite - Odoo ERP', 3, 1560.00, 4680.00),
('i1000000-0000-0000-0000-000000000004', 'p1000000-0000-0000-0000-000000000005', NULL, 'CRM Pro', 1, 2000.00, 2000.00),
('i1000000-0000-0000-0000-000000000004', 'p1000000-0000-0000-0000-000000000006', NULL, 'Premium Support', 1, 5000.00, 5000.00),
('i1000000-0000-0000-0000-000000000005', 'p1000000-0000-0000-0000-000000000001', 'v1000000-0000-0000-0000-000000000001', 'Business Software Suite - Odoo ERP', 3, 1560.00, 4680.00),
('i1000000-0000-0000-0000-000000000005', 'p1000000-0000-0000-0000-000000000005', NULL, 'CRM Pro', 1, 2000.00, 2000.00),
('i1000000-0000-0000-0000-000000000005', 'p1000000-0000-0000-0000-000000000006', NULL, 'Premium Support', 1, 5000.00, 5000.00),
('i1000000-0000-0000-0000-000000000006', 'p1000000-0000-0000-0000-000000000002', NULL, 'Cloud Hosting Service', 1, 2500.00, 2500.00),
('i1000000-0000-0000-0000-000000000006', 'p1000000-0000-0000-0000-000000000003', 'v1000000-0000-0000-0000-000000000005', 'Email Marketing Platform - Starter', 1, 1500.00, 1500.00)
ON CONFLICT DO NOTHING;

-- =================== PAYMENTS ===================
INSERT INTO payments (payment_reference, invoice_id, customer_id, recorded_by, amount, payment_method, payment_date, notes) VALUES
(
    'PAY-2024-0001',
    'i1000000-0000-0000-0000-000000000001',
    'c1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000002',
    4838.00,
    'bank_transfer',
    '2024-08-15',
    'Full payment received via NEFT'
),
(
    'PAY-2024-0002',
    'i1000000-0000-0000-0000-000000000002',
    'c1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000002',
    2000.00,
    'upi',
    '2024-09-10',
    'Partial payment via UPI'
),
(
    'PAY-2024-0003',
    'i1000000-0000-0000-0000-000000000003',
    'c1000000-0000-0000-0000-000000000002',
    'a1000000-0000-0000-0000-000000000001',
    119982.40,
    'bank_transfer',
    '2024-04-01',
    'Annual payment by RTGS'
),
(
    'PAY-2024-0004',
    'i1000000-0000-0000-0000-000000000006',
    'c1000000-0000-0000-0000-000000000005',
    'a1000000-0000-0000-0000-000000000002',
    4720.00,
    'cash',
    '2024-04-28',
    'Cash payment at office'
)
ON CONFLICT DO NOTHING;

-- =================== QUOTATIONS ===================
INSERT INTO quotations (id, quotation_number, customer_id, created_by, status, subtotal, discount_amount, tax_amount, total, notes, expiry_date) VALUES
(
    'q1000000-0000-0000-0000-000000000001',
    'QUO-2024-0001',
    'c1000000-0000-0000-0000-000000000001',
    'a1000000-0000-0000-0000-000000000002',
    'accepted',
    4100.00,
    0,
    738.00,
    4838.00,
    'Monthly plan quotation for TechSoft Solutions',
    '2024-08-31'
),
(
    'q1000000-0000-0000-0000-000000000002',
    'QUO-2024-0002',
    'c1000000-0000-0000-0000-000000000004',
    'a1000000-0000-0000-0000-000000000002',
    'sent',
    48000.00,
    5000.00,
    7740.00,
    50740.00,
    'Enterprise plan proposal for CloudOps',
    CURRENT_DATE + INTERVAL '10 days'
),
(
    'q1000000-0000-0000-0000-000000000003',
    'QUO-2024-0003',
    'c1000000-0000-0000-0000-000000000005',
    'a1000000-0000-0000-0000-000000000002',
    'draft',
    8000.00,
    800.00,
    1296.00,
    8496.00,
    'Renewal quotation for DataBridge Analytics',
    CURRENT_DATE + INTERVAL '30 days'
)
ON CONFLICT DO NOTHING;

-- =================== QUOTATION ITEMS ===================
INSERT INTO quotation_items (quotation_id, product_id, variant_id, quantity, unit_price, total_price, description) VALUES
('q1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000001', 'v1000000-0000-0000-0000-000000000001', 1, 1560.00, 1560.00, 'Business Software - Odoo'),
('q1000000-0000-0000-0000-000000000001', 'p1000000-0000-0000-0000-000000000002', NULL, 1, 2500.00, 2500.00, 'Cloud Hosting'),
('q1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000001', 'v1000000-0000-0000-0000-000000000001', 3, 1560.00, 4680.00, 'Business Software - Odoo x3'),
('q1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000005', NULL, 1, 2000.00, 2000.00, 'CRM Pro'),
('q1000000-0000-0000-0000-000000000002', 'p1000000-0000-0000-0000-000000000006', NULL, 1, 5000.00, 5000.00, 'Premium Support'),
('q1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000002', NULL, 1, 2500.00, 2500.00, 'Cloud Hosting'),
('q1000000-0000-0000-0000-000000000003', 'p1000000-0000-0000-0000-000000000003', 'v1000000-0000-0000-0000-000000000006', 1, 2300.00, 2300.00, 'Email Marketing Pro')
ON CONFLICT DO NOTHING;

-- =================== AUDIT LOGS ===================
INSERT INTO audit_logs (user_id, action, entity_type, entity_id, new_values) VALUES
('a1000000-0000-0000-0000-000000000001', 'CREATE', 'subscription', 's1000000-0000-0000-0000-000000000001', '{"status":"active"}'),
('a1000000-0000-0000-0000-000000000001', 'CREATE', 'subscription', 's1000000-0000-0000-0000-000000000002', '{"status":"active"}'),
('a1000000-0000-0000-0000-000000000002', 'PAUSE', 'subscription', 's1000000-0000-0000-0000-000000000003', '{"status":"paused"}'),
('a1000000-0000-0000-0000-000000000001', 'CLOSE', 'subscription', 's1000000-0000-0000-0000-000000000005', '{"status":"closed"}'),
('a1000000-0000-0000-0000-000000000002', 'PAYMENT_RECORDED', 'payment', NULL, '{"amount":4838,"method":"bank_transfer"}'),
('a1000000-0000-0000-0000-000000000002', 'PAYMENT_RECORDED', 'payment', NULL, '{"amount":2000,"method":"upi"}')
ON CONFLICT DO NOTHING;
