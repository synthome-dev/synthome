import { createClient } from "@sanity/client";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

const client = createClient({
  projectId: "kepkopk6",
  dataset: "production",
  apiVersion: "2024-01-01",
  token: process.env.SANITY_TOKEN,
  useCdn: false,
});

interface MarkdownArticle {
  title: string;
  description: string;
  slug: string;
  body: string;
}

function parseMarkdown(content: string, filename: string): MarkdownArticle {
  const lines = content.split("\n");

  // Title is the first line (# Title)
  const title = lines[0].replace(/^#\s+/, "").trim();

  // Description is typically line 3 (after empty line)
  const description = lines[2]?.trim() || "";

  // Body is everything after the description (skip title, empty line, description, ---)
  const bodyStartIndex = lines.findIndex(
    (line, i) => i > 2 && line.trim() === "---",
  );
  const body =
    bodyStartIndex > 0
      ? lines
          .slice(bodyStartIndex + 1)
          .join("\n")
          .trim()
      : lines.slice(4).join("\n").trim();

  // Generate slug from filename (article-01-ai-media-pipeline-architecture.md -> ai-media-pipeline-architecture)
  const slug = filename.replace(/\.md$/, "").replace(/^article-\d+-/, "");

  return { title, description, slug, body };
}

function parseInlineFormatting(text: string): {
  children: any[];
  markDefs: any[];
} {
  const children: any[] = [];
  const markDefs: any[] = [];

  // Regex to match **bold**, *italic*, `code`, and [link](url)
  const inlineRegex =
    /(\*\*(.+?)\*\*)|(\*(.+?)\*)|(`(.+?)`)|(\[(.+?)\]\((.+?)\))/g;

  let lastIndex = 0;
  let match;

  while ((match = inlineRegex.exec(text)) !== null) {
    // Add text before the match
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

  // Add remaining text after last match
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

  // If no matches found, return the whole text as a single span
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
    // Handle code blocks
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

    // Handle headings
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

    // Handle horizontal rules
    if (line.trim() === "---") {
      flushParagraph();
      continue;
    }

    // Handle empty lines (paragraph break)
    if (line.trim() === "") {
      flushParagraph();
      continue;
    }

    // Handle list items
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

    // Handle numbered list items
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

    // Regular text - add to current paragraph
    currentBlock.push(line);
  }

  // Flush any remaining content
  flushParagraph();
  if (inCodeBlock) {
    flushCodeBlock();
  }

  return blocks;
}

async function importPosts() {
  const seoDir = join(process.cwd(), "../../seo");
  const files = await readdir(seoDir);

  const articleFiles = files
    .filter((f) => f.startsWith("article-") && f.endsWith(".md"))
    .sort();

  console.log(`Found ${articleFiles.length} articles to import\n`);

  for (const filename of articleFiles) {
    const filePath = join(seoDir, filename);
    const content = await readFile(filePath, "utf-8");
    const article = parseMarkdown(content, filename);

    // Create draft document (drafts. prefix makes it a draft)
    const draftId = `drafts.${crypto.randomUUID()}`;

    const doc = {
      _id: draftId,
      _type: "post",
      title: article.title,
      description: article.description,
      slug: {
        _type: "slug",
        current: article.slug,
      },
      publishedAt: new Date().toISOString(),
      body: markdownToPortableText(article.body),
    };

    try {
      const result = await client.create(doc);
      console.log(`✓ Imported: ${article.title}`);
      console.log(`  Slug: ${article.slug}`);
      console.log(`  ID: ${result._id}\n`);
    } catch (error) {
      console.error(`✗ Failed to import: ${article.title}`);
      console.error(`  Error: ${error}\n`);
    }
  }

  console.log("Import complete!");
}

importPosts().catch(console.error);
