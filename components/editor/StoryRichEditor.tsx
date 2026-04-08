"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import "@toast-ui/editor/dist/toastui-editor.css";

const Editor = dynamic(
  () => import("@toast-ui/react-editor").then((mod) => mod.Editor),
  { ssr: false }
);

type StoryRichEditorProps = {
  name: string;
  initialValue?: string;
  label?: string;
  height?: string;
};

export default function StoryRichEditor({
  name,
  initialValue = "",
  label,
  height = "600px",
}: StoryRichEditorProps) {
  const editorRef = useRef<any>(null);
  const [htmlValue, setHtmlValue] = useState(initialValue);

  useEffect(() => {
    setHtmlValue(initialValue);
  }, [initialValue]);

  return (
    <div className="form-field form-field-full">
      {label && <span>{label}</span>}

      <div className="story-rich-editor-shell">
        <Editor
          ref={editorRef}
          initialValue={initialValue || ""}
          initialEditType="wysiwyg"
          previewStyle="vertical"
          height={height}
          hideModeSwitch={false}
          useCommandShortcut={true}
          onChange={() => {
            const instance = editorRef.current?.getInstance();
            if (!instance) return;
            setHtmlValue(instance.getHTML());
          }}
        />
      </div>

      <input type="hidden" name={name} value={htmlValue} readOnly />
    </div>
  );
}
