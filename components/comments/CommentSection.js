"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/shared/ToastProvider";
import { useRouter } from "next/navigation";
import UserAvatar from "@/components/shared/UserAvatar";
import CommentReactionButton from "@/components/comments/CommentReactionButton";
import ConfirmModal from "@/components/shared/ConfirmModal";
import Link from "next/link";

export default function CommentSection({ postId, onUpdate }) {
  const toast = useToast();
  const router = useRouter();
  
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [replyTo, setReplyTo] = useState(null); 
  const [replyText, setReplyText] = useState("");
  const [replyBusy, setReplyBusy] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState(null);

  const loadComments = useCallback(async () => {
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, { cache: "no-store" });
      if (res.ok) {
        const d = await res.json();
        const fetchedComments = d.comments || [];
        
        // Orphan handling
        const validIds = new Set(fetchedComments.map(c => c.id));
        const roots = fetchedComments.filter(c => !c.parentId || !validIds.has(c.parentId));
        const children = fetchedComments.filter(c => c.parentId && validIds.has(c.parentId));
        
        const nested = roots.map(root => ({
          ...root,
          replies: children.filter(child => child.parentId === root.id)
        }));
        
        setComments(nested);
        if (onUpdate) onUpdate(fetchedComments.length);
      }
    } finally { setLoading(false); }
  }, [postId, onUpdate]);

  useEffect(() => { loadComments(); }, [loadComments]);

  async function handlePostComment(e) {
    e.preventDefault();
    if (!text.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: text, parentId: null }),
      });
      
      const d = await res.json();
      if (!res.ok) {
        if (res.status === 401) { router.push("/login"); return; }
        toast.error("Error", d.error || "Could not post comment");
        return;
      }
      setText("");
      await loadComments();
      toast.success("Comment", "Posted");
    } catch {
      toast.error("Error", "Network error");
    } finally { setBusy(false); }
  }

  async function handlePostReply(e, parentId, mentionName) {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplyBusy(true);
    try {
      // @mention যুক্ত করা
      const finalContent = `@${mentionName} ${replyText}`;
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: finalContent, parentId }),
      });
      
      const d = await res.json();
      if (!res.ok) {
        toast.error("Error", d.error || "Could not post reply");
        return;
      }
      setReplyText("");
      setReplyTo(null);
      await loadComments();
      toast.success("Reply", "Posted");
    } catch {
      toast.error("Error", "Network error");
    } finally { setReplyBusy(false); }
  }

  function confirmDelete(commentId) {
    setDeletingCommentId(commentId);
  }

  async function executeDelete() {
    if (!deletingCommentId) return;
    try {
      const res = await fetch(`/api/comments/${deletingCommentId}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Deleted", "Comment removed");
        await loadComments();
      } else {
        toast.error("Error", "Could not delete comment");
        throw new Error("Failed");
      }
    } catch (e) {
      throw e;
    }
  }

  function handleReactionUpdate(type, count, isReply, parentId, replyId) {
    if (!isReply) {
      setComments(prev => prev.map(c => 
        c.id === parentId ? { ...c, myReaction: type, reactionCount: count } : c
      ));
    } else {
      setComments(prev => prev.map(c => ({
        ...c,
        replies: c.replies?.map(r => 
          r.id === replyId ? { ...r, myReaction: type, reactionCount: count } : r
        )
      })));
    }
  }

  return (
    <div className="mt-2 pt-3 border-t border-ts-border">
      {loading ? (
        <p className="text-xs text-ts-muted mb-2">Loading comments...</p>
      ) : (
        <ul className="mb-4 space-y-4">
          {comments.map((root) => (
            <li key={root.id} className="space-y-2">
              
              <CommentItem 
                comment={root} 
                onReply={() => setReplyTo({ id: root.id, authorName: root.authorName })}
                onDelete={confirmDelete}
                onReact={(type, count) => handleReactionUpdate(type, count, false, root.id, null)}
              />

              {root.replies && root.replies.length > 0 && (
                <ul className="ml-8 space-y-2">
                  {root.replies.map(reply => (
                    <li key={reply.id}>
                      <CommentItem 
                        comment={reply} 
                        isReply={true}
                        onReply={() => setReplyTo({ id: root.id, authorName: reply.authorName })}
                        onDelete={confirmDelete}
                        onReact={(type, count) => handleReactionUpdate(type, count, true, root.id, reply.id)}
                      />
                    </li>
                  ))}
                </ul>
              )}

              {replyTo?.id === root.id && (
                <div className="ml-8 mt-1">
                  <form onSubmit={(e) => handlePostReply(e, root.id, replyTo.authorName)} className="flex gap-2 items-center">
                    <input 
                      value={replyText} 
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to @${replyTo.authorName}...`}
                      className="flex-1 min-w-0 rounded-full border border-ts-border bg-ts-surface-2 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ts-primary/50" 
                      autoFocus
                    />
                    <button type="button" onClick={() => setReplyTo(null)} className="text-xs text-ts-muted hover:text-ts-text px-2">Cancel</button>
                    <button type="submit" disabled={replyBusy || !replyText.trim()} className="shrink-0 rounded-full bg-ts-primary px-3 py-1.5 text-xs font-medium text-ts-primary-text disabled:opacity-50">
                      {replyBusy ? "..." : "Reply"}
                    </button>
                  </form>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handlePostComment} className="flex gap-2 items-center w-full">
        <input 
          value={text} 
          onChange={(e) => setText(e.target.value)}
          placeholder="Write a comment..."
          className="flex-1 min-w-0 rounded-full border border-ts-border bg-ts-surface-2 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ts-primary/50" 
        />
        <button 
          type="submit" 
          disabled={busy || !text.trim()}
          className="shrink-0 rounded-full bg-ts-primary px-4 py-2 text-sm font-medium text-ts-primary-text disabled:opacity-50">
          {busy ? "..." : "Send"}
        </button>
      </form>

      <ConfirmModal 
        isOpen={!!deletingCommentId}
        onClose={() => setDeletingCommentId(null)}
        onConfirm={executeDelete}
        title="Delete Comment?"
        message="Are you sure you want to delete this comment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        isDanger={true}
      />
    </div>
  );
}

