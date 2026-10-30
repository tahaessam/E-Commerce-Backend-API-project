# 📦 E‑commerce API

---

## 📖 Project Overview

This repository contains a **NestJS** based RESTful API for a simple e‑commerce platform.  The API focuses on **user authentication**, **role‑based access control**, and CRUD operations for core domain entities such as **users, brands, categories, products, sellers** and **admin** data.  It demonstrates a clean‑architecture style with clearly separated **controllers**, **services**, **repositories**, and **Mongoose schemas**.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Language | **TypeScript** |
| Runtime / Framework | **NestJS** (v11) |
| Database | **MongoDB** (via **@nestjs/mongoose**) |
| ORM / ODM | **Mongoose** |
| Authentication | **JWT** (`@nestjs/jwt`), **@nestjs/config** for secret management |
| Authorization | Custom **role‑based permissions** (see `src/Permissions/permissions.catalog.ts`)
| Cache | **Redis** (abstracted behind `common/cache` interfaces) |
| Mail | **nodemailer** via `@nestjs-modules/mailer` |
| Validation / DTOs | **class‑validator**, **class‑transformer** |
| Testing | **Jest** (`jest`, `ts‑jest`) for unit and e2e tests |
| Lint / Format | **ESLint**, **Prettier** |
| Build / Run | **Nest CLI**, **npm scripts** |

---

## 🏗️ Architecture

```
src/
├─ admin/               # Admin‑related repositories & schemas
├─ brand/               # Brand domain (controller, service, DTOs, repo, schema)
├─ category/            # Category domain
├─ common/              # Shared utilities (cache, decorators, enums, guards, filters)
│   ├─ cache/
│   ├─ decorators/
│   ├─ enums/
│   ├─ filters/
│   └─ guards/
├─ config/              # Configuration service (environment variables)
├─ customer/            # Customer (aka user) repository & schema
├─ auth/                # Auth controller / service / DTOs
├─ product/             # Product domain
├─ seller/              # Seller domain (repositories, schemas)
├─ user/                # User management (controller, service, DTOs, repo, schema)
└─ Permissions/         # Permission catalog & role‑permission helper
```

### Request Lifecycle (simplified)

```mermaid
flowchart TD
    Client -->|HTTP Request| Router[Nest Router]
    Router -->|Guard (AuthGuard) + RoleGuard| Auth
    Auth -->|Validate JWT| JwtService
    Auth -->|Load role permissions| PermissionsGuard
    PermissionsGuard -->|Check @Roles & @Permissions| Controller
    Controller -->|Call Service| Service
    Service -->|Interact with Repository| Repo
    Repo -->|Mongoose Model| MongoDB
    MongoDB -->|Result| Repo --> Service --> Controller --> Router --> Client
```

---

## ✨ Features

| Feature | Implemented? | Description |
|---------|--------------|-------------|
| **Authentication** | ✅ | Register (email + OTP), login, JWT issuance (access + refresh) |
| **Authorization** | ✅ | Role‑based (`admin`, `seller`, `user`) and fine‑grained permissions defined in `Permissions/permissions.catalog.ts` |
| **User Management** | ✅ | CRUD endpoints for `User` (admin‑only create/update/delete, read for all roles) |
| **Brand Management** | ✅ | CRUD for `Brand` (admin can create/update/delete, read for all) |
| **Category Management** | ✅ | CRUD for `Category` (same permission model) |
| **Product Management** | ✅ | CRUD for `Product` (admin & seller can create/update/delete) |
| **Seller Management** | ✅ | Repositories & schemas exist (no explicit controller yet) |
| **Admin Data** | ✅ | Repositories & schemas exist (no explicit controller yet) |
| **Cache (Redis)** | ✅ | Abstracted via `common/cache` – used for OTP registration flow |
| **Email (OTP)** | ✅ | `mailer` service sends OTP on registration |
| **Testing** | ✅ | Unit tests (`*.spec.ts`) and e2e tests via Jest |

---

## 🚀 Installation & Setup

1. **Prerequisites**
   - Node.js **≥ 20**
   - npm **≥ 10**
   - MongoDB instance (local or remote)
   - Redis instance (optional – required for OTP caching)

2. **Clone the repository**
   ```bash
   git clone <repository‑url>
   cd "E-commerce Project"
   ```

3. **Install dependencies**
   ```bash
   npm ci
   ```

4. **Configure environment variables**
   - Copy the example file and edit as needed:
   ```bash
   cp .env .env.local   # or rename to .env
   ```
   - The only required variable for the core app is `DB_URL`.  See the **Environment Variables** section below for the full list.

5. **Run in development mode**
   ```bash
   npm run start:dev   # nest start --watch
   ```
   The API will be available at `http://localhost:3000`.

6. **Build for production**
   ```bash
   npm run build       # nest build
   npm run start:prod  # node dist/main.js
   ```

---

## 🔧 Environment Variables

Create a `.env` file in the project root.  Below is a minimal example (the file already exists in the repo):

