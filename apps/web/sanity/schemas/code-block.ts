import { defineField, defineType } from "sanity";

export default defineType({
  name: "codeBlock",
  title: "Code Block",
  type: "object",
  fields: [
    defineField({
      name: "code",
      title: "Code",
      type: "text",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "language",
      title: "Language",
      type: "string",
      options: {
        list: [
          { title: "TypeScript", value: "typescript" },
          { title: "JavaScript", value: "javascript" },
          { title: "JSON", value: "json" },
          { title: "Bash", value: "bash" },
          { title: "Shell", value: "shell" },
          { title: "Python", value: "python" },
          { title: "HTML", value: "html" },
          { title: "CSS", value: "css" },
          { title: "SQL", value: "sql" },
          { title: "Markdown", value: "markdown" },
          { title: "YAML", value: "yaml" },
          { title: "Plain Text", value: "text" },
        ],
      },
      initialValue: "typescript",
    }),
    defineField({
      name: "filename",
      title: "Filename (optional)",
      type: "string",
    }),
  ],
  preview: {
    select: {
      code: "code",
      language: "language",
    },
    prepare({ code, language }) {
      return {
        title: `Code Block (${language || "text"})`,
        subtitle: code?.slice(0, 50) + "...",
      };
    },
  },
});
