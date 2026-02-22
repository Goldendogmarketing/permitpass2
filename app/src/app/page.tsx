'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Upload,
  Search,
  FileCheck,
  Shield,
  MapPin,
  Layers,
  RefreshCw,
  FileText,
  ArrowRight,
  ChevronRight,
  Star,
  Check,
  LogIn,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

/* ═══════════════════════════════════════════════════════════════════════
   CONSTANTS — Replace these tokens before deploying
   ═══════════════════════════════════════════════════════════════════════ */

const PRODUCT_NAME = 'Permit Pass';
const TAGLINE = 'Every violation caught. Every plan approved faster.';
const HEADLINE = 'Your Plans. Reviewed in Minutes. Not Weeks.';
const SUBHEAD =
  "AI-powered FBC compliance that catches what humans miss — so your permits don't get sent back.";
const CTA_TEXT = 'Upload Your First Plan Free';
const SECONDARY_CTA = 'Book a Demo';
const FINAL_CTA_HEADLINE = 'Stop Guessing. Start Knowing.';

/* ═══════════════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════════════ */

interface Annotation {
  id: string;
  x: number;
  y: number;
  type: 'pass' | 'fail' | 'warning';
  label: string;
  detail: string;
  code: string;
}

/* ═══════════════════════════════════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════════════════════════════════ */

const ANNOTATIONS: Annotation[] = [
  {
    id: 'egress',
    x: 18,
    y: 28,
    type: 'pass',
    label: 'Egress Window — R310',
    detail: '5.7 sq ft clearance verified',
    code: 'FBC R310.1',
  },
  {
    id: 'stair',
    x: 45,
    y: 56,
    type: 'fail',
    label: 'Stair Rise — R311.7',
    detail: 'Rise 8.5″ exceeds 7¾″ maximum',
    code: 'FBC R311.7.5.1',
  },
  {
    id: 'gfci',
    x: 75,
    y: 22,
    type: 'warning',
    label: 'GFCI Required — NEC 210.8',
    detail: "Verify GFCI within 6' of sink",
    code: 'NEC 210.8(A)',
  },
  {
    id: 'wind',
    x: 80,
    y: 68,
    type: 'pass',
    label: 'Wind Design — R301.2.1',
    detail: 'Opening protection verified for 150 mph',
    code: 'FBC R301.2.1.2',
  },
  {
    id: 'guardrail',
    x: 15,
    y: 72,
    type: 'fail',
    label: 'Guardrail — R312.1',
    detail: 'Height 32″ below 36″ minimum',
    code: 'FBC R312.1.1',
  },
];

const FEATURES = [
  {
    icon: Shield,
    title: 'Multi-Code Coverage',
    desc: 'Full compliance checking against FBC 8th Edition, IBC, IRC, ADA, NFPA, and NEC. Every applicable code section, covered in one scan.',
  },
  {
    icon: MapPin,
    title: 'Pinpoint Precision',
    desc: "Violations marked directly on your plans with exact code section references. No vague findings — every issue tied to a specific location and code citation.",
  },
  {
    icon: Layers,
    title: 'Batch Processing',
    desc: 'Review entire plan sets — architectural, structural, MEP — in one upload. No need to split files or run separate analyses.',
  },
  {
    icon: Search,
    title: 'Jurisdiction-Aware',
    desc: 'Automatically applies Florida county-specific amendments based on your project location. Clay, Duval, St. Johns — we know the local rules.',
  },
  {
    icon: RefreshCw,
    title: 'Revision Tracking',
    desc: "Resubmit corrected plans and instantly see what's resolved vs. still outstanding. Track progress across review cycles.",
  },
  {
    icon: FileText,
    title: 'Export-Ready Reports',
    desc: 'PDF compliance reports formatted for direct submission to building departments. Professional, detailed, and ready for permit review.',
  },
];

const TESTIMONIALS = [
  {
    quote:
      'We used to spend 3-4 days on a single plan review. Permit Pass catches things in minutes that would take our team hours to find manually. The code citations alone save us from second-guessing.',
    name: 'Sarah Mitchell',
    title: 'Senior Plan Reviewer',
    company: 'Southeast Building Consultants',
  },
  {
    quote:
      "Our permit rejection rate dropped from 40% to under 8% in the first month. The ROI was immediate — we're saving thousands per project in resubmission costs and delays.",
    name: 'Marcus Thompson',
    title: 'General Contractor',
    company: 'Thompson Development Group',
  },
  {
    quote:
      "As a private provider in Florida, accuracy is everything. Permit Pass doesn't replace our expertise — it amplifies it. We review more plans with higher confidence.",
    name: 'Jennifer Walsh',
    title: 'Licensed Private Provider',
    company: 'Walsh Inspection Services',
  },
];

const PAIN_STATS = [
  {
    value: '$4,200',
    label: 'average cost per review cycle',
    context:
      'When code violations are caught after permit submission, the rework cycle burns money — redesign fees, resubmission costs, and contractor downtime add up fast.',
  },
  {
    value: '3–6 weeks',
    label: 'typical resubmission delay',
    context:
      'Municipal review backlogs mean every rejection costs weeks. One missed violation can push your project timeline back over a month.',
  },
  {
    value: '67%',
    label: 'of plans rejected on first review',
    context:
      'The majority of residential plans get sent back for code violations that were entirely preventable with a thorough pre-check.',
  },
];

