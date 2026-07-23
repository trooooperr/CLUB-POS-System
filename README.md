# Club POS System (V2.0 — Production-Grade ERP)

A **premium, production-ready Restaurant & Bar POS ERP System** engineered specifically for **HumTum Bar & Restaurant**. 
Built with **enterprise-level architecture, atomic data integrity, role-secured API security, custom silent desktop printing, and an automated stock & financial engine**, this platform delivers high concurrency safety and real-time operational control.

---

<p align="center">
  <img width="48%" alt="Table Management" src="https://github.com/user-attachments/assets/ae20b048-35cd-4558-b7f4-bff125f011c5" />
  <img width="48%" src="https://github.com/user-attachments/assets/568310af-b824-44fa-9786-b6aa041de85c" alt="Billing Dashboard" />
  <img width="48%" src="https://github.com/user-attachments/assets/a4599772-bdae-4d87-ae7f-cdd024de8547" alt="order history"/>
  <img width="48%" src="https://github.com/user-attachments/assets/621d111b-0233-4059-b4a9-59750787e537" alt="Inventory Managment"/>
</p>

---

## Demo Credentials

Because this POS system is deployed live in an active restaurant, **live production credentials and customer databases are strictly protected**. Reviewers, recruiters, and clients can demonstrate and evaluate 100% of the platform's capabilities using the following safe approaches:

### 1. Local One-Command Sandbox Environment
When running locally, the server automatically synchronizes pre-configured demo user accounts on startup. Anyone cloning the repository can log in instantly with these local sandbox credentials:

| Role | Username | Password | Access Level & Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin` | `admin123` | Full access: Settings, User Mgmt, Categories, Cache Clear |
| **Manager** | `manager` | `manager123` | Operations: Inventory, Workers, Payroll, Reports, Staff Reset |
| **Staff** | `staff` | `staff123` | POS Billing & KOT Creation (Blocked from Admin/Settings) |

```bash
# Clone & run isolated local sandbox
npm install
cd frontend && npm install && cd ..
npm run dev
```

### 2. Zero-Setup Automated In-Memory Audit (`npm test`)
To inspect full system capabilities (order flow, KOT refunds, delta stock deduction, RBAC security) without spinning up databases or servers, run the automated test suite powered by `mongodb-memory-server`:

```bash
npm test
```
*Executes all 56 E2E test cases across 10 test suites in ~6 seconds with zero cloud dependency.*

### 3. Separate Staging Environment
For live public demos, deploy a separate staging branch (e.g., Render / Railway) connected to a **MongoDB Sandbox Database** (`humtum-demo-db`) pre-populated with sample menu items (e.g., "Butter Chicken", "Kingfisher Beer"). This ensures zero risk to live restaurant data.

---

## System Architecture & Layered Overview

```mermaid
graph TD
    subgraph Customer & Staff Interfaces [Client & Device Layer]
        CUST_MOB["Customer Smartphone (QR Code Digital Menu / Self-Order)"]
        WAITER_UI["Waiter Mobile / POS Tablet"]
        POS_TERM["Cashier POS Billing Terminal"]
        KDS_UI["Kitchen Display System (KDS)"]
        INV_REP_UI["Inventory & Financial Analytics Dashboard"]
    end

    subgraph Hardware Layer [Local PC Thermal Printing]
        PA["HumTum Silent Desktop Print Agent (Port 5001)"]
        EDGE["Headless MS Edge / Chrome PDF Engine"]
        SUMATRA["SumatraPDF Spooler"]
        KOT_PRINTER["ESC/POS Kitchen Thermal Printer"]
        BILL_PRINTER["ESC/POS Cashier Thermal Receipt Printer"]
    end

    subgraph Application Server [Node.js + Express 4 ERP Backend]
        AUTH_MW["JWT Auth & RBAC Security Guard"]
        ORDER_ENG["Order Processing & Digital Menu Engine"]
        KOT_ENG["KOT Lifecycle & Socket.IO Real-time Engine"]
        BILL_ENG["Unified Billing & Financial Tax Engine"]
        STOCK_ENG["Delta Stock Deduction & Inventory Engine"]
        CRON_ENG["Daily Stock Snapshot & Report Engine"]
    end

    subgraph Data Store Layer [Database & Cache]
        MONGO[("MongoDB Atlas - Core ERP Store")]
        REDIS[("Upstash Redis / In-Memory Counter")]
    end

    %% Interactions
    CUST_MOB -->|Order Request & Menu Sync| ORDER_ENG
    WAITER_UI -->|KOT & Order Creation| AUTH_MW
    POS_TERM -->|Settle Order & Payment Call| AUTH_MW
    KDS_UI -->|WebSocket Events| KOT_ENG
    INV_REP_UI -->|Restricted API Calls| AUTH_MW

    AUTH_MW --> ORDER_ENG
    AUTH_MW --> KOT_ENG
    AUTH_MW --> BILL_ENG
    AUTH_MW --> STOCK_ENG

    KOT_ENG -->|Real-time Order Status Sync| KDS_UI
    KOT_ENG -->|Status Updates| CUST_MOB

    BILL_ENG -->|Atomic Bill # INCR| REDIS
    BILL_ENG -->|Order & Settle bulkWrite| MONGO
    STOCK_ENG -->|Real-time Inventory Deduction & Refunds| MONGO
    CRON_ENG -->|Daily Stock Summaries & Audit| MONGO

    POS_TERM -->|POST http://localhost:5001/print| PA
    WAITER_UI -->|POST http://localhost:5001/print| PA
    PA --> EDGE --> SUMATRA
    SUMATRA --> KOT_PRINTER
    SUMATRA --> BILL_PRINTER
