"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, Wallet } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function SignupPage() {
  const { signUp } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    const { error } = await signUp(email, password);
    if (error) {
      setError(error);
      setLoading(false);
    } else {
      router.push("/login");
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

        <h1 className="text-xl font-semibold text-gray-900 text-center mb-1">Create account</h1>
        <p className="text-sm text-gray-500 text-center mb-6">Start tracking your expenses</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
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
            disabled={loading}
            className="w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            Create account
          </button>
        </form>

        <p className="text-sm text-center text-gray-500 mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-violet-600 hover:text-violet-700 font-medium">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
