# E-commerce Backend API

A RESTful e-commerce backend built with **NestJS, TypeScript, MongoDB, and Redis**. The project demonstrates modular backend architecture, JWT authentication, email OTP verification, role-based permissions, seller-owned product management, request validation, and automated tests.

## Tech stack

- **Runtime:** Node.js 22+
- **Framework:** NestJS 11
- **Language:** TypeScript
- **Database:** MongoDB with Mongoose
- **Cache:** Redis (OTP state and refresh-token rotation)
- **Authentication:** JWT access and refresh tokens, bcrypt password hashing
- **Authorization:** Role and permission guards
- **Validation:** class-validator and class-transformer
- **Email:** NestJS Mailer / Nodemailer
- **Testing:** Jest, Supertest
- **CI:** GitHub Actions

## Architecture

The application follows NestJS modular architecture with clear separation of responsibilities:

```text
src/
├── app/                 # Root application module and controller
├── auth/                # Registration, OTP, login, refresh tokens
├── user/                # Administrative user management
├── customer/            # Customer discriminator and repository
├── seller/              # Seller discriminator and repository
├── admin/               # Admin discriminator and repository
├── product/             # Product API, business rules, DTOs and tests
├── brand/               # Brand management
├── category/            # Category management
├── common/
│   ├── cache/           # Redis cache adapter and cache port
│   ├── decorators/      # Public, role and permission decorators
│   ├── enums/
│   ├── filters/
│   ├── guards/          # JWT and role/permission guards
│   └── helpers/         # Password and OTP helpers
├── config/              # Environment configuration
├── database/            # Shared Mongoose models and repositories
└── Permissions/         # Role-to-permission catalog
```

**Request flow:** HTTP request → global authentication guard → role/permission guard → validation pipe → controller → service → repository → MongoDB / Redis.

## Features

### Authentication
- Customer registration with email OTP verification.
- OTP values are stored as HMAC digests, not plaintext.
- Passwords are bcrypt-hashed before pending registration data is cached.
- Login verifies credentials and account verification status.
- Access and refresh tokens use separate signing secrets.
- Refresh tokens are rotated and tracked in Redis.
- OTP verification attempts and resend requests are rate-limited.

### Authorization
- Roles: `admin`, `seller`, and `user`.
- Route-level `@Roles` and `@Permissions` enforcement.
- Public registration always creates a regular customer; clients cannot choose privileged roles.
- User administration endpoints are restricted to administrators.

### Products
- Product CRUD with category, brand, and seller reference validation.
- Sellers can create products only for their own account.
- Sellers can update or delete only products they own.
- Product ownership cannot be reassigned through update DTOs.
- Availability, rating, and sold-count values are server-controlled.
- Search input is escaped before being used in a MongoDB regular expression.
- Price range validation is applied to product filtering.

## Getting started

### Prerequisites

- Node.js 22 or later
- npm
- MongoDB
- Redis
- SMTP credentials for sending verification emails

### Installation

```bash
git clone https://github.com/tahaessam/E-Commerce-Backend-API-project.git
cd E-Commerce-Backend-API-project
npm install
```

### Environment configuration

Copy the example file:

**PowerShell**
```powershell
Copy-Item .env.example .env
```

**macOS / Linux**
```bash
cp .env.example .env
```

Update the database, Redis, mail, and secret values in `.env`. Generate independent secrets (run once for each secret):

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

