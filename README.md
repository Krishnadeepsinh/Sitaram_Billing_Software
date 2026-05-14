<p align="center">
  <img src="public/favicon.ico" alt="Sitaram Cable & Broadband" width="120" />
</p>

<h1 align="center">Sitaram Cable & Broadband Billing System</h1>

<p align="center">
  <strong>A modern, high-performance billing and subscriber management platform designed specifically for ISP and Cable network operators.</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vite-B73BFE?style=for-the-badge&logo=vite&logoColor=FFD62E" alt="Vite" />
</p>

---

## 🚀 Overview

The **Sitaram Cable & Broadband Billing System** is an end-to-end, full-stack web application tailored for managing internet service provider (ISP) and cable television operations. With a sleek dark-mode UI, it simplifies complex billing cycles, tracks active subscriber nodes, manages multi-tier service schemas, and provides real-time financial reporting.

Designed to eliminate administrative overhead, the software supports bulk invoicing, automated GST calculations, expense tracking, and offline-capable data synchronization.

## ✨ Key Features

- **Dual-Mode Operations**: Seamlessly toggle between "Cable" and "Broadband" business contexts, keeping service domains distinct yet easily accessible.
- **Subscriber Management**: Track subscriber statuses, metadata, hardware assignments (MAC addresses/STB numbers), and installation locations.
- **Dynamic Billing Cycles**: Support for flexible lifecycle management (e.g., 30-day renewals, fixed-term iptv bundles) with automated invoice generation.
- **Financial Dashboard & Analytics**: High-level KPIs, revenue metrics, expense tracking, and quick actions directly on a responsive dashboard grid.
- **Modern Design System**: Built with a unified `slate-900` / `indigo-600` dark mode aesthetic using Tailwind CSS and Radix UI components (shadcn/ui).
- **PDF Invoicing & Reports**: Generate professional, print-ready PDF invoices, receipts, and administrative reports locally in the browser.
- **Secure Architecture**: Robust context-driven state management integrated with Turso for secure, low-latency database syncing.

## 🛠️ Technology Stack

- **Frontend Framework**: React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS, shadcn/ui, Lucide Icons
- **Build Tool**: Vite
- **Routing**: React Router DOM
- **Database / Sync**: Turso DB (SQLite on the edge)
- **PDF Generation**: jsPDF, html2pdf.js

## 📦 Project Structure

```text
src/
├── components/         # Reusable UI components (Sidebar, Nav, Layout)
├── components/ui/      # Shadcn/ui atomic components (Buttons, Inputs, Cards)
├── context/            # React Context providers (BillingContext, Turso sync)
├── lib/                # Utility functions, mock data, formatting helpers
├── pages/              # Application views (Dashboard, Subscribers, Invoices, etc.)
└── App.tsx             # Main routing and application wrapper
```

## 💻 Local Development

Follow these steps to run the project locally on your machine.

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Krishnadeepsinh/Sitaram_Billing_Software.git
   cd Sitaram_Billing_Software
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Variables:**
   Create a `.env` file in the root directory and configure any required database or authentication tokens (e.g., Turso DB URLs).

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Build for production:**
   ```bash
   npm run build
   ```

## 🎨 Design System

The application employs a consistent, premium dark mode aesthetic designed for maximum legibility in operational environments.
- **Backgrounds**: Deep `slate-950` with `slate-900` application panels.
- **Borders & Dividers**: Subtle `white/10` or `white/5` delineations.
- **Accents**: Primary interactive elements use `indigo-600` (`blue-600` for branding accents), combined with color-coded semantic utilities (Emerald for success/payments, Rose for destructive actions, Amber for warnings).

## 🔒 Security & Data

All financial and user data logic is heavily isolated. The `BillingContext` safely manages state across the application while the Turso layer handles secure SQLite edge synchronization. Operations such as schema purging and database migrations require administrative confirmation dialogues to prevent accidental data loss.

## 🤝 Contributing

We welcome contributions to improve the Sitaram Billing Software! 

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

*For support or inquiries, please contact the repository administrators.*
