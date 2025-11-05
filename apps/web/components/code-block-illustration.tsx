import CodeBlock from "@/components/code-block";

export const CodeBlockIllustration = () => {
  const code = `import { compose, generateVideo, merge, replicate } from "synthome";\n\nconst productDemo = compose(\n  generateVideo({\n    model: replicate("bytedance/seedance-1-pro"),\n    prompt: "Product showcase scene 1",\n    duration: 3,\n  }),\n  generateVideo({\n    model: replicate("bytedance/seedance-1-pro"),\n    prompt: "Product showcase scene 2",\n    duration: 3,\n  }),\n  merge(),\n);\n`;

  return (
    <CodeBlock
      code={code}
      lang="javascript"
      maxHeight={320}
      lineNumbers
      theme="github-light"
      className="[&_pre]:min-h-0 [&_pre]:max-w-xs [&_pre]:rounded-xl [&_pre]:border-none [&_pre]:!bg-transparent mask-y-from-80%"
    />
  );
};
