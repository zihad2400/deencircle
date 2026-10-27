"use client";

import { useState, useEffect, useRef } from "react";
import { useToast } from "@/components/shared/ToastProvider";

const TYPES = [
  { key: "like", emoji: "👍", label: "Like", color: "text-blue-500" },
  { key: "love", emoji: "❤️", label: "Love", color: "text-red-500" },
  { key: "care", emoji: "🥰", label: "Care", color: "text-yellow-500" },
  { key: "laugh", emoji: "😂", label: "Haha", color: "text-yellow-500" },
  { key: "surprised", emoji: "😮", label: "Wow", color: "text-yellow-500" },
  { key: "sad", emoji: "😢", label: "Sad", color: "text-yellow-500" },
];

export default function ReactionBar({ postId, initialReaction, initialCount, onUpdate }) {
  const toast = useToast();
  const [picked, setPicked] = useState(initialReaction || null);
  const [count, setCount] = useState(initialCount || 0);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  
  const hoverTimeout = useRef(null);
  const ref = useRef(null);

  useEffect(() => {
    setPicked(initialReaction || null);
    setCount(initialCount || 0);
  }, [initialReaction, initialCount]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMouseEnter = () => {
    if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    hoverTimeout.current = setTimeout(() => {
      setOpen(false);
    }, 500);
  };

  // রিঅ্যাকশন সিলেক্ট বা রিমুভ করার লজিক
  async function handleReactionClick(type) {
    if (busy) return;
    setBusy(true);
    
    // যদি একই রিঅ্যাকশনে ক্লিক করা হয়, তবে সেটি ডিলিট হবে (Unreact)
    const isSame = picked === type;
    const method = isSame ? "DELETE" : "POST";
    
    // Optimistic UI
    const oldPicked = picked;
    const oldCount = count;
    const newPicked = isSame ? null : type;
    const newCount = isSame ? Math.max(0, count - 1) : (picked ? count : count + 1);
    
    setPicked(newPicked);
    setCount(newCount);
    if (onUpdate) onUpdate(newPicked, newCount);

    try {
      const res = await fetch(`/api/posts/${postId}/reactions`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: isSame ? undefined : JSON.stringify({ type }),
      });
      
      if (!res.ok) {
        const data = await res.json();
        // Rollback
        setPicked(oldPicked);
        setCount(oldCount);
        if (onUpdate) onUpdate(oldPicked, oldCount);
        
        if (res.status === 401) {
          toast.error("Login Required", "Please log in to react.");
        } else {
          toast.error("Reaction Failed", data.error || "Try again");
        }
        return;
      }
      
      if (!isSame) toast.success("Reacted", type);
      else toast.success("Removed", "Reaction removed");
      
      setOpen(false);
    } catch (e) {
      setPicked(oldPicked);
      setCount(oldCount);
      if (onUpdate) onUpdate(oldPicked, oldCount);
      toast.error("Error", "Network error");
    } finally {
      setBusy(false);
    }
  }

  const activeType = TYPES.find((t) => t.key === picked);

  return (
    <div ref={ref} className="relative flex-1 flex justify-center">
      {/* মূল বাটন */}
      <button
        type="button"
        disabled={busy}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        // ⚠️ এখানে লজিক আপডেট করা হয়েছে: 
        // যদি কোনো রিঅ্যাকশন না থাকে, মেনু খুলবে। 
        // যদি থাকে, তবে ক্লিক করলে সরাসরি Unreact হবে।
        onClick={() => { 
          if (picked) {
            handleReactionClick(picked); 
          } else {
            setOpen(!open); 
          }
        }}
        className={`flex items-center justify-center gap-2 py-2 rounded-md hover:bg-ts-surface-2 text-sm font-medium transition-colors w-full disabled:opacity-50 ${activeType ? activeType.color : "text-ts-muted"}`}
      >
        {activeType ? (
          <>
            <span className="text-lg leading-none">{activeType.emoji}</span>
            <span className="hidden sm:inline">{activeType.label}</span>
            {count > 0 && <span className="text-xs">({count})</span>}
          </>
        ) : (
          <>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
            </svg>
            <span className="hidden sm:inline">Like</span>
            {count > 0 && <span className="text-xs">({count})</span>}
          </>
        )}
      </button>

      {/* ইমোজি মেনু */}
      {open && (
        <div 
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 flex gap-1 rounded-full border border-ts-border bg-ts-surface px-2 py-1 shadow-ts-2 z-20 animate-in fade-in slide-in-from-bottom-2 duration-200"
        >
          {TYPES.map((t) => (
            <button key={t.key} type="button" title={t.label}
              onClick={() => handleReactionClick(t.key)}
              disabled={busy}
              className={`rounded-full p-1 text-2xl hover:scale-125 hover:-translate-y-1 transition-transform duration-200 disabled:opacity-50 ${picked === t.key ? 'ring-2 ring-ts-primary bg-ts-primary/20' : ''}`}>
              {t.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
