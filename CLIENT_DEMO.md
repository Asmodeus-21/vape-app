# VapesHub Live Demo Package

## 1. Production URL (Vercel)

- Main demo site (replace with actual URL once deployed):
  - `https://YOUR-PROJECT-NAME.vercel.app`

- API base URL (if different):
  - `https://YOUR-PROJECT-NAME.vercel.app/api`


## 2. Environments & Data Seed

The server is configured with these published defaults:
- `NODE_ENV=production`
- `GEMINI_API_KEY` (optional) - leave unset for no AI chat or set it for demo AI as you wish.

The product dataset uses Juicy Fly pricing (Foger, Utbar, Flum Mello, Hydroxie, Blues, Zyns, etc.) and is seeded automatically from `db/seed.ts` during startup. The `/api/products` path supports full listing, search, filter, paging, and sort.


## 3. Demo Logins (pre-created accounts)

### Admin user
- Email: admin@vapeshub.test
- Password: `Admin@1234`
- Role: `admin`
- Access: `/admin`, `/api/admin/*`, any vendor management and price update tool

### Vendor user
- Email: vendor@vapeshub.test
- Password: `Vendor@1234`
- Role: `vendor`
- Access: `/vendor`, `/api/vendor/*`, product add/edit/delete

### Customer user
- Email: customer@vapeshub.test
- Password: `Customer@1234`
- Role: `customer`
- Access: browsing, checkout, profile, order history


## 4. Login / Quick URL Map

- Website homepage: `https://YOUR-PROJECT-NAME.vercel.app`
- Login page: `https://YOUR-PROJECT-NAME.vercel.app/login`
- Product browsing: `https://YOUR-PROJECT-NAME.vercel.app/products`
- Product details: `https://YOUR-PROJECT-NAME.vercel.app/products/:id`
- Admin dashboard: `https://YOUR-PROJECT-NAME.vercel.app/admin`
- Vendor dashboard: `https://YOUR-PROJECT-NAME.vercel.app/vendor`
- User profile: `https://YOUR-PROJECT-NAME.vercel.app/profile`


## 5. API Health Checks

### (1) Products listing
`GET /api/products`

### (2) Product details
`GET /api/products/:id`

### (3) Auth register
`POST /api/auth/register` body: `{ email, password, name, role }`

### (4) Auth login
`POST /api/auth/login` body: `{ email, password }`

### (5) Admin stats (auth token required)
`GET /api/admin/stats`


## 6. Frontend billing path (+ cart)

- Add to cart: product cards on listing/detail pages
- Checkout: `/checkout`
- The checkout flow submits to `/api/orders/checkout` with bearer token


## 7. Optional testing entrypoints

### Smoke tests (locally)
- `npm run build`
- `npm run preview`
- `npm test` (if tests exist in future)

### Manual API test
- Via curl: `curl -s https://YOUR-PROJECT-NAME.vercel.app/api/products | jq '. | length'`


## 8. Credentials security note
For client demos, use short-lived credentials and rotate them after the walkthrough. Deploy into a team-managed Vercel account and share access using the Vercel Invite flow.

---

### Ready To Share
1. Replace placeholder domain with actual Vercel URL.
2. Paste this as the email delivery content.
3. Confirm the admin/vendor/customer users exist in the production DB.
4. Add the `GEMINI_API_KEY` value in Vercel environment settings if AI chat is required.

---

### Vercel Links
- Vercel project: `https://vercel.com/YOUR-USERNAME/YOUR-PROJECT-NAME`
- Dashboard environment variables: `https://vercel.com/YOUR-USERNAME/YOUR-PROJECT-NAME/settings/environment-variables`
- Deployments view: `https://vercel.com/YOUR-USERNAME/YOUR-PROJECT-NAME/deployments`