const PROOF_STATS: { value: number; suffix: string; label: string; decimals?: number }[] = [
  { value: 2400, suffix: '+', label: 'Plans Reviewed' },
  { value: 98.7, suffix: '%', label: 'Violation Detection Rate', decimals: 1 },
  { value: 47, suffix: 'x', label: 'Faster Than Manual Review' },
];

/* ═══════════════════════════════════════════════════════════════════════
   PRICING DATA
   ═══════════════════════════════════════════════════════════════════════ */

interface PricingTier {
  name: string;
  monthlyRange: string;
  annualRange: string;
  plans: string;
  audience: string;
  popular?: boolean;
  features: string[];
  cta: string;
  ctaStyle: 'primary' | 'secondary';
}

const PRICING_TIERS: PricingTier[] = [
  {
    name: 'Starter',
    monthlyRange: '$99–$199',
    annualRange: '$84–$169',
    plans: '5–10 plans/mo',
    audience: 'Small designers & engineers',
    features: [
      'FBC compliance check',
      'Visual plan markup',
      'PDF export reports',
      'Email support',
    ],
    cta: 'Get Started',
    ctaStyle: 'secondary',
  },
  {
    name: 'Professional',
    monthlyRange: '$399–$799',
    annualRange: '$339–$679',
    plans: '30–50 plans/mo',
    audience: 'Mid-sized firms',
    popular: true,
    features: [
      'Everything in Starter',
      'Priority processing',
      'Batch uploads',
      'Revision tracking',
      'Phone support',
    ],
    cta: 'Start Free Trial',
    ctaStyle: 'primary',
  },
  {
    name: 'Enterprise',
    monthlyRange: '$1,200–$2,500+',
    annualRange: '$1,020–$2,125+',
    plans: 'Unlimited plans',
    audience: 'Agencies & large firms',
    features: [
      'Everything in Professional',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
      'On-site training',
    ],
    cta: 'Contact Sales',
    ctaStyle: 'secondary',
  },
  {
    name: 'Per Plan',
    monthlyRange: '$15–$60',
    annualRange: '$13–$51',
    plans: 'Pay-as-you-go',
    audience: 'Flex users',
    features: [
      'Single plan analysis',
      'Full compliance report',
      'Visual annotations',
      'No commitment',
    ],
    cta: 'Try One Plan',
    ctaStyle: 'secondary',
  },
];

/* ═══════════════════════════════════════════════════════════════════════
   HOOKS
   ═══════════════════════════════════════════════════════════════════════ */

function useInView(options?: IntersectionObserverInit) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setInView(true);
      },
      { threshold: 0.2, ...options },
    );
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return [ref, inView] as const;
}

function useCountUp(target: number, duration = 2000, inView: boolean, decimals = 0) {
  const [count, setCount] = useState(0);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!inView || hasAnimated.current) return;
    hasAnimated.current = true;
    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * target;
      setCount(decimals > 0 ? parseFloat(current.toFixed(decimals)) : Math.round(current));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [inView, target, duration, decimals]);

  return count;
}

function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768 || navigator.maxTouchPoints > 0);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  return isMobile;
}

/* ═══════════════════════════════════════════════════════════════════════
   BLUEPRINT SVG
   ═══════════════════════════════════════════════════════════════════════ */

