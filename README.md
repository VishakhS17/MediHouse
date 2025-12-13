# MediHouse - Pharmaceutical Distribution Platform

A comprehensive Next.js-based pharmaceutical distribution management system with customer-facing e-commerce and powerful admin tools.

---

## Tech Stack

**Frontend:**
- Next.js 16.0.3 (React 19.2.0)
- TypeScript
- Tailwind CSS 4.1.17
- React Hooks (useState, useEffect, useRef)

**Backend:**
- Next.js API Routes
- PostgreSQL (pg 8.16.3)
- Connection pooling
- Database transactions

**Authentication & Authorization:**
- bcrypt for password hashing
- Admin session management
- Role-Based Access Control (RBAC)
- Permission-based feature access

**File Processing:**
- XLSX for Excel file handling
- formidable for file uploads
- Batch processing for large datasets (50,000+ rows)

**Database Features:**
- PostgreSQL triggers for auto-calculations
- Database functions (PL/pgSQL)
- Trigram indexes (pg_trgm) for fast text search
- GIN indexes for optimized queries

**Deployment:**
- Vercel
- Environment variables (dotenv)

---

## Features

### Customer-Facing Features

**Product Catalog:**
- Real-time stock visibility
- Search and filter by brand/manufacturer
- Stock status indicators (in-stock, low stock, out-of-stock)
- Responsive design for all devices
- Auto-refresh on page focus for latest data

**Shopping Experience:**
- Shopping cart (localStorage persistence)
- WhatsApp order placement (instant opening)
- Product categorization by manufacturer
- Expandable brand sections

**Business Information:**
- Partner/Manufacturer showcase
- Testimonials section
- FAQ section
- Contact form
- Service highlights
- Company values display

---

### Admin Panel Features

**Authentication & Security:**
- Secure admin login with bcrypt hashing
- Session management
- Role-based access control (RBAC)
- Permission-based feature access
- Protected routes

**Product Management:**
- View all products with real-time stock
- Stock upload via Excel (batch processing)
- Automatic stock updates
- Product search and filtering

**Sales & Orders:**
- Order management system
- Sales report generation with Excel export
- IST timezone support for reports
- Real-time order tracking

**Invoice Management:**
- Invoice collection tracking
- Invoice checking system
- Collector and checker assignment
- Invoice status tracking
- Excel export for invoice collections

**Supply Chain:**
- Supply tracking system
- Delivery date tracking
- Customer and supplier management
- Supply status monitoring

**Outstanding Bills (DRS - Daily Report System):**
- Upload DRS Excel files (handles 50,000+ rows)
- Automatic invoice matching by invoice number and customer name
- UPSERT operations (insert new or update existing records)
- Automatic calculation of:
  - Pending balance (total amount - received amount)
  - Credit days (days between bill date and current date)
- Real-time outstanding bills display
- Advanced search by:
  - Customer number
  - Customer name
  - Invoice number
  - REF column
- REF filtering with dropdown:
  - Filter by distinct REF values
  - Special handling for "PART OK" (includes blank/null values)
  - Exact match filtering for other REF values
- Date sorting:
  - Sort by Date of Bill (newest first / oldest first)
  - Maintains sorting with filters and pagination
- Display features:
  - Received amounts shown in green
  - Pending balances in red
  - Pagination support (50 records per page, max 500)
  - Summary statistics (total records, total pending balance)
- Batch processing for large file uploads (5,000 rows per batch)
- Transaction management for data integrity

**Employee Management:**
- Employee attendance tracking
- Attendance marking system
- Attendance history and reports

**Dashboard:**
- Real-time statistics
- Quick access to key features
- Activity overview

**User Management:**
- Admin user creation and management
- Role assignment
- Permission management

---

## Performance Optimizations

**Database:**
- Batch database operations (10-30x faster for large datasets)
- Connection pooling for efficient resource usage
- Database transactions for data integrity
- Optimized queries with indexes:
  - B-tree indexes for exact matches
  - GIN indexes with trigram for text search
  - Composite indexes for multi-column queries
- Parallel query execution (Promise.all)
- SQL-side aggregation for summary data

**File Processing:**
- Batch processing (5,000 rows per batch)
- UPSERT operations (ON CONFLICT DO UPDATE)
- Pre-validation in memory before database operations
- Optimized counting for large files

