import { source } from "@/lib/source";
import {
  DocsPage,
  DocsBody,
  DocsDescription,
  DocsTitle,
} from "fumadocs-ui/page";
import { notFound } from "next/navigation";
import defaultMdxComponents from "fumadocs-ui/mdx";
import { Tabs, Tab } from "fumadocs-ui/components/tabs";
import { LLMCopyButton, ViewOptions } from "@/components/page-actions";
import {
  Feedback,
  type Feedback as FeedbackType,
  type ActionResponse,
} from "@/components/feedback";

const GITHUB_OWNER = "synthomevideo";
const GITHUB_REPO = "synthome";

async function onFeedback(
  url: string,
  feedback: FeedbackType,
): Promise<ActionResponse> {
  "use server";
  // Log feedback for now - integrate with PostHog, GitHub, or database later
  console.log("Docs feedback received:", { url, feedback });

  // Return empty response since we're not using GitHub integration yet
  return { githubUrl: "" };
}

export default async function Page(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  const MDX = page.data.body;

  return (
    <DocsPage toc={page.data.toc} full={page.data.full}>
      <DocsTitle>{page.data.title}</DocsTitle>
      <DocsDescription>{page.data.description}</DocsDescription>
      <div className="flex flex-row gap-2 items-center border-b pt-2 pb-6">
        <LLMCopyButton markdownUrl={`${page.url}.mdx`} />
        <ViewOptions
          markdownUrl={`${page.url}.mdx`}
          githubUrl={`https://github.com/${GITHUB_OWNER}/${GITHUB_REPO}/blob/main/apps/web/content/docs/${page.slugs.join("/")}.mdx`}
        />
      </div>
      <DocsBody>
        <MDX
          components={{
            ...defaultMdxComponents,
            Tabs,
            Tab,
          }}
        />
      </DocsBody>
      <Feedback onRateAction={onFeedback} />
    </DocsPage>
  );
}

export async function generateStaticParams() {
  return source.generateParams();
}

export async function generateMetadata(props: {
  params: Promise<{ slug?: string[] }>;
}) {
  const params = await props.params;
  const page = source.getPage(params.slug);
  if (!page) notFound();

  return {
    title: page.data.title,
    description: page.data.description,
  };
}
