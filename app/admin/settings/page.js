"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/shared/ToastProvider";
import Link from "next/link";

export default function AdminSettingsPage() {
  const toast = useToast();
  const [settings, setSettings] = useState({
    siteName: "DeenCircle",
    siteDescription: "Faith. Community. Connection.",
    allowRegistration: true,
    requireEmailVerification: false,
    maintenanceMode: false,
  });
  const [busy, setBusy] = useState(false);

  async function saveSettings(e) {
    e.preventDefault();
    setBusy(true);
    // Placeholder for real API call
    await new Promise(r => setTimeout(r, 800));
    toast.success("Settings Saved", "Platform settings updated.");
    setBusy(false);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Settings</h1>
        <p className="text-sm text-ts-muted mt-1">Configure your platform's global settings.</p>
      </div>

      <div className="flex gap-2">
        <Link href="/admin" className="text-sm text-ts-primary hover:underline">← Back to Dashboard</Link>
      </div>

      <form onSubmit={saveSettings} className="space-y-6">
        
        {/* Site Identity */}
        <section className="rounded-ts-lg border border-ts-border bg-ts-surface p-6 shadow-ts-1 space-y-4">
          <h2 className="text-lg font-semibold">Site Identity</h2>
          <div>
            <label className="block text-sm font-medium mb-1.5">Site Name</label>
            <input value={settings.siteName} onChange={(e) => setSettings({...settings, siteName: e.target.value})}
              className="w-full rounded-ts-sm border border-ts-border bg-ts-surface-2 px-3 py-2 text-sm focus:ring-2 focus:ring-ts-primary/50 outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Tagline</label>
            <input value={settings.siteDescription} onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
              className="w-full rounded-ts-sm border border-ts-border bg-ts-surface-2 px-3 py-2 text-sm focus:ring-2 focus:ring-ts-primary/50 outline-none" />
          </div>
        </section>

        {/* Registration */}
        <section className="rounded-ts-lg border border-ts-border bg-ts-surface p-6 shadow-ts-1 space-y-4">
          <h2 className="text-lg font-semibold">Registration</h2>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium">Allow New Registrations</p>
              <p className="text-xs text-ts-muted">Toggle to open or close public sign-ups.</p>
            </div>
            <input type="checkbox" checked={settings.allowRegistration} onChange={(e) => setSettings({...settings, allowRegistration: e.target.checked})}
              className="h-5 w-5 accent-ts-primary" />
          </label>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium">Require Email Verification</p>
              <p className="text-xs text-ts-muted">Users must verify email before posting.</p>
            </div>
            <input type="checkbox" checked={settings.requireEmailVerification} onChange={(e) => setSettings({...settings, requireEmailVerification: e.target.checked})}
              className="h-5 w-5 accent-ts-primary" />
          </label>
        </section>

        {/* System */}
        <section className="rounded-ts-lg border border-ts-border bg-ts-surface p-6 shadow-ts-1 space-y-4">
          <h2 className="text-lg font-semibold">System</h2>
          <label className="flex items-center justify-between cursor-pointer">
            <div>
              <p className="text-sm font-medium">Maintenance Mode</p>
              <p className="text-xs text-ts-muted">Only admins can access the site when enabled.</p>
            </div>
            <input type="checkbox" checked={settings.maintenanceMode} onChange={(e) => setSettings({...settings, maintenanceMode: e.target.checked})}
              className="h-5 w-5 accent-rose-500" />
          </label>
        </section>

        <button type="submit" disabled={busy}
          className="rounded-ts-sm bg-ts-primary px-6 py-2.5 text-sm font-semibold text-ts-primary-text disabled:opacity-50">
          {busy ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </div>
  );
}
