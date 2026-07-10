import { useEffect, useRef } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Undo2,
} from "lucide-react";
import type { WinnerRichText } from "../../lib/winners/types";
import { cn } from "./ui";

const EMPTY_DOCUMENT: WinnerRichText = { type: "doc", content: [{ type: "paragraph" }] };

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      aria-label={label}
      aria-pressed={active}
      className={cn(
        "grid size-9 place-items-center rounded-md text-zinc-400 transition hover:bg-white/[0.08] hover:text-zinc-100 disabled:cursor-not-allowed disabled:opacity-40",
        active && "bg-[#ffb001]/15 text-[#ffd05a]",
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      {children}
    </button>
  );
}

export default function WinnerRichTextEditor({
  value,
  onChange,
}: {
  value: WinnerRichText | null;
  onChange: (value: WinnerRichText) => void;
}) {
  const onChangeRef = useRef(onChange);
  const valueKey = JSON.stringify(value ?? EMPTY_DOCUMENT);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ heading: { levels: [2, 3] } }),
      Link.configure({
        autolink: true,
        linkOnPaste: true,
        openOnClick: false,
        HTMLAttributes: { rel: "noopener noreferrer" },
      }),
      Placeholder.configure({ placeholder: "Write a source-backed story that adds specific, useful context for the winner." }),
    ],
    content: value ?? EMPTY_DOCUMENT,
    editorProps: {
      attributes: {
        class:
          "min-h-80 px-4 py-3 text-[15px] leading-7 text-zinc-100 outline-none [&_a]:text-[#ffd05a] [&_a]:underline [&_blockquote]:my-5 [&_blockquote]:border-l-2 [&_blockquote]:border-[#ffb001]/60 [&_blockquote]:pl-4 [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:text-lg [&_h3]:font-bold [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-3 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 [&_.is-editor-empty:first-child::before]:pointer-events-none [&_.is-editor-empty:first-child::before]:float-left [&_.is-editor-empty:first-child::before]:h-0 [&_.is-editor-empty:first-child::before]:text-zinc-600 [&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]",
      },
    },
    onUpdate: ({ editor: updatedEditor }) => {
      onChangeRef.current(updatedEditor.getJSON() as WinnerRichText);
    },
  });

  useEffect(() => {
    if (!editor || JSON.stringify(editor.getJSON()) === valueKey) return;
    editor.commands.setContent(value ?? EMPTY_DOCUMENT, { emitUpdate: false });
  }, [editor, value, valueKey]);

  const disabled = !editor;

  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.1] bg-[#0e0e11] focus-within:border-[#ffb001]/55 focus-within:ring-2 focus-within:ring-[#ffb001]/18">
      <div className="flex flex-wrap gap-1 border-b border-white/[0.08] bg-[#121215] p-2">
        <ToolbarButton label="Bold" active={editor?.isActive("bold")} disabled={disabled} onClick={() => editor?.chain().focus().toggleBold().run()}><Bold size={16} /></ToolbarButton>
        <ToolbarButton label="Italic" active={editor?.isActive("italic")} disabled={disabled} onClick={() => editor?.chain().focus().toggleItalic().run()}><Italic size={16} /></ToolbarButton>
        <span className="mx-1 h-7 w-px self-center bg-white/[0.08]" />
        <ToolbarButton label="Heading level 2" active={editor?.isActive("heading", { level: 2 })} disabled={disabled} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={16} /></ToolbarButton>
        <ToolbarButton label="Heading level 3" active={editor?.isActive("heading", { level: 3 })} disabled={disabled} onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 size={16} /></ToolbarButton>
        <ToolbarButton label="Bullet list" active={editor?.isActive("bulletList")} disabled={disabled} onClick={() => editor?.chain().focus().toggleBulletList().run()}><List size={16} /></ToolbarButton>
        <ToolbarButton label="Numbered list" active={editor?.isActive("orderedList")} disabled={disabled} onClick={() => editor?.chain().focus().toggleOrderedList().run()}><ListOrdered size={16} /></ToolbarButton>
        <ToolbarButton label="Quote" active={editor?.isActive("blockquote")} disabled={disabled} onClick={() => editor?.chain().focus().toggleBlockquote().run()}><Quote size={16} /></ToolbarButton>
        <span className="mx-1 h-7 w-px self-center bg-white/[0.08]" />
        <ToolbarButton label="Undo" disabled={!editor?.can().undo()} onClick={() => editor?.chain().focus().undo().run()}><Undo2 size={16} /></ToolbarButton>
        <ToolbarButton label="Redo" disabled={!editor?.can().redo()} onClick={() => editor?.chain().focus().redo().run()}><Redo2 size={16} /></ToolbarButton>
      </div>
      <EditorContent editor={editor} />
      <p className="border-t border-white/[0.08] px-4 py-2 text-xs text-zinc-600">Paste a full URL to make it a link. Use only facts you can support in the source notes below.</p>
    </div>
  );
}