```

---

## End-to-End Workflow & Dataflow Diagrams

### 1. Complete Customer-to-Cashier Process Flow
This flowchart maps the entire operational pipeline from the customer ordering on their phone to cashier settlement, thermal receipt printing, and real-time inventory/database sync.

```mermaid
flowchart TD
    A["Customer Scans QR Code on Phone"] --> B["Browse Digital Menu & Select Food / Bar Items"]
    B --> C["Submit Order Request from Customer Phone"]
    C --> D["Waiter / POS Terminal Confirms Order & Assigns Table"]
    D --> E["Express Server Validates JWT & User Permissions"]
    
    E --> F{"Check Bar Inventory Stock"}
    F -- Stock Low/Insufficient --> G["Return Warning / Out of Stock Error"]
    F -- Stock Available --> H["Deduct Bar Inventory Stock & Create KOT (Status: Pending)"]
    
    H --> I["Broadcast 'kot:created' via Socket.IO to Kitchen KDS"]
    H --> J["Dispatch KOT HTML Payload to HumTum Silent Print Agent (Port 5001)"]
    J --> K["Silent Print KOT Ticket via SumatraPDF to Kitchen Thermal Printer"]
    
    I --> L["Kitchen Staff Prepares Food & Updates KDS Status (Pending -> Preparing -> Ready -> Served)"]
    L --> M["Customer Enjoys Meal & Requests Final Bill"]
    
    M --> N["Cashier Opens Active Table Session on POS Terminal"]
    N --> O["Click 'Settle / Generate Bill' (Select Discounts & Payment Mode)"]
    
    O --> P["Fetch Atomic Sequential Bill # from Upstash Redis (INCR bill_counter)"]
    P --> Q["Calculate Subtotal, CGST (2.5%), SGST (2.5%), Discounts & Grand Total"]
    Q --> R{"Any Delta / Additional Non-KOT Items?"}
    R -- Yes --> S["Execute bulkWrite Stock Deduction for Delta Items in MongoDB"]
    R -- No --> T["Bypass Double Stock Deduction (Stock Already Deducted on KOT)"]
    
    S --> U["Update Order Status: Completed & Persist Transaction in MongoDB"]
    T --> U
    
    U --> V["Send Thermal Receipt HTML Payload to HumTum Silent Print Agent"]
    V --> W["Silent Print Final Customer Bill Receipt on Cashier ESC/POS Printer"]
    W --> X["Real-Time System Sync: Stock Levels, Sales Analytics & Daily Snapshot Engine Updated"]
