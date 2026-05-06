# StayFresh-B2B-Portal

A full-stack B2B e-commerce platform for managing fresh produce (fruits and vegetables) orders. The system supports two roles: **staff** who manage inventory and orders, and **clients** (other businesses) who browse products and place orders.

## Visit StayFresh [here](https://stayfreshportal.netlify.app/)

![An Image of 'ADMIN' dashboard](./img/dashboard-final.jpg)

---

## Features

- **Authentication**: JWT-based login and client signup with company registration
- **Product Management**: Staff can create, update, soft-delete, and search/filter products by category (FRUIT / VEGETABLE)
- **Inventory Tracking**: Real-time stock management with purchase price and sale price per product
- **Shopping Cart**: Clients add products to cart, adjust quantities, and place orders
- **Order Management**: Full order lifecycle: PLACED → TRANSIT → COMPLETE, with cancellation support
- **Stock Control**: Atomic stock deduction on order placement; automatic restoration on cancellation (PostgreSQL `FOR UPDATE` locking)
- **Role-Based Access**: Staff see all data and manage orders; clients see only active products (without purchase prices) and their own orders
- **Dashboard Stats**: Staff home shows active product count, pending orders, and total orders

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js (ES modules) |
| Backend framework | Express.js |
| Database | PostgreSQL (Neon) via `pg` |
| Authentication | JWT (`jsonwebtoken`) + `bcrypt` |
| Validation | `express-validator` |
| Frontend framework | React 19 |
| Build tool | Vite |
| Routing | React Router v7 |
| Styling | Tailwind CSS |
| Icons | lucide-react |
| Notifications | react-toastify |
| Package manager | Bun |

---

## Project Structure

```
StayFreshB2B/
├── backend/
│   ├── server.js               # Express app, middleware, route registration
│   ├── db.js                   # PostgreSQL connection pool
│   ├── queries.js              # Database seed script
│   ├── controllers/
│   │   ├── authController.js   # Signup / login
│   │   ├── productController.js# Product CRUD, stats, soft delete
│   │   └── orderController.js  # Order placement, status transitions
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   └── orderRoutes.js
│   ├── middleware/
│   │   ├── verifyToken.js      # JWT verification
│   │   ├── requireStaff.js     # Role guard
│   │   └── errorHandler.js     # Centralised error responses
│   ├── validators/
│   │   ├── authValidator.js
│   │   └── productValidator.js
│   ├── .env.example
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx             # Route definitions, PrivateRoute wrappers
    │   ├── context/
    │   │   ├── AuthContext.jsx # Auth state (token, user, login/logout)
    │   │   └── CartContext.jsx # Cart state (items, totals, operations)
    │   ├── services/           # API call helpers (auth, products, orders)
    │   ├── pages/              # Login, SignUp, Home, Cart, Orders, OrderDetail, etc.
    │   ├── components/         # Navbar, SearchBar, ProductRow, ConfirmModal, etc.
    │   └── utils/
    │       └── formatStatus.js
    ├── .env.example
    ├── vite.config.js
    └── package.json
```

---

## Getting Started

### Prerequisites

- Node.js >= 18 or [Bun](https://bun.sh)
- A PostgreSQL database (e.g. [Neon](https://neon.tech))

---

### Backend

```bash
cd StayFreshB2B/backend
bun install          # or: npm install

cp .env.example .env
# Edit .env and set:
#   DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
#   JWT_SECRET=<long_random_hex_string>

bun run dev          # development (watch mode)
# or
node server.js       # production
```

The server starts on **http://localhost:3000**.

#### Seed the database

```bash
node queries.js
# or
bun queries.js
```

This creates the tables and inserts sample products and users.

| Role | Email | Password |
|---|---|---|
| Staff | staff@fresh.com | staff123 |
| Client | abc@super.com | password123 |
| Client | starmart@market.com | password123 |

---

### Frontend

```bash
cd StayFreshB2B/frontend
bun install          # or: npm install

cp .env.example .env
# Edit .env and set:
#   VITE_BACKEND_HOST=http://localhost:3000/api

bun run dev          # starts Vite dev server (default: http://localhost:5173)
bun run build        # production build → dist/
bun run lint         # ESLint
```

---

## API Reference

All endpoints are prefixed with `/api`. Protected routes require:

```
Authorization: Bearer <jwt_token>
```

### Auth

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/auth/signup` | Public | Register a new client account |
| POST | `/auth/login` | Public | Login; returns JWT token |

### Products

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/products` | All | List active products (`?search=term`) |
| GET | `/products/stats` | Staff | Dashboard stats |
| GET | `/products/:id` | Staff | Single product detail |
| POST | `/products` | Staff | Create a product |
| PUT | `/products/:id` | Staff | Update a product |
| DELETE | `/products/:id` | Staff | Soft-delete a product |

### Orders

| Method | Path | Access | Description |
|---|---|---|---|
| GET | `/orders` | All | List orders (`?status=PLACED,TRANSIT`) |
| GET | `/orders/:id` | All | Order details with line items |
| POST | `/orders` | Client | Place an order from cart |
| PATCH | `/orders/:id/status` | All | Update order status |

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Returns `{ ok: true }` |

---

## Database Schema

```
users          id, email, hashed_password, role (Staff | Client)
clients        id, user_id, company_name, company_address, uen, contact_number
products       id, code, description, price, sale_price, uom, stock, category, is_active
orders         id, user_id, status (PLACED | TRANSIT | CANCELLED | COMPLETE)
order_items    id, order_id, product_id, quantity, unit_price
```

- Products are **soft-deleted** (`is_active = false`) to preserve order history.
- `unit_price` on `order_items` is a snapshot of `sale_price` at the time of ordering.

---

## Order Status Transitions

```
PLACED → TRANSIT  (staff)
TRANSIT → COMPLETE (staff)
PLACED → CANCELLED (staff or client)
TRANSIT → CANCELLED (staff or client)
```

Cancelling an order automatically restores product stock in the same database transaction.

---

## Environment Variables

### Backend `.env`

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `JWT_SECRET` | Secret key for signing JWTs |

### Frontend `.env`

| Variable | Description |
|---|---|
| `VITE_BACKEND_HOST` | Backend API base URL (e.g. `http://localhost:3000/api`) |

## Wireframes
Refer to [Wireframes](./docs/wireframes.md)

## Attributions

Refer to [Attributions](./docs/attributions.md)

## Next Steps
- Batch tracking
- Expiry dates
- Image handling for product images
- Page for damaged/ spoiled inventory write-offs
- Password reset (2 endpoints: `/auth/forgot-password` and `/auth/reset-password`)
- Pagination of product list and order list
- Address technical debt by migrating commented-out experimental logic to a dedicated reference file.