# PlanCheck Pro

**AI-Powered Florida Building Code Compliance Review**

Built for private provider inspection companies, contractors, and building departments.

---

## 🚀 Quick Start

```bash
cd app
npm install
cp .env.example .env.local
# Fill in your API keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

```
plan-review-platform/
├── app/                    # Next.js application
│   ├── src/
│   │   ├── app/           # Pages and routes
│   │   ├── components/    # React components
│   │   ├── lib/           # Utilities and API clients
│   │   └── types/         # TypeScript types
│   └── package.json
├── docs/                   # Documentation
├── assets/                 # Static assets
├── PRODUCT-SPEC.md        # Product specification
├── COMPETITIVE-ANALYSIS.md # Market research
├── FBC-RESIDENTIAL-CHECKLIST.md  # Compliance checklist
└── README.md
```

---

## 🛠️ Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS
- **Backend:** Next.js API Routes, Python (PDF processing)
- **Database:** Supabase (PostgreSQL)
- **AI:** Claude API (vision), OpenAI (embeddings)
- **Storage:** Supabase Storage
- **Hosting:** Vercel

---

## 📋 Features (MVP)

- [ ] PDF plan upload and storage
- [ ] AI-powered plan analysis (Claude Vision)
- [ ] Florida Building Code compliance checking
- [ ] Detailed compliance report with code citations
- [ ] PDF export
- [ ] Project management

---

## 🔑 Required API Keys

1. **Supabase** — Create project at [supabase.com](https://supabase.com)
2. **Anthropic** — Get API key at [console.anthropic.com](https://console.anthropic.com)
3. **OpenAI** — Get API key at [platform.openai.com](https://platform.openai.com)

---

## 📊 Compliance Categories

| Category | FBC Reference |
|----------|---------------|
| Egress Windows | R310 |
| Stairs | R311.7 |
| Guardrails | R312 |
| Electrical | E3600+ / NEC |
| Smoke/CO Detectors | R314/R315 |
| Wind Design | R301.2.1 |
| Fire Separation | R302 |
| Energy Code | FBC-Energy |

---

## 👥 Team

- **Product:** Branden Waters
- **Development:** Waylon (AI) + Branden
- **Client:** Jason McClellan

---

## 📄 License

Proprietary — Golden Dog Marketing / Branden Waters

---

*Last Updated: February 7, 2026*
