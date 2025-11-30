"use client";

import { cn } from "@/lib/utils";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { JSX, useLayoutEffect, useState } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import type { BundledLanguage } from "shiki/bundle/web";
import { codeToHast } from "shiki/bundle/web";

export async function highlight(
  code: string,
  lang: BundledLanguage,
  theme?: string,
  lineNumbers?: boolean,
) {
  const hast = await codeToHast(code, {
    lang,
    theme: theme || "github-light",
    transformers: lineNumbers
      ? [
          {
            line(node, line) {
              node.properties["data-line"] = line;
            },
          },
        ]
      : [],
  });

  return toJsxRuntime(hast, {
    Fragment,
    jsx,
    jsxs,
  }) as JSX.Element;
}

type Props = {
  code: string | null;
  lang: BundledLanguage;
  initial?: JSX.Element;
  preHighlighted?: JSX.Element | null;
  maxHeight?: number;
  className?: string;
  theme?: string;
  lineNumbers?: boolean;
};

export default function CodeBlock({
  code,
  lang,
  initial,
  maxHeight,
  preHighlighted,
  theme,
  className,
  lineNumbers,
}: Props) {
  const [content, setContent] = useState<JSX.Element | null>(
    preHighlighted || initial || null,
  );

  useLayoutEffect(() => {
    // If we have pre-highlighted content, skip the effect
    if (preHighlighted) {
      return;
    }

    let isMounted = true;

    if (code) {
      highlight(code, lang, theme, lineNumbers).then((result) => {
        if (isMounted) setContent(result);
      });
    }

    return () => {
      isMounted = false;
    };
  }, [code, lang, theme, preHighlighted, lineNumbers]);

  return (
    <div
      className={cn(
        "[&_code]:text-[13px]/2 [&_pre]:max-h-(--pre-max-height) [&_code]:font-mono [&_pre]:min-h-[32rem] [&_pre]:overflow-auto [&_pre]:border-l [&_pre]:!bg-transparent [&_pre]:p-4 [&_pre]:leading-snug [&_pre]:pl-0",
        lineNumbers &&
          "[&_.line[data-line]]:before:mr-4 [&_.line[data-line]]:before:inline-block [&_.line[data-line]]:before:w-4 [&_.line[data-line]]:before:text-right [&_.line[data-line]]:before:text-zinc-400 [&_.line[data-line]]:before:content-[attr(data-line)]",
        className,
      )}
      style={{ "--pre-max-height": `${maxHeight}px` } as React.CSSProperties}
    >
      {content ? (
        content
      ) : (
        <pre className="flex size-full items-center justify-center p-4">
          Loading...
        </pre>
      )}
    </div>
  );
}
