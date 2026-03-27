import { RichTextEditor } from '../RichTextEditor';

type Props = {
  blockId: string;
  value: string;
  onChange: (html: string) => void;
};

/** TipTap editor for V2 rich text blocks; remounts when `blockId` changes so content syncs per block. */
export function V2RichTextField({ blockId, value, onChange }: Props) {
  return (
    <div className="max-h-[min(320px,50vh)] overflow-y-auto rounded-lg border border-slate-200">
      <RichTextEditor
        key={blockId}
        value={value}
        onChange={onChange}
        aria-label="Rich text body"
      />
    </div>
  );
}
