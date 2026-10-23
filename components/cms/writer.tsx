"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import Image from "@tiptap/extension-image";
import { TableKit } from "@tiptap/extension-table";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useRef } from "react";
import { imageUrl } from "./types";

export function sourceOnly(body: string) {
  return /<[A-Za-z]|\{[^\n]*\}/.test(
    body.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, ""),
  );
}
export function Writer({
  value,
  onChange,
  source,
  onMedia,
  onLink,
}: {
  value: string;
  onChange: (body: string) => void;
  source: boolean;
  onMedia: () => void;
  onLink: (apply: (url: string) => void) => void;
}) {
  const change = useRef(onChange);
  useEffect(() => {
    change.current = onChange;
  }, [onChange]);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        link: { openOnClick: false, protocols: ["https", "http", "mailto"] },
      }),
      Markdown,
      Image.extend({
        renderHTML({ HTMLAttributes }) {
          return [
            "img",
            { ...HTMLAttributes, src: imageUrl(HTMLAttributes.src ?? "") },
          ];
        },
      }),
      TableKit,
      Placeholder.configure({
        placeholder: "Start with the thought you want to follow…",
      }),
    ],
    content: value,
    contentType: "markdown",
    editorProps: {
      attributes: { class: "studio-tiptap", "aria-label": "Article body" },
    },
    onUpdate: ({ editor }) => change.current(editor.getMarkdown()),
  });
  useEffect(() => {
    if (editor && editor.getMarkdown() !== value)
      editor.commands.setContent(value, {
        contentType: "markdown",
        emitUpdate: false,
      });
  }, [editor, value]);
  const textarea = useRef<HTMLTextAreaElement>(null);
  function insert(before: string, after = "") {
    const field = textarea.current;
    if (!field) return;
    const start = field.selectionStart;
    const end = field.selectionEnd;
    onChange(
      value.slice(0, start) +
        before +
        (value.slice(start, end) || "text") +
        after +
        value.slice(end),
    );
    requestAnimationFrame(() => {
      field.focus();
      field.setSelectionRange(
        start + before.length,
        start + before.length + (end - start || 4),
      );
    });
  }
  return (
    <div className="studio-writer">
      <div
        className="studio-formatting"
        role="toolbar"
        aria-label="Text formatting"
      >
        <button
          type="button"
          title="Bold"
          aria-label="Bold"
          onClick={() =>
            source
              ? insert("**", "**")
              : editor?.chain().focus().toggleBold().run()
          }
        >
          <strong>B</strong>
        </button>
        <button
          type="button"
          title="Italic"
          aria-label="Italic"
          onClick={() =>
            source
              ? insert("*", "*")
              : editor?.chain().focus().toggleItalic().run()
          }
        >
          <em>I</em>
        </button>
        <button
          type="button"
          aria-label="Heading 2"
          onClick={() =>
            source
              ? insert("\n## ", "\n")
              : editor?.chain().focus().toggleHeading({ level: 2 }).run()
          }
        >
          H2
        </button>
        <button
          type="button"
          aria-label="Heading 3"
          onClick={() =>
            source
              ? insert("\n### ", "\n")
              : editor?.chain().focus().toggleHeading({ level: 3 }).run()
          }
        >
          H3
        </button>
        <button
          type="button"
          aria-label="Bullet list"
          onClick={() =>
            source
              ? insert("\n- ")
              : editor?.chain().focus().toggleBulletList().run()
          }
        >
          List
        </button>
        <button
          type="button"
          aria-label="Numbered list"
          onClick={() =>
            source
              ? insert("\n1. ")
              : editor?.chain().focus().toggleOrderedList().run()
          }
        >
          1. 2.
        </button>
        <button
          type="button"
          aria-label="Block quote"
          onClick={() =>
            source
              ? insert("\n> ")
              : editor?.chain().focus().toggleBlockquote().run()
          }
        >
          Quote
        </button>
        <button
          type="button"
          aria-label="Code block"
          onClick={() =>
            source
              ? insert("\n```ts\n", "\n```\n")
              : editor?.chain().focus().toggleCodeBlock().run()
          }
        >
          Code
        </button>
        <button
          type="button"
          aria-label="Insert link"
          onClick={() =>
            onLink((url) =>
              source
                ? insert("[", `](${url})`)
                : editor
                    ?.chain()
                    .focus()
                    .extendMarkRange("link")
                    .setLink({ href: url })
                    .run(),
            )
          }
        >
          Link
        </button>
        <button
          type="button"
          aria-label="Insert table"
          onClick={() =>
            source
              ? insert("\n| Column | Column |\n| --- | --- |\n| ", " |  |\n")
              : editor
                  ?.chain()
                  .focus()
                  .insertTable({ rows: 3, cols: 2, withHeaderRow: true })
                  .run()
          }
        >
          Table
        </button>
        <button type="button" onClick={onMedia}>
          Image
        </button>
        {!source && (
          <>
            <button
              type="button"
              onClick={() => editor?.chain().focus().undo().run()}
              aria-label="Undo"
            >
              ↶
            </button>
            <button
              type="button"
              onClick={() => editor?.chain().focus().redo().run()}
              aria-label="Redo"
            >
              ↷
            </button>
          </>
        )}
      </div>
      {source ? (
        <textarea
          ref={textarea}
          className="studio-source"
          aria-label="Markdown source"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          placeholder="Write Markdown here. Code and custom diagrams stay exactly as you wrote them."
        />
      ) : editor ? (
        <EditorContent editor={editor} />
      ) : (
        <div className="studio-writer-fallback" aria-label="Article body">
          {value ||
            "The visual editor is loading. Your writing will appear here."}
        </div>
      )}
    </div>
  );
}