```
# MongoDB connection string
DB_URL=mongodb://127.0.0.1:27017/first-nest-app

# JWT secret (required for token signing)
JWT_SECRET=your‑jwt‑secret

# OTP configuration (used by auth service)
OTP_LENGTH=6
OTP_EXPIRES_IN=300   # seconds

# Redis configuration (optional – used for OTP cache)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

> **Important** – Do **not** commit real secrets to the repository.

---

## 📚 API Documentation

All routes are prefixed with `/api` when the **global prefix** is set in `src/main.ts` (default Nest behaviour).  Below is a summary of the implemented endpoints.

### Auth (`/auth`)
| Method | Route | Description | Auth |
|--------|-------|-------------|------|
| `POST` | `/auth/register` | Register a new customer (sends OTP, caches registration data) | Public |
| `POST` | `/auth/login` | Authenticate a customer and receive `accessToken` & `refreshToken` | Public |

### Users (`/user`)
| Method | Route | Description | Roles | Permissions |
|--------|-------|-------------|-------|------------|
| `POST` | `/user` | Create a new user | `admin` | `user.create` |
| `GET` | `/user` | List all users | `admin`, `seller`, `user` | `user.read` |
| `GET` | `/user/:id` | Get a single user | `admin`, `seller`, `user` | `user.read` |
| `PATCH` | `/user/:id` | Update a user | `admin` | `user.update` |
| `DELETE` | `/user/:id` | Delete a user | `admin` | `user.delete` |

### Brands (`/brand`)
| Method | Route | Description | Roles | Permissions |
|--------|-------|-------------|-------|------------|
| `POST` | `/brand` | Create brand | `admin` | `brand.create` |
| `GET` | `/brand` | List brands | `admin`, `seller`, `user` | `brand.read` |
| `GET` | `/brand/:id` | Get brand | `admin`, `seller`, `user` | `brand.read` |
| `PATCH` | `/brand/:id` | Update brand | `admin` | `brand.update` |
| `DELETE` | `/brand/:id` | Delete brand | `admin` | `brand.delete` |

### Categories (`/category`)
| Method | Route | Description | Roles | Permissions |
|--------|-------|-------------|-------|------------|
| `POST` | `/category` | Create category | `admin` | `category.create` |
| `GET` | `/category` | List categories | `admin`, `seller`, `user` | `category.read` |
| `GET` | `/category/:id` | Get category | `admin`, `seller`, `user` | `category.read` |
| `PATCH` | `/category/:id` | Update category | `admin` | `category.update` |
| `DELETE` | `/category/:id` | Delete category | `admin` | `category.delete` |

### Products (`/product`)
| Method | Route | Description | Roles | Permissions |
|--------|-------|-------------|-------|------------|
| `POST` | `/product` | Create product | `admin`, `seller` | `product.create` |
| `GET` | `/product` | List products (supports query parameters) | `admin`, `seller`, `user` | `product.read` |
| `GET` | `/product/:id` | Get product | `admin`, `seller`, `user` | `product.read` |
| `PATCH` | `/product/:id` | Update product | `admin`, `seller` | `product.update` |
| `DELETE` | `/product/:id` | Delete product | `admin`, `seller` | `product.delete` |

> **DTO validation** is performed using `class-validator` decorators inside each `*dto.ts` file.  Validation errors are transformed into a unified error response format by the global `AllExceptionsFilter`.

---

## 🔐 Authentication Flow

1. **Registration** – `POST /auth/register`
   - Client sends `email`, `password`, optional profile fields.
   - Service checks for existing email, generates a numeric OTP, stores `{otp, user}` in Redis (TTL based on `OTP_EXPIRES_IN`), sends OTP via email.
   - Customer record is created immediately (TODO: email verification before activation).

2. **Login** – `POST /auth/login`
   - Client provides `email` and `password` (password comparison is a TODO in the current code).
   - Service validates existence, then issues:
     - **Access token** (short‑lived, default JWT expiry)
     - **Refresh token** (7‑day expiry)
   - Tokens are signed with the secret from `JWT_SECRET`.

3. **Protected Routes** – All other endpoints are guarded by `AuthGuard` (JWT validation) and `RolesPermissionsGuard` which reads the `@Roles` and `@Permissions` decorators.
   - The guard fetches the user role from the JWT payload and resolves the list of allowed permissions via `getRolePermissions` (see `permissions.catalog.ts`).
   - If the required permission for the route is missing, a `ForbiddenException` is thrown.

---

## 📦 Database Design (Mongoose)

### Core Schemas (found under `src/*/schemas/`)
| Schema | Collection | Key Fields | Validation |
|--------|------------|------------|------------|
| `UserSchema` (`src/user/schemas/user.schema.ts`) | `users` | `username`, `email`, `password`, `role`, `phoneNumber`, … | Required strings, enum `UserRole` |
| `BrandSchema` (`src/brand/schemas/brand.schema.ts`) | `brands` | `name`, `description` | Required `name` |
| `CategorySchema` (`src/category/schemas/category.schema.ts`) | `categories` | `name`, `description` | Required `name` |
| `ProductSchema` (`src/product/schemas/product.schema.ts`) | `products` | `title`, `price`, `brandId`, `categoryId`, `sellerId` | Required `title`, `price` |
| `CustomerSchema` (`src/customer/schemas/customer.schema.ts`) | `customers` | `email`, `password`, `role` | Required `email`, `role` |
| `SellerSchema` (`src/seller/schemas/seller.schema.ts`) | `sellers` | `userId`, `storeName` | Required `userId` |

All schemas use `timestamps: true` (created/updated dates) and are linked via `ObjectId` references where appropriate (e.g., `product.brandId`).

---

## 🛡️ Error Handling & Validation

- **Validation** – DTOs use `class-validator`.  Validation errors are automatically transformed by Nest's built‑in `ValidationPipe`.
- **Global Exception Filter** – `src/common/filters/all-exceptions.filter.ts` catches uncaught exceptions and returns a JSON payload:
  ```json
  {
    "statusCode": <number>,
    "message": "<error description>",
    "timestamp": "<ISO timestamp>",
    "path": "<request path>"
  }
  ```
- **HTTP Status Codes** – Standard Nest conventions are followed (e.g., `404` for NotFound, `400` for BadRequest, `403` for Forbidden, `500` for internal errors).

---

## 🧪 Testing

The project uses **Jest** for both unit and end‑to‑end tests.

| Script | Description |
|--------|-------------|
| `npm test` | Run all unit tests (`*.spec.ts`) |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:cov` | Run tests with coverage report (output in `coverage/`) |
| `npm run test:e2e` | Execute end‑to‑end tests (located in `test/`) |

Tests are defined alongside modules (e.g., `user.service.spec.ts`).  The `jest` config in `package.json` points `rootDir` to `src` and matches `**/*.spec.ts`.

---

## 📦 API Usage Examples (cURL)

### Register a new customer
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@example.com","password":"Secret123"}'
```

