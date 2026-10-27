"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLang } from "@/components/shared/LanguageProvider";
import { useToast } from "@/components/shared/ToastProvider";
import { useAuth } from "@/components/shared/AuthProvider";
import BrandLogo from "@/components/shared/BrandLogo";

export default function LoginPage() {
  const router = useRouter();
  const { tr } = useLang();
  const toast = useToast();
  const { login } = useAuth(); 
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(tr("nav.login"), data.error || "login_failed");
        return;
      }
      
      login(data.user);
      toast.success(tr("nav.login"), data.user?.displayName || "");
      
      router.push(data.user?.role === "admin" ? "/admin" : "/");
      router.refresh();
    } catch (e) {
      toast.error(tr("actions.retry"), e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md rounded-ts-lg border border-ts-border bg-ts-surface shadow-ts-2 p-5 sm:p-8 animate-in fade-in zoom-in-95 duration-300">
        
        <div className="mb-6 sm:mb-8 text-center">
          <Link href="/" className="inline-flex items-center justify-center gap-2 mb-3">
            <BrandLogo size={36} />
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-ts-text">
              {tr("brand.name")}
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">{tr("nav.login")}</h1>
          <p className="text-xs sm:text-sm text-ts-muted mt-1">Welcome back! Please enter your details.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4 sm:space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5">Email address</label>
            <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
              className="w-full rounded-ts-sm border border-ts-border bg-ts-surface-2 px-4 py-2.5 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-ts-primary/40 focus:border-ts-primary" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-medium">Password</label>
              <Link href="/forgot-password" className="text-xs text-ts-primary hover:underline">Forgot password?</Link>
            </div>
            <div className="relative">
              <input 
                type={showPass ? "text" : "password"} 
                required 
                autoComplete="current-password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                placeholder="••••••••"
                className="w-full rounded-ts-sm border border-ts-border bg-ts-surface-2 px-4 py-2.5 pr-12 text-sm transition-all focus:outline-none focus:ring-2 focus:ring-ts-primary/40 focus:border-ts-primary" 
              />
              
              {/* ⚠️ নতুন প্রিমিয়াম Eye Icon */}
              <button 
                type="button" 
                onClick={() => setShowPass(!showPass)} 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ts-muted hover:text-ts-primary transition-colors p-1" 
                tabIndex={-1}
                aria-label={showPass ? "Hide password" : "Show password"}
              >
                {showPass ? (
                  // চোখ খোলা (দেখাচ্ছে)
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                ) : (
                  // চোখ বন্ধ (লুকানো)
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" disabled={busy}
            className="w-full mt-2 rounded-ts-sm bg-ts-primary text-ts-primary-text py-2.5 text-sm font-semibold shadow-ts-1 transition-all hover:bg-ts-primary/90 hover:shadow-ts-2 disabled:opacity-70 flex items-center justify-center gap-2">
            {busy ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Logging in...
              </>
            ) : tr("nav.login")}
          </button>
        </form>

        <p className="mt-6 sm:mt-8 text-center text-sm text-ts-muted">
          Don't have an account?{" "}
          <Link href="/register" className="font-semibold text-ts-primary hover:underline whitespace-nowrap">{tr("nav.register")}</Link>
        </p>
      </div>
    </div>
  );
}
