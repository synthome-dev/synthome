import { CallToAction } from "@/components/call-to-action";
import { Container } from "@/components/container";
import { portableTextComponents } from "@/components/content-components";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { getAllPostSlugs, getPostBySlug } from "@/lib/actions";
import { formatDate } from "@/lib/format-date";
import { PortableText } from "@portabletext/react";
import Image from "next/image";
import { notFound } from "next/navigation";

export async function generateStaticParams() {
  const posts = await getAllPostSlugs();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: `${post.title} - Blog`,
    description: post.description,
    openGraph: {
      title: `${post.title} - Blog`,
      description: post.description,
      images: [
        {
          url: post.image,
          width: 1200,
          height: 675,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${post.title} - Blog`,
      description: post.description,
      images: [
        {
          url: post.image,
          width: 1200,
          height: 675,
        },
      ],
    },
    alternates: {
      canonical: `/blog/${slug}`,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    notFound();
  }

  return (
    <div className="relative mx-auto max-w-6xl px-6 lg:px-12">
      <div className="grid max-lg:gap-4 lg:grid-cols-[1fr_auto_1fr]">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/blog">Blog</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/blog/category/${post.category.slug}`}>
                {post.category.title}
              </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <article className="max-w-2xl">
          <header className="mb-8">
            <time
              className="text-muted-foreground text-sm"
              dateTime={new Date(post.publishedAt).toISOString()}
            >
              {formatDate(post.publishedAt)}
            </time>
            <h1 className="text-foreground mt-6 text-balance text-3xl font-semibold md:text-4xl md:leading-tight">
              {post.title}
            </h1>
          </header>

          <div className="max-w-2xl">
            {post.image && (
              <div className="relative overflow-hidden rounded-xl border shadow shadow-black/5">
                <Image
                  src={post.image}
                  alt={post.title}
                  width={1200}
                  height={675}
                  className="aspect-video w-full object-cover"
                  priority
                />
              </div>
            )}

            <div className="mb-12 flex flex-wrap items-center gap-4 border-b py-6">
              {post.authors.map((author, index) => (
                <div
                  key={index}
                  className="grid grid-cols-[auto_1fr] items-center gap-2"
                >
                  <div className="ring-border-illustration bg-card aspect-square size-6 overflow-hidden rounded-md border border-transparent shadow-md shadow-black/15 ring-1">
                    <Image
                      src={author.image}
                      alt={author.name}
                      width={460}
                      height={460}
                      className="size-full object-cover"
                    />
                  </div>
                  <span className="text-foreground line-clamp-1 text-sm">
                    {author.name}
                  </span>
                </div>
              ))}
            </div>

            <div className="prose prose-slate dark:prose-invert max-w-none">
              <p className="text-muted-foreground">{post.description}</p>
              <PortableText
                value={post.body}
                components={portableTextComponents}
              />
            </div>
          </div>
        </article>
      </div>
      <Container className="**:data-[slot=content]:pt-2 h-8 mask-t-from-95% border-0 bg-transparent"></Container>
      <CallToAction />
      <Container className="**:data-[slot=content]:pt-2 h-8 mask-t-from-95% border-0 bg-transparent"></Container>
    </div>
  );
}