### Login and obtain JWTs
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@example.com","password":"Secret123"}'
```
_Response contains `accessToken` and `refreshToken`.

### Create a brand (admin role required)
```bash
TOKEN="<access‑token-from‑login>"
curl -X POST http://localhost:3000/brand \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Acme","description":"Premium brand"}'
```

### List products (any authenticated role)
```bash
curl -H "Authorization: Bearer $TOKEN" http://localhost:3000/product
```

---

## 🚧 Future Improvements

- **Password hashing** – Currently passwords are stored in plain text (TODO in `AuthService`).
- **Email verification flow** – OTP is sent, but the account is created before verification.
- **Seller & Admin Controllers** – Repositories and schemas exist, but public REST endpoints are missing.
- **Pagination & Filtering** – List endpoints return all records; adding pagination would improve scalability.
- **Refresh‑token rotation & revocation** – Enhance security for token lifecycle management.
- **Swagger / OpenAPI** – Automatic API docs generation would aid consumer developers.

---

## 📂 Project Structure (Tree)

```text
E-commerce Project/
├─ .env                 # environment variables example
├─ .gitignore
├─ eslint.config.mjs
├─ nest-cli.json
├─ package.json
├─ tsconfig.json
├─ tsconfig.build.json
├─ src/
│   ├─ admin/
│   │   ├─ repositories/
│   │   └─ schemas/
│   ├─ brand/
│   │   ├─ brand.controller.ts
│   │   ├─ brand.service.ts
│   │   ├─ dto/
│   │   ├─ interfaces/
│   │   ├─ repositories/
│   │   └─ schemas/
│   ├─ category/
│   │   └─ ... (controller, service, dto, repo, schema)
│   ├─ common/
│   │   ├─ cache/        # Cache interface & Redis implementation
│   │   ├─ decorators/   # @IsPublic, @Roles, @Permissions, @BodyValidator
│   │   ├─ enums/        # UserRole, ProviderRole
│   │   ├─ filters/      # Global exception filter
│   │   └─ guards/       # AuthGuard, RolesPermissionsGuard
│   ├─ config/
│   │   └─ configuration.ts
│   ├─ customer/
│   │   ├─ repositories/customer.repo.ts
│   │   └─ schemas/customer.schema.ts
│   ├─ auth/
│   │   ├─ auth.controller.ts
│   │   ├─ auth.service.ts
│   │   └─ dto/ (register, login, update)
│   ├─ product/
│   │   └─ ... (controller, service, dto, repo, schema)
│   ├─ seller/
│   │   ├─ repositories/seller.repo.ts
│   │   └─ schemas/seller.schema.ts
│   ├─ user/
│   │   ├─ user.controller.ts
│   │   ├─ user.service.ts
│   │   ├─ dto/ (create, update)
│   │   ├─ repositories/user.repo.ts
│   │   └─ schemas/user.schema.ts
│   ├─ Permissions/permissions.catalog.ts
│   └─ main.ts
└─ test/                # e2e test configuration
```

---