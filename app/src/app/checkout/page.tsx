'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CreditCard, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const PLANS: Record<string, { name: string; price: string; plans: string }> = {
  starter: { name: 'Starter', price: '$99–$199/mo', plans: '5–10 plans/mo' },
  professional: { name: 'Professional', price: '$399–$799/mo', plans: '30–50 plans/mo' },
  enterprise: { name: 'Enterprise', price: '$1,200–$2,500+/mo', plans: 'Unlimited plans' },
  per_plan: { name: 'Per Plan', price: '$15–$60/plan', plans: 'Pay-as-you-go' },
};

function CheckoutContent() {
  const searchParams = useSearchParams();
  const planKey = searchParams.get('plan') || 'starter';
  const plan = PLANS[planKey] || PLANS.starter;
  const { profile } = useAuth();

  return (
    <main className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="bg-slate-800 text-white py-4">
        <div className="container mx-auto px-4 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-slate-300 hover:text-white">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <img
            src="/permit-pass-logo.png"
            alt="Permit Pass"
            className="h-8 w-auto rounded"
          />
          <span className="text-lg font-semibold text-slate-300">— Checkout</span>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-lg mx-auto">
          {/* Coming Soon Banner */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-start gap-3">
            <Bell className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">Coming Soon</p>
              <p className="text-sm text-amber-700">
                Online checkout is not yet available. We&apos;ll notify you when payment
                processing is ready.
              </p>
            </div>
          </div>

          {/* Plan Card */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-cyan-50 rounded-lg flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-cyan-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{plan.name} Plan</h1>
                <p className="text-sm text-slate-500">{plan.plans}</p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6 space-y-4">
              <div className="flex justify-between">
                <span className="text-slate-600">Plan</span>
                <span className="font-semibold text-slate-900">{plan.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Price</span>
                <span className="font-semibold text-slate-900">{plan.price}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Included</span>
                <span className="font-semibold text-slate-900">{plan.plans}</span>
              </div>
              {profile?.email && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Account</span>
                  <span className="text-slate-900">{profile.email}</span>
                </div>
              )}
            </div>

            <button
              disabled
              className="w-full mt-8 bg-slate-300 text-slate-500 font-semibold py-3 px-4 rounded-xl cursor-not-allowed"
            >
              Checkout Coming Soon
            </button>
          </div>

          <div className="text-center mt-6">
            <Link
              href="/analyze"
              className="text-cyan-600 hover:text-cyan-700 font-medium text-sm"
            >
              Back to Analyzer
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense>
      <CheckoutContent />
    </Suspense>
  );
}
