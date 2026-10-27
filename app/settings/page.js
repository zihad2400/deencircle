"use client";

import { useEffect, useState } from "react";
import { useLang } from "@/components/shared/LanguageProvider";
import { useTheme } from "@/components/shared/ThemeProvider";
import { useToast } from "@/components/shared/ToastProvider";
import { useAuth } from "@/components/shared/AuthProvider";
import UserAvatar from "@/components/shared/UserAvatar";
import ConfirmModal from "@/components/shared/ConfirmModal";

export default function SettingsPage() {
  const { tr, lang, setLang } = useLang();
  const { mode, setMode } = useTheme();
  const { user: me, refreshUser, logout } = useAuth();
  const toast = useToast();
  
  const [activeTab, setActiveTab] = useState("profile");
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (me) {
      setDisplayName(me.displayName || "");
      setBio(me.bio || "");
      setAvatarUrl(me.avatarUrl || "");
    }
  }, [me]);

  if (!me) return <div className="text-center py-20 text-ts-muted">Loading...</div>;

  async function saveProfile(e) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, bio, avatarUrl, preferredLanguage: lang, preferredTheme: mode }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error("Save Failed", data.error || "Try again"); return; }
      toast.success("Profile Updated", "Your profile has been saved.");
      await refreshUser();
    } catch { toast.error("Error", "Network error"); }
    finally { setBusy(false); }
  }

  async function changePassword(e) {
    e.preventDefault();
    if (!currentPassword || !newPassword) return;
    setBusy(true);
    try {
      const res = await fetch("/api/auth/update-profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error("Password Error", data.error || "Try again"); return; }
      toast.success("Password Changed", "You can now use your new password.");
      setCurrentPassword("");
      setNewPassword("");
    } catch { toast.error("Error", "Network error"); }
    finally { setBusy(false); }
  }

  async function deleteAccount() {
    try {
      const res = await fetch("/api/auth/delete-account", { method: "DELETE" });
      if (!res.ok) { toast.error("Error", "Could not delete account"); return; }
      toast.success("Account Deleted", "Goodbye!");
      await logout();
    } catch { toast.error("Error", "Network error"); }
  }

  const tabs = [
    { key: "profile", label: "Profile", icon: "👤" },
    { key: "security", label: "Security", icon: "🔒" },
    { key: "preferences", label: "Preferences", icon: "🎨" },
    { key: "danger", label: "Danger Zone", icon: "⚠️" },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{tr("nav.settings")}</h1>
        <p className="text-sm text-ts-muted mt-1">Manage your account settings and preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[240px_1fr] gap-6">
        <aside>
          <div className="rounded-ts-lg border border-ts-border bg-ts-surface p-2 shadow-ts-1 md:sticky md:top-20">
            <ul className="flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
              {tabs.map(tab => (
                <li key={tab.key} className="shrink-0 md:shrink">
                  <button onClick={() => setActiveTab(tab.key)}
                    className={`w-full text-left flex items-center gap-2 md:gap-3 px-3 py-2 rounded-ts text-sm transition-colors whitespace-nowrap ${
                      activeTab === tab.key ? "bg-ts-primary-soft text-ts-primary font-semibold" : "hover:bg-ts-surface-2 text-ts-text"
                    }`}>
                    <span>{tab.icon}</span>
                    <span>{tab.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </aside>

        <div className="space-y-6">
          {activeTab === "profile" && (
            <div className="rounded-ts-lg border border-ts-border bg-ts-surface p-6 shadow-ts-1">
              <h2 className="text-lg font-semibold mb-4">Public Profile</h2>
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-6">
                <UserAvatar name={displayName || me.displayName} role={me.role} avatarUrl={avatarUrl} size={80} />
                <div>
                  <p className="text-sm font-medium">{me.email}</p>
                  <p className="text-xs text-ts-muted">Role: {me.role}</p>
                </div>
              </div>
              <form onSubmit={saveProfile} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Display Name</label>
                  <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full rounded-ts-sm border border-ts-border bg-ts-surface-2 px-3 py-2 text-sm focus:ring-2 focus:ring-ts-primary/50 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Bio</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} maxLength={200}
                    className="w-full rounded-ts-sm border border-ts-border bg-ts-surface-2 px-3 py-2 text-sm focus:ring-2 focus:ring-ts-primary/50 outline-none resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Avatar URL</label>
                  <input type="url" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..."
                    className="w-full rounded-ts-sm border border-ts-border bg-ts-surface-2 px-3 py-2 text-sm focus:ring-2 focus:ring-ts-primary/50 outline-none" />
                </div>
                <button disabled={busy} className="rounded-ts-sm bg-ts-primary px-4 py-2 text-sm font-semibold text-ts-primary-text disabled:opacity-50">
                  {busy ? "Saving..." : "Save Profile"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "security" && (
            <div className="rounded-ts-lg border border-ts-border bg-ts-surface p-6 shadow-ts-1">
              <h2 className="text-lg font-semibold mb-4">Change Password</h2>
              <form onSubmit={changePassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Current Password</label>
                  <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full rounded-ts-sm border border-ts-border bg-ts-surface-2 px-3 py-2 text-sm focus:ring-2 focus:ring-ts-primary/50 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">New Password (min 8)</label>
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full rounded-ts-sm border border-ts-border bg-ts-surface-2 px-3 py-2 text-sm focus:ring-2 focus:ring-ts-primary/50 outline-none" />
                </div>
                <button disabled={busy} className="rounded-ts-sm bg-ts-primary px-4 py-2 text-sm font-semibold text-ts-primary-text disabled:opacity-50">
                  {busy ? "Updating..." : "Update Password"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="rounded-ts-lg border border-ts-border bg-ts-surface p-6 shadow-ts-1 space-y-6">
              <div>
                <h2 className="text-lg font-semibold mb-4">Appearance</h2>
                <div className="grid grid-cols-3 gap-2">
                  {["light", "dark", "system"].map(t => (
                    <button key={t} onClick={() => setMode(t)}
                      className={`rounded-ts-sm border-2 px-3 py-3 text-sm font-medium capitalize transition-colors ${
                        mode === t ? "border-ts-primary bg-ts-primary-soft text-ts-primary" : "border-ts-border hover:bg-ts-surface-2"
                      }`}>
                      {t === "light" ? "☀️" : t === "dark" ? "🌙" : "💻"} {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <h2 className="text-lg font-semibold mb-4">Language</h2>
                <select value={lang} onChange={(e) => setLang(e.target.value)}
                  className="w-full rounded-ts-sm border border-ts-border bg-ts-surface-2 px-3 py-2 text-sm focus:ring-2 focus:ring-ts-primary/50 outline-none">
                  <option value="en">English</option>
                  <option value="bn">বাংলা</option>
                  <option value="ar">العربية</option>
                  <option value="ur">اردو</option>
                  <option value="hi">हिन्दी</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                  <option value="tr">Türkçe</option>
                  <option value="id">Bahasa Indonesia</option>
                  <option value="ru">Русский</option>
                  <option value="zh">中文</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === "danger" && (
            <div className="rounded-ts-lg border-2 border-rose-500/30 bg-rose-500/5 p-6 shadow-ts-1">
              <h2 className="text-lg font-semibold text-rose-500 mb-2">Delete Account</h2>
              <p className="text-sm text-ts-muted mb-4">Once you delete your account, there is no going back.</p>
              <button onClick={() => setShowDeleteConfirm(true)}
                className="rounded-ts-sm bg-rose-500 text-white px-4 py-2 text-sm font-semibold hover:bg-rose-600 transition-colors">
                Delete My Account
              </button>
            </div>
          )}
        </div>
      </div>

      <ConfirmModal 
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={deleteAccount}
        title="Delete Your Account?"
        message="This action is permanent. All your data will be removed."
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isDanger={true}
      />
    </div>
  );
}
