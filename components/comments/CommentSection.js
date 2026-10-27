"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/shared/ToastProvider";
import { useRouter } from "next/navigation";
import UserAvatar from "@/components/shared/UserAvatar";
import CommentReactionButton from "@/components/comments/CommentReactionButton";
import ConfirmModal from "@/components/shared/ConfirmModal";

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
        
        // ⚠️ Orphan handling: If parent is missing, treat the reply as a root comment
        const validIds = new Set(fetchedComments.map(c => c.id));
        
        const roots = fetchedComments.filter(c => 
          !c.parentId || !validIds.has(c.parentId)
        );
        const children = fetchedComments.filter(c => 
          c.parentId && validIds.has(c.parentId)
        );
        
        const nested = roots.map(root => ({
          ...root,
          replies: children.filter(child => child.parentId === root.id)
        }));
        
        setComments(nested);
        if (onUpdate) onUpdate(fetchedComments.length);
      }
    } finally { 
      setLoading(false); 
    }
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
        if (res.status === 401) { 
          router.push("/login"); 
          toast.error("Login Required", "Please log in to comment."); 
          return; 
        }
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

  async function handlePostReply(e, parentId) {
    e.preventDefault();
    if (!replyText.trim()) return;
    setReplyBusy(true);
    try {
      const res = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyText, parentId }),
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
            <li key={root.id} className="space-y-3">
              
              <CommentItem 
                comment={root} 
                onReply={() => setReplyTo({ id: root.id, authorName: root.authorName })}
                onDelete={confirmDelete}
                onReact={(type, count) => handleReactionUpdate(type, count, false, root.id, null)}
              />

              {root.replies && root.replies.length > 0 && (
                <ul className="ml-6 sm:ml-8 space-y-3 border-l-2 border-ts-border/60 pl-3 sm:pl-4">
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
                <div className="ml-6 sm:ml-8 mt-2">
                  <form onSubmit={(e) => handlePostReply(e, root.id)} className="flex gap-2 items-center">
                    <input 
                      value={replyText} 
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Reply to ${replyTo.authorName}...`}
                      className="flex-1 min-w-0 rounded-full border border-ts-border bg-ts-surface-2 px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ts-primary/50" 
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
          className="shrink-0 rounded-full bg-ts-primary px-4 py-2 text-sm font-medium text-ts-primary-text disabled:opacity-50 hover:bg-ts-primary/90 transition-colors">
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
  return (
    <div className="flex gap-2 items-start group">
      <UserAvatar name={comment.authorName} role={comment.role || "user"} size={isReply ? 28 : 32} />
      <div className="flex-1 min-w-0">
        <div className="bg-ts-surface-2 rounded-2xl rounded-tl-sm px-3 py-2 inline-block max-w-full">
          <div className="flex items-center gap-1">
            <p className="text-sm font-semibold">{comment.authorName}</p>
            {comment.isOwn && <span className="text-[10px] text-ts-muted bg-ts-border px-1 rounded">You</span>}
          </div>
          <p className="whitespace-pre-wrap text-sm break-words">{comment.content}</p>
        </div>
        
        <div className="flex items-center gap-3 mt-1 px-1">
          <button onClick={onReply} className="text-xs text-ts-muted hover:text-ts-text font-medium">Reply</button>
          
          <CommentReactionButton 
            commentId={comment.id} 
            initialReaction={comment.myReaction} 
            initialCount={comment.reactionCount} 
            onUpdate={onReact}
          />

          {(comment.isOwn || comment.canDelete) && (
            <button onClick={() => onDelete(comment.id)} className="text-xs text-rose-500/80 hover:text-rose-500 font-medium">Delete</button>
          )}
        </div>
      </div>
    </div>
  );
}
