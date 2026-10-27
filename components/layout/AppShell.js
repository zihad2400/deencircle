"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useLang } from "@/components/shared/LanguageProvider";
import { useTheme } from "@/components/shared/ThemeProvider";
import { useAuth } from "@/components/shared/AuthProvider";
import { useToast } from "@/components/shared/ToastProvider";
import NotificationBell from "@/components/notifications/NotificationBell";
import LanguageSwitcher from "@/components/shared/LanguageSwitcher";
import BrandLogo from "@/components/shared/BrandLogo";
import UserAvatar from "@/components/shared/UserAvatar";
import { SUPPORTED, LANG_META } from "@/lib/i18n";

function NavItem({ href, label, icon, mobile = false, onClick }) {
  return (
    <Link href={href} onClick={onClick}
      className={`flex ${mobile ? 'flex-col items-center justify-center gap-1 text-[10px]' : 'items-center gap-3 text-sm px-3 py-2'} rounded-ts hover:bg-ts-surface-2 transition-colors text-ts-text`}>
      <span aria-hidden className={`${mobile ? 'text-xl' : 'w-5 text-center opacity-80'}`}>{icon}</span>
      <span className={mobile ? "font-medium" : ""}>{label}</span>
    </Link>
  );
}

function FooterYear() {
  const [year, setYear] = useState("2025");
  useEffect(() => { setYear(String(new Date().getFullYear())); }, []);
  return <span suppressHydrationWarning>{year}</span>;
}

