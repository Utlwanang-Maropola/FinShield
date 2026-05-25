# FinShield – AI-Powered Financial Fraud & Spending Insights Platform

A full-stack fintech web application for transaction analytics, anomaly/fraud detection, and AI-generated financial insights. Built with **Angular 19**, **TypeScript**, **ASP.NET Core 10 Web API**, and **C#**.

---

## Overview

FinShield simulates a lightweight banking analytics platform where users can manage transactions, receive intelligent spending insights, and get alerted to suspicious financial activity — all backed by a clean, layered API.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Angular 19, TypeScript, Angular Material |
| Backend | ASP.NET Core 10 Web API, C# |
| ORM | Entity Framework Core 10 |
| Database | SQL Server (LocalDB for dev) |
| Auth | JWT Bearer Tokens, Role-based (User / Admin) |
| Architecture | Clean Architecture (Core / Infrastructure / API) |
| Detection | Rule-based anomaly engine + Z-score outlier detection |

---

## Features

### User Features
- **Authentication** — Register/login with JWT auth; roles: `User`, `Admin`
- **Transaction Management** — Add, edit, delete transactions; CSV bulk import
- **Spending Analytics Dashboard** — Monthly trends, category breakdown, savings rate
- **Fraud & Anomaly Alerts** — Real-time suspicious transaction flagging
- **AI Financial Insights** — Rule-based natural language spending analysis

### Admin Features
- View system-wide stats (total users, transactions, flagged alerts)
- Monitor and resolve flagged transactions across all users
- Suspend and activate user accounts

---

## Anomaly Detection Engine

The `FraudDetectionService` scores every transaction across 5 independent rules:

| Rule | Trigger |
|---|---|
| Large Transaction | Amount > 3× user's 30-day average |
| Spending Spike | Same category spending up >200% vs prior month |
| Velocity Check | 5+ transactions within 10 minutes |
| Unusual Hour | Transaction between 01:00–04:00 |
| Z-Score Outlier | Amount > 2.5 standard deviations from user mean |

Each rule contributes to a composite `RiskScore` (0–100). Score ≥ 40 = `FraudAlert` created automatically.

---

## AI Insights Engine

The `InsightsService` generates natural-language financial summaries per user per month:

- Category spend change vs prior month (percentage increase/decrease)
- Budget overspend warnings
- Savings rate commentary
- Top spending category callout

All rule-based — no external API dependency. Designed for easy upgrade to OpenAI later.

---

## Project Structure

```
FinShield/
├── backend/
│   ├── FinShield.API/
│   │   ├── Controllers/        # Auth, Transactions, Fraud, Insights, Dashboard, Admin
│   │   ├── DTOs/               # Request/Response records
│   │   ├── Middleware/         # Global exception handler
│   │   └── Program.cs          # DI, JWT, CORS, OpenAPI config
│   ├── FinShield.Core/
│   │   ├── Entities/           # AppUser, Transaction, FraudAlert, Budget, Insight
│   │   ├── Interfaces/         # Repository and service contracts
│   │   └── Services/           # FraudDetectionService, InsightsService, DashboardService
│   └── FinShield.Infrastructure/
│       ├── Data/               # FinShieldDbContext (EF Core)
│       └── Repositories/       # EF Core repository implementations
└── FinShield.Client/           # Angular 19 frontend
    └── src/app/
        ├── core/               # Auth service, JWT interceptor, guards, models
        ├── features/
        │   ├── auth/           # Login, Register
        │   ├── dashboard/      # Analytics dashboard
        │   ├── transactions/   # Transaction CRUD + CSV import
        │   ├── fraud/          # Fraud alerts view
        │   ├── insights/       # AI insights feed
        │   └── admin/          # Admin panel
        └── shared/             # Reusable components
```

---

## Getting Started

### Prerequisites
- .NET 10 SDK
- Node.js 20+
- Angular CLI: `npm install -g @angular/cli`
- SQL Server LocalDB (ships with Visual Studio)

### Backend Setup

```bash
# 1. Open FinShield.sln in Visual Studio

# 2. Run EF Core migrations in Package Manager Console
Add-Migration InitialCreate -Project FinShield.Infrastructure -StartupProject FinShield.API
Update-Database -Project FinShield.Infrastructure -StartupProject FinShield.API

# 3. Run the API (F5 in Visual Studio)
# API → https://localhost:7207
# OpenAPI docs → https://localhost:7207/openapi/v1.json
# Scalar UI → https://localhost:7207/scalar/v1
```

### Frontend Setup

```bash
cd FinShield.Client
npm install
ng serve --proxy-config proxy.conf.json
# App → http://localhost:4200
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Get JWT token |
| GET | `/api/transactions` | List user transactions |
| POST | `/api/transactions` | Add transaction + run fraud detection |
| POST | `/api/transactions/import/csv` | Bulk import from CSV |
| GET | `/api/fraud` | Get user fraud alerts |
| PATCH | `/api/fraud/{id}/resolve` | Resolve an alert |
| GET | `/api/insights` | Get saved insights |
| POST | `/api/insights/generate` | Regenerate insights |
| GET | `/api/dashboard/summary` | Full dashboard analytics |
| GET | `/api/admin/summary` | Admin system stats |
| GET | `/api/admin/users` | All users (Admin only) |
| GET | `/api/admin/alerts` | All fraud alerts (Admin only) |

---

## CSV Import Format

```
Date,Amount,Type,Category,Description,MerchantName
2026-05-01,25000,Income,Salary,May salary,
2026-05-03,1500,Expense,Food & Groceries,Groceries,Woolworths
2026-05-05,900,Expense,Transport,Uber,Uber
```

---

## Creating an Admin Account

After registering, run this SQL against `FinShieldDb`:

```sql
UPDATE Users SET Role = 'Admin' WHERE Email = 'your@email.com'
```

Log out and back in — the Admin panel will appear in the sidebar.

---

## Author

Built as a personal project to demonstrate full-stack .NET + Angular development with clean architecture, domain-driven design, and financial analytics.
