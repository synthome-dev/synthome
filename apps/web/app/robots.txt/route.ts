const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://synthome.ai";

export async function GET() {
  const robotsTxt = `# robots.txt for ${SITE_URL}
User-agent: *
Allow: /

# Sitemap
Sitemap: ${SITE_URL}/sitemap.xml

# Disallow admin and API routes
Disallow: /api/
Disallow: /studio/
`;

  return new Response(robotsTxt, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=172800",
    },
  });
}
