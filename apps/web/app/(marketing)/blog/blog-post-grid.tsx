"use client";

import { formatDate } from "@/lib/format-date";
import { cn } from "@/lib/utils";
import { Post } from "@/types/post";
import { ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export function BlogPostGrid({ posts }: { posts: Post[] }) {
  const moreArticles = posts.slice(2);
  const lastArticles = posts.slice(posts.length - 3);

  return (
    <div className="mx-auto max-w-6xl px-6 lg:px-12">
      <div className="relative">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-x-px -inset-y-6 border-x"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-y-6 inset-x-0 left-1/2 w-2 -translate-x-1 border-x max-sm:hidden lg:left-1/3 lg:-translate-x-1.5"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-y-6 inset-x-0 right-1/3 ml-auto w-2 translate-x-1.5 border-x max-lg:hidden"
        />

        <div className="space-y-12">
          {posts.slice(posts.length - 2).map((article, index) => (
            <div
              key={`${article.title}-${article.date}-${index}`}
              className="group relative"
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-x-6 -inset-y-px group-first:border-y"
              />
              <article
                className={cn(
                  "bg-card/75 ring-foreground/3 hover:bg-card/50 focus-within:bg-card/50 group relative gap-2 rounded-xl border border-transparent shadow-md ring-1 duration-200 sm:grid sm:grid-cols-3"
                )}
              >
                {article.image && (
                  <div className="before:border-border-illustration relative m-0.5 aspect-square overflow-hidden rounded-[10px] before:absolute before:inset-0 before:rounded-[10px] before:border">
                    <Image
                      src={article.image}
                      alt={article.title}
                      width={6394}
                      height={4500}
                      className="h-full w-full object-cover"
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      loading={index < 3 ? "eager" : "lazy"}
                      priority={index === 0}
                    />
                  </div>
                )}

                <div className="col-span-2 flex flex-col gap-3 p-6">
                  <time
                    className="text-muted-foreground text-sm"
                    dateTime={new Date(article.date).toISOString()}
                  >
                    {formatDate(article.date)}
                  </time>
                  <h2 className="text-foreground text-balance text-lg font-semibold md:text-xl">
                    <Link
                      href={`/blog/${article.href}`}
                      className="before:absolute before:inset-0"
                    >
                      {article.title}
                    </Link>
                  </h2>
                  <p className="text-muted-foreground">{article.description}</p>

                  <div className="mt-auto grid grid-cols-[1fr_auto] items-end gap-2 pt-4">
                    <div className="space-y-2">
                      {article.authors.map((author, index) => (
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
                          <span className="text-muted-foreground line-clamp-1 text-sm">
                            {author.name}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex h-6 items-center">
                      <span
                        aria-label={`Read ${article.title}`}
                        className="text-primary group-hover:text-foreground flex items-center gap-1 text-sm font-medium transition-colors duration-200"
                      >
                        Read
                        <ChevronRight
                          strokeWidth={2.5}
                          aria-hidden="true"
                          className="size-3.5 translate-y-px duration-200 group-hover:translate-x-0.5"
                        />
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          ))}
        </div>
      </div>

      {/* More Articles Grid */}
      {moreArticles.length > 0 && (
        <div className="mt-12">
          <div className="relative">
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-px -inset-y-6 border-x"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-y-6 inset-x-0 left-1/2 w-2 -translate-x-1.5 border-x max-sm:hidden lg:left-1/3 lg:-translate-x-1.5"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-y-6 inset-x-0 right-1/3 ml-auto w-2 translate-x-1.5 border-x max-lg:hidden"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute -inset-x-6 -inset-y-px border-y"
            />

            <div className="-mx-6 border-b px-12 py-2">
              <h2 className="text-foreground text-xs font-medium uppercase">
                More Articles
              </h2>
            </div>
            <div className="grid gap-x-2 sm:grid-cols-2 lg:grid-cols-3">
              {moreArticles.map((article, index) => (
                <article
                  key={article.slug}
                  className={cn(
                    "hover:bg-card focus-within:bg-card group relative row-span-2 grid grid-rows-subgrid gap-4 p-6 duration-200",
                    index < moreArticles.length - lastArticles.length &&
                      "border-b"
                  )}
                >
                  <div className="space-y-3">
                    <time
                      className="text-muted-foreground block text-sm"
                      dateTime={new Date(article.date).toISOString()}
                    >
                      {formatDate(article.date)}
                    </time>
                    <h3 className="text-foreground text-lg font-semibold">
                      <Link
                        href={`/blog/${article.slug}`}
                        className="before:absolute before:inset-0"
                      >
                        {article.title}
                      </Link>
                    </h3>
                    <p className="text-muted-foreground">
                      {article.description}
                    </p>
                  </div>

                  <div className="grid grid-cols-[1fr_auto] items-end gap-2 self-end pt-4">
                    <div className="space-y-2">
                      {article.authors.map((author, index) => (
                        <div
                          key={index}
                          className="grid grid-cols-[auto_1fr] items-center gap-2"
                        >
                          <div className="ring-border-illustration bg-card aspect-square size-6 overflow-hidden rounded-md border border-transparent shadow-md shadow-black/15 ring-1">
                            <img
                              src={author.image}
                              alt={author.name}
                              width={460}
                              height={460}
                              className="size-full object-cover"
                              loading="lazy"
                              decoding="async"
                            />
                          </div>
                          <span className="text-muted-foreground line-clamp-1 text-sm">
                            {author.name}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="flex h-6 items-center">
                      <span
                        aria-label={`Read ${article.title}`}
                        className="text-primary group-hover:text-foreground flex items-center gap-1 text-sm font-medium transition-colors duration-200"
                      >
                        Read
                        <ChevronRight
                          strokeWidth={2.5}
                          aria-hidden="true"
                          className="size-3.5 translate-y-px duration-200 group-hover:translate-x-0.5"
                        />
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
