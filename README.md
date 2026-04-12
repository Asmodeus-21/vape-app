# Banana Leaf Store

Banana Leaf Store is a production-ready vape and nicotine commerce platform that combines fast mobile shopping with secure OTP authentication and a high-conversion JuiceFly-style checkout journey.

## Core Features

- OTP Auth: password and email-OTP login/register with verification-based onboarding
- JuiceFly-style UX: conversion-focused banners, mobile-first navigation, and side-cart feedback
- Guest Checkout: complete purchases without account creation, with optional save-details verification
- 3-step Checkout: Shipping, Delivery, and Payment flow with success summary
- Role-aware Experiences: customer, vendor, and admin routing paths

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Express + TypeScript
- Database: PostgreSQL (Supabase compatible)
- Auth: JWT + OTP email verification

## Getting Started

1. Install dependencies

```bash
npm install
```

2. Configure environment

- Copy values from `.env.example` into your local environment file (`.env` or `.env.local`)
- Set required keys such as `DATABASE_URL`, `JWT_SECRET`, and API/email provider keys

3. Start development server

```bash
npm run dev
```

4. Build for production

```bash
npm run build
```

## Useful Scripts

- `npm run dev` - run development server
- `npm run build` - production build
- `npm run lint` - TypeScript no-emit validation
- `npm run verify` - lint + build

## Environment

See `.env.example` for the full list of required and optional environment keys.
