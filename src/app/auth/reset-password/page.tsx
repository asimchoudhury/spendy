"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Wallet, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

// NOTE: The redirectTo URL below must also be added in the Supabase dashboard:
// Authentication → URL Configuration → Email Templates → Reset Password
// Set the redirect URL to: http://localhost:3000/auth/reset-password
// (and your production domain equivalent, e.g. https://your-app.vercel.app/auth/reset-password)

type Stage = "loading" | "form" | "success" | "error";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("loading");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("code");

    if (!code) {
      setInitError("Invalid or missing reset link. Please request a new one.");
      setStage("error");
      return;
    }

    supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
      if (error) {
        setInitError("This reset link has expired or is invalid. Please request a new one.");
        setStage("error");
      } else {
        setStage("form");
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setSubmitting(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSubmitting(false);

    if (updateError) {
      setError(updateError.message);
    } else {
      setStage("success");
      setTimeout(() => router.replace("/login"), 3000);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-2.5 justify-center mb-6">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-sm">
            <Wallet size={18} className="text-white" />
          </div>
          <span className="font-bold text-gray-900 text-xl tracking-tight">Spendy</span>
        </div>

        {stage === "loading" && (
          <div className="flex justify-center py-8">
            <Loader2 className="animate-spin text-violet-600" size={32} />
          </div>
        )}

        {stage === "error" && (
          <div className="text-center">
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg mb-4">{initError}</p>
            <Link href="/forgot-password" className="text-sm text-violet-600 hover:text-violet-700 font-medium">
              Request a new reset link
            </Link>
          </div>
        )}

        {stage === "success" && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 size={24} className="text-green-600" />
              </div>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 mb-2">Password updated</h1>
            <p className="text-sm text-gray-500 mb-4">
              Your password has been changed. Redirecting you to sign in…
            </p>
            <Link href="/login" className="text-sm text-violet-600 hover:text-violet-700 font-medium">
              Sign in now
            </Link>
          </div>
        )}

        {stage === "form" && (
          <>
            <h1 className="text-xl font-semibold text-gray-900 text-center mb-1">Set new password</h1>
            <p className="text-sm text-gray-500 text-center mb-6">
              Choose a new password for your account
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  New password
                </label>
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm password
                </label>
                <input
                  id="confirm"
                  type="password"
                  required
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
                />
              </div>

              {error && (
                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {submitting && <Loader2 size={15} className="animate-spin" />}
                Update password
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
