import { getAllPosts } from '@/lib/actions'

export async function GET() {
    const posts = await getAllPosts()

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://tailark.com'
    const title = 'Synthome Blog'
    const description = 'News, insights and more from Synthome'

    const rssFeed = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
    <title>${title}</title>
    <description>${description}</description>
    <link>${siteUrl}/libre/blog-one</link>
    <atom:link href="${siteUrl}/rss.xml" rel="self" type="application/rss+xml" />
    <language>en</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${posts
        .map(
            (post) => `
    <item>
        <title><![CDATA[${post.title}]]></title>
        <description><![CDATA[${post.description}]]></description>
        <link>${siteUrl}${post.href}</link>
        <guid isPermaLink="true">${siteUrl}${post.href}</guid>
        <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>
        ${post.category ? `<category>${post.category.title}</category>` : ''}
        ${post.authors?.map((author) => `<author>${author.name}</author>`).join('\n        ') || ''}
    </item>`
        )
        .join('')}
</channel>
</rss>`

    const headers = new Headers({
        'Content-Type': 'application/xml; charset=utf-8',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=7200',
    })

    return new Response(rssFeed, { headers })
}