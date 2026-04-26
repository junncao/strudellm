import Script from "next/script";
import type { Metadata } from "next";
import "./globals.css";
import { STORED_THEME_IDS, THEME_STORAGE_KEY } from "@/lib/editor-theme";

export const metadata: Metadata = {
  title: "MorningDrift - Live Coding Music",
  description: "Live coding music editor with AI assistance",
  icons: {
    icon: "/favicon.svg",
    apple: "/apple-touch-icon.svg",
  },
};

function getThemeBootstrapScript(): string {
  return `(() => {
  try {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (!('localStorage' in window)) return;

    var theme = window.localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    var allowed = ${JSON.stringify(STORED_THEME_IDS)};
    if (theme && allowed.indexOf(theme) !== -1) {
      document.documentElement.dataset.theme = theme;
    } else if (theme) {
      window.localStorage.removeItem(${JSON.stringify(THEME_STORAGE_KEY)});
    }
  } catch (e) {
    // Ignore storage access errors (e.g. blocked in some privacy modes)
  }
})();`;
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Script id="theme-bootstrap" strategy="beforeInteractive">
          {getThemeBootstrapScript()}
        </Script>
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
