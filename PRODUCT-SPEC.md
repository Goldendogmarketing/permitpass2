# PlanCheck Pro — Product Specification
## AI-Powered Florida Building Code Compliance Review

*Version 1.0 | February 7, 2026*

---

## 🎯 Vision

**"The TurboTax of Florida Building Code Compliance"**

Help plan reviewers, inspectors, and private providers verify residential construction plans against Florida Building Code — faster, cheaper, and more accurately than manual review.

---

## 👥 Target Users

### Primary: Private Provider Inspection Companies
- Plan reviewers checking documents before permit submission
- Inspectors preparing for site visits
- Office staff managing workflow

### Secondary: Contractors & Builders
- Pre-check plans before submitting to building department
- Reduce rejection rates and delays

### Tertiary: Building Departments
- Supplement staff with AI-assisted review
- Reduce backlog

---

## 🏗️ Core Features (MVP)

### 1. Plan Upload & Processing
- Upload PDF construction plans (multi-page)
- Automatic page detection and categorization
- High-resolution image extraction (300 DPI)
- Support for common plan types:
  - Floor plans
  - Elevations
  - Foundation plans
  - Electrical plans
  - Roof framing
  - Structural details

### 2. AI Compliance Analysis
- Vision AI extracts:
  - Dimensions and measurements
  - Room labels and sizes
  - Window/door specifications
  - Structural notes
  - Electrical layouts
- Cross-reference against FBC 8th Edition (2023)
- Check categories:
  - Egress windows (R310)
  - Stairs (R311.7)
  - Guardrails (R312)
  - Electrical (NEC/E3600+)
  - Fire separation (R302)
  - Wind design (R301.2.1)
  - Energy code compliance

### 3. Compliance Report
- Pass/Fail status per category
- Specific code citations
- Recommended corrections
- Visual markup showing issues
- Export as PDF
- Ready-for-permit checklist

### 4. Project Management
- Save and organize projects
- Track review status
- Notes and comments
- Revision history

---

## 🚀 Phase 2 Features (Post-MVP)

### Inspection Scheduling
- Customer portal for booking
- Inspector calendar management
- Automated reminders (SMS/email)
- Route optimization

### Customer Portal
- Self-service plan upload
- Status tracking
- Document storage
- Payment processing

### Advanced AI
- Learn from corrections
- County-specific amendments
- Commercial building support
- Automated re-review on plan revisions

### Integrations
- Building department systems
- Accounting software
- Calendar apps

---

## 💰 Pricing Model

### Per-Review Pricing
| Plan Type | Price |
|-----------|-------|
| Single-Family Residential | $49 |
| Multi-Family (2-4 units) | $99 |
| Addition/Renovation | $29 |
| Re-review (after corrections) | $19 |

### Monthly Subscription (Unlimited)
| Tier | Price | Includes |
|------|-------|----------|
| Starter | $299/mo | Up to 20 reviews |
| Professional | $499/mo | Up to 50 reviews |
| Enterprise | $999/mo | Unlimited + API access |

---

## 🛠️ Technical Architecture

### Frontend
- Next.js 14 (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui components

### Backend
- Next.js API Routes
- Python microservice (PDF processing)
- Claude API (vision analysis)
- OpenAI Embeddings (code search)

### Database
- Supabase (PostgreSQL)
- Row-level security
- Real-time subscriptions

### Storage
- Supabase Storage (PDFs, images)
- CDN for fast delivery

### Infrastructure
- Vercel (frontend + API)
- Railway or Fly.io (Python service)
- Cloudflare (CDN, security)

---

## 📊 Success Metrics

### MVP Launch (Month 1)
- [ ] 5 beta users (including Jason)
- [ ] 95% accuracy on egress/stairs/guardrails
- [ ] <5 minute review time per plan set
- [ ] NPS > 40 from beta users

### Growth (Month 3)
- [ ] 20 paying customers
- [ ] $5,000 MRR
- [ ] <2% churn
- [ ] 90% accuracy across all categories

### Scale (Month 6)
- [ ] 100+ customers
- [ ] $25,000 MRR
- [ ] Inspection scheduling live
- [ ] Customer portal live

---

## 🗓️ Development Timeline

### Week 1-2: Foundation
- [ ] Project setup (Next.js, Supabase, Vercel)
- [ ] Authentication (login, signup, roles)
- [ ] Basic dashboard UI
- [ ] PDF upload and storage

### Week 3-4: AI Engine
- [ ] PDF to image conversion pipeline
- [ ] Claude vision integration
- [ ] FBC code database (structured)
- [ ] Basic compliance checking

### Week 5-6: MVP Polish
- [ ] Compliance report generation
- [ ] PDF export
- [ ] Project management
- [ ] Error handling and edge cases

### Week 7-8: Beta Launch
- [ ] Beta testing with Jason
- [ ] Feedback and iteration
- [ ] Performance optimization
- [ ] Documentation

---

## 🔐 Security & Compliance

- All data encrypted at rest and in transit
- SOC 2 compliance roadmap
- GDPR-ready data handling
- Regular security audits
- Role-based access control

---

## 🏁 MVP Definition of Done

A plan reviewer can:
1. ✅ Sign up and log in
2. ✅ Upload a residential PDF plan set
3. ✅ Run AI compliance analysis
4. ✅ View detailed report with pass/fail per category
5. ✅ See specific code citations for failures
6. ✅ Export report as PDF
7. ✅ Save project for future reference

---

*Document Owner: Waylon (AI) + Branden Waters*
*Client: Jason McClellan*
*Last Updated: February 7, 2026*
