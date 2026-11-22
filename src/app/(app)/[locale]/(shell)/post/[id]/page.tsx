import { getServerT } from "@/i18n/server";
import { fetchMarketingPostById } from "@/services/marketingPosts";
import type { AppLanguage, MarketingPost } from "@/types/types";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { PostView } from "./PostView";

// An admin's sponsored post, opened from the feed grid like a listing opens
// /listing/:id. Rendered on the server so a shared link previews properly;
// RLS keeps hidden posts away from everyone but the admin who posted them.

type PageProps = { params: Promise<{ locale: string; id: string }> };

const getPost = cache(async (id: string): Promise<MarketingPost | null> => {
  if (!/^\d+$/.test(id)) {
    return null;
  }
  return fetchMarketingPostById(id);
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const post = await getPost(id);
  const t = getServerT(locale as AppLanguage);

  if (!post) {
    return { title: t("web.listing.notFoundTitle"), robots: { index: false } };
  }

  const title = [t("admin.sponsored"), post.user?.username].filter(Boolean).join(" · ");
  const description = post.description.replace(/\s+/g, " ").trim().slice(0, 180) || undefined;
  const photo = post.media.find((item) => item.kind === "photo");
  const path = `/post/${post.id}`;

  return {
    title,
    description,
    robots: { index: false, follow: true },
    alternates: {
      canonical: locale === "en" ? `/en${path}` : path,
      languages: { sr: path, en: `/en${path}` },
    },
    openGraph: {
      title,
      description,
      type: "website",
      locale: locale === "en" ? "en_US" : "sr_RS",
      images: photo ? [{ url: photo.public_url }] : ["/favicon.png"],
    },
  };
}

export default async function PostPage({ params }: PageProps) {
  const { id } = await params;
  const post = await getPost(id);

  if (!post) {
    notFound();
  }

  return <PostView post={post} />;
}
