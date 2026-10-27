export const metadata = {
  title: "Terms of Service | DeenCircle",
  description: "Terms and conditions for using DeenCircle.",
};

export default function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      <h1 className="text-3xl font-bold">Terms of Service</h1>
      <p className="text-sm text-ts-muted">Last updated: 2026</p>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">1. Acceptance of Terms</h2>
        <p className="text-sm leading-relaxed">
          By using DeenCircle, you agree to these terms. If you do not agree, please do not use the platform.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">2. Community Guidelines</h2>
        <p className="text-sm leading-relaxed">
          You agree to treat others with respect. Hate speech, harassment, spam, and content that violates Islamic principles will result in account suspension.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">3. Content Ownership</h2>
        <p className="text-sm leading-relaxed">
          You retain ownership of the content you post. By posting, you grant DeenCircle a license to display your content to other users.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">4. Account Termination</h2>
        <p className="text-sm leading-relaxed">
          We reserve the right to suspend or terminate accounts that violate these terms. You may also delete your account at any time.
        </p>
      </section>

      <p className="text-xs text-ts-muted pt-4 border-t border-ts-border">
        For questions, contact legal@deencircle.app
      </p>
    </div>
  );
}
