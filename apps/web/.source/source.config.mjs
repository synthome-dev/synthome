// source.config.ts
import { defineDocs, defineConfig } from "fumadocs-mdx/config";
var docs = defineDocs({
  dir: "content/docs",
  docs: {
    postprocess: {
      includeProcessedMarkdown: true
    }
  }
});
var source_config_default = defineConfig({
  mdxOptions: {
    rehypeCodeOptions: {
      themes: {
        light: "github-light",
        dark: "github-dark"
      },
      transformers: [
        {
          name: "line-numbers",
          pre(node) {
            node.properties["data-line-numbers"] = "";
          }
        }
      ]
    }
  }
});
export {
  source_config_default as default,
  docs
};
