"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/shared/ToastProvider";

const SHARE_OPTIONS = [
  {
    name: "WhatsApp",
    icon: "🟢",
    color: "bg-green-500/10 text-green-500",
    getUrl: (url, text) => `https://wa.me/?text=${encodeURIComponent(text + " " + url)}`,
  },
  {
    name: "Facebook",
    icon: "🔵",
    color: "bg-blue-600/10 text-blue-600",
    getUrl: (url) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
  },
  {
    name: "Twitter / X",
    icon: "⚫",
    color: "bg-black/10 text-black dark:bg-white/10 dark:text-white",
    getUrl: (url, text) => `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
  },
  {
    name: "Telegram",
    icon: "🔵",
    color: "bg-sky-500/10 text-sky-500",
    getUrl: (url, text) => `https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`,
  },
  {
    name: "LinkedIn",
    icon: "💼",
    color: "bg-blue-700/10 text-blue-700",
    getUrl: (url) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  },
  {
    name: "Email",
    icon: "📧",
    color: "bg-gray-500/10 text-gray-500",
    getUrl: (url, text) => `mailto:?subject=${encodeURIComponent("Check this out")}&body=${encodeURIComponent(text + "\n\n" + url)}`,
  },
];

export default function ShareModal({ isOpen, onClose, postId, content }) {
  const toast = useToast();
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (isOpen && typeof window !== "undefined") {
      setUrl(`${window.location.origin}/#post-${postId}`);
    }
  }, [isOpen, postId]);

  if (!isOpen) return null;

  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: "DeenCircle Post",
        text: content,
        url: url,
      });
      toast.success("Shared", "Post shared successfully");
      onClose();
    } catch (err) {
      if (err.name !== "AbortError") {
        toast.error("Error", "Could not share natively");
      }
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Copied", "Link copied to clipboard");
      onClose();
    } catch {
      toast.error("Error", "Could not copy link");
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />

      {/* Modal Box */}
      <div className="relative w-full max-w-md rounded-ts-lg border border-ts-border bg-ts-surface shadow-ts-2 p-5 animate-in zoom-in-95 duration-200">
        
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Share Post</h3>
          <button onClick={onClose} className="p-1 text-ts-muted hover:bg-ts-surface-2 rounded-full">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Native Share (Mobile only) */}
        {typeof navigator !== "undefined" && navigator.share && (
          <button onClick={handleNativeShare} className="w-full mb-4 flex items-center justify-center gap-2 rounded-ts-sm bg-ts-primary text-white py-2.5 font-medium">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" y1="2" x2="12" y2="15"/></svg>
            Share via device
          </button>
        )}

        {/* Social Grid */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {SHARE_OPTIONS.map((opt) => (
            <a 
              key={opt.name}
              href={opt.getUrl(url, content)}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex flex-col items-center justify-center gap-2 p-3 rounded-ts border border-ts-border bg-ts-surface-2 hover:bg-ts-surface transition-colors ${opt.color}`}
            >
              <span className="text-2xl">{opt.icon}</span>
              <span className="text-[11px] font-medium text-center">{opt.name}</span>
            </a>
          ))}
        </div>

        {/* Copy Link Input */}
        <div className="flex items-center gap-2 rounded-ts-sm border border-ts-border bg-ts-surface-2 p-1 pl-3">
          <input 
            type="text" 
            readOnly 
            value={url} 
            className="flex-1 bg-transparent text-xs text-ts-muted outline-none truncate"
          />
          <button onClick={copyLink} className="shrink-0 rounded-ts-sm bg-ts-primary/10 text-ts-primary px-3 py-1.5 text-xs font-semibold hover:bg-ts-primary/20 transition-colors">
            Copy
          </button>
        </div>

      </div>
    </div>
  );
}
