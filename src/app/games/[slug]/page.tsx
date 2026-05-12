import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { listGameHtmlSlugs } from "../_lib/game-files";

type GamePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const slugs = await listGameHtmlSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: GamePageProps): Promise<Metadata> {
  const { slug } = await params;
  return {
    title: `${slug} - MorningDrift`,
  };
}

export default async function GamePage({ params }: GamePageProps) {
  const { slug } = await params;
  const slugs = await listGameHtmlSlugs();

  if (!slugs.includes(slug)) {
    notFound();
  }

  return (
    <main className="h-screen w-full bg-black">
      <iframe
        src={`/games/assets/${slug}.html`}
        title={slug}
        className="h-full w-full border-0"
        allow="fullscreen"
      />
    </main>
  );
}
