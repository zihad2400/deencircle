"use client";

import { useState, useRef, useEffect } from "react";
import { useToast } from "@/components/shared/ToastProvider";

const TYPES = [
  { key: "like", emoji: "👍" },
  { key: "love", emoji: "❤️" },
  { key: "care", emoji: "🥰" },
  { key: "laugh", emoji: "😂" },
  { key: "surprised", emoji: "😮" },
  { key: "sad", emoji: "😢" },
];

export default function CommentReactionButton({ commentId, initialReaction, initialCount, onUpdate }) {
  const toast = useToast();
  const [picked, setPicked] = useState(initialReaction || null);
  const [count, setCount] = useState(initialCount || 0);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onDocClick(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  async function react(type) {
    setOpen(false);
    try {
      const res = await fetch(`/api/comments/${commentId}/reactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type }),
      });
      
      const data = await res.json();
      if (!res.ok) {
        toast.error("Reaction", data.error || "");
        return;
      }
      
      const isSame = picked === type;
      const newPicked = isSame ? null : type;
      const newCount = isSame ? Math.max(0, count - 1) : (picked ? count : count + 1);
      
      setPicked(newPicked);
      setCount(newCount);
      if (onUpdate) onUpdate(newPicked, newCount);
    } catch {
      toast.error("Reaction", "network_error");
    }
  }

  const activeType = TYPES.find((t) => t.key === picked);

  return (
    <div ref={ref} className="relative flex items-center gap-1">
      <button 
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1 text-xs font-medium px-1.5 py-0.5 rounded-md hover:bg-ts-surface-2 transition-colors ${activeType ? 'text-ts-primary' : 'text-ts-muted hover:text-ts-text'}`}
      >
        {activeType ? activeType.emoji : "👍"}
        {count > 0 && <span>{count}</span>}
      </button>

      {open && (
        <div className="absolute bottom-full left-0 mb-1 flex gap-1 rounded-full border border-ts-border bg-ts-surface px-2 py-1 shadow-ts-2 z-50 animate-in fade-in slide-in-from-bottom-1 duration-150">
          {TYPES.map((t) => (
            <button key={t.key} onClick={() => react(t.key)} title={t.key}
              className="text-lg hover:scale-125 transition-transform duration-150 px-1">
              {t.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
