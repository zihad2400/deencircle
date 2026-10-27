export const metadata = {
  title: "Privacy Policy | DeenCircle",
  description: "How DeenCircle collects, uses, and protects your data.",
};

export default function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      <h1 className="text-3xl font-bold">Privacy Policy</h1>
      <p className="text-sm text-ts-muted">Last updated: {new Date().getFullYear()}</p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Information We Collect</h2>
        <p className="text-sm leading-relaxed">
          DeenCircle collects your name, email address, and profile information when you register. We also store your posts, comments, reactions, and messages on our secure MongoDB servers.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. How We Use Your Data</h2>
        <p className="text-sm leading-relaxed">
          Your data is used solely to provide the DeenCircle community experience—showing your posts to others, enabling messaging, and displaying personalized content.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Data Security</h2>
        <p className="text-sm leading-relaxed">
          Passwords are hashed with bcrypt. Sessions are protected with HTTP-only cookies. We never sell your data to third parties.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Your Rights</h2>
        <p className="text-sm leading-relaxed">
          You can delete your account at any time from Settings. All your posts, comments, messages, and reactions will be permanently removed.
        </p>
      </section>

      <p className="text-xs text-ts-muted pt-4 border-t border-ts-border">
        Questions? Contact us at privacy@deencircle.app
      </p>
    </div>
  );
}
