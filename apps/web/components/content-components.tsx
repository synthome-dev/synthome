import CodeBlock from "@/components/code-block";
import { slugify } from "@/lib/slugify";
import { type PortableTextComponents } from "@portabletext/react";
import Image from "next/image";
import Link from "next/link";
import type { BundledLanguage } from "shiki/bundle/web";

export const portableTextComponents: PortableTextComponents = {
  types: {
    image: ({ value }: { value: { asset: { url: string }; alt?: string } }) => (
      <div className="my-8">
        <Image
          src={value.asset.url}
          alt={value.alt || ""}
          width={1200}
          height={675}
          className="rounded-lg"
        />
      </div>
    ),
    codeBlock: ({
      value,
    }: {
      value: { code: string; language?: string; filename?: string };
    }) => (
      <div className="my-6 overflow-hidden rounded-lg border">
        {value.filename && (
          <div className="bg-muted text-muted-foreground border-b px-4 py-2 font-mono text-sm">
            {value.filename}
          </div>
        )}
        <CodeBlock
          code={value.code}
          lang={(value.language || "typescript") as BundledLanguage}
          theme="github-dark"
          lineNumbers
          className="[&_pre]:!min-h-0 [&_pre]:!p-4 [&_code]:![border:none] [&_code]:!bg-transparent bg-zinc-900"
        />
      </div>
    ),
  },
  block: {
    h1: ({ children, value }) => {
      const text =
        value?.children
          ?.map((child) => ("text" in child ? child.text : ""))
          .join("") || "";
      const id = slugify(text);
      return (
        <h1 id={id} className="text-foreground mb-4 mt-8 text-4xl font-bold">
          {children}
        </h1>
      );
    },
    h2: ({ children, value }) => {
      const text =
        value?.children
          ?.map((child) => ("text" in child ? child.text : ""))
          .join("") || "";
      const id = slugify(text);
      return (
        <h2
          id={id}
          className="text-foreground mb-4 mt-16 scroll-mt-20 text-2xl font-semibold"
        >
          {children}
        </h2>
      );
    },
    h3: ({ children, value }) => {
      const text =
        value?.children
          ?.map((child) => ("text" in child ? child.text : ""))
          .join("") || "";
      const id = slugify(text);
      return (
        <h3
          id={id}
          className="text-foreground mb-3 mt-6 scroll-mt-20 text-xl font-semibold"
        >
          {children}
        </h3>
      );
    },
    h4: ({ children }) => (
      <h4 className="text-foreground mb-3 mt-6 text-lg font-semibold">
        {children}
      </h4>
    ),
    normal: ({ children }) => (
      <p className="text-muted-foreground mb-4 text-base leading-relaxed">
        {children}
      </p>
    ),
    blockquote: ({ children }) => (
      <blockquote className="border-muted *:last:not-first:text-muted-foreground *:last:not-first:text-sm my-8 border-l-4 pl-4 text-xl *:block *:space-y-4">
        {children}
      </blockquote>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="text-muted-foreground mb-4 ml-6 list-disc space-y-2">
        {children}
      </ul>
    ),
    number: ({ children }) => (
      <ol className="text-muted-foreground mb-4 ml-6 list-decimal space-y-2">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => <li className="leading-relaxed">{children}</li>,
    number: ({ children }) => <li className="leading-relaxed">{children}</li>,
  },
  marks: {
    strong: ({ children }) => (
      <strong className="text-foreground font-semibold">{children}</strong>
    ),
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => (
      <code className="bg-muted text-foreground rounded px-1.5 py-0.5 font-mono text-sm">
        {children}
      </code>
    ),
    link: ({ children, value }) => {
      const href = value?.href || "#";
      return (
        <Link
          href={href}
          className="text-primary hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          {children}
        </Link>
      );
    },
  },
};
