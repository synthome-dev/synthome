import CodeBlockIllustration from "@/components/code-block-illustration";

export default function CodeDemoSection() {
  return (
    <section className="bg-background" data-theme="light">
      <div className="@container [--color-secondary:var(--color-indigo-200)]">
        <div className="mx-auto w-full">
          <CodeBlockIllustration />
        </div>
      </div>
    </section>
  );
}
