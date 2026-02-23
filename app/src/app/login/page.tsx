'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Shield, Loader2 } from 'lucide-react';

function LoginContent() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get('redirectTo') || '/analyze';

  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid access code');
        return;
      }

      window.location.href = redirectTo;
    } catch {
      setError('Something went wrong. Please try again.');
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
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-cyan-50 rounded-xl mb-3">
                <Shield className="w-6 h-6 text-cyan-600" />
              </div>
              <h1 className="text-2xl font-bold text-slate-900">Beta Access</h1>
              <p className="text-sm text-slate-500 mt-1">
                Enter your access code to continue
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Access Code
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter access code"
                  className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 outline-none transition-all"
                  autoFocus
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !password.trim()}
                className="w-full bg-cyan-500 hover:bg-cyan-400 disabled:bg-slate-300 disabled:cursor-not-allowed text-slate-900 font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Continue'}
              </button>
            </form>
          </div>

          <p className="text-center text-xs text-slate-400 mt-6">
            Permit Pass Beta — Invitation only
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