**Frontend:**
- Debounced search inputs (500ms)
- Pagination for large datasets
- No caching for real-time data accuracy
- Auto-refresh on page focus

**Application:**
- Gzip compression enabled
- Optimized React rendering
- Lazy loading where applicable

---

## Database Schema

**Key Tables:**
- `products` - Product catalog with stock management
- `orders` - Customer orders
- `order_items` - Order line items
- `admin_users` - Admin user accounts
- `admin_roles` - Role definitions
- `admin_permissions` - Permission definitions
- `role_permissions` - Role-permission mappings
- `invoice_collections` - Invoice collection tracking
- `supply` - Supply chain tracking
- `outstanding_bills` - DRS outstanding bills management
- `attendance` - Employee attendance records

**Key Features:**
- Automatic calculations via database triggers
- Foreign key constraints for data integrity
- Unique constraints for business rules
- Timestamp tracking (created_at, updated_at)

---

## API Endpoints

**Public:**
- `GET /api/products` - Get product catalog
- `POST /api/orders` - Submit order

**Admin (Protected):**
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/products` - Get all products
- `POST /api/admin/upload-stock` - Upload stock Excel
- `GET /api/admin/orders` - Get all orders
- `GET /api/admin/sales-report` - Generate sales report
- `POST /api/admin/upload-drs` - Upload DRS file
- `GET /api/admin/outstanding-bills` - Get outstanding bills
- `DELETE /api/admin/outstanding-bills` - Delete bill record
- `GET /api/admin/invoice-collection` - Get invoice collections
- `POST /api/admin/invoice-collection` - Create invoice collection
- `GET /api/admin/invoice-checking` - Get invoice checking records
- `POST /api/admin/invoice-checking` - Check invoice
- `GET /api/admin/supply` - Get supply records
- `POST /api/admin/supply` - Create supply record
- `GET /api/admin/attendance` - Get attendance records
- `POST /api/admin/attendance` - Mark attendance
- `GET /api/admin/users` - Get admin users
- `POST /api/admin/users` - Create admin user

---

## Setup & Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd MediHouse
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env.local` file with:
   ```env
   DATABASE_URL=your_postgresql_connection_string
   ADMIN_SESSION_SECRET=your_secret_key
   ```

4. **Run database migrations:**
   Execute the SQL scripts in the `scripts/` directory in order:
   - `migrate-rbac-invoice.sql`
   - `migrate-supply.sql`
   - `migrate-outstanding-bills.sql`
   - `migrate-add-ref-to-outstanding-bills.sql` (if table already exists)
   - `migrate-invoice-checking.sql`
   - `migrate-attendance.sql`
   - `migrate-simplify-roles.sql`

5. **Run development server:**
   ```bash
   npm run dev
   ```

6. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

---

## DRS File Format

The DRS (Daily Report System) Excel file should contain the following columns:
- **DATE** - Date of Bill
- **INV NO** - Invoice Number (used with Customer Name for matching)
- **Customer Name** - Customer name (used with Invoice Number for matching)
- **REF** - Reference field (optional)
- **AMT** - Total amount of invoice
- **REC** - Amount received
- **Pending Bal** - Calculated automatically (AMT - REC)
- **DATE** (2nd column) - Current date (as_of_date) - set automatically
- **CREDITDAYS** - Calculated automatically (days between bill date and current date)

The system automatically:
- Matches existing records by Invoice Number + Customer Name
- Updates existing records with new amounts
- Inserts new records if no match is found
- Calculates pending balance and credit days

---

## Permissions & Roles

**Default Roles:**
- `super_admin` - Full access to all features
- `invoice_handler` - Access to invoice and DRS management
- `stock_manager` - Access to product and stock management

**Key Permissions:**
- `manage_outstanding_bills` - Upload and manage DRS files
- `manage_supply` - Manage supply chain
- `check_invoices` - Check and verify invoices
- `manage_stock` - Upload and manage stock
- `view_sales_report` - Generate sales reports

---

## Deployment

The application is optimized for Vercel deployment:
- Serverless API routes
- Static page generation where applicable
- Environment variables configuration
- Automatic builds on git push

---

## License

[Your License Here]

---

## Support

For issues or questions, please contact [Your Contact Information]

