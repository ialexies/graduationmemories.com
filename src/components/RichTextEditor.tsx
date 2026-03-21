import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TextAlign from "@tiptap/extension-text-align";

const TOOLBAR_BTN =
  "p-2 rounded hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed text-slate-700";

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  if (!editor) return null;
  return (
    <div className="flex flex-wrap gap-0.5 border border-slate-300 border-b-0 rounded-t-lg bg-slate-50 p-1">
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`${TOOLBAR_BTN} ${editor.isActive("bold") ? "bg-slate-200" : ""}`}
        title="Bold"
      >
        <strong>B</strong>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`${TOOLBAR_BTN} ${editor.isActive("italic") ? "bg-slate-200" : ""}`}
        title="Italic"
      >
        <em>I</em>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`${TOOLBAR_BTN} ${editor.isActive("strike") ? "bg-slate-200" : ""}`}
        title="Strikethrough"
      >
        <s>S</s>
      </button>
      <span className="w-px h-6 bg-slate-300 mx-0.5 self-center" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={`${TOOLBAR_BTN} ${editor.isActive("heading", { level: 1 }) ? "bg-slate-200" : ""}`}
        title="Heading 1"
      >
        H1
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={`${TOOLBAR_BTN} ${editor.isActive("heading", { level: 2 }) ? "bg-slate-200" : ""}`}
        title="Heading 2"
      >
        H2
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={`${TOOLBAR_BTN} ${editor.isActive("heading", { level: 3 }) ? "bg-slate-200" : ""}`}
        title="Heading 3"
      >
        H3
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setParagraph().run()}
        className={`${TOOLBAR_BTN} ${editor.isActive("paragraph") ? "bg-slate-200" : ""}`}
        title="Normal paragraph"
      >
        P
      </button>
      <span className="w-px h-6 bg-slate-300 mx-0.5 self-center" />
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`${TOOLBAR_BTN} ${editor.isActive("bulletList") ? "bg-slate-200" : ""}`}
        title="Bullet list"
      >
        •
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`${TOOLBAR_BTN} ${editor.isActive("orderedList") ? "bg-slate-200" : ""}`}
        title="Numbered list"
      >
        1.
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={`${TOOLBAR_BTN} ${editor.isActive("blockquote") ? "bg-slate-200" : ""}`}
        title="Quote"
      >
        "
      </button>
      <span className="w-px h-6 bg-slate-300 mx-0.5 self-center" />
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign("left").run()}
        className={`${TOOLBAR_BTN} ${editor.isActive({ textAlign: "left" }) ? "bg-slate-200" : ""}`}
        title="Align left"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="15" y2="12"/><line x1="3" y1="18" x2="18" y2="18"/></svg>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign("center").run()}
        className={`${TOOLBAR_BTN} ${editor.isActive({ textAlign: "center" }) ? "bg-slate-200" : ""}`}
        title="Align center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="6" y1="12" x2="18" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().setTextAlign("right").run()}
        className={`${TOOLBAR_BTN} ${editor.isActive({ textAlign: "right" }) ? "bg-slate-200" : ""}`}
        title="Align right"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="6" y1="18" x2="21" y2="18"/></svg>
      </button>
    </div>
  );
}

/**
 * Converts plain text to HTML for editor. Detects if content is already HTML.
 */
export function toEditorHtml(value: string): string {
  if (!value || value.trim() === "") return "<p></p>";
  if (/<(p|div|br|h[1-6]|strong|b|em|i|ul|ol|li|blockquote)\b/.test(value)) {
    return value;
  }
  const escaped = value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const paras = escaped.split(/\n\n+/).filter(Boolean);
  if (paras.length <= 1) {
    return "<p>" + escaped.replace(/\n/g, "<br>") + "</p>";
  }
  return paras.map((p) => "<p>" + p.replace(/\n/g, "<br>") + "</p>").join("");
}

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  required?: boolean;
  id?: string;
  "aria-label"?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder: _placeholder = "Write something…",
  required,
  id,
  "aria-label": ariaLabel = "Rich text editor",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      TextAlign.configure({
        types: ["heading", "paragraph"],
        alignments: ["left", "center", "right"],
      }),
    ],
    content: toEditorHtml(value),
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        "aria-label": ariaLabel,
        class: "w-full px-3 py-2 min-h-[160px] text-slate-800 focus:outline-none [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-bold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_blockquote]:border-l-4 [&_blockquote]:pl-4 [&_blockquote]:italic [&_blockquote]:text-slate-600",
      },
    },
  });

  return (
    <div
      id={id}
      className="border border-slate-300 rounded-lg overflow-hidden bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
      data-required={required}
    >
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