function BlueprintSVG({ bright = false }: { bright?: boolean }) {
  const stroke = bright ? '#22d3ee' : '#94a3b8';
  const wall = bright ? '#67e8f9' : '#cbd5e1';
  const txt = bright ? '#a5f3fc' : '#94a3b8';
  const fix = bright ? '#06b6d4' : '#a1a1aa';
  const dim = bright ? '#0e7490' : '#d1d5db';
  const bg = bright ? '#0f172a' : '#f3f4f6';

  return (
    <svg
      viewBox="0 0 800 520"
      className="w-full h-full"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Grid pattern */}
      <defs>
        <pattern
          id={`grid-${bright ? 'b' : 'd'}`}
          width="40"
          height="40"
          patternUnits="userSpaceOnUse"
        >
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke={dim} strokeWidth="0.5" opacity="0.5" />
        </pattern>
      </defs>
      <rect width="800" height="520" fill={`url(#grid-${bright ? 'b' : 'd'})`} />

      {/* ── Outer walls ── */}
      <rect x="60" y="40" width="680" height="440" fill="none" stroke={wall} strokeWidth="3" />

      {/* ── Interior walls ── */}
      <line x1="60" y1="260" x2="740" y2="260" stroke={wall} strokeWidth="2.5" />
      <line x1="400" y1="40" x2="400" y2="260" stroke={wall} strokeWidth="2.5" />
      <line x1="280" y1="260" x2="280" y2="480" stroke={wall} strokeWidth="2.5" />
      <line x1="480" y1="260" x2="480" y2="480" stroke={wall} strokeWidth="2.5" />
      <line x1="280" y1="370" x2="480" y2="370" stroke={wall} strokeWidth="2.5" />

      {/* ── Door openings + arcs ── */}
      {/* Living → Foyer */}
      <line x1="160" y1="260" x2="200" y2="260" stroke={bg} strokeWidth="3" />
      <path
        d="M 160 260 A 40 40 0 0 1 200 260"
        fill="none"
        stroke={stroke}
        strokeWidth="1"
        strokeDasharray="3,3"
      />
      {/* Kitchen doorway */}
      <line x1="400" y1="130" x2="400" y2="180" stroke={bg} strokeWidth="3" />
      <path
        d="M 400 130 A 50 50 0 0 0 400 180"
        fill="none"
        stroke={stroke}
        strokeWidth="1"
        strokeDasharray="3,3"
      />
      {/* Hall → Bedroom */}
      <line x1="480" y1="300" x2="480" y2="340" stroke={bg} strokeWidth="3" />
      <path
        d="M 480 300 A 40 40 0 0 1 480 340"
        fill="none"
        stroke={stroke}
        strokeWidth="1"
        strokeDasharray="3,3"
      />
      {/* Hall → Bath */}
      <line x1="350" y1="370" x2="400" y2="370" stroke={bg} strokeWidth="3" />
      <path
        d="M 350 370 A 50 50 0 0 0 400 370"
        fill="none"
        stroke={stroke}
        strokeWidth="1"
        strokeDasharray="3,3"
      />
      {/* Front door */}
      <line x1="140" y1="480" x2="180" y2="480" stroke={bg} strokeWidth="3" />
      <path d="M 140 480 A 40 40 0 0 0 180 480" fill="none" stroke={stroke} strokeWidth="1.5" />

      {/* ── Windows (double lines on exterior) ── */}
      {/* Living — top */}
      <line x1="140" y1="38" x2="220" y2="38" stroke={stroke} strokeWidth="2" />
      <line x1="140" y1="42" x2="220" y2="42" stroke={stroke} strokeWidth="2" />
      <line x1="260" y1="38" x2="340" y2="38" stroke={stroke} strokeWidth="2" />
      <line x1="260" y1="42" x2="340" y2="42" stroke={stroke} strokeWidth="2" />
      {/* Living — left */}
      <line x1="58" y1="120" x2="58" y2="200" stroke={stroke} strokeWidth="2" />
      <line x1="62" y1="120" x2="62" y2="200" stroke={stroke} strokeWidth="2" />
      {/* Kitchen — top */}
      <line x1="500" y1="38" x2="620" y2="38" stroke={stroke} strokeWidth="2" />
      <line x1="500" y1="42" x2="620" y2="42" stroke={stroke} strokeWidth="2" />
      {/* Kitchen — right */}
      <line x1="738" y1="100" x2="738" y2="180" stroke={stroke} strokeWidth="2" />
      <line x1="742" y1="100" x2="742" y2="180" stroke={stroke} strokeWidth="2" />
      {/* Bedroom — right */}
      <line x1="738" y1="340" x2="738" y2="420" stroke={stroke} strokeWidth="2" />
      <line x1="742" y1="340" x2="742" y2="420" stroke={stroke} strokeWidth="2" />
      {/* Bedroom — bottom */}
      <line x1="560" y1="478" x2="660" y2="478" stroke={stroke} strokeWidth="2" />
      <line x1="560" y1="482" x2="660" y2="482" stroke={stroke} strokeWidth="2" />
      {/* Foyer — left */}
      <line x1="58" y1="340" x2="58" y2="420" stroke={stroke} strokeWidth="2" />
      <line x1="62" y1="340" x2="62" y2="420" stroke={stroke} strokeWidth="2" />

      {/* ── Stairs ── */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <line
          key={`stair-${i}`}
          x1={300 + i * 25}
          y1="275"
          x2={300 + i * 25}
          y2="355"
          stroke={stroke}
          strokeWidth="1"
        />
      ))}
      <line x1="310" y1="315" x2="460" y2="315" stroke={stroke} strokeWidth="1" />
      <polygon points="455,310 465,315 455,320" fill={stroke} />
      <text x="370" y="308" fontSize="8" fill={txt} textAnchor="middle">
        UP
      </text>

      {/* ── Kitchen fixtures ── */}
      <rect x="410" y="50" width="15" height="100" fill="none" stroke={fix} strokeWidth="1.5" rx="2" />
      <rect x="430" y="80" width="30" height="20" fill="none" stroke={fix} strokeWidth="1" rx="3" />
      <circle cx="445" cy="90" r="5" fill="none" stroke={fix} strokeWidth="0.8" />

      {/* ── Bathroom fixtures ── */}
      <rect x="310" y="400" width="20" height="25" fill="none" stroke={fix} strokeWidth="1" rx="3" />
      <ellipse cx="320" cy="440" rx="12" ry="15" fill="none" stroke={fix} strokeWidth="1" />
      <rect x="410" y="385" width="55" height="25" fill="none" stroke={fix} strokeWidth="1" rx="4" />

      {/* ── Dimension lines ── */}
      <line x1="70" y1="30" x2="390" y2="30" stroke={txt} strokeWidth="0.5" />
      <line x1="70" y1="25" x2="70" y2="35" stroke={txt} strokeWidth="0.5" />
      <line x1="390" y1="25" x2="390" y2="35" stroke={txt} strokeWidth="0.5" />
      <text x="230" y="28" fontSize="8" fill={txt} textAnchor="middle">
        {"24'-0\""}
      </text>

      <line x1="410" y1="30" x2="730" y2="30" stroke={txt} strokeWidth="0.5" />
      <line x1="410" y1="25" x2="410" y2="35" stroke={txt} strokeWidth="0.5" />
      <line x1="730" y1="25" x2="730" y2="35" stroke={txt} strokeWidth="0.5" />
      <text x="570" y="28" fontSize="8" fill={txt} textAnchor="middle">
        {"22'-0\""}
      </text>

      <line x1="50" y1="50" x2="50" y2="250" stroke={txt} strokeWidth="0.5" />
      <line x1="45" y1="50" x2="55" y2="50" stroke={txt} strokeWidth="0.5" />
      <line x1="45" y1="250" x2="55" y2="250" stroke={txt} strokeWidth="0.5" />
      <text
        x="42"
        y="155"
        fontSize="8"
        fill={txt}
        textAnchor="middle"
        transform="rotate(-90, 42, 155)"
      >
        {"16'-0\""}
      </text>

      {/* ── Room labels ── */}
      <text x="220" y="155" fontSize="12" fill={txt} textAnchor="middle" fontWeight="bold">
        LIVING ROOM
      </text>
      <text x="220" y="172" fontSize="9" fill={txt} textAnchor="middle">
        {"24' × 16'"}
      </text>

      <text x="565" y="155" fontSize="12" fill={txt} textAnchor="middle" fontWeight="bold">
        KITCHEN
      </text>
      <text x="565" y="172" fontSize="9" fill={txt} textAnchor="middle">
        {"22' × 16'"}
      </text>

      <text x="165" y="385" fontSize="12" fill={txt} textAnchor="middle" fontWeight="bold">
        FOYER
      </text>

      <text x="380" y="298" fontSize="10" fill={txt} textAnchor="middle" fontWeight="bold">
        HALL
      </text>

      <text x="380" y="440" fontSize="10" fill={txt} textAnchor="middle" fontWeight="bold">
        BATH
      </text>

      <text x="610" y="376" fontSize="12" fill={txt} textAnchor="middle" fontWeight="bold">
        MASTER BEDROOM
      </text>
      <text x="610" y="393" fontSize="9" fill={txt} textAnchor="middle">
        {"18' × 16'"}
      </text>

      {/* ── Compass rose ── */}
      <g transform="translate(720, 500)">
        <line x1="0" y1="-12" x2="0" y2="12" stroke={txt} strokeWidth="1" />
        <line x1="-12" y1="0" x2="12" y2="0" stroke={txt} strokeWidth="1" />
        <polygon points="0,-15 -3,-8 3,-8" fill={stroke} />
        <text x="0" y="-18" fontSize="7" fill={txt} textAnchor="middle">
          N
        </text>
      </g>

      {/* ── Title block ── */}
      <rect x="560" y="490" width="180" height="25" fill="none" stroke={stroke} strokeWidth="1" />
      <text x="650" y="505" fontSize="7" fill={txt} textAnchor="middle">
        RESIDENTIAL FLOOR PLAN — SHEET A1
      </text>
      <text x="650" y="512" fontSize="6" fill={txt} textAnchor="middle">
        {'SCALE: 1/4" = 1\'-0"'}
      </text>
    </svg>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   ANNOTATION BADGE
   ═══════════════════════════════════════════════════════════════════════ */

