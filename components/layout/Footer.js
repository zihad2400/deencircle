"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/components/shared/LanguageProvider";
import { useAuth } from "@/components/shared/AuthProvider";
import BrandLogo from "@/components/shared/BrandLogo";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";

export default function Footer() {
  const { tr, lang } = useLang();
  const { user: me } = useAuth();
  const pathname = usePathname();
  const isAdmin = me?.role === "admin";
  const isMessagesPage = pathname === "/messages";

  // মেসেজ পেজে ফুটার হাইড (কারণ পুরো স্ক্রিন চ্যাট দরকার)
  if (isMessagesPage) return null;

  const quickLinks = [
    { href: "/", label: tr("nav.home") },
    { href: "/explore", label: tr("nav.explore") },
    { href: "/bookmarks", label: "Saved Posts" },
    { href: "/notifications", label: tr("nav.notifications") },
  ];

  const accountLinks = me ? [
    { href: `/profile/${me.id}`, label: tr("nav.profile") },
    { href: "/messages", label: "Messages" },
    { href: "/settings", label: tr("nav.settings") },
    ...(isAdmin ? [{ href: "/admin", label: "Admin Dashboard" }] : []),
  ] : [
    { href: "/login", label: tr("nav.login") },
    { href: "/register", label: tr("nav.register") },
  ];

  return (
    <footer className="border-t border-ts-border bg-ts-surface mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-8">
        
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
          
          {/* Brand */}
          <div className="sm:col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-3">
              <BrandLogo size={28} />
              <span className="font-bold text-lg">{tr("brand.name")}</span>
            </Link>
            <p className="text-sm text-ts-muted leading-relaxed max-w-xs">
              {tr("brand.tagline")}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-sm mb-3">Quick Links</h3>
            <ul className="space-y-2">
              {quickLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-ts-muted hover:text-ts-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="font-semibold text-sm mb-3">{me ? "Account" : "Get Started"}</h3>
            <ul className="space-y-2">
              {accountLinks.map(link => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-ts-muted hover:text-ts-primary transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Language & Info */}
          <div>
            <h3 className="font-semibold text-sm mb-3">{tr("settings.language")}</h3>
            <div className="max-w-full">
              <LanguageSwitcher />
            </div>
            <p className="text-xs text-ts-muted mt-3">
              Faith. Community. Connection.
            </p>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-ts-border mt-6 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-xs text-ts-muted">
            © {new Date().getFullYear()} {tr("brand.name")} · {tr("footer.rights")}
          </p>
          <div className="flex items-center gap-3 text-xs text-ts-muted">
            <Link href="/privacy" className="hover:text-ts-primary transition-colors">Privacy</Link>
            <span>·</span>
            <Link href="/terms" className="hover:text-ts-primary transition-colors">Terms</Link>
            <span>·</span>
            <Link href="/about" className="hover:text-ts-primary transition-colors">About</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
