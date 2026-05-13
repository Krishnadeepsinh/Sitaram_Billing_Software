# Sitaram Broadband - Broadband Billing Software

A professional, high-performance billing and management system designed for Broadband operators. Built with modern web technologies for speed, reliability, and ease of use.

## 🚀 Key Features

- **Automated Billing**: Generate and manage monthly invoices with a single click.
- **Robust PDF Exports**: Industrial-strength PDF generation for invoices and reports, optimized for all browsers.
- **Subscriber Management**: Track balances, areas, and plan history for all customers.
- **Payment Tracking**: Record Cash and UPI payments with instant receipt generation.
- **Business Insights**: Dashboard with area-wise breakdowns and financial performance metrics.
- **Native Print Support**: Professional print engine for high-quality physical documentation.

## 🛠 Technology Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS + Lucide Icons
- **Database**: LibSQL (Turso) for cloud-native persistence
- **PDF Engine**: html2pdf.js + jsPDF + html2canvas
- **State Management**: React Context API with async database syncing

## 📦 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Setup Environment**:
   Create a `.env` file with your Turso database credentials and admin login values (refer to `.env.example`).

3. **Run Locally**:
   ```bash
   npm run dev
   ```

## Vercel Deployment

Set these environment variables in Vercel Project Settings before deploying:

- `BROADBAND_TURSO_DATABASE_URL`
- `BROADBAND_TURSO_AUTH_TOKEN`
- `ADMIN_USERNAME`
- `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH`
- `SESSION_SECRET`
- `SYNC_ADMIN_PASSWORD_ON_BOOT=true` if you want the deployment to force-reset the DB admin password from env

Notes:

- The login API reads the server-side `BROADBAND_*` variables first.
- On first login, the app can auto-create the admin user in `admin_users` from `ADMIN_USERNAME` plus `ADMIN_PASSWORD` or `ADMIN_PASSWORD_HASH`.
- If you want deployment env vars to reset the admin password in the database automatically, set `SYNC_ADMIN_PASSWORD_ON_BOOT=true`.
- You can reset the database admin user locally with `npm run reset:admin`.

## 📄 License

Proprietary Software - All Rights Reserved.