const BADGE_COLORS = {
  pass: {
    bg: 'bg-green-500/90',
    border: 'border-green-400',
    text: 'text-green-50',
    dot: 'bg-green-400',
  },
  fail: {
    bg: 'bg-red-500/90',
    border: 'border-red-400',
    text: 'text-red-50',
    dot: 'bg-red-400',
  },
  warning: {
    bg: 'bg-amber-500/90',
    border: 'border-amber-400',
    text: 'text-amber-50',
    dot: 'bg-amber-400',
  },
};

function AnnotationBadge({
  annotation,
  visible,
}: {
  annotation: Annotation;
  visible: boolean;
}) {
  const c = BADGE_COLORS[annotation.type];

  return (
    <div
      className={`absolute z-20 pointer-events-none transition-all duration-300 ${
        visible ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
      }`}
      style={{
        left: `${annotation.x}%`,
        top: `${annotation.y}%`,
        transform: 'translate(-50%, -50%)',
      }}
    >
      {/* Pulsing dot */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span
          className={`absolute w-3 h-3 rounded-full ${c.dot} ${visible ? 'animate-ping' : ''}`}
        />
        <span className={`relative w-3 h-3 rounded-full ${c.dot}`} />
      </div>
      {/* Label card */}
      <div
        className={`absolute left-5 top-1/2 -translate-y-1/2 whitespace-nowrap ${c.bg} ${c.border} border rounded-lg px-3 py-2 backdrop-blur-sm shadow-lg`}
      >
        <p className={`text-xs font-bold ${c.text}`}>{annotation.label}</p>
        <p className={`text-xs ${c.text} opacity-80`}>{annotation.detail}</p>
        <p className={`text-[10px] ${c.text} opacity-60 font-mono mt-0.5`}>{annotation.code}</p>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   NAVBAR
   ═══════════════════════════════════════════════════════════════════════ */

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthorized, loading, signOut } = useAuth();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const links = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Results', href: '#social-proof' },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-gray-100/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <a href="#">
          <img
            src="/permit-pass-logo.png"
            alt="Permit Pass"
            className="h-9 w-auto rounded"
          />
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              {l.label}
            </a>
          ))}
          <Link
            href="/analyze"
            className="text-sm font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-900 px-5 py-2.5 rounded-xl transition-colors"
          >
            {CTA_TEXT}
          </Link>
          {!loading && (
            isAuthorized ? (
              <button
                onClick={() => signOut()}
                className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Log In
              </Link>
            )
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-slate-900 p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle navigation menu"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {mobileMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-100/95 backdrop-blur-md border-t border-gray-200 px-4 pb-4">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="block py-3 text-slate-600 hover:text-slate-900 transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <Link
            href="/analyze"
            className="block mt-2 text-center font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-900 px-5 py-2.5 rounded-xl transition-colors"
            onClick={() => setMobileMenuOpen(false)}
          >
            {CTA_TEXT}
          </Link>
          {!loading && (
            isAuthorized ? (
              <button
                onClick={() => { signOut(); setMobileMenuOpen(false); }}
                className="block w-full mt-2 text-center py-2.5 text-slate-600 hover:text-slate-900 transition-colors"
              >
                Sign Out
              </button>
            ) : (
              <Link
                href="/login"
                className="block mt-2 text-center py-2.5 text-slate-600 hover:text-slate-900 transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log In
              </Link>
            )
          )}
        </div>
      )}
    </nav>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   HERO SECTION — Interactive Blueprint Reveal
   ═══════════════════════════════════════════════════════════════════════ */