```

---

### 2. Customer Phone to Cashier Settlement Sequence Dataflow
This sequence diagram details the exact API payloads, socket events, atomic counters, and hardware spooling calls executed across the full lifecycle.

```mermaid
sequenceDiagram
    autonumber
    actor Customer as Customer (Smartphone)
    actor Waiter as Waiter / POS Mobile
    actor Cashier as Cashier (POS Terminal)
    participant Server as Express Backend API
    participant KDS as Kitchen Display (Socket.IO)
    participant Redis as Upstash Redis Counter
    participant DB as MongoDB Atlas Store
    participant PrintAgent as HumTum Print Agent (Port 5001)
    participant Printer as ESC/POS Thermal Printers

    rect rgb(240, 248, 255)
        Note over Customer, Printer: Phase 1: Customer Phone Order, KOT Creation & Silent Kitchen Print
        Customer->>Waiter: Scan QR Code / Send Order Selection from Phone
        Waiter->>Server: POST /api/kots (Items, TableNo, Remarks)
        Server->>DB: Check Inventory stock for Bar items
        Server->>DB: Deduct stock for initial KOT items immediately
        Server->>DB: Save KOT Record (Status: 'Pending')
        Server->>KDS: Broadcast 'kot:created' event via WebSockets
        Server-->>Waiter: 201 Created (KOT Payload & Thermal HTML Template)
        Waiter->>PrintAgent: POST http://localhost:5001/print (KOT HTML, PrinterName)
        PrintAgent->>Printer: Render PDF silently via Edge & Print to Kitchen Thermal Printer
    end

    rect rgb(255, 250, 240)
        Note over KDS, Customer: Phase 2: Kitchen KDS Fulfillment & Live Status Updates
        KDS->>Server: Update KOT Status ('Pending' -> 'Preparing' -> 'Ready' -> 'Served')
        Server->>Customer: Socket.IO Live Broadcast: Order Ready / Served
    end

    rect rgb(240, 255, 240)
        Note over Cashier, Printer: Phase 3: Cashier Bill Generation, Delta Stock & Silent Receipt Print
        Customer->>Cashier: Request Bill Payment
        Cashier->>Server: POST /api/orders/settle (OrderId, PaymentMode, Discount)
        Server->>Redis: INCR bill_counter:{businessDate}
        Redis-->>Server: Return Atomic Bill Number (e.g. #1042)
        Server->>DB: Calculate Delta Stock = (Final Bill Quantities) - (KOT Deducted Quantities)
        alt Delta > 0 (New items added at cashier stage)
            Server->>DB: Execute bulkWrite stock deduction for Delta items
        end
        Server->>Server: Compute Subtotal, SGST (2.5%), CGST (2.5%), Discounts & Grand Total
        Server->>DB: Persist Completed Order (isActive: false, orderStatus: 'Completed', billNo)
        Server-->>Cashier: 200 OK (Settled Order Payload & Customer Receipt HTML)
        Cashier->>PrintAgent: POST http://localhost:5001/print (Receipt HTML, CashierPrinter)
        PrintAgent->>Printer: Spool PDF silently & Print Customer Thermal Receipt
        Server->>DB: Sync Financial Ledger, Stock Snapshots & Sales Dashboard Reports
    end
```

---

### 3. Kitchen KOT Item Refund & Recalculation Flow
When an item is cancelled from an active KOT by authorized personnel, the system automatically refunds inventory stock and updates financial totals.

```mermaid
flowchart TD
    A[Admin/Manager selects item to cancel in active KOT] --> B{Check User Role}
    B -- Staff L1 --> C[403 Forbidden: Cannot modify KOT]
    B -- Manager L2 / Admin L3 --> D[Find item in KOT & Order]
    D --> E[Increment Bar Inventory stock for refunded quantity]
    E --> F[Remove item from KOT record]
    F --> G[Recalculate Order Subtotal & Grand Total]
    G --> H[Broadcast updated KOT state via Socket.IO to Kitchen Display]
    H --> I[Return updated Order & Inventory state]
```

---

## Key Production Capabilities

### 1. Separation of Concerns Architecture
- **Kitchen Menu (Food Layer):** Fast order fulfillment for kitchen items (Biryanis, Starters, Main Course). Decoupled from stock tracking to eliminate billing latency.
- **Bar Inventory (Stock Layer):** Managed via the `Inventory` collection with real-time stock tracking. Supports bottle-to-peg ratio conversions and automatic stock deductions.
- **Delta Stock Protection:** Prevents double-deduction when converting KOTs to final bills. Stock is deducted during KOT placement, and only newly added items are deducted upon final bill printing.

### 2. Unified Billing & Financial Engine
- Dynamically merges Kitchen Menu and Bar Inventory items into unified multi-category bills.
- Sequential atomic bill numbering (resetting per business day session).
- Full support for discounts, SGST/CGST calculations, and instant settlement.
- Immutability enforcement on settled bills (retains original bill number, date, and business date).

### 3. Kitchen Order Ticket (KOT) System
- Live status tracking across kitchen display screens (Pending ➔ Preparing ➔ Ready ➔ Served).
- Admin/Manager item refund & removal from active KOTs with instant inventory stock restoration.
- Automatic order grand total recalculation upon item modification.

### 4. Daily Stock Tracking & Backfill Engine
- Automated daily stock report generation via `node-cron` schedules.
- Historical backfill engine capable of processing past completed orders to rebuild historical stock snapshots accurately.

### 5. Custom Silent Desktop Print Agent (`HumTum Print Agent`)
- **In-House Native Solution:** Built explicitly for HumTum POS to run locally on client Windows PCs on port `5001`.
- **Zero Third-Party Dependency:** Eliminates third-party software dependencies like QZ Tray.
- **Silent PDF Rendering:** Takes receipt HTML layouts from the POS dashboard, converts them silently to PDF using headless Microsoft Edge/Chrome, and dispatches them directly to local Windows thermal receipt/KOT printers via SumatraPDF.

---

## Security & Role-Based Access Control (RBAC)

The system enforces strict permission boundaries across all API endpoints:

| Role | Level | Accessible Features & Endpoint Permissions |
| :--- | :---: | :--- |
| **Admin** | **L3** | Full system control: Manage users, reset all passwords, clear system cache, edit business settings & tax rates, manage categories, delete menu/inventory items. |
| **Manager** | **L2** | Operational management: Add/edit inventory stock, manage worker profiles & payroll payments, view financial & sales reports, reset Staff passwords. Blocked from Admin cache/settings. |
| **Staff** | **L1** | Billing & POS operations: Take orders, create KOTs, view menu items, search products. Strictly blocked from editing settings, viewing reports, modifying stock, or accessing staff payroll. |

```mermaid
graph LR
    User[Incoming API Request] --> JWT{Valid JWT?}
    JWT -- No --> R401[401 Unauthorized]
    JWT -- Yes --> Role{Check Role}
    
    Role -- Staff L1 --> CheckStaff{Target Endpoint}
    CheckStaff -- Orders / KOT / Menu --> Allow1[200 OK]
    CheckStaff -- Settings / Reports / Inventory edit / Users --> Block1[403 Forbidden]

    Role -- Manager L2 --> CheckMgr{Target Endpoint}
    CheckMgr -- Inventory / Workers / Reports / Staff PW --> Allow2[200 OK]
    CheckMgr -- Admin Cache / System Settings / Reset Admin PW --> Block2[403 Forbidden]

    Role -- Admin L3 --> AllowAll[Full Access 200 OK]
```

---

## Comprehensive Automated Testing & Audit Metrics

The repository includes a comprehensive Jest & Supertest automated audit suite running on an in-memory MongoDB environment.

### Overall Audit Results
- **Test Suites Passed:** `10 / 10` (100% Pass Rate)
- **Total Automated Tests Passed:** `56 / 56` (0 Failures)
- **Suite Execution Time:** `~6.24 seconds`

```
PASS  src/test/rigorous_pos_audit.test.js (24 tests)
PASS  src/test/orders.test.js              (6 tests)
PASS  src/test/tough_audit.test.js         (5 tests)
PASS  src/test/kots_management.test.js      (4 tests)
PASS  src/test/inventoryReport.test.js     (4 tests)
PASS  src/test/cors.test.js                (4 tests)
PASS  src/test/settings.test.js            (2 tests)
PASS  src/test/menu.test.js                (2 tests)
PASS  src/test/auth.test.js                (2 tests)
PASS  src/test/health.test.js              (1 test)
```

### Detailed Test Suite Breakdown

#### 1. Security & RBAC Audit (`rigorous_pos_audit.test.js` & `tough_audit.test.js`) — 29 Tests
- ✅ **Admin Privilege Verification:** Verified Admin can clear cache, update business settings, add/remove settings categories, and reset passwords.
- ✅ **Staff Access Restrictions:** Confirmed Staff (L1) receives `403 Forbidden` when attempting to clear cache, modify settings, create/update inventory items, read/create worker records, view financial reports, or send email summaries.
- ✅ **Manager Password Enforcement:** Verified Manager cannot reset Admin credentials, but is authorized to reset Staff credentials.
- ✅ **Inactive User Blocking:** Inactive user accounts are immediately denied login tokens.

#### 2. Billing & Stock Accuracy Audit (`orders.test.js` & `kots_management.test.js`) — 10 Tests
- ✅ **Stock Deduction & Protection:** Confirmed inventory stock decreases upon KOT creation and verifies zero double-deduction when the final bill is generated.
- ✅ **Delta Deduction:** Verified that when additional items are added after KOT creation, only the newly added item quantities are deducted from inventory upon final bill printing.
- ✅ **KOT Refunds:** Item removal from active KOTs automatically restores exact inventory stock levels and recalculates completed order totals.
- ✅ **Bill Numbering Integrity:** Atomic sequential bill numbering handles high concurrency, business date resets, and retains original numbers during payment settlement.

#### 3. Financial Audit (`tough_audit.test.js`) — 2 Tests
- ✅ **Payment Settlement & Billing Accuracy:** Verified exact subtotal, SGST, CGST, discount, and grand total calculations across settlement methods.
- ✅ **History Settlement Verification:** Verifies payment completion history without mutating original billing parameters.

#### 4. Daily Inventory & Reporting Audit (`inventoryReport.test.js`) — 4 Tests
- ✅ **Stock Adjustment Audit Logs:** Logs manual stock adjustments via API and order finalization deductions.
- ✅ **Historical Backfill:** Successfully backfilled historical stock snapshots across past business days from completed order records.

#### 5. Network & Infrastructure Audit (`cors.test.js`, `settings.test.js`, `auth.test.js`, `health.test.js`, `menu.test.js`) — 11 Tests
- ✅ **CORS Enforcement:** Verified allowance for configured domains, same-origin requests, no-origin clients, and verified HTTP 403 block for unauthorized origins.
- ✅ **Settings & JWT Auth:** Verified token issuance, protected route access (`/auth/me`), health check endpoint (`/health`), and direct printing toggle normalization.

---

## Performance & Load Benchmarks

- **Concurrency Load:** Validated with **100+ parallel order transactions** without race conditions or stock mismatches.
- **Virtual User Capacity:** Stress-tested with **7,500 simulated user sessions** (Artillery test suite).
- **Atomic Operations:** Uses Redis `INCR` for atomic bill numbering and MongoDB `bulkWrite` for instant batch stock updates.

---

## Repository Cleanliness

To maintain a clean production repository:
- ❌ **Removed `check_db.js`:** Obsolete manual debug script removed from source control.
- ❌ **Cleaned OS Metadata:** macOS `.DS_Store` metadata files removed.
- ✅ **Git Hygiene:** Clean working tree free of obsolete scripts or unindexed temporary files.

---

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Lucide Icons, Socket.IO Client
- **Backend:** Node.js, Express 4, Socket.IO
- **Database:** MongoDB Atlas (Mongoose 8)
- **Caching & Atomic Ops:** Upstash Redis (@upstash/redis)
- **Silent Desktop Thermal Printing:** `HumTum Print Agent` (Local Node.js executable + Headless Edge/Chrome + SumatraPDF)
- **Testing:** Jest, Supertest, MongoDB Memory Server

---

## Installation & Setup

### 1. Prerequisites
- Node.js (v18+ recommended)
- MongoDB instance (Local or MongoDB Atlas)
- Upstash Redis account (Optional; system defaults to resilient in-memory fallback)

### 2. Environment Configuration
Create a `.env` file in the root directory:

```env
PORT=3001
CLOUD_MONGO_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/humtum_pos
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_upstash_token
JWT_SECRET=your_jwt_secret_key
ADMIN_EMAIL=admin@humtum.com
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3001
VITE_API_URL=http://localhost:3001
```

### 3. Running Locally

```bash
# Install root dependencies (Backend)
npm install

# Install frontend dependencies
cd frontend && npm install && cd ..

# Run backend test suite (56 tests)
npm test

# Start backend server
npm run dev

# In a separate terminal, start frontend dev server
cd frontend && npm run dev
```

### 4. Running the HumTum Silent Print Agent (Client PC)

```bash
# Navigate to print-agent directory
cd print-agent

# Install dependencies and start
npm install
npm start

# Or build standalone Windows executable
npm run build
```

### 5. Docker Deployment

```bash
docker-compose up --build -d
```

---

## License

Built for **HumTum Bar & Restaurant**. All rights reserved.
