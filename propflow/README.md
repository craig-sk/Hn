# 🏠 PropFlow – Commercial Real Estate SaaS Platform

> React + Node.js + Express + Supabase · Deployed on AWS

A full-stack, production-ready SaaS platform for commercial property management with dual portals (Agent/Admin + Public), AI chatbot, real-time enquiry tracking, and analytics.

---

## 📐 Architecture

```
┌─────────────────────────────────────────────────────┐
│                   CloudFront CDN                     │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │   Application Load Balancer  │
        └──────────────┬──────────────┘
                       │
        ┌──────────────┴──────────────┐
        │      EC2 / Docker           │
        │  ┌──────────────────────┐   │
        │  │  Nginx (reverse proxy)│   │
        │  └──────┬───────────────┘   │
        │  ┌──────┴──────┐            │
        │  │ React SPA   │  (dist/)   │
        │  └─────────────┘            │
        │  ┌─────────────┐            │
        │  │ Express API │  :5000     │
        │  └──────┬──────┘            │
        └─────────┼───────────────────┘
                  │
    ┌─────────────┴────────────┐
    │        Supabase          │
    │  PostgreSQL + Auth + RLS │
    └──────────────────────────┘
    
    AWS S3 (property images)
    Anthropic Claude (AI chat)
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 22+
- Docker & Docker Compose
- Supabase account (free tier works)
- Anthropic API key

### 1. Clone & Install
```bash
git clone https://github.com/yourorg/propflow.git
cd propflow
npm run install:all
```

### 2. Set up Supabase
1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste contents of `infra/supabase-schema.sql` → Run
3. Copy your Project URL and keys from **Settings → API**

### 3. Configure Environment

**Backend** (`backend/.env`):
```bash
cp backend/.env.example backend/.env
# Fill in: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY
```

**Frontend** (`frontend/.env.local`):
```bash
cp frontend/.env.example frontend/.env.local
# Fill in: VITE_API_URL, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```

### 4. Create First Admin User
1. Go to Supabase Dashboard → Authentication → Users → Add User
2. Enter email: `admin@propflow.co.za` and a password
3. Copy the UUID from the users list
4. Run in Supabase SQL Editor:
```sql
INSERT INTO public.users (id, email, full_name, role)
VALUES ('<your-uuid>', 'admin@propflow.co.za', 'Admin User', 'admin');
```

### 5. Run Development
```bash
npm run dev
# Backend: http://localhost:5000
# Frontend: http://localhost:3000
```

---

## 📁 Project Structure

```
propflow/
├── backend/
│   └── src/
│       ├── index.js              # Express entry point
│       ├── config/
│       │   └── supabase.js       # DB client
│       ├── middleware/
│       │   ├── auth.middleware.js
│       │   └── validate.middleware.js
│       ├── routes/
│       │   ├── auth.routes.js
│       │   ├── listings.routes.js
│       │   ├── enquiries.routes.js
│       │   ├── agents.routes.js
│       │   ├── analytics.routes.js
│       │   ├── chat.routes.js    # Claude AI
│       │   └── uploads.routes.js # S3 presigned URLs
│       └── controllers/
│           └── listings.controller.js
│
├── frontend/
│   └── src/
│       ├── App.jsx               # Routes + auth guards
│       ├── lib/
│       │   ├── api.js            # Axios + interceptors
│       │   └── store.js          # Zustand state
│       ├── pages/
│       │   ├── auth/             # Login, ForgotPassword
│       │   ├── admin/            # Dashboard, Listings, Enquiries, Agents, Analytics, Settings
│       │   └── public/           # Home, SearchResults, ListingDetail
│       └── components/
│           ├── admin/            # AdminLayout, sidebar
│           ├── public/           # PublicLayout, PublicNav
│           └── chat/             # ChatWidget (AI)
│
└── infra/
    ├── supabase-schema.sql       # Complete DB schema + RLS
    ├── docker/
    │   └── backend.Dockerfile
    ├── nginx/
    │   └── nginx.conf
    └── aws/
        └── DEPLOY.md             # Full AWS deployment guide
```

---

## 🔑 API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Agent/admin login |
| POST | `/api/auth/logout` | Invalidate session |
| GET  | `/api/auth/me` | Current user profile |
| POST | `/api/auth/register` | Create agent (admin only) |
| POST | `/api/auth/forgot-password` | Send reset email |

### Listings
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/listings` | Public | Search with filters |
| GET | `/api/listings/:id` | Public | Single listing detail |
| GET | `/api/listings/admin/all` | Agent/Admin | All listings with all statuses |
| POST | `/api/listings` | Agent/Admin | Create listing |
| PUT | `/api/listings/:id` | Agent/Admin | Update listing |
| PATCH | `/api/listings/:id/status` | Agent/Admin | Update status |
| DELETE | `/api/listings/:id` | Admin | Delete listing |

### Enquiries
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/enquiries` | Public | Submit enquiry |
| GET | `/api/enquiries` | Agent/Admin | Inbox with filters |
| PATCH | `/api/enquiries/:id/status` | Agent/Admin | Update status |

### AI Chat
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/chat` | Public | Send message to Claude AI |

---

## 🚢 Production Deployment

See [`infra/aws/DEPLOY.md`](infra/aws/DEPLOY.md) for the full AWS guide.

### Quick Docker Deploy
```bash
# Build frontend
cd frontend && npm run build && cd ..

# Build & start containers
docker-compose up -d

# Check logs
docker-compose logs -f
```

---

## 🔐 Security Features
- Supabase Auth with JWT tokens
- Row Level Security (RLS) on all tables
- Role-based access control (admin / agent)
- Helmet.js security headers
- Rate limiting (global + per-endpoint)
- Input validation with express-validator
- CORS whitelisting
- Nginx TLS termination

---

## 🤖 AI Chat
Powered by **Anthropic Claude Sonnet**. The chat widget:
- Maintains conversation history per session
- Can be enriched with listing context (when viewing a property)
- Has rate limiting (20 req/min per IP)
- Logs token usage for monitoring
- Falls back gracefully on API errors

---

## 📊 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, React Query, Zustand, Recharts |
| Backend | Node.js 22, Express 4, express-validator |
| Database | Supabase (PostgreSQL 15) |
| Auth | Supabase Auth (JWT) |
| AI | Anthropic Claude Sonnet |
| Image Storage | AWS S3 (presigned URLs) |
| Hosting | AWS EC2 + ALB + CloudFront |
| Proxy | Nginx |
| Containerization | Docker + Docker Compose |
| CI/CD | GitHub Actions → ECR → EC2 (add your own) |
