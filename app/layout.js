import "./globals.css";
import { Suspense } from "react";
import { LanguageProvider } from "@/components/shared/LanguageProvider";
import { ThemeProvider } from "@/components/shared/ThemeProvider";
import { ToastProvider } from "@/components/shared/ToastProvider";
import { AuthProvider } from "@/components/shared/AuthProvider";
import AppShell from "@/components/layout/AppShell";

export const metadata = {
  title: "DeenCircle",
  description: "Faith. Community. Connection.",
};

const themeBootstrap = `
(function(){try{
  var m=localStorage.getItem('ts_theme')||'system';
  var dark=m==='dark'||(m==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.classList.toggle('dark',dark);
  document.documentElement.dataset.theme=m;
  var l=localStorage.getItem('ts_lang');
  if(l==='ar'){document.documentElement.lang='ar';document.documentElement.dir='rtl';}
  else if(l==='bn'){document.documentElement.lang='bn';document.documentElement.dir='ltr';}
}catch(e){}})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <ToastProvider>
                <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-ts-muted">Loading...</div>}>
                  <AppShell>{children}</AppShell>
                </Suspense>
              </ToastProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
