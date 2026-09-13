"use client";

import { useState, useEffect, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, AlertCircle, CheckCircle2, Lock, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Navbar from "@/components/Navbar";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, login, signup } = useAuth();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (searchParams.get("mode") === "signup") {
      setIsSignUp(true);
    } else {
      setIsSignUp(false);
    }
  }, [searchParams]);

  // If already logged in, redirect to upload
  useEffect(() => {
    if (user) {
      router.replace("/upload");
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters long.");
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setErrorMsg("Passwords do not match. Please re-enter.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (isSignUp) {
        const res = await signup(email, password);
        if (!res.success) {
          setErrorMsg(res.error || "Signup failed. Please try again.");
          setIsSubmitting(false);
          return;
        }
        setSuccessMsg("Account created! Redirecting to your dashboard...");
        setTimeout(() => {
          router.push("/upload");
        }, 1000);
      } else {
        const res = await login(email, password);
        if (!res.success) {
          setErrorMsg(res.error || "Login failed. Please check your credentials.");
          setIsSubmitting(false);
          return;
        }
        setSuccessMsg("Welcome back! Redirecting...");
        setTimeout(() => {
          router.push("/upload");
        }, 800);
      }
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred. Please try again.");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col text-foreground selection:bg-primary selection:text-white relative">
      {/* Dark overlay for better legibility */}
      <div className="fixed inset-0 bg-black/25 pointer-events-none z-0"></div>
      
      {/* Full-width Navbar */}
      <Navbar />

      {/* Main Form Area */}
      <main className="flex-grow flex items-center justify-center px-4 sm:px-6 py-8 sm:py-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md bg-white/90 backdrop-blur-md border border-white/60 p-6 sm:p-8 rounded-3xl shadow-2xl my-auto"
        >
          {/* Tabs: Log in / Sign up */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                !isSignUp
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Log in
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErrorMsg(null);
                setSuccessMsg(null);
              }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                isSignUp
                  ? "bg-white text-slate-900 shadow-xs"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              Sign up
            </button>
          </div>

          <div className="mb-6">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              {isSignUp
                ? "Sign up to save your discharge summaries and prescriptions to your profile."
                : "Log in to access your saved medical documents and AI analyses."}
            </p>
          </div>

          {/* Feedback Messages */}
          <AnimatePresence>
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
                <span className="leading-snug">{errorMsg}</span>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-sm flex items-center gap-2.5"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <div className="flex flex-col gap-1.5">
              <label htmlFor="email" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Email address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-slate-900"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="password" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  id="password"
                  name="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-slate-900"
                />
              </div>
            </div>

            {isSignUp && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="flex flex-col gap-1.5"
              >
                <label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your password"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white transition-all text-slate-900"
                  />
                </div>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 w-full group inline-flex justify-center items-center gap-2 bg-primary text-primary-foreground py-3 rounded-xl font-semibold shadow-md hover:shadow-lg hover:opacity-95 disabled:opacity-50 transition-all cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{isSignUp ? "Creating account..." : "Signing in..."}</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? "Create account" : "Sign in"}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500">
            {isSignUp ? (
              <>
                Already have an account?{" "}
                <button
                  onClick={() => {
                    setIsSignUp(false);
                    setErrorMsg(null);
                  }}
                  className="text-primary font-semibold hover:underline cursor-pointer"
                >
                  Log in
                </button>
              </>
            ) : (
              <>
                Don&apos;t have an account?{" "}
                <button
                  onClick={() => {
                    setIsSignUp(true);
                    setErrorMsg(null);
                  }}
                  className="text-primary font-semibold hover:underline cursor-pointer"
                >
                  Sign up free
                </button>
              </>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
