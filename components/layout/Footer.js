"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/components/shared/LanguageProvider";

export default function Footer() {
  const { tr } = useLang();
  const pathname = usePathname();
  const isMessagesPage = pathname === "/messages";

  // মেসেজ পেজে ফুটার হাইড
  if (isMessagesPage) return null;

  return (
    <footer className="border-t border-ts-border bg-ts-surface mt-auto">
      <div className="mx-auto max-w-6xl px-4 py-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          
          {/* Copyright */}
          <p className="text-xs text-ts-muted text-center sm:text-left">
            © {new Date().getFullYear()} {tr("brand.name")} · {tr("footer.rights")}
          </p>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-ts-muted">
            <Link href="/privacy" className="hover:text-ts-primary transition-colors">
              Privacy
            </Link>
            <span className="opacity-30">·</span>
            <Link href="/terms" className="hover:text-ts-primary transition-colors">
              Terms
            </Link>
            <span className="opacity-30">·</span>
            <Link href="/about" className="hover:text-ts-primary transition-colors">
              About
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
