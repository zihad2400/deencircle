import Link from "next/link";
import BrandLogo from "@/components/shared/BrandLogo";

export const metadata = {
  title: "About DeenCircle",
  description: "One Community. Three Languages. Meaningful Conversations.",
};

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      <div className="text-center mb-8">
        <BrandLogo size={80} className="mx-auto mb-4" />
        <h1 className="text-3xl font-bold">About DeenCircle</h1>
        <p className="text-ts-muted mt-2">Faith. Community. Connection.</p>
      </div>

      <section className="space-y-3">
        <p className="text-base leading-relaxed">
          DeenCircle is a premium Islamic social community platform designed to bring Muslims together for meaningful conversations, sharing of knowledge, and brotherhood.
        </p>
        <p className="text-base leading-relaxed">
          Built with modern technology, DeenCircle offers a distraction-free, ad-free environment where your focus stays on what matters most: faith, family, and community.
        </p>
      </section>

      <section className="space-y-3 pt-4 border-t border-ts-border">
        <h2 className="text-xl font-semibold">Our Features</h2>
        <ul className="list-disc list-inside text-sm space-y-1 text-ts-muted">
          <li>Text-only posts for focused discussions</li>
          <li>Nested comments and reactions</li>
          <li>Real-time messaging with live location sharing</li>
          <li>Multi-language support (বাংলা, English, العربية, and more)</li>
          <li>Premium dark/light themes</li>
          <li>Admin moderation and community safety</li>
        </ul>
      </section>

      <section className="space-y-3 pt-4 border-t border-ts-border text-center">
        <p className="text-sm text-ts-muted">Want to join us?</p>
        <Link href="/register" className="inline-block rounded-ts-sm bg-ts-primary px-6 py-2 text-sm font-semibold text-white hover:opacity-90">
          Join DeenCircle
        </Link>
      </section>
    </div>
  );
}