function CommentItem({ comment, isReply, onReply, onDelete, onReact }) {
  // মেনশন হাইলাইট করার ফাংশন (যেমন: @Zihad Bin Samsu)
  function renderContent(text) {
    const parts = text.split(/(@[\w\s]+?(?=\s|$|[.,!?]))/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        return <span key={i} className="text-blue-500 font-semibold hover:underline cursor-pointer">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  }

  return (
    <div className="flex gap-2 items-start group">
      <UserAvatar name={comment.authorName} role={comment.role || "user"} size={isReply ? 32 : 36} />
      <div className="flex-1 min-w-0">
        <div className="bg-ts-surface-2 rounded-2xl rounded-tl-sm px-3 py-2 inline-block max-w-full">
          <div className="flex items-center gap-1.5">
            <Link href={`/profile/${comment.authorId}`} className="text-sm font-bold hover:underline">{comment.authorName}</Link>
            {/* অ্যাডমিন হলে Author ব্যাজ */}
            {comment.role === "admin" && (
              <span className="text-[10px] bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded font-semibold flex items-center gap-0.5">
                <svg viewBox="0 0 24 24" width="10" height="10" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
                Author
              </span>
            )}
          </div>
          <p className="whitespace-pre-wrap text-[14px] break-words mt-0.5 leading-relaxed">
            {renderContent(comment.content)}
          </p>
        </div>
        
        <div className="flex items-center gap-4 mt-1.5 px-2">
          <button onClick={onReply} className="text-xs font-semibold text-ts-muted hover:text-ts-text transition-colors">Reply</button>
          
          <CommentReactionButton 
            commentId={comment.id} 
            initialReaction={comment.myReaction} 
            initialCount={comment.reactionCount} 
            onUpdate={onReact}
          />

          {comment.canDelete && (
            <button onClick={() => onDelete(comment.id)} className="text-xs font-semibold text-ts-muted hover:text-rose-500 transition-colors">Delete</button>
          )}
        </div>
      </div>
    </div>
  );
}
