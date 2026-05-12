import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "LMDJ - Live Coding Music",
  description:
    "Create music with AI assistance with live coding, the live coding environment. Generate beats, melodies, and soundscapes through natural language.",
  keywords: [
    "morning drift",
    "live coding",
    "music",
    "AI",
    "generative music",
    "algorithmic music",
    "tidal cycles",
  ],
  openGraph: {
    title: "LMDJ - Live Coding Music",
    description:
      "Create music with AI assistance with live coding, the live coding environment.",
    type: "website",
    url: "https://morningdrift.vercel.app",
    siteName: "LMDJ",
  },
  twitter: {
    card: "summary_large_image",
    title: "LMDJ - Live Coding Music",
    description:
      "Create music with AI assistance with live coding, the live coding environment.",
  },
};

const cornerLinks = [
  {
    href: "/taggame",
    label: "Bubble Game",
  },
  {
    href: "/chat",
    label: "Chat Music",
  },
];

const tvLinks = [
  {
    href: "/games/breakout",
    label: "breakout",
  },
  {
    href: "/games/club",
    label: "club",
  },
  {
    href: "/games/index",
    label: "snake",
  },
  {
    href: "/games/slot",
    label: "slot",
  },
];

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(166,255,74,0.12),_transparent_42%),radial-gradient(circle_at_bottom,_rgba(108,92,231,0.18),_transparent_46%)]" />

      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
        <div className="relative aspect-square w-full max-w-[min(96vw,92vh)]">
          <Image
            src="/lmdj.png"
            alt="Little Monster DJ home screen"
            fill
            priority
            sizes="(max-width: 768px) 96vw, 80vw"
            className="object-contain [image-rendering:pixelated]"
          />

          <div className="absolute bottom-[10%] left-[4%] z-20 flex w-[28%] min-w-[10rem] max-w-[14rem] flex-col gap-2">
            {cornerLinks.map((entry) => (
              <Link
                key={entry.href}
                href={entry.href}
                className="flex min-h-[2.4rem] items-center justify-center rounded-md border border-lime-300/60 bg-black/72 px-3 py-2 text-center text-[clamp(0.72rem,1vw,0.9rem)] font-black uppercase tracking-[0.12em] text-lime-200 shadow-[0_0_0_1px_rgba(163,230,53,0.25),0_0_18px_rgba(163,230,53,0.24)] transition hover:-translate-y-0.5 hover:bg-lime-300/15 hover:text-lime-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300/80"
              >
                {entry.label}
              </Link>
            ))}
          </div>

          <div className="absolute left-1/2 top-[72%] z-20 flex w-[39%] -translate-x-1/2 -translate-y-1/2 flex-col gap-[0.42rem] px-[2%] sm:gap-[0.52rem]">
            {tvLinks.map((entry) => (
              <Link
                key={entry.href}
                href={entry.href}
                className="flex min-h-[2.08rem] items-center justify-center rounded-md border border-lime-300/60 bg-black/70 px-2 py-1.5 text-center text-[clamp(0.62rem,1.18vw,0.86rem)] font-black uppercase tracking-[0.12em] text-lime-200 shadow-[0_0_0_1px_rgba(163,230,53,0.25),0_0_18px_rgba(163,230,53,0.24)] transition hover:-translate-y-0.5 hover:bg-lime-300/15 hover:text-lime-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-lime-300/80"
              >
                {entry.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
