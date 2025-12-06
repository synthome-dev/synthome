/**
 * Import post-to-import.md into Sanity CMS
 *
 * Usage:
 *   bun run import-post
 *
 * Reads from: apps/web/post-to-import.md
 * Category is specified in the markdown file itself (e.g., **Category:** changelog)
 */

import { createClient } from "@sanity/client";
import { readFile } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const client = createClient({
  projectId: "kepkopk6",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

interface ParsedPost {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  category?: string;
  body: string;
}

function parseMarkdown(content: string): ParsedPost {
  const lines = content.split("\n");

  // Title is the first line (# Title)
  const title = lines[0].replace(/^#\s+/, "").trim();

  // Look for metadata lines
  let description = "";
  let publishedAt = new Date().toISOString();
  let category: string | undefined;

  // Find the --- separator and extract metadata before it
  const separatorIndex = lines.findIndex(
    (line, i) => i > 0 && line.trim() === "---",
  );

  if (separatorIndex > 0) {
    // Parse metadata between title and separator
    for (let i = 1; i < separatorIndex; i++) {
      const line = lines[i].trim();
      if (line.startsWith("**Date:**")) {
        const dateStr = line.replace("**Date:**", "").trim();
        const parsed = new Date(dateStr);
        if (!isNaN(parsed.getTime())) {
          publishedAt = parsed.toISOString();
        }
      }
      if (line.startsWith("**Category:**")) {
        category = line.replace("**Category:**", "").trim().toLowerCase();
      }
    }
  }

  // Description is the first non-empty paragraph after the separator
  const bodyStartIndex = separatorIndex > 0 ? separatorIndex + 1 : 3;
  let descEndIndex = bodyStartIndex;

  // Find first non-empty line after separator
  for (let i = bodyStartIndex; i < lines.length; i++) {
    if (lines[i].trim() !== "") {
      description = lines[i].trim();
      descEndIndex = i + 1;
      // Continue to next empty line for multi-line description
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim() === "" || lines[j].startsWith("#")) {
          descEndIndex = j;
          break;
        }
        description += " " + lines[j].trim();
      }
      break;
    }
  }

  // Body is everything after the description
  const body = lines.slice(descEndIndex).join("\n").trim();

  // Generate slug from title
  const slug = title
    .toLowerCase()
    .replace(/@/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  return { title, description, slug, publishedAt, category, body };
}

function parseInlineFormatting(text: string): {
  children: any[];
  markDefs: any[];
} {
  const children: any[] = [];
  const markDefs: any[] = [];

  const inlineRegex =
    /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[(.+?)\]\((.+?)\))/g;

  let lastIndex = 0;
  let match;

  while ((match = inlineRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      const beforeText = text.slice(lastIndex, match.index);
      if (beforeText) {
        children.push({
          _type: "span",
          _key: crypto.randomUUID().slice(0, 8),
          text: beforeText,
          marks: [],
        });
      }
    }

    if (match[1]) {
      // Bold **text**
      children.push({
        _type: "span",
        _key: crypto.randomUUID().slice(0, 8),
        text: match[2],
        marks: ["strong"],
      });
    } else if (match[3]) {
      // Italic *text*
      children.push({
        _type: "span",
        _key: crypto.randomUUID().slice(0, 8),
        text: match[4],
        marks: ["em"],
      });
    } else if (match[5]) {
      // Inline code `text`
      children.push({
        _type: "span",
        _key: crypto.randomUUID().slice(0, 8),
        text: match[6],
        marks: ["code"],
      });
    } else if (match[7]) {
      // Link [text](url)
      const linkKey = crypto.randomUUID().slice(0, 8);
      markDefs.push({
        _type: "link",
        _key: linkKey,
        href: match[9],
      });
      children.push({
        _type: "span",
        _key: crypto.randomUUID().slice(0, 8),
        text: match[8],
        marks: [linkKey],
      });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    const remainingText = text.slice(lastIndex);
    if (remainingText) {
      children.push({
        _type: "span",
        _key: crypto.randomUUID().slice(0, 8),
        text: remainingText,
        marks: [],
      });
    }
  }

  if (children.length === 0) {
    children.push({
      _type: "span",
      _key: crypto.randomUUID().slice(0, 8),
      text: text,
      marks: [],
    });
  }

  return { children, markDefs };
}

function markdownToPortableText(markdown: string): any[] {
  const blocks: any[] = [];
  const lines = markdown.split("\n");
  let currentBlock: string[] = [];
  let inCodeBlock = false;
  let codeLanguage = "";
  let codeContent: string[] = [];

  const flushParagraph = () => {
    if (currentBlock.length > 0) {
      const text = currentBlock.join("\n").trim();
      if (text) {
        const { children, markDefs } = parseInlineFormatting(text);
        blocks.push({
          _type: "block",
          _key: crypto.randomUUID().slice(0, 8),
          style: "normal",
          markDefs,
          children,
        });
      }
      currentBlock = [];
    }
  };

  const flushCodeBlock = () => {
    if (codeContent.length > 0) {
      blocks.push({
        _type: "codeBlock",
        _key: crypto.randomUUID().slice(0, 8),
        code: codeContent.join("\n"),
        language: codeLanguage || "text",
      });
      codeContent = [];
      codeLanguage = "";
    }
  };

  for (const line of lines) {
    if (line.startsWith("```")) {
      if (inCodeBlock) {
        flushCodeBlock();
        inCodeBlock = false;
      } else {
        flushParagraph();
        inCodeBlock = true;
        codeLanguage = line.slice(3).trim();
      }
      continue;
    }

    if (inCodeBlock) {
      codeContent.push(line);
      continue;
    }

    const h2Match = line.match(/^##\s+(.+)$/);
    const h3Match = line.match(/^###\s+(.+)$/);
    const h4Match = line.match(/^####\s+(.+)$/);

    if (h2Match) {
      flushParagraph();
      const { children, markDefs } = parseInlineFormatting(h2Match[1]);
      blocks.push({
        _type: "block",
        _key: crypto.randomUUID().slice(0, 8),
        style: "h2",
        markDefs,
        children,
      });
      continue;
    }

    if (h3Match) {
      flushParagraph();
      const { children, markDefs } = parseInlineFormatting(h3Match[1]);
      blocks.push({
        _type: "block",
        _key: crypto.randomUUID().slice(0, 8),
        style: "h3",
        markDefs,
        children,
      });
      continue;
    }

    if (h4Match) {
      flushParagraph();
      const { children, markDefs } = parseInlineFormatting(h4Match[1]);
      blocks.push({
        _type: "block",
        _key: crypto.randomUUID().slice(0, 8),
        style: "h4",
        markDefs,
        children,
      });
      continue;
    }

    if (line.trim() === "---") {
      flushParagraph();
      continue;
    }

    if (line.trim() === "") {
      flushParagraph();
      continue;
    }

    if (line.match(/^[-*]\s+/)) {
      flushParagraph();
      const text = line.replace(/^[-*]\s+/, "").trim();
      const { children, markDefs } = parseInlineFormatting(text);
      blocks.push({
        _type: "block",
        _key: crypto.randomUUID().slice(0, 8),
        style: "normal",
        listItem: "bullet",
        level: 1,
        markDefs,
        children,
      });
      continue;
    }

    if (line.match(/^\d+\.\s+/)) {
      flushParagraph();
      const text = line.replace(/^\d+\.\s+/, "").trim();
      const { children, markDefs } = parseInlineFormatting(text);
      blocks.push({
        _type: "block",
        _key: crypto.randomUUID().slice(0, 8),
        style: "normal",
        listItem: "number",
        level: 1,
        markDefs,
        children,
      });
      continue;
    }

    currentBlock.push(line);
  }

  flushParagraph();
  if (inCodeBlock) {
    flushCodeBlock();
  }

  return blocks;
}

async function getCategoryRef(
  categorySlug: string,
): Promise<{ _type: "reference"; _ref: string } | undefined> {
  const category = await client.fetch(
    `*[_type == "category" && slug.current == $slug][0]{ _id }`,
    { slug: categorySlug },
  );

  if (!category) {
    console.warn(`Warning: Category "${categorySlug}" not found in Sanity`);
    return undefined;
  }

  return { _type: "reference", _ref: category._id };
}

async function importPost() {
  const filePath = resolve(__dirname, "../post-to-import.md");
  const content = await readFile(filePath, "utf-8");
  const post = parseMarkdown(content);

  console.log("Parsed post:");
  console.log(`  Title: ${post.title}`);
  console.log(`  Slug: ${post.slug}`);
  console.log(`  Description: ${post.description.slice(0, 80)}...`);
  console.log(`  Published: ${post.publishedAt}`);
  console.log(`  Category: ${post.category || "(none)"}`);
  console.log("");

  // Look up category if specified in markdown
  let categoryRef: { _type: "reference"; _ref: string } | undefined;
  if (post.category) {
    categoryRef = await getCategoryRef(post.category);
    if (categoryRef) {
      console.log(`  Category "${post.category}" found in Sanity`);
    }
  }

  const draftId = `drafts.${crypto.randomUUID()}`;

  const doc = {
    _id: draftId,
    _type: "post" as const,
    title: post.title,
    description: post.description,
    slug: {
      _type: "slug" as const,
      current: post.slug,
    },
    publishedAt: post.publishedAt,
    body: markdownToPortableText(post.body),
    ...(categoryRef && { category: categoryRef }),
  };

  try {
    const result = await client.create(doc);
    console.log(`\nImported as draft: ${result._id}`);
    console.log(`\nOpen in Sanity Studio to review and publish.`);
  } catch (error) {
    console.error(`Failed to import: ${error}`);
    process.exit(1);
  }
}

// CLI
if (!process.env.SANITY_TOKEN) {
  console.error("Error: SANITY_TOKEN environment variable is required");
  console.error("Usage: SANITY_TOKEN=xxx bun run import-post");
  process.exit(1);
}

importPost().catch(console.error);
