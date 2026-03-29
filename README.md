# VapesHub - Premium Tobacco & Vapor Product Marketplace

<div align="center">
<img width="1200" height="475" alt="VapesHub Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

A modern, production-ready e-commerce platform for tobacco and vapor products, built with React, TypeScript, and Express.js. Features comprehensive legal compliance, advanced QA infrastructure, and seamless deployment to Vercel.

## 🚀 Features

### Core Functionality
- **Product Marketplace**: Browse and purchase premium tobacco/vapor products
- **User Authentication**: Secure JWT-based authentication with role management
- **Vendor Dashboard**: Retailer management system for product listings and orders
- **Admin Dashboard**: Global analytics and user/product management
- **AI-Powered Chat**: Integrated Gemini AI assistant for customer support
- **Responsive Design**: Mobile-first design with premium UI/UX

### Legal Compliance
- **Age Verification**: 21+ age gate with comprehensive health warnings
- **Terms of Service**: Complete legal terms covering liability and user rights
- **Privacy Policy**: GDPR/CCPA compliant data protection policies
- **Age Policy**: Tobacco-specific compliance and health information
- **Surgeon General Warnings**: Required FDA health warnings for tobacco products

### Production Readiness
- **SPA Routing**: Client-side routing with direct link support
- **SEO Optimization**: XML sitemaps and meta tag management
- **Performance Monitoring**: Lighthouse audits and performance tracking
- **Uptime Monitoring**: Automated health checks and alerting
- **Smoke Testing**: Automated end-to-end functionality verification
- **Build Optimization**: Vite-based production builds with code splitting

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS, Framer Motion
- **Backend**: Express.js, SQLite, JWT Authentication
- **AI**: Google Gemini API integration
- **Build**: Vite, Vercel deployment
- **Testing**: Lighthouse, Puppeteer, Playwright
- **Database**: Better SQLite3 with migration support

## 📋 Prerequisites

- Node.js 18+
- npm or yarn
- Gemini API key (for AI features)

## 🚀 Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd vape-app
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.local.example .env.local
   # Add your GEMINI_API_KEY to .env.local
   ```

3. **Database Setup**
   ```bash
   npm run seed
   ```

4. **Development**
   ```bash
   npm run dev
   ```

5. **Production Build**
   ```bash
   npm run build
   npm run preview
   ```

## 🧪 Quality Assurance

### Automated Testing Suite

```bash
# Generate SEO sitemap
npm run qa:sitemap

# Performance audit with Lighthouse
npm run qa:performance

# Smoke tests for core functionality
npm run qa:smoke

# Uptime monitoring (one-time check)
npm run qa:uptime

# Continuous uptime monitoring
npm run qa:uptime:monitor

# Run all QA checks
npm run qa:all

# CI pipeline (build + all QA)
npm run qa:ci
```

### QA Reports

All QA tools generate detailed reports in the following directories:
- `dist/sitemap.xml` - XML sitemap for SEO
- `dist/sitemap.html` - Human-readable sitemap
- `reports/` - Performance audits, smoke test results
- `logs/` - Uptime monitoring logs

## 📦 Deployment

### Vercel Deployment

1. **Connect Repository**
   - Import your GitHub repository to Vercel
   - Configure build settings:
     - Build Command: `npm run build`
     - Output Directory: `dist`
     - Install Command: `npm install`

2. **Environment Variables**
   - Set `GEMINI_API_KEY` in Vercel dashboard
   - Configure `BASE_URL` for production domain

3. **SPA Routing**
   - Vercel configuration is handled by `vercel.json`
   - Supports direct links to `/admin`, `/vendor`, `/legal`, etc.

### Production Checklist

- [x] Legal compliance pages implemented
- [x] Age verification system
- [x] SEO optimization (sitemaps, meta tags)
- [x] Performance monitoring
- [x] Automated testing suite
- [x] SPA routing configuration
- [x] Production build optimization
- [x] Error handling and logging
- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] Shipping rate calculations
- [ ] Real vendor/admin accounts
- [ ] Analytics implementation (GA4)
- [ ] Enhanced security scanning

## 🏗️ Project Structure

```
vape-app/
├── src/
│   ├── components/          # React components
│   │   ├── AdminDashboard.tsx
│   │   ├── AgeVerification.tsx
│   │   ├── LegalPages.tsx
│   │   ├── TermsOfService.tsx
│   │   ├── PrivacyPolicy.tsx
│   │   ├── AgePolicy.tsx
│   │   └── UserProfile.tsx
│   ├── services/            # API and external services
│   │   ├── aiService.ts
│   │   └── api.ts
│   ├── types.ts             # TypeScript definitions
│   └── main.tsx             # App entry point
├── server/                  # Backend API
│   └── auth.ts
├── db/                      # Database files
│   ├── schema.sql
│   └── seed.ts
├── public/                  # Static assets
├── dist/                    # Production build output
├── reports/                 # QA test reports
├── logs/                    # Uptime monitoring logs
├── vercel.json              # Vercel deployment config
├── generate-sitemap.js      # SEO sitemap generator
├── performance-audit.js     # Lighthouse performance audits
├── uptime-monitor.js        # Uptime monitoring
├── smoke-test.js           # Smoke testing suite
└── package.json
```

## 🔒 Security & Compliance

### Age Verification
- 21+ age requirement enforcement
- Health warnings and Surgeon General notices
- Parental control guidance
- Compliance reporting capabilities

### Data Protection
- GDPR and CCPA compliance
- Secure JWT authentication
- Data minimization practices
- User consent management

### Tobacco Industry Compliance
- FDA health warning requirements
- Age-restricted sales compliance
- Product information accuracy
- Legal liability disclaimers

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Run QA tests (`npm run qa:all`)
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 📞 Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the QA reports for system status

## 🔄 Recent Updates

- ✅ Legal compliance pages (Terms, Privacy, Age Policy)
- ✅ User profile management system
- ✅ SPA routing fixes for direct links
- ✅ Comprehensive QA testing infrastructure
- ✅ Performance monitoring and uptime checks
- ✅ SEO optimization with sitemaps
- ✅ Production-ready build configuration

---

**Built with ❤️ for the tobacco and vapor community**
