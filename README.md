# AssetFlow — Enterprise Asset & Resource Management System

AssetFlow is a state-of-the-art, premium Enterprise Asset & Resource Management System. Inspired by modern ERP workflows (like Odoo), it provides organizations with a highly visual, interactive, and comprehensive platform to register assets, schedule resource bookings, raise maintenance requests, organize audits, and handle department-level approvals.

---

## 🚀 Key Features

* **Dual-Pane Authentication**: Sleek auth experience with a blurred, glassmorphic marketing panel on the left and a clean credentials manager on the right.
* **Interactive Drag-to-Select Booking Calendar**: A vertical, drag-and-drop availability timeline (8:00 AM to 8:00 PM) for shared resources with instant conflict check validations.
* **Maintenance Kanban Board**: A full-height, interactive drag-and-drop Kanban workflow for ticket lifecycle tracking (Approve, Assign, Start, Resolve) featuring color-coded priority indicators.
* **Database Actions with Stateless Connection Support**: Configured to work smoothly with stateless serverless drivers (like Neon HTTP) by removing database transaction locks and executing queries sequentially.

---

## 🛠️ Technology Stack

* **Framework**: Next.js 15 (App Router, Tailwind CSS, TypeScript)
* **UI & Components**: Ant Design (Antd), Lucide Icons, and Vanilla CSS
* **Database & ORM**: Drizzle ORM paired with PostgreSQL (Neon Serverless DB)
* **Date Utilities**: Day.js
* **State Management**: Zustand & Next-Auth

---

## 👥 Role-Based Workflows

AssetFlow utilizes a robust role-based access control (RBAC) system with four key roles:

### 1. Administrator (Admin)
The administrative cockpit controls the organization's structure and metadata:
* **Departments Management**: Register departments and assign Department Heads.
* **Asset Categories**: Model the hierarchical category tree.
* **Employee Registry**: Invite, configure, and manage staff accounts and role assignments (Admin, Asset Manager, Department Head, Employee).
* **Audit Control**: Designate, monitor, and close global asset audit cycles.
* **Analytics**: Gain high-level visual insight into asset utilization rates and depreciation metrics.

### 2. Asset Manager
Asset Managers oversee the active physical inventory and maintenance tickets:
* **Asset Registry**: Add new assets, capture acquisition costs, log serial numbers, specify locations, upload photos, and update current condition levels.
* **Maintenance Kanban**: Redesigned Kanban system to manage reported hardware issues. Move tickets across columns via drag-and-drop to approve requests, assign technicians, begin work, and mark tickets resolved.
* **Audits**: Conduct audit reviews and verify physical asset inventory conditions.

### 3. Department Head
Department Heads act as the approval authority for department assets:
* **Allocations & Transfers**: Assign assets to department employees, or approve asset transfer requests between departments.
* **Booking Approvals**: Approve or reject shared resource reservation requests made by department members.
* **Department Assets Overview**: Track all active allocations, booking histories, and department-owned assets.

### 4. Employee
Employees utilize resources and report issues:
* **Resource Booking**: Select shared bookable assets (e.g. conference rooms, laptops, tools) and reserve slots by dragging a range directly over the interactive timeline calendar.
* **Asset Requests**: Request new asset allocations or submit transfer requests.
* **Maintenance Requests**: Report hardware issues or damaged assets to alert the Asset Manager.

---

## 🏁 Getting Started

### 1. Installation
Install project dependencies:
```bash
npm install
```

### 2. Setup Environment Variables
Create a `.env` file in the root directory and configure the database link:
```env
DATABASE_URL="your-postgresql-connection-string"
NEXTAUTH_SECRET="your-next-auth-secret"
```

### 3. Run Development Server
Start the Next.js local development process:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Run Drizzle Studio
Explore and manage database entries visually:
```bash
npm run studio
```
