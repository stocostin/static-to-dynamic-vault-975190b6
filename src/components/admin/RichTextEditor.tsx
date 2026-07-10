import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { TaskList } from "@tiptap/extension-task-list";
import { TaskItem } from "@tiptap/extension-task-item";
import { TextStyle } from "@tiptap/extension-text-style";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Typography from "@tiptap/extension-typography";
import Youtube from "@tiptap/extension-youtube";
import CharacterCount from "@tiptap/extension-character-count";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight, common } from "lowlight";
import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Bold, Italic, Underline as UIcon, Strikethrough, List, ListOrdered, Quote,
  Heading1, Heading2, Heading3, Link as LinkIcon, Image as ImgIcon,
  AlignLeft, AlignCenter, AlignRight, Undo, Redo, Code, Minus,
  Table as TableIcon, ListChecks, Highlighter, Palette, Youtube as YoutubeIcon,
  Rows3, Columns3, Trash2, Code2,
} from "lucide-react";

const lowlight = createLowlight(common);

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const fileInput = useRef<HTMLInputElement>(null);
  const hydratedRef = useRef(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ codeBlock: false }),
      Underline,
      Link.configure({ openOnClick: false, HTMLAttributes: { rel: "noopener", target: "_blank" } }),
      Image.configure({ inline: false, allowBase64: false }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: placeholder ?? "Write your article…" }),
      Table.configure({ resizable: true, HTMLAttributes: { class: "tiptap-table" } }),
      TableRow, TableCell, TableHeader,
      TaskList,
      TaskItem.configure({ nested: true }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Typography,
      Youtube.configure({ controls: true, nocookie: true, HTMLAttributes: { class: "tiptap-youtube" } }),
      CharacterCount,
      CodeBlockLowlight.configure({ lowlight }),
    ],
    content: value || "",
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none min-h-[400px] p-4 focus:outline-none " +
          "[&_h1]:text-3xl [&_h1]:font-bold [&_h2]:text-2xl [&_h2]:font-semibold [&_h3]:text-xl " +
          "[&_a]:text-primary [&_a]:underline " +
          "[&_pre]:bg-muted [&_pre]:text-foreground [&_pre]:rounded-md [&_pre]:p-3 [&_pre]:overflow-x-auto " +
          "[&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm " +
          "[&_pre_code]:bg-transparent [&_pre_code]:p-0 " +
          "[&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:pl-4 [&_blockquote]:italic " +
          "[&_table]:w-full [&_table]:border-collapse [&_table]:my-2 " +
          "[&_th]:border [&_th]:border-border [&_th]:bg-muted [&_th]:p-2 [&_th]:text-left " +
          "[&_td]:border [&_td]:border-border [&_td]:p-2 " +
          "[&_ul[data-type='taskList']]:list-none [&_ul[data-type='taskList']]:pl-0 " +
          "[&_ul[data-type='taskList']_li]:flex [&_ul[data-type='taskList']_li]:gap-2 [&_ul[data-type='taskList']_li]:items-start " +
          "[&_mark]:bg-yellow-200 [&_mark]:px-0.5 [&_mark]:rounded " +
          "[&_img]:rounded-md [&_img]:my-2 [&_iframe]:rounded-md [&_iframe]:my-2 [&_hr]:my-4",
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (hydratedRef.current) return;
    if (value && value !== editor.getHTML()) {
      editor.commands.setContent(value, { emitUpdate: false });
    }
    if (value) hydratedRef.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, editor]);

  if (!editor) return null;

  const setLink = () => {
    const prev = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("URL", prev ?? "https://");
    if (url === null) return;
    if (url === "") { editor.chain().focus().unsetLink().run(); return; }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const uploadImg = async (file: File) => {
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `blog/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("admin-uploads").upload(path, file);
    if (error) { toast.error(error.message); return; }
    const alt = window.prompt("Alt text (for accessibility & SEO)", "") ?? "";
    editor.chain().focus().setImage({ src: `/uploads/${path}`, alt }).run();
  };

  const insertYoutube = () => {
    const url = window.prompt("YouTube URL");
    if (!url) return;
    editor.chain().focus().setYoutubeVideo({ src: url, width: 640, height: 360 }).run();
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  const btn = (active: boolean, onClick: () => void, Icon: typeof Bold, label: string, disabled = false) => (
    <Button
      type="button"
      variant={active ? "default" : "ghost"}
      size="icon"
      onClick={onClick}
      disabled={disabled}
      title={label}
      className="h-8 w-8"
    >
      <Icon className="h-4 w-4" />
    </Button>
  );

  const words = editor.storage.characterCount?.words?.() ?? 0;
  const chars = editor.storage.characterCount?.characters?.() ?? 0;

  return (
    <div className="border rounded-md">
      <div className="flex flex-wrap items-center gap-0.5 border-b p-1 bg-muted/30 sticky top-0 z-10">
        {btn(editor.isActive("heading", { level: 1 }), () => editor.chain().focus().toggleHeading({ level: 1 }).run(), Heading1, "H1")}
        {btn(editor.isActive("heading", { level: 2 }), () => editor.chain().focus().toggleHeading({ level: 2 }).run(), Heading2, "H2")}
        {btn(editor.isActive("heading", { level: 3 }), () => editor.chain().focus().toggleHeading({ level: 3 }).run(), Heading3, "H3")}
        <span className="w-px h-6 bg-border mx-1" />
        {btn(editor.isActive("bold"), () => editor.chain().focus().toggleBold().run(), Bold, "Bold")}
        {btn(editor.isActive("italic"), () => editor.chain().focus().toggleItalic().run(), Italic, "Italic")}
        {btn(editor.isActive("underline"), () => editor.chain().focus().toggleUnderline().run(), UIcon, "Underline")}
        {btn(editor.isActive("strike"), () => editor.chain().focus().toggleStrike().run(), Strikethrough, "Strike")}
        {btn(editor.isActive("code"), () => editor.chain().focus().toggleCode().run(), Code, "Inline code")}
        {btn(editor.isActive("codeBlock"), () => editor.chain().focus().toggleCodeBlock().run(), Code2, "Code block")}
        <span className="w-px h-6 bg-border mx-1" />
        <label className="inline-flex items-center h-8 px-1 cursor-pointer" title="Text color">
          <Palette className="h-4 w-4" />
          <input
            type="color"
            className="w-6 h-6 ml-1 p-0 border-0 bg-transparent cursor-pointer"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
          />
        </label>
        {btn(editor.isActive("highlight"), () => editor.chain().focus().toggleHighlight().run(), Highlighter, "Highlight")}
        <span className="w-px h-6 bg-border mx-1" />
        {btn(editor.isActive("bulletList"), () => editor.chain().focus().toggleBulletList().run(), List, "Bullet list")}
        {btn(editor.isActive("orderedList"), () => editor.chain().focus().toggleOrderedList().run(), ListOrdered, "Ordered list")}
        {btn(editor.isActive("taskList"), () => editor.chain().focus().toggleTaskList().run(), ListChecks, "Task list")}
        {btn(editor.isActive("blockquote"), () => editor.chain().focus().toggleBlockquote().run(), Quote, "Quote")}
        {btn(false, () => editor.chain().focus().setHorizontalRule().run(), Minus, "Divider")}
        <span className="w-px h-6 bg-border mx-1" />
        {btn(editor.isActive({ textAlign: "left" }), () => editor.chain().focus().setTextAlign("left").run(), AlignLeft, "Align left")}
        {btn(editor.isActive({ textAlign: "center" }), () => editor.chain().focus().setTextAlign("center").run(), AlignCenter, "Align center")}
        {btn(editor.isActive({ textAlign: "right" }), () => editor.chain().focus().setTextAlign("right").run(), AlignRight, "Align right")}
        <span className="w-px h-6 bg-border mx-1" />
        {btn(editor.isActive("link"), setLink, LinkIcon, "Link")}
        {btn(false, () => fileInput.current?.click(), ImgIcon, "Insert image")}
        {btn(false, insertYoutube, YoutubeIcon, "Embed YouTube")}
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImg(f); e.target.value = ""; }}
        />
        <span className="w-px h-6 bg-border mx-1" />
        {btn(false, insertTable, TableIcon, "Insert table")}
        {btn(false, () => editor.chain().focus().addRowAfter().run(), Rows3, "Add row", !editor.can().addRowAfter())}
        {btn(false, () => editor.chain().focus().addColumnAfter().run(), Columns3, "Add column", !editor.can().addColumnAfter())}
        {btn(false, () => editor.chain().focus().deleteTable().run(), Trash2, "Delete table", !editor.can().deleteTable())}
        <span className="w-px h-6 bg-border mx-1" />
        {btn(false, () => editor.chain().focus().undo().run(), Undo, "Undo")}
        {btn(false, () => editor.chain().focus().redo().run(), Redo, "Redo")}
      </div>
      <EditorContent editor={editor} />
      <div className="flex items-center justify-between border-t px-3 py-1.5 text-xs text-muted-foreground bg-muted/20">
        <span>{words} words · {chars} characters</span>
        <span>Rich text · autosave on save</span>
      </div>
    </div>
  );
}