Use separate values for `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `REFRESH_HMAC_SECRET`, and `OTP_HMAC_SECRET`. Each must be at least 32 characters. Never commit your real `.env` file or production secrets.

### Run the application

```bash
npm run start:dev
```

The API listens on port `3000` by default. Set `PORT` to change it. Routes are **not** prefixed with `/api`.

### Build and run production output

```bash
npm run build
npm run start:prod
```

## Environment variables

| Variable | Purpose |
|---|---|
| `PORT` | HTTP port (default: `3000`) |
| `DB_URL` | MongoDB connection string |
| `REDIS_URL` | Redis connection string |
| `JWT_ACCESS_SECRET` | Access-token signing secret |
| `JWT_ACCESS_EXPIRES_IN` | Access-token lifetime (e.g. `15m`) |
| `JWT_REFRESH_SECRET` | Refresh-token signing secret |
| `JWT_REFRESH_EXPIRES_IN` | Refresh-token lifetime (e.g. `7d`) |
| `REFRESH_HMAC_SECRET` | HMAC secret for refresh-token cache records |
| `REFRESH_TOKEN_TTL_SECONDS` | Redis lifetime for refresh-token records (default: `604800`) |
| `OTP_HMAC_SECRET` | HMAC secret for OTP digests |
| `OTP_LENGTH` | Numeric OTP length (default: `6`) |
| `OTP_EXPIRES_IN` | OTP lifetime in seconds (default: `300`) |
| `MAIL_HOST` | SMTP host |
| `MAIL_PORT` | SMTP port (default: `587`) |
| `MAIL_SECURE` | Whether SMTP uses TLS |
| `MAIL_USER` / `MAIL_PASS` | SMTP credentials |
| `MAIL_FROM` | Sender address |
| `S3_ACCESS_KEY` / `S3_SECRET_KEY` / `S3_BUCKET_NAME` | Optional object-storage configuration |

## API routes

All routes below are relative to the server origin (for example, `http://localhost:3000`). Protected routes require:

```http
Authorization: Bearer <accessToken>
```

### Authentication

| Method | Route | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Start customer registration and send OTP |
| POST | `/auth/verify-otp` | Public | Verify the email OTP and activate registration |
| POST | `/auth/resend-otp` | Public | Resend a verification OTP |
| POST | `/auth/login` | Public | Authenticate and receive access / refresh tokens |
| POST | `/auth/refresh` | Public | Rotate refresh token and issue a new token pair |

Registration body:

```json
{
  "email": "customer@example.com",
  "username": "customer",
  "password": "a-strong-password",
  "phoneNumber": "+201000000000"
}
```

OTP verification body:

```json
{
  "email": "customer@example.com",
  "otp": "123456"
}
```

Refresh body:

```json
{
  "refreshToken": "<refresh-token>"
}
```

### Products

| Method | Route | Roles | Description |
|---|---|---|---|
| POST | `/product` | admin, seller | Create a product |
| GET | `/product` | admin, seller, user | List / filter products |
| GET | `/product/:id` | admin, seller, user | Get a product |
| PATCH | `/product/:id` | admin, owning seller | Update a product |
| DELETE | `/product/:id` | admin, owning seller | Delete a product |

Product listing supports `search`, `category`, `brand`, `seller`, `minPrice`, `maxPrice`, and `isAvailable` query parameters.

A seller's identity is taken from the authenticated token; the seller cannot create or manage products under another seller's ID. Administrators must provide a seller ID when creating a product.

### Brands and categories

| Resource | Method | Route | Roles |
|---|---|---|---|
| Brands | POST | `/brand` | admin |
| Brands | GET | `/brand` | admin, seller, user |
| Brands | GET | `/brand/:id` | admin, seller, user |
| Brands | PATCH | `/brand/:id` | admin |
| Brands | DELETE | `/brand/:id` | admin |
| Categories | POST | `/category` | admin |
| Categories | GET | `/category` | admin, seller, user |
| Categories | GET | `/category/:id` | admin, seller, user |
| Categories | PATCH | `/category/:id` | admin |
| Categories | DELETE | `/category/:id` | admin |

### User administration

| Method | Route | Roles | Description |
|---|---|---|---|
| GET | `/user` | admin | List users |
| GET | `/user/:id` | admin | Get a user |
| PATCH | `/user/:id` | admin | Update username / phone number |
| DELETE | `/user/:id` | admin | Delete a user |

Public user creation is handled through the verified registration flow. There is no unrestricted `POST /user` endpoint.

## Validation and error handling

A global NestJS `ValidationPipe` enables transformation, removes non-whitelisted properties, and rejects unknown request fields. A global exception filter standardizes error responses.

## Testing

```bash
# Unit tests
npm test -- --runInBand

# End-to-end tests (requires MongoDB and Redis)
npm run test:e2e -- --runInBand

# Production build
npm run build
```

The GitHub Actions workflow runs the production build, unit tests, and e2e tests. The e2e job provisions MongoDB and Redis service containers.

## Project status

This repository is under active development. Authentication integration coverage, complete API documentation, pagination, and a fully regenerated committed dependency lockfile remain areas for further work.