function ProfileMenu({ me, onLogout }) {
  const { tr } = useLang();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    function onDoc(e) { 
      if (!e.target.closest('.profile-menu-root')) setOpen(false); 
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const isAdmin = me.role === "admin";

  return (
    <div className="relative profile-menu-root">
      <button type="button" onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 rounded-full border border-ts-border bg-ts-surface px-1.5 py-1 hover:bg-ts-surface-2">
        <UserAvatar name={me.displayName} role={me.role} size={28} />
        {isAdmin && (
          <span className="hidden sm:inline-block rounded-full bg-rose-500/15 px-2 py-0.5 text-[10px] font-semibold text-rose-500">Admin</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-56 rounded-ts-lg border border-ts-border bg-ts-surface shadow-ts-2 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-3 border-b border-ts-border flex items-center gap-3">
            <UserAvatar name={me.displayName} role={me.role} size={36} />
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{me.displayName}</p>
              <p className="text-xs text-ts-muted truncate">{me.email}</p>
            </div>
          </div>
          <ul className="py-1">
            <li><Link href={`/profile/${me.id}`} onClick={() => setOpen(false)} className="block px-3 py-2 text-sm hover:bg-ts-surface-2">{tr("nav.profile")}</Link></li>
            <li><Link href="/settings" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm hover:bg-ts-surface-2">{tr("nav.settings")}</Link></li>
            {isAdmin && (
              <li>
                <Link href="/admin" onClick={() => setOpen(false)} className="block px-3 py-2 text-sm font-medium text-rose-500 hover:bg-rose-500/10">🛡️ Admin Dashboard</Link>
              </li>
            )}
          </ul>
          <div className="border-t border-ts-border">
            <button onClick={() => { setOpen(false); onLogout(); }} className="w-full text-left px-3 py-2 text-sm text-ts-danger hover:bg-ts-surface-2">{tr("nav.logout")}</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AppShell({ children }) {
  const { tr, lang, setLang, meta } = useLang();
  const { mode, setMode } = useTheme();
  const { user: me, logout: clearAuth } = useAuth(); 
  const toast = useToast();
  const pathname = usePathname();
  const [mobileMenu, setMobileMenu] = useState(false);
  const isMessagesPage = pathname === "/messages";

  useEffect(() => {
    setMobileMenu(false);
  }, [pathname]);

  async function logout() {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      clearAuth(); 
      toast.success(tr("nav.logout"), "");
      window.location.href = "/login";
    } catch {
      toast.error(tr("actions.retry"), "");
    }
  }

  const isAdmin = me?.role === "admin";
  const closeMenu = () => setMobileMenu(false);

  return (
    <div className="min-h-screen flex flex-col bg-ts-bg text-ts-text pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b border-ts-border bg-ts-surface/95 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 h-14 flex items-center gap-3">
          
          <button className="md:hidden p-1 -ml-1 text-ts-muted" onClick={() => setMobileMenu(true)}>
            <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M3 12h18M3 6h18M3 18h18"/></svg>
          </button>

          <Link href="/" className="font-semibold tracking-tight text-lg flex items-center gap-2">
            <BrandLogo size={28} />
            <span className="hidden sm:block">{tr("brand.name")}</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-1 ml-4">
            <NavItem href="/" label={tr("nav.home")} icon="⌂" />
            <NavItem href="/explore" label={tr("nav.explore")} icon="⌕" />
          </nav>
          
          <div className="ml-auto flex items-center gap-2">
            <Link href="/messages" className="p-2 rounded-full border border-ts-border bg-ts-surface hover:bg-ts-surface-2 text-ts-text" aria-label="Messages">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>
            </Link>

            <NotificationBell />

            <div className="hidden sm:block"><LanguageSwitcher /></div>

            <button type="button" onClick={() => setMode(mode === "dark" ? "light" : "dark")}
              className="rounded-ts-sm border border-ts-border bg-ts-surface px-2 py-1 text-sm"
              aria-label={tr("settings.theme")}>
              {mode === "dark" ? "☀" : "☾"}
            </button>

            {me ? <ProfileMenu me={me} onLogout={logout} /> : (
              <Link href="/login" className="rounded-ts-sm px-3 py-1.5 text-sm bg-ts-primary text-ts-primary-text hover:opacity-90">
                {tr("nav.login")}
              </Link>
            )}
          </div>
        </div>
      </header>

      {mobileMenu && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm md:hidden animate-in fade-in" onClick={closeMenu}>
          <div className="w-64 h-full bg-ts-surface p-4 flex flex-col animate-in slide-in-from-left" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-6">
              <BrandLogo size={32} />
              <span className="font-bold text-lg">{tr("brand.name")}</span>
            </div>
            
            <div className="space-y-1 flex-1 overflow-y-auto">
              <NavItem href="/" label={tr("nav.home")} icon="⌂" onClick={closeMenu} />
              <NavItem href="/explore" label={tr("nav.explore")} icon="⌕" onClick={closeMenu} />
              <NavItem href="/notifications" label={tr("nav.notifications")} icon="◔" onClick={closeMenu} />
              <NavItem href="/messages" label="Messages" icon="💬" onClick={closeMenu} />
              <NavItem href="/bookmarks" label="Saved Posts" icon="🔖" onClick={closeMenu} />
              {isAdmin && <NavItem href="/admin" label="Admin Dashboard" icon="🛡️" onClick={closeMenu} />}
              {me && <NavItem href={`/profile/${me.id}`} label={tr("nav.profile")} icon="◑" onClick={closeMenu} />}
              <NavItem href="/settings" label={tr("nav.settings")} icon="⚙" onClick={closeMenu} />
            </div>
            
            <div className="pt-4 mt-4 border-t border-ts-border">
              <label className="block text-sm mb-2">{tr("settings.language")}</label>
              <LanguageSwitcher mobile />
            </div>
          </div>
        </div>
      )}

      {isMessagesPage ? (
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-0 h-[calc(100vh-120px)] md:h-[calc(100vh-56px)] overflow-hidden">
          <main className="h-full w-full min-h-0 overflow-hidden">{children}</main>
        </div>
      ) : (
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 min-h-0">
          <aside className="hidden md:block">
            <div className="sticky top-20 space-y-1 rounded-ts border border-ts-border bg-ts-surface p-2 shadow-ts-1">
              <NavItem href="/" label={tr("nav.home")} icon="⌂" />
              <NavItem href="/explore" label={tr("nav.explore")} icon="⌕" />
              <NavItem href="/notifications" label={tr("nav.notifications")} icon="◔" />
              <NavItem href="/messages" label="Messages" icon="💬" />
              <NavItem href="/bookmarks" label="Saved Posts" icon="🔖" />
              {isAdmin && <NavItem href="/admin" label="Admin Dashboard" icon="🛡️" />}
              {isAdmin && <NavItem href="/admin/moderation" label="Moderation" icon="⚠" />}
              {isAdmin && <NavItem href="/admin/users" label="Users" icon="👥" />}
              {me && <NavItem href={`/profile/${me.id}`} label={tr("nav.profile")} icon="◑" />}
              <NavItem href="/settings" label={tr("nav.settings")} icon="⚙" />
            </div>
          </aside>
          <main className="min-h-0">{children}</main>
        </div>
      )}

      {!isMessagesPage && (
        <footer className="border-t border-ts-border bg-ts-surface hidden md:block">
          <div className="mx-auto max-w-6xl px-4 h-12 flex items-center text-xs text-ts-muted">
            © <FooterYear />{" "}{tr("brand.name")} · {tr("footer.rights")} · {meta[lang].label}
          </div>
        </footer>
      )}

      <nav className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-ts-border bg-ts-surface h-16 flex items-center justify-around pb-safe">
        <NavItem href="/" label={tr("nav.home")} icon="⌂" mobile />
        <NavItem href="/explore" label={tr("nav.explore")} icon="⌕" mobile />
        {isAdmin && <NavItem href="/admin" label="Admin" icon="🛡️" mobile />}
        {me && <NavItem href={`/profile/${me.id}`} label={tr("nav.profile")} icon="◑" mobile />}
      </nav>
    </div>
  );
}