function HeroSection() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: -999, y: -999 });
  const [isHovering, setIsHovering] = useState(false);
  const isMobile = useIsMobile();
  const [mobilePos, setMobilePos] = useState({ x: 50, y: 50 });
  const [mobileActive, setMobileActive] = useState(false);
  const [sectionRef, inView] = useInView({ threshold: 0.2 });
  const mobileAnimRef = useRef<number | null>(null);
  const mobileStartRef = useRef<number>(0);

  // Desktop mouse tracking
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, []);

  // Mobile auto-sweep animation
  useEffect(() => {
    if (!isMobile || !inView) return;
    setMobileActive(true);

    const waypoints = ANNOTATIONS.map((a) => ({ x: a.x, y: a.y }));
    const total = waypoints.length;
    const moveDuration = 900;
    const pauseDuration = 2000;
    const cycleDuration = total * (moveDuration + pauseDuration);

    mobileStartRef.current = performance.now();

    const animate = (now: number) => {
      const elapsed = (now - mobileStartRef.current) % cycleDuration;
      const segDur = moveDuration + pauseDuration;
      const seg = Math.floor(elapsed / segDur);
      const segElapsed = elapsed - seg * segDur;
      const from = seg;
      const to = (seg + 1) % total;

      if (segElapsed < moveDuration) {
        const t = segElapsed / moveDuration;
        const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
        setMobilePos({
          x: waypoints[from].x + (waypoints[to].x - waypoints[from].x) * eased,
          y: waypoints[from].y + (waypoints[to].y - waypoints[from].y) * eased,
        });
      } else {
        setMobilePos({ x: waypoints[to].x, y: waypoints[to].y });
      }
      mobileAnimRef.current = requestAnimationFrame(animate);
    };

    mobileAnimRef.current = requestAnimationFrame(animate);
    return () => {
      if (mobileAnimRef.current) cancelAnimationFrame(mobileAnimRef.current);
    };
  }, [isMobile, inView]);

  // Spotlight positioning
  const spotlightActive = isMobile ? mobileActive : isHovering;
  const spotX = isMobile ? `${mobilePos.x}%` : `${mousePos.x}px`;
  const spotY = isMobile ? `${mobilePos.y}%` : `${mousePos.y}px`;
  const spotRadius = isMobile ? '28vmin' : '150px';

  // Annotation visibility (distance check)
  const isAnnotationVisible = (anno: Annotation) => {
    if (!spotlightActive) return false;
    if (isMobile) {
      const dx = anno.x - mobilePos.x;
      const dy = anno.y - mobilePos.y;
      return Math.sqrt(dx * dx + dy * dy) < 16;
    }
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return false;
    const ax = (anno.x / 100) * rect.width;
    const ay = (anno.y / 100) * rect.height;
    const dx = mousePos.x - ax;
    const dy = mousePos.y - ay;
    return Math.sqrt(dx * dx + dy * dy) < 170;
  };

  return (
    <section
      ref={sectionRef}
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gray-100"
    >
      {/* Blueprint layers */}
      <div
        ref={containerRef}
        className="absolute inset-0"
        onMouseMove={!isMobile ? handleMouseMove : undefined}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false);
          setMousePos({ x: -999, y: -999 });
        }}
      >
        {/* Dim layer */}
        <div
          className="absolute inset-0 opacity-25"
          style={{ filter: 'blur(0.5px) brightness(0.6)' }}
        >
          <BlueprintSVG />
        </div>

        {/* Bright layer (masked to spotlight) */}
        <div
          className="absolute inset-0 transition-opacity duration-300"
          style={{
            opacity: spotlightActive ? 1 : 0,
            WebkitMaskImage: `radial-gradient(circle ${spotRadius} at ${spotX} ${spotY}, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)`,
            maskImage: `radial-gradient(circle ${spotRadius} at ${spotX} ${spotY}, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 100%)`,
          }}
        >
          <BlueprintSVG bright />
        </div>

        {/* Spotlight glow */}
        {spotlightActive && (
          <div
            className="absolute pointer-events-none rounded-full"
            style={{
              left: spotX,
              top: spotY,
              width: isMobile ? '50vmin' : 300,
              height: isMobile ? '50vmin' : 300,
              transform: 'translate(-50%, -50%)',
              background:
                'radial-gradient(circle, rgba(6,182,212,0.12) 0%, rgba(6,182,212,0.04) 40%, transparent 70%)',
            }}
          />
        )}

        {/* Annotations */}
        {ANNOTATIONS.map((anno) => (
          <AnnotationBadge
            key={anno.id}
            annotation={anno}
            visible={isAnnotationVisible(anno)}
          />
        ))}
      </div>

      {/* Light gradient for text readability */}
      <div className="absolute inset-0 bg-gradient-to-b from-gray-100/70 via-gray-100/40 to-gray-100/80 pointer-events-none" />

      {/* Hero content */}
      <div className="relative z-10 text-center px-4 max-w-4xl mx-auto pt-20">
        <p className="text-cyan-600 font-semibold text-sm tracking-wider uppercase mb-4">
          {TAGLINE}
        </p>
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight mb-6">
          Your Plans. <br className="hidden sm:block" />
          Reviewed in Minutes. <br className="hidden sm:block" />
          <span className="text-cyan-600">Not Weeks.</span>
        </h1>
        <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          {SUBHEAD}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
          <Link
            href="/analyze"
            className="cta-glow group inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold text-lg px-8 py-4 rounded-xl transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/40"
          >
            <Upload className="w-5 h-5" />
            {CTA_TEXT}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#contact"
            className="inline-flex items-center gap-2 text-slate-700 hover:text-slate-900 font-semibold text-lg px-6 py-4 rounded-xl border border-slate-400 hover:border-slate-600 transition-all"
          >
            {SECONDARY_CTA}
            <ChevronRight className="w-5 h-5" />
          </a>
        </div>

        <p className="text-sm text-slate-500">
          2,400+ plans reviewed &nbsp;&bull;&nbsp; 98.7% violation detection rate &nbsp;&bull;&nbsp;
          No credit card required
        </p>

        {!isMobile && (
          <p className="mt-8 text-xs text-slate-400 animate-bounce">
            Move your cursor over the blueprint to see AI scanning in action
          </p>
        )}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION 2 — THE PAIN (Agitation)
   ═══════════════════════════════════════════════════════════════════════ */

