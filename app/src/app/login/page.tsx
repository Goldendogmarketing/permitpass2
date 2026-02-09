'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Phone, Shield, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type Mode = 'login' | 'signup';
type Step = 'phone' | 'otp';

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (raw.startsWith('+')) return raw;
  return `+${digits}`;
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/analyze';

  const [supabase] = useState(() => createClient());
  const [mode, setMode] = useState<Mode>('login');
  const [step, setStep] = useState<Step>('phone');

  // Form fields
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  // State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleSendOtp = async () => {
    setError(null);
    const formatted = formatPhone(phone);
    if (formatted.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          phone: formatted,
          password: crypto.randomUUID(),
          options: {
            data: { full_name: fullName, email },
          },
        });
        if (signUpError) throw signUpError;
      } else {
        const { error: otpError } = await supabase.auth.signInWithOtp({
          phone: formatted,
        });
        if (otpError) throw otpError;
      }
      setStep('otp');
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to send verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    if (otp.length < 6) {
      setError('Please enter the 6-digit code');
      return;
    }

    setLoading(true);
    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        phone: formatPhone(phone),
        token: otp,
        type: 'sms',
      });
      if (verifyError) throw verifyError;
      router.push(redirectTo);
    } catch (err: any) {
      setError(err.message || 'Invalid verification code');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setError(null);
    setLoading(true);
    try {
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: formatPhone(phone),
      });
      if (otpError) throw otpError;
      setResendCooldown(60);
    } catch (err: any) {
      setError(err.message || 'Failed to resend code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 flex flex-col">
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
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Tabs */}
            <div className="flex bg-slate-100 rounded-xl p-1 mb-8">
              <button
                onClick={() => {
                  setMode('login');
                  setStep('phone');
                  setError(null);
                  setOtp('');
                }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  mode === 'login'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setMode('signup');
                  setStep('phone');
                  setError(null);
                  setOtp('');
                }}
                className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  mode === 'signup'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Sign Up
              </button>
            </div>

            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-cyan-50 rounded-xl mb-3">
                {step === 'phone' ? (
                  <Phone className="w-6 h-6 text-cyan-600" />
                ) : (
                  <Shield className="w-6 h-6 text-cyan-600" />
                )}
              </div>
              <h1 className="text-2xl font-bold text-slate-900">
                {step === 'phone'
                  ? mode === 'signup'
                    ? 'Create Account'
                    : 'Welcome Back'
                  : 'Verify Phone'}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {step === 'phone'
                  ? 'Enter your phone number to continue'
                  : `We sent a code to ${formatPhone(phone)}`}
              </p>
            </div>

            {step === 'phone' && (
              <div className="space-y-4">
                {mode === 'signup' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="John Smith"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="john@example.com"
                        className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                  />
                  <p className="text-xs text-slate-400 mt-1">US numbers auto-formatted to +1</p>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleSendOtp}
                  disabled={loading || !phone.trim() || (mode === 'signup' && !fullName.trim())}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-300 disabled:cursor-not-allowed text-slate-900 font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Send Verification Code'
                  )}
                </button>
              </div>
            )}

            {step === 'otp' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Verification Code
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all text-center text-2xl tracking-[0.5em] font-mono"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleVerifyOtp}
                  disabled={loading || otp.length < 6}
                  className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-300 disabled:cursor-not-allowed text-slate-900 font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue'}
                </button>

                <div className="flex items-center justify-between text-sm">
                  <button
                    onClick={() => {
                      setStep('phone');
                      setOtp('');
                      setError(null);
                    }}
                    className="text-slate-500 hover:text-slate-700"
                  >
                    Change number
                  </button>
                  <button
                    onClick={handleResend}
                    disabled={resendCooldown > 0 || loading}
                    className="text-cyan-600 hover:text-cyan-700 disabled:text-slate-400 disabled:cursor-not-allowed"
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>
              </div>
            )}
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}
