import type { MetadataRoute } from "next";
import { sitemapEntries, sitemapLastModified, absoluteUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  return sitemapEntries().map((path) => ({
    url: absoluteUrl(path),
    lastModified: new Date(sitemapLastModified(path)),
    changeFrequency: path.startsWith("/tools/") && path.split("/").length > 3 ? "monthly" : "weekly",
    priority: path === "/" ? 1 : path.includes("/tools/") ? 0.8 : 0.6,
  }));
}