function PainSection() {
  const [ref, inView] = useInView({ threshold: 0.2 });

  return (
    <section ref={ref} className="relative bg-gray-200 py-20 sm:py-28 overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="w-full h-full"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 39px, rgba(6,182,212,0.3) 39px, rgba(6,182,212,0.3) 40px), repeating-linear-gradient(90deg, transparent, transparent 39px, rgba(6,182,212,0.3) 39px, rgba(6,182,212,0.3) 40px)',
          }}
        />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 sm:gap-12">
          {PAIN_STATS.map((stat, i) => (
            <div
              key={i}
              className={`text-center transition-all duration-700 ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <p
                className={`text-4xl sm:text-5xl font-bold mb-2 ${
                  i === 2 ? 'text-amber-400' : 'text-red-400'
                }`}
              >
                {stat.value}
              </p>
              <p className="text-slate-700 font-semibold text-lg mb-3">{stat.label}</p>
              <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto">
                {stat.context}
              </p>
            </div>
          ))}
        </div>

        <div
          className={`text-center mt-16 transition-all duration-700 delay-500 ${
            inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}
        >
          <p className="text-xl sm:text-2xl text-slate-800 font-medium">
            What if you could catch{' '}
            <span className="text-cyan-600 font-bold">every violation</span> before you submit?
          </p>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION 3 — HOW IT WORKS
   ═══════════════════════════════════════════════════════════════════════ */

const STEPS = [
  {
    num: '01',
    title: 'Upload',
    desc: 'Drop your PDF, CAD, or blueprint file',
    icon: (
      <Upload className="w-8 h-8 text-cyan-400" />
    ),
  },
  {
    num: '02',
    title: 'AI Scan',
    desc: 'Our engine checks against FBC, IBC, IRC, ADA, and local amendments',
    icon: (
      <Search className="w-8 h-8 text-cyan-400" />
    ),
  },
  {
    num: '03',
    title: 'Report',
    desc: 'Get a compliance report with every issue pinpointed and code-referenced',
    icon: (
      <FileCheck className="w-8 h-8 text-cyan-400" />
    ),
  },
];

function HowItWorksSection() {
  const [ref, inView] = useInView({ threshold: 0.2 });

  return (
    <section
      ref={ref}
      id="how-it-works"
      className="bg-white py-20 sm:py-28"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-cyan-600 font-semibold text-sm tracking-wider uppercase mb-2">
            Simple Process
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            How It Works
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-8 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-16 left-[calc(16.67%+40px)] right-[calc(16.67%+40px)] h-0.5 bg-slate-200" />

          {STEPS.map((step, i) => (
            <div
              key={step.num}
              className={`relative text-center transition-all duration-700 ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ transitionDelay: `${i * 200}ms` }}
            >
              <div className="relative inline-flex items-center justify-center w-20 h-20 bg-slate-50 border-2 border-slate-200 rounded-2xl mb-6 z-10">
                {step.icon}
              </div>
              <p className="text-xs text-cyan-600 font-bold tracking-widest mb-2">{step.num}</p>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{step.title}</h3>
              <p className="text-slate-600 max-w-xs mx-auto">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION 4 — FEATURES
   ═══════════════════════════════════════════════════════════════════════ */

function FeaturesSection() {
  const [ref, inView] = useInView({ threshold: 0.1 });

  return (
    <section ref={ref} id="features" className="bg-slate-50 py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <p className="text-cyan-600 font-semibold text-sm tracking-wider uppercase mb-2">
            Capabilities
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            Built for Plan Review Professionals
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {FEATURES.map((feat, i) => {
            const Icon = feat.icon;
            const isEven = i % 2 === 0;
            return (
              <div
                key={feat.title}
                className={`group bg-white border border-slate-200 rounded-lg p-6 hover:-translate-y-1 hover:shadow-lg hover:border-cyan-200 transition-all duration-300 ${
                  inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
                }`}
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <div className={`flex gap-4 ${isEven ? 'flex-row' : 'flex-row-reverse'}`}>
                  <div className="flex-shrink-0 w-12 h-12 bg-cyan-50 rounded-lg flex items-center justify-center group-hover:bg-cyan-100 transition-colors">
                    <Icon className="w-6 h-6 text-cyan-600" />
                  </div>
                  <div className={isEven ? '' : 'text-right'}>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">{feat.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION 5 — PRICING
   ═══════════════════════════════════════════════════════════════════════ */

function PricingSection() {
  const [ref, inView] = useInView({ threshold: 0.1 });
  const [annual, setAnnual] = useState(false);

  return (
    <section ref={ref} id="pricing" className="bg-white py-20 sm:py-28">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-cyan-600 font-semibold text-sm tracking-wider uppercase mb-2">
            Pricing
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-4">
            Plans That Scale With You
          </h2>
          <p className="text-slate-600 max-w-xl mx-auto mb-8">
            From solo designers to enterprise agencies — pick the plan that fits your review volume.
          </p>

          {/* Toggle */}
          <div className="inline-flex items-center gap-3 bg-slate-100 rounded-full p-1">
            <button
              onClick={() => setAnnual(false)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                !annual
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setAnnual(true)}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
                annual
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Annual
              <span className="ml-1.5 text-xs text-green-600 font-bold">Save 15%</span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {PRICING_TIERS.map((tier, i) => (
            <div
              key={tier.name}
              className={`relative bg-white rounded-2xl p-6 transition-all duration-700 ${
                tier.popular
                  ? 'border-2 border-cyan-400 shadow-lg shadow-cyan-100'
                  : 'border border-slate-200 hover:border-slate-300 hover:shadow-md'
              } ${inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
              style={{ transitionDelay: `${i * 100}ms` }}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-cyan-500 text-slate-900 text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900 mb-1">{tier.name}</h3>
                <p className="text-sm text-slate-500 mb-4">{tier.audience}</p>
                <div className="mb-2">
                  <span className="text-3xl font-bold text-slate-900">
                    {annual ? tier.annualRange : tier.monthlyRange}
                  </span>
                  <span className="text-sm text-slate-500 ml-1">
                    {tier.name === 'Per Plan' ? '/plan' : '/mo'}
                  </span>
                </div>
                <p className="text-sm text-cyan-600 font-medium">{tier.plans}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2 text-sm text-slate-600">
                    <Check className="w-4 h-4 text-cyan-500 flex-shrink-0 mt-0.5" />
                    {feat}
                  </li>
                ))}
              </ul>

              <Link
                href={
                  tier.name === 'Enterprise'
                    ? '#contact'
                    : `/checkout?plan=${tier.name.toLowerCase().replace(/ /g, '_')}`
                }
                className={`block w-full text-center font-semibold py-3 px-4 rounded-xl transition-all text-sm ${
                  tier.ctaStyle === 'primary'
                    ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-900 shadow-md shadow-cyan-200'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                }`}
              >
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION 6 — SOCIAL PROOF
   ═══════════════════════════════════════════════════════════════════════ */

function StatCounter({
  stat,
  inView,
}: {
  stat: (typeof PROOF_STATS)[number];
  inView: boolean;
}) {
  const count = useCountUp(stat.value, 2200, inView, stat.decimals ?? 0);

  return (
    <div className="text-center">
      <p className="text-4xl sm:text-5xl font-bold text-cyan-300">
        {stat.decimals ? count.toFixed(stat.decimals) : count}
        {stat.suffix}
      </p>
      <p className="text-slate-300 mt-1 text-sm">{stat.label}</p>
    </div>
  );
}

function SocialProofSection() {
  const [ref, inView] = useInView({ threshold: 0.15 });
  const [statsRef, statsInView] = useInView({ threshold: 0.3 });

  return (
    <section ref={ref} id="social-proof" className="bg-white py-20 sm:py-28">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Testimonials */}
        <div className="text-center mb-16">
          <p className="text-cyan-600 font-semibold text-sm tracking-wider uppercase mb-2">
            Trusted by Professionals
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-slate-900">
            What Our Users Say
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-20">
          {TESTIMONIALS.map((t, i) => (
            <div
              key={i}
              className={`bg-slate-50 border-l-4 border-cyan-400 rounded-lg p-6 transition-all duration-700 ${
                inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-6'
              }`}
              style={{ transitionDelay: `${i * 150}ms` }}
            >
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, s) => (
                  <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <blockquote className="text-slate-700 text-sm leading-relaxed mb-4">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <div>
                <p className="font-bold text-slate-900 text-sm">{t.name}</p>
                <p className="text-slate-500 text-xs">
                  {t.title}, {t.company}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Logo bar */}
        <div className="text-center mb-16">
          <p className="text-slate-400 text-sm font-medium mb-6">
            Trusted by teams at
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-40">
            {['Coastal Builders', 'FL Private Providers Inc', 'Palm Design Group', 'Sunstate Engineering', 'Gulf Code Review'].map(
              (name) => (
                <div
                  key={name}
                  className="text-slate-400 font-bold text-sm tracking-wider uppercase"
                >
                  {name}
                </div>
              ),
            )}
          </div>
        </div>

        {/* Stats bar */}
        <div
          ref={statsRef}
          className="bg-slate-900 rounded-2xl py-12 px-8"
        >
          <div className="grid grid-cols-3 gap-8">
            {PROOF_STATS.map((stat, i) => (
              <StatCounter key={i} stat={stat} inView={statsInView} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   SECTION 6 — FINAL CTA
   ═══════════════════════════════════════════════════════════════════════ */

function FinalCTASection() {
  const [ref, inView] = useInView({ threshold: 0.3 });

  return (
    <section
      ref={ref}
      id="contact"
      className="relative bg-gray-200 py-24 sm:py-32 overflow-hidden"
    >
      {/* Subtle radial glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)',
        }}
      />

      <div
        className={`relative max-w-3xl mx-auto px-4 text-center transition-all duration-700 ${
          inView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-slate-900 mb-4">
          {FINAL_CTA_HEADLINE}
        </h2>
        <p className="text-lg text-slate-600 mb-10 max-w-xl mx-auto">
          Upload your plans today and get an AI-powered compliance report before your next
          submission deadline.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
          <Link
            href="/analyze"
            className="cta-glow group inline-flex items-center gap-2 bg-cyan-500 hover:bg-cyan-400 text-slate-900 font-bold text-lg px-8 py-4 rounded-xl transition-all shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/40"
          >
            <Upload className="w-5 h-5" />
            {CTA_TEXT}
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <a
            href="#"
            className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 font-semibold text-lg transition-colors"
          >
            {SECONDARY_CTA}
            <ChevronRight className="w-5 h-5" />
          </a>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <Check className="w-4 h-4 text-cyan-600" />
            No credit card required
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="w-4 h-4 text-cyan-600" />
            SOC 2 compliant
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Check className="w-4 h-4 text-cyan-600" />
            Your plans stay private
          </span>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   FOOTER
   ═══════════════════════════════════════════════════════════════════════ */

function Footer() {
  return (
    <footer className="bg-[#1B2A4A] py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <a href="#">
              <img
                src="/permit-pass-logo.png"
                alt="Permit Pass"
                className="h-8 w-auto"
              />
            </a>
            <p className="text-slate-400 text-sm mt-2">
              AI-Powered Florida Building Code Compliance Review
            </p>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-400">
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
            <a href="#social-proof" className="hover:text-white transition-colors">
              Results
            </a>
            <a href="#contact" className="hover:text-white transition-colors">
              Contact
            </a>
          </div>
        </div>
        <div className="border-t border-slate-700 mt-8 pt-6">
          <p className="text-xs text-slate-500 mb-6">
            Disclaimer: Permit Pass provides AI-assisted plan review for informational purposes only. Results do not constitute a professional engineering, architectural, or code compliance certification. All findings should be verified by a licensed professional before permit submission. Permit Pass is not a substitute for review by a licensed private provider, plans examiner, or building official.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>&copy; {new Date().getFullYear()} {PRODUCT_NAME} — Built for Florida Private Providers</p>
            <p>Golden Dog Marketing</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN PAGE
   ═══════════════════════════════════════════════════════════════════════ */

export default function Home() {
  return (
    <main className="overflow-x-hidden">
      <Navbar />
      <HeroSection />
      <PainSection />
      <HowItWorksSection />
      <FeaturesSection />
      <PricingSection />
      <SocialProofSection />
      <FinalCTASection />
      <Footer />
    </main>
  );
}
