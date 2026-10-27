"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/components/shared/AuthProvider";
import { useToast } from "@/components/shared/ToastProvider";
import UserAvatar from "@/components/shared/UserAvatar";
import ConfirmModal from "@/components/shared/ConfirmModal";
import Link from "next/link";

const EMOJIS = ["😀","😂","😍","🥰","😎","🤔","👍","❤️","🔥","✨","🎉","🙏","😢","😡","🤲","🕌"];

function timeAgo(iso) {
  const d = new Date(iso);
  const diff = (new Date() - d) / 1000;
  if (diff < 60) return "just now";
  if (diff < 3600) return Math.floor(diff/60) + "m ago";
  if (diff < 86400) return Math.floor(diff/3600) + "h ago";
  return d.toLocaleDateString();
}

function ChatBox({ activeUserId, onBack, onDeleteConversation }) {
  const { user: me } = useAuth();
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [otherUser, setOtherUser] = useState(null);
  const [showEmoji, setShowEmoji] = useState(false);
  const [showAttachment, setShowAttachment] = useState(false);
  const [locating, setLocating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const endRef = useRef(null);
  const emojiRef = useRef(null);
  const attachRef = useRef(null);

  useEffect(() => {
    if (!activeUserId) return;
    setLoading(true);
    fetch(`/api/messages?with=${activeUserId}`)
      .then(r => r.json())
      .then(d => { setMessages(d.messages || []); setLoading(false); });
    
    fetch(`/api/users/${activeUserId}`)
      .then(r => r.json())
      .then(d => { if (d.user) setOtherUser(d.user); });
  }, [activeUserId]);

  useEffect(() => {
    if (!activeUserId) return;
    const interval = setInterval(() => {
      fetch(`/api/messages?with=${activeUserId}`)
        .then(r => r.json())
        .then(d => setMessages(d.messages || []));
    }, 3000);
    return () => clearInterval(interval);
  }, [activeUserId]);

  useEffect(() => {
    if (endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  useEffect(() => {
    function onDoc(e) {
      if (emojiRef.current && !emojiRef.current.contains(e.target)) setShowEmoji(false);
      if (attachRef.current && !attachRef.current.contains(e.target)) setShowAttachment(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  async function sendTextMessage(e) {
    e.preventDefault();
    if (!content.trim()) return;
    
    const txt = content;
    setContent("");
    
    setMessages(prev => [...prev, { id: "temp-" + Date.now(), from: me.id, to: activeUserId, content: txt, type: "text", read: false, createdAt: new Date() }]);
    
    try {
      await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: activeUserId, content: txt, type: "text" })
      });
      const res = await fetch(`/api/messages?with=${activeUserId}`);
      const data = await res.json();
      setMessages(data.messages || []);
    } catch {
      toast.error("Error", "Could not send message");
    }
  }

  async function handleDeleteConversation() {
    try {
      const res = await fetch(`/api/messages/${activeUserId}`, { method: "DELETE" });
      if (!res.ok) {
        toast.error("Error", "Could not delete conversation");
        return;
      }
      toast.success("Deleted", "Conversation cleared");
      setShowDeleteConfirm(false);
      onDeleteConversation(activeUserId); // Notify parent to refresh list
    } catch {
      toast.error("Error", "Network error");
    }
  }

  async function handleSendLocation() {
    if (!navigator.geolocation) {
      toast.error("Not Supported", "Geolocation is not supported.");
      return;
    }
    setLocating(true);
    setShowAttachment(false);
    
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const locationText = `📍 Live Location\n${mapLink}`;
        
        const tempId = "temp-" + Date.now();
        setMessages(prev => [...prev, { id: tempId, from: me.id, to: activeUserId, content: locationText, type: "location", meta: JSON.stringify({lat: latitude, lng: longitude}), read: false, createdAt: new Date() }]);
        
        try {
          await fetch("/api/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ to: activeUserId, content: locationText, type: "location", meta: JSON.stringify({lat: latitude, lng: longitude}) })
          });
          const res = await fetch(`/api/messages?with=${activeUserId}`);
          const data = await res.json();
          setMessages(data.messages || []);
          toast.success("Location Sent", "Your live location has been shared.");
        } catch {
          toast.error("Error", "Could not send location");
        } finally {
          setLocating(false);
        }
      },
      (error) => {
        let msg = "Could not get location.";
        if (error.code === 1) msg = "Location permission denied.";
        else if (error.code === 2) msg = "Location unavailable.";
        else if (error.code === 3) msg = "Location request timed out.";
        toast.error("Location Error", msg);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }

  function addEmoji(emoji) {
    setContent(prev => prev + emoji);
    setShowEmoji(false);
  }

  return (
    <div className="flex flex-col h-full w-full min-h-0 border border-ts-border rounded-ts-lg bg-ts-surface overflow-hidden shadow-ts-1">
      
      <div className="flex items-center gap-3 p-3 border-b border-ts-border bg-ts-surface shrink-0">
        <button onClick={onBack} className="md:hidden text-ts-muted hover:text-ts-text p-1">←</button>
        {otherUser && (
          <Link href={`/profile/${otherUser.id}`} className="flex items-center gap-3 hover:underline flex-1">
            <UserAvatar name={otherUser.name} role={otherUser.role} avatarUrl={otherUser.avatarUrl} size={36} />
            <div>
              <p className="font-semibold text-sm">{otherUser.name}</p>
              <p className="text-xs text-ts-muted">@{otherUser.role}</p>
            </div>
          </Link>
        )}
        <button 
          onClick={() => setShowDeleteConfirm(true)}
          className="text-ts-muted hover:text-rose-500 p-1"
          title="Delete conversation"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
          </svg>
        </button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-2 bg-ts-bg/50" style={{ overflowAnchor: "none" }}>
        {loading && <p className="text-center text-sm text-ts-muted">Loading...</p>}
        {messages.length === 0 && !loading && (
          <p className="text-center text-sm text-ts-muted py-10">No messages yet. Say hello!</p>
        )}
        {messages.map((m, i) => {
          const isMine = String(m.from) === String(me?.id);
          return (
            <div key={m.id || i} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm shadow-sm ${
                isMine ? "bg-ts-primary text-white rounded-br-sm" : "bg-ts-surface text-ts-text border border-ts-border rounded-bl-sm"
              }`}>
                
                {m.type === "location" ? (
                  <div>
                    <p className="font-semibold">📍 Live Location</p>
                    {m.meta && (() => {
                      try {
                        const meta = JSON.parse(m.meta);
                        return (
                          <div className="mt-1">
                            <iframe
                              src={`https://maps.google.com/maps?q=${meta.lat},${meta.lng}&z=15&output=embed`}
                              width="100%"
                              height="120"
                              style={{ border: 0, borderRadius: "8px", maxWidth: "200px" }}
                              loading="lazy"
                              referrerPolicy="no-referrer-when-downgrade"
                              title="Live Location"
                            />
                            <a 
                              href={`https://www.google.com/maps?q=${meta.lat},${meta.lng}`} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className={`text-xs underline mt-1 block ${isMine ? 'text-white/80' : 'text-ts-primary'}`}>
                              Open in Google Maps →
                            </a>
                          </div>
                        );
                      } catch { return null; }
                    })()}
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                )}
                
                <div className={`flex items-center justify-end gap-1 mt-0.5 ${isMine ? "text-white/70" : "text-ts-muted"}`}>
                  <span className="text-[10px]">{timeAgo(m.createdAt)}</span>
                  {isMine && <span className="text-[10px] font-bold">{m.read ? "✓✓" : "✓"}</span>}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>

      <form onSubmit={sendTextMessage} className="p-2 sm:p-3 border-t border-ts-border flex gap-1 sm:gap-2 items-center bg-ts-surface shrink-0 min-h-[60px]">
        
        <div className="relative" ref={attachRef}>
          <button type="button" onClick={() => setShowAttachment(!showAttachment)} className="p-1.5 text-ts-muted hover:text-ts-primary">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path>
            </svg>
          </button>
          {showAttachment && (
            <div className="absolute bottom-full mb-2 left-0 bg-ts-surface border border-ts-border rounded-xl shadow-ts-2 p-2 z-50 flex flex-col gap-1 min-w-[200px]">
              <button 
                type="button"
                onClick={handleSendLocation} 
                disabled={locating}
                className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-ts-surface-2 rounded-md text-left disabled:opacity-50">
                <span className="text-lg">📍</span> 
                <span>{locating ? "Getting location..." : "Send Live Location"}</span>
              </button>
            </div>
          )}
        </div>

        <div className="relative" ref={emojiRef}>
          <button type="button" onClick={() => setShowEmoji(!showEmoji)} className="p-1.5 text-ts-muted hover:text-ts-primary">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path><line x1="9" y1="9" x2="9.01" y2="9"></line><line x1="15" y1="9" x2="15.01" y2="9"></line>
            </svg>
          </button>
          {showEmoji && (
            <div className="absolute bottom-full mb-2 left-0 bg-ts-surface border border-ts-border rounded-xl shadow-ts-2 p-2 flex flex-row flex-nowrap gap-1 overflow-x-auto z-50 max-w-[280px] sm:max-w-[350px]">
              {EMOJIS.map(e => (
                <button key={e} type="button" onClick={() => addEmoji(e)} className="text-xl hover:bg-ts-surface-2 p-1 rounded shrink-0">{e}</button>
              ))}
            </div>
          )}
        </div>

        <input 
          value={content} 
          onChange={(e) => setContent(e.target.value)} 
          placeholder="Type a message" 
          className="flex-1 min-w-0 bg-ts-surface-2 rounded-full px-3 sm:px-4 py-2 text-sm outline-none focus:outline-none focus:ring-0 border border-transparent focus:border-transparent" 
        />
        
        <button 
          type="submit" 
          disabled={!content.trim()}
          className="bg-ts-primary text-white px-3 sm:px-4 py-2 rounded-full text-sm font-semibold disabled:opacity-50 shrink-0">
          Send
        </button>
      </form>

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteConversation}
        title="Delete Conversation?"
        message="Are you sure you want to delete all messages in this conversation? This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
      />
    </div>
  );
}

function MessageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchUsers, setSearchUsers] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const activeUserId = searchParams.get("with");

  async function loadConversations() {
    setLoading(true);
    try {
      const res = await fetch("/api/messages");
      const d = await res.json();
      setConversations(d.conversations || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadConversations(); }, [activeUserId]);

  useEffect(() => {
    if (!showNewChat) return;
    const timer = setTimeout(() => {
      fetch(`/api/messages?search=${encodeURIComponent(searchUsers)}`)
        .then(r => r.json())
        .then(d => setSearchResults(d.users || []));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchUsers, showNewChat]);

  function startChat(userId) {
    setShowNewChat(false);
    setSearchUsers("");
    router.push(`/messages?with=${userId}`);
  }

  function handleConversationDeleted(userId) {
    setConversations(prev => prev.filter(c => String(c.userId) !== String(userId)));
    router.push("/messages");
  }

  return (
    <div className="w-full h-full grid grid-cols-1 md:grid-cols-[320px_1fr] gap-4 min-h-0 overflow-hidden">
      <div className={`border border-ts-border rounded-ts-lg bg-ts-surface overflow-hidden flex flex-col min-h-0 ${activeUserId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-ts-border flex items-center justify-between shrink-0">
          <h2 className="font-bold">Messages</h2>
          <button onClick={() => setShowNewChat(true)} className="text-xs bg-ts-primary text-white px-3 py-1 rounded-full font-semibold">+ New</button>
        </div>
        
        <div className="flex-1 min-h-0 overflow-y-auto">
          {loading && <p className="p-4 text-sm text-ts-muted">Loading...</p>}
          {!loading && conversations.length === 0 && (
            <div className="p-6 text-center">
              <p className="text-sm text-ts-muted mb-3">No conversations yet.</p>
              <button onClick={() => setShowNewChat(true)} className="text-xs text-ts-primary hover:underline">Start a new chat</button>
            </div>
          )}
          {conversations.map(c => (
            <button key={c.userId} onClick={() => router.push(`/messages?with=${c.userId}`)}
              className={`w-full flex items-center gap-3 p-3 border-b border-ts-border hover:bg-ts-surface-2 text-left transition-colors ${String(c.userId) === String(activeUserId) ? 'bg-ts-primary-soft' : ''}`}>
              <UserAvatar name={c.name} avatarUrl={c.avatarUrl} size={40} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold truncate">{c.name}</p>
                <p className="text-xs text-ts-muted truncate">{c.lastMessage}</p>
              </div>
              {c.unread > 0 && (
                <span className="bg-ts-primary text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 px-1.5 flex items-center justify-center">{c.unread}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className={`${activeUserId ? 'block h-full min-h-0' : 'hidden md:block h-full min-h-0'}`}>
        {activeUserId ? (
          <ChatBox 
            activeUserId={activeUserId} 
            onBack={() => router.push("/messages")} 
            onDeleteConversation={handleConversationDeleted}
          />
        ) : (
          <div className="hidden md:flex h-full items-center justify-center border border-ts-border rounded-ts-lg bg-ts-surface text-ts-muted text-sm">
            Select a conversation to start messaging
          </div>
        )}
      </div>

      {showNewChat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setShowNewChat(false)}>
          <div className="w-full max-w-md rounded-ts-lg border border-ts-border bg-ts-surface shadow-ts-2 p-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">New Chat</h3>
              <button onClick={() => setShowNewChat(false)} className="text-ts-muted hover:text-ts-text">✕</button>
            </div>
            <input 
              value={searchUsers} 
              onChange={(e) => setSearchUsers(e.target.value)}
              placeholder="Search users..."
              className="w-full bg-ts-surface-2 rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ts-primary/50 mb-3"
              autoFocus
            />
            <div className="max-h-80 overflow-y-auto">
              {searchResults.length === 0 && searchUsers && <p className="text-xs text-ts-muted text-center py-4">No users found</p>}
              {searchResults.map(u => (
                <button key={u.id} onClick={() => startChat(u.id)} 
                  className="w-full flex items-center gap-3 p-2 rounded-ts hover:bg-ts-surface-2 text-left">
                  <UserAvatar name={u.name} role={u.role} avatarUrl={u.avatarUrl} size={36} />
                  <div>
                    <p className="text-sm font-semibold">{u.name}</p>
                    <p className="text-xs text-ts-muted">{u.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <div className="h-full w-full">
      <MessageContent />
    </div>
  );
}
