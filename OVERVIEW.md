# Plan Review & Inspection Platform

*Construction plan review + inspection scheduling SaaS*

---

## Lead Info

- **Source:** Branden bumped into him (Feb 7, 2026)
- **Contact:** Jason McClellan
- **Role:** Building & Home Inspector @ Clay County Board of Commissioners
- **Location:** Keystone Heights, FL
- **LinkedIn:** linkedin.com/in/jason-mcclellan-6a1971162/
- **Company:** Possibly starting private provider venture?
- **Status:** Waiting for callback this week

### Florida Context
Florida's "Private Provider" program (F.S. 553.791) allows private companies to conduct plan review and inspections instead of municipal building departments. Growing market as counties are backlogged.

---

## What They Want

### Core Product: Pre-Permit FBC Compliance Review

**Primary Focus (from Jason call 2/7):**
AI reviews construction plans for Florida Building Code compliance BEFORE permitting submission.

### Compliance Check Categories:

**1. Windows & Doors**
- [ ] Egress window sizing (5.7 sq ft min, 24" min opening height, 20" min width)
- [ ] Emergency escape requirements (R310)
- [ ] Glazing/safety glass requirements
- [ ] Door width minimums (32" clear)

**2. Stairs**
- [ ] Rise/run (max 7¾" rise, min 10" run per R311.7)
- [ ] Handrail height (34-38")
- [ ] Stair width (min 36")
- [ ] Headroom (min 6'8")
- [ ] Landing requirements

**3. Decks**
- [ ] Guardrail height (min 36", 42" if >30" drop)
- [ ] Baluster spacing (max 4")
- [ ] Ledger connection details
- [ ] Structural requirements

**4. Walls/Framing**
- [ ] Fire separation distances (R302)
- [ ] Header sizing for spans
- [ ] Wall bracing requirements
- [ ] Insulation R-values for Florida climate zone

**5. Electrical**
- [ ] Outlet spacing (max 12' apart, 6' from corners)
- [ ] GFCI locations (kitchen, bath, garage, outdoor)
- [ ] AFCI requirements (bedrooms)
- [ ] Panel sizing/location

**6. HVAC**
- [ ] Ventilation requirements
- [ ] Duct sizing
- [ ] Equipment specifications
- [ ] Return air requirements

**7. Plumbing**
- [ ] Fixture counts per occupancy
- [ ] Venting requirements
- [ ] Pipe sizing
- [ ] Water heater specs

### Output: Compliance Report
- [ ] Pass/Fail per category
- [ ] Specific FBC code citations
- [ ] Recommended corrections
- [ ] Ready-for-permit checklist

### Inspection Scheduling
- [ ] Customer-facing booking portal
- [ ] Inspector calendar management
- [ ] Automated reminders (SMS/email)
- [ ] Zone/type routing

### Admin Dashboard
- [ ] Review queue (AI-assisted)
- [ ] Inspection calendar view
- [ ] Customer management
- [ ] Reporting & analytics

---

## Technical Considerations

### AI Plan Review
- PDF parsing (construction drawings are complex)
- Vision models for drawing interpretation
- Florida Building Code knowledge base
- Structured output (compliance checklist)

### Scheduling
- Calendar integration (Google, Outlook)
- SMS/email notifications
- Booking widget for website embed

### Stack Options
- Next.js + Supabase (fast to build)
- React Native for mobile (phase 2)
- OpenAI/Claude vision for plan analysis

---

## Competitive Landscape

*To research:*
- [ ] Existing AI plan review tools
- [ ] Inspection scheduling software
- [ ] Vertical SaaS for inspectors

---

## Pricing Models

- Per-plan-review fee ($X per PDF)
- Monthly SaaS subscription (tiers by volume)
- Per-seat licensing

---

## MVP Scope (Phase 1)

**Quick win approach:**
1. Inspection scheduling portal (1-2 weeks)
2. Basic plan upload + status tracking (1 week)
3. AI plan review integration (2-4 weeks)

---

## Next Steps

1. [ ] Discovery call with lead
2. [ ] Research Florida Building Code access
3. [ ] Competitive analysis
4. [ ] Scope & pricing options
5. [ ] Demo/prototype

---

*Created: February 7, 2026*
