"use client";

import type { Editor } from "@tiptap/react";

type TiptapToolbarProps = {
  editor: Editor | null;
};

export default function TiptapToolbar({ editor }: TiptapToolbarProps) {
  if (!editor) return null;

  return (
    <div className="tiptap-toolbar">
      <button
        type="button"
        className={editor.isActive("bold") ? "is-active" : ""}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        Bold
      </button>

      <button
        type="button"
        className={editor.isActive("italic") ? "is-active" : ""}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        Italic
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().setParagraph().run()}
      >
        Paragraph
      </button>

      <button
        type="button"
        className={editor.isActive("bulletList") ? "is-active" : ""}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        Bullet
      </button>

      <button
        type="button"
        className={editor.isActive("orderedList") ? "is-active" : ""}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        Number
      </button>

      <button
        type="button"
        onClick={() => editor.chain().focus().setHardBreak().run()}
      >
        Line Break
      </button>
    </div>
  );
}
