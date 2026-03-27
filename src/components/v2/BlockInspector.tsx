import { useRef, useState } from 'react';
import type { V2Block } from '../../types';
import {
  V2_BLOCK_TYPE_LABELS,
  type ContentSize,
  type FontPreset,
  type ImageAlign,
  type ImageBorder,
  type ImageFit,
  type ImageFocalPoint,
  type ImageLoading,
  type ImageRadius,
  type ImageRatio,
  type ImageShadow,
  type ImageWidthPreset,
  type TextAlign,
} from './blockLabels';
import { V2RichTextField } from './V2RichTextField';
import { apiFetch } from '../../lib/api';

type Props = {
  block: V2Block;
  pageId?: string;
  onChangeProps: (props: Record<string, unknown>) => void;
  onChangeVisibility: (visible: boolean) => void;
};

async function uploadImageForPage(pageId: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await apiFetch(`/api/admin/pages/${pageId}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(typeof data?.error === 'string' ? data.error : `Upload failed (${res.status})`);
  }
  const data = (await res.json()) as { path?: string };
  if (!data?.path) throw new Error('Upload did not return a file path');
  return data.path;
}

function ImageUploadButton({
  pageId,
  onUploaded,
  text = 'Upload image',
  multiple = false,
}: {
  pageId?: string;
  onUploaded: (paths: string[]) => void;
  text?: string;
  multiple?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  async function onPickFiles(files: FileList | null) {
    if (!pageId || !files || files.length === 0) return;
    setUploading(true);
    setError('');
    try {
      const paths = await Promise.all(Array.from(files).map((f) => uploadImageForPage(pageId, f)));
      onUploaded(paths);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  return (
    <div className="space-y-1">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="hidden"
        aria-label="Select image files to upload"
        onChange={(e) => void onPickFiles(e.target.files)}
      />
      <button
        type="button"
        disabled={!pageId || uploading}
        onClick={() => inputRef.current?.click()}
        className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded-lg hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400"
      >
        {uploading ? 'Uploading...' : text}
      </button>
      {!pageId && <p className="text-[11px] text-slate-500">Save the page first to enable uploads.</p>}
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
}

function str(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function peopleItems(raw: unknown): { name: string; tag: string; avatar: string }[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((row) => {
    const o = row && typeof row === 'object' && !Array.isArray(row) ? (row as Record<string, unknown>) : {};
    return {
      name: str(o.name),
      tag: str(o.tag),
      avatar: str(o.avatar),
    };
  });
}

const ALIGNS: { value: TextAlign; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

const FONTS: { value: FontPreset; label: string }[] = [
  { value: 'default', label: 'Default' },
  { value: 'serif', label: 'Serif' },
  { value: 'strong', label: 'Strong' },
];

const SIZES: { value: ContentSize; label: string }[] = [
  { value: 'sm', label: 'Smaller' },
  { value: 'md', label: 'Normal' },
  { value: 'lg', label: 'Larger' },
];

const IMAGE_WIDTHS: { value: ImageWidthPreset; label: string }[] = [
  { value: 'full', label: 'Full width' },
  { value: 'wide', label: 'Wide' },
  { value: 'normal', label: 'Normal' },
  { value: 'narrow', label: 'Narrow' },
];

const IMAGE_ALIGNS: { value: ImageAlign; label: string }[] = [
  { value: 'left', label: 'Left' },
  { value: 'center', label: 'Center' },
  { value: 'right', label: 'Right' },
];

const IMAGE_RATIOS: { value: ImageRatio; label: string }[] = [
  { value: 'auto', label: 'Auto' },
  { value: '16:9', label: '16:9' },
  { value: '4:3', label: '4:3' },
  { value: '1:1', label: '1:1 (Square)' },
  { value: '3:4', label: '3:4 (Portrait)' },
];

const IMAGE_FITS: { value: ImageFit; label: string }[] = [
  { value: 'cover', label: 'Cover (crop to fill)' },
  { value: 'contain', label: 'Contain (show full image)' },
];

const IMAGE_RADII: { value: ImageRadius; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
  { value: 'pill', label: 'Pill' },
];

const IMAGE_BORDERS: { value: ImageBorder; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'thin', label: 'Thin border' },
];

const IMAGE_SHADOWS: { value: ImageShadow; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'sm', label: 'Small' },
  { value: 'md', label: 'Medium' },
  { value: 'lg', label: 'Large' },
];

const IMAGE_FOCAL_POINTS: { value: ImageFocalPoint; label: string }[] = [
  { value: 'center', label: 'Center' },
  { value: 'top', label: 'Top' },
  { value: 'bottom', label: 'Bottom' },
  { value: 'left', label: 'Left' },
  { value: 'right', label: 'Right' },
];

const IMAGE_LOADING: { value: ImageLoading; label: string }[] = [
  { value: 'lazy', label: 'Lazy (faster page load)' },
  { value: 'eager', label: 'Eager (load immediately)' },
];

function BlockLayoutFields({
  props,
  onChange,
  showFont,
  showContentSize,
}: {
  props: Record<string, unknown>;
  onChange: (p: Record<string, unknown>) => void;
  showFont?: boolean;
  showContentSize?: boolean;
}) {
  const textAlign = (props.textAlign as TextAlign) || 'left';
  const fontPreset = (props.fontPreset as FontPreset) || 'default';
  const contentSize = (props.contentSize as ContentSize) || 'md';
  return (
    <div className="space-y-2 border-b border-slate-100 pb-3 mb-2">
      <p className="text-xs font-medium text-slate-600">Layout &amp; style</p>
      <label className="block text-[11px] text-slate-500">Text alignment</label>
      <select
        className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded-lg"
        value={textAlign}
        onChange={(e) => onChange({ ...props, textAlign: e.target.value as TextAlign })}
        aria-label="Text alignment"
      >
        {ALIGNS.map((a) => (
          <option key={a.value} value={a.value}>
            {a.label}
          </option>
        ))}
      </select>
      {showFont && (
        <>
          <label className="block text-[11px] text-slate-500 mt-2">Font style</label>
          <select
            className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded-lg"
            value={fontPreset}
            onChange={(e) => onChange({ ...props, fontPreset: e.target.value as FontPreset })}
            aria-label="Font preset"
          >
            {FONTS.map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
        </>
      )}
      {showContentSize && (
        <>
          <label className="block text-[11px] text-slate-500 mt-2">Text size</label>
          <select
            className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded-lg"
            value={contentSize}
            onChange={(e) => onChange({ ...props, contentSize: e.target.value as ContentSize })}
            aria-label="Body text size"
          >
            {SIZES.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </>
      )}
    </div>
  );
}

function HeaderFields({ props, onChange }: { props: Record<string, unknown>; onChange: (p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-2">
      <BlockLayoutFields props={props} onChange={onChange} showFont />
      <label className="block text-xs font-medium text-slate-600">Main title</label>
      <textarea
        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm"
        rows={2}
        value={str(props.title)}
        onChange={(e) => onChange({ ...props, title: e.target.value })}
        aria-label="Header title"
      />
      <label className="block text-xs font-medium text-slate-600">Subtitle</label>
      <textarea
        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm"
        rows={2}
        value={str(props.subtitle)}
        onChange={(e) => onChange({ ...props, subtitle: e.target.value })}
        aria-label="Header subtitle"
      />
      <label className="block text-xs font-medium text-slate-600">Extra line (left)</label>
      <p className="text-[11px] text-slate-500">Optional — e.g. date or group name</p>
      <textarea
        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm"
        rows={2}
        value={str(props.metaLeft)}
        onChange={(e) => onChange({ ...props, metaLeft: e.target.value })}
        aria-label="Header extra left"
      />
      <label className="block text-xs font-medium text-slate-600">Extra line (right)</label>
      <p className="text-[11px] text-slate-500">Optional — e.g. location</p>
      <textarea
        className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-sm"
        rows={2}
        value={str(props.metaRight)}
        onChange={(e) => onChange({ ...props, metaRight: e.target.value })}
        aria-label="Header extra right"
      />
    </div>
  );
}

function RichTextFields({
  blockId,
  props,
  onChange,
}: {
  blockId: string;
  props: Record<string, unknown>;
  onChange: (p: Record<string, unknown>) => void;
}) {
  return (
    <div className="space-y-2">
      <BlockLayoutFields props={props} onChange={onChange} showFont showContentSize />
      <label className="block text-xs font-medium text-slate-600">Body text</label>
      <p className="text-[11px] text-slate-500">Use the toolbar for bold, lists, and alignment.</p>
      <V2RichTextField
        blockId={blockId}
        value={str(props.content)}
        onChange={(html) => onChange({ ...props, content: html })}
      />
    </div>
  );
}

function PeopleListFields({ props, onChange }: { props: Record<string, unknown>; onChange: (p: Record<string, unknown>) => void }) {
  const items = peopleItems(props.items);
  function setItems(next: typeof items) {
    onChange({
      ...props,
      items: next.map((i) => ({ name: i.name, tag: i.tag, avatar: i.avatar })),
    });
  }
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-600">People</span>
        <button
          type="button"
          className="text-xs px-2 py-1 border border-slate-300 rounded hover:bg-slate-50"
          onClick={() => setItems([...items, { name: '', tag: '', avatar: '' }])}
        >
          Add row
        </button>
      </div>
      <div className="space-y-2 max-h-[200px] overflow-auto">
        {items.map((row, idx) => (
          <div key={idx} className="border border-slate-200 rounded-lg p-2 space-y-1">
            <input
              className="w-full text-sm px-2 py-1 border border-slate-200 rounded"
              placeholder="Name"
              value={row.name}
              onChange={(e) => {
                const n = [...items];
                n[idx] = { ...n[idx], name: e.target.value };
                setItems(n);
              }}
              aria-label={`Person ${idx + 1} name`}
            />
            <input
              className="w-full text-sm px-2 py-1 border border-slate-200 rounded"
              placeholder="Tag"
              value={row.tag}
              onChange={(e) => {
                const n = [...items];
                n[idx] = { ...n[idx], tag: e.target.value };
                setItems(n);
              }}
              aria-label={`Person ${idx + 1} tag`}
            />
            <input
              className="w-full text-sm px-2 py-1 border border-slate-200 rounded"
              placeholder="Photo URL"
              value={row.avatar}
              onChange={(e) => {
                const n = [...items];
                n[idx] = { ...n[idx], avatar: e.target.value };
                setItems(n);
              }}
              aria-label={`Person ${idx + 1} photo URL`}
            />
            <button type="button" className="text-xs text-red-600" onClick={() => setItems(items.filter((_, i) => i !== idx))}>
              Remove
            </button>
          </div>
        ))}
      </div>
      <label className="block text-xs font-medium text-slate-600">Footer line</label>
      <input
        className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded-lg"
        value={str(props.footerText)}
        onChange={(e) => onChange({ ...props, footerText: e.target.value })}
        aria-label="People list footer text"
      />
    </div>
  );
}

function ImageGridFields({
  props,
  onChange,
  pageId,
}: {
  props: Record<string, unknown>;
  onChange: (p: Record<string, unknown>) => void;
  pageId?: string;
}) {
  const images = Array.isArray(props.images) ? props.images.filter((x): x is string => typeof x === 'string') : [];
  const text = images.join('\n');
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-slate-600">Image addresses (one per line)</label>
      <p className="text-[11px] text-slate-500">Upload photos or paste links from your media library.</p>
      <ImageUploadButton
        pageId={pageId}
        text="Upload image(s)"
        multiple
        onUploaded={(paths) => onChange({ ...props, images: [...images, ...paths] })}
      />
      <textarea
        className="w-full min-h-[120px] font-mono text-xs px-2 py-1.5 border border-slate-300 rounded-lg"
        value={text}
        onChange={(e) =>
          onChange({
            ...props,
            images: e.target.value
              .split('\n')
              .map((s) => s.trim())
              .filter(Boolean),
          })
        }
        aria-label="Image grid URLs"
      />
    </div>
  );
}

function CtaFields({ props, onChange }: { props: Record<string, unknown>; onChange: (p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-2">
      <BlockLayoutFields props={props} onChange={onChange} showFont />
      <label className="block text-xs font-medium text-slate-600">Button text</label>
      <input
        className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded-lg"
        value={str(props.label)}
        onChange={(e) => onChange({ ...props, label: e.target.value })}
        aria-label="CTA label"
      />
      <label className="block text-xs font-medium text-slate-600">Link (web address)</label>
      <input
        className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded-lg"
        value={str(props.href)}
        onChange={(e) => onChange({ ...props, href: e.target.value })}
        aria-label="CTA link URL"
      />
    </div>
  );
}

function FooterFields({ props, onChange }: { props: Record<string, unknown>; onChange: (p: Record<string, unknown>) => void }) {
  const labels: Record<string, string> = {
    shopName: 'Business or site name',
    tagline: 'Tagline',
    location: 'Location',
    linkUrl: 'Website link',
  };
  return (
    <div className="space-y-2">
      <BlockLayoutFields props={props} onChange={onChange} showFont />
      {(['shopName', 'tagline', 'location', 'linkUrl'] as const).map((key) => (
        <div key={key}>
          <label className="block text-xs font-medium text-slate-600">{labels[key]}</label>
          <input
            className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded-lg"
            value={str(props[key])}
            onChange={(e) => onChange({ ...props, [key]: e.target.value })}
            aria-label={labels[key]}
          />
        </div>
      ))}
    </div>
  );
}

function ImageFields({
  props,
  onChange,
  pageId,
}: {
  props: Record<string, unknown>;
  onChange: (p: Record<string, unknown>) => void;
  pageId?: string;
}) {
  const widthPreset = (props.widthPreset as ImageWidthPreset) || 'full';
  const align = (props.align as ImageAlign) || 'center';
  const ratio = (props.ratio as ImageRatio) || 'auto';
  const fit = (props.fit as ImageFit) || 'cover';
  const radius = (props.radius as ImageRadius) || 'lg';
  const border = (props.border as ImageBorder) || 'none';
  const shadow = (props.shadow as ImageShadow) || 'sm';
  const focalPoint = (props.focalPoint as ImageFocalPoint) || 'center';
  const loading = (props.loading as ImageLoading) || 'lazy';

  return (
    <div className="space-y-3">
      <div className="space-y-2 border border-slate-200 rounded-lg p-2">
        <p className="text-xs font-medium text-slate-700">Layout</p>
        <label className="block text-[11px] text-slate-500">Display width</label>
        <select
          className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded-lg"
          value={widthPreset}
          onChange={(e) => onChange({ ...props, widthPreset: e.target.value as ImageWidthPreset })}
          aria-label="Image width preset"
        >
          {IMAGE_WIDTHS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <label className="block text-[11px] text-slate-500">Alignment</label>
        <select
          className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded-lg"
          value={align}
          onChange={(e) => onChange({ ...props, align: e.target.value as ImageAlign })}
          aria-label="Image alignment"
        >
          {IMAGE_ALIGNS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 border border-slate-200 rounded-lg p-2">
        <p className="text-xs font-medium text-slate-700">Crop and frame</p>
        <label className="block text-[11px] text-slate-500">Aspect ratio</label>
        <select
          className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded-lg"
          value={ratio}
          onChange={(e) => onChange({ ...props, ratio: e.target.value as ImageRatio })}
          aria-label="Image aspect ratio"
        >
          {IMAGE_RATIOS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <label className="block text-[11px] text-slate-500">Fit mode</label>
        <select
          className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded-lg"
          value={fit}
          onChange={(e) => onChange({ ...props, fit: e.target.value as ImageFit })}
          aria-label="Image fit mode"
        >
          {IMAGE_FITS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <label className="block text-[11px] text-slate-500">Focal point</label>
        <select
          className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded-lg"
          value={focalPoint}
          onChange={(e) => onChange({ ...props, focalPoint: e.target.value as ImageFocalPoint })}
          aria-label="Image focal point"
        >
          {IMAGE_FOCAL_POINTS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 border border-slate-200 rounded-lg p-2">
        <p className="text-xs font-medium text-slate-700">Style</p>
        <label className="block text-[11px] text-slate-500">Corner radius</label>
        <select
          className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded-lg"
          value={radius}
          onChange={(e) => onChange({ ...props, radius: e.target.value as ImageRadius })}
          aria-label="Image corner radius"
        >
          {IMAGE_RADII.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <label className="block text-[11px] text-slate-500">Border</label>
        <select
          className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded-lg"
          value={border}
          onChange={(e) => onChange({ ...props, border: e.target.value as ImageBorder })}
          aria-label="Image border style"
        >
          {IMAGE_BORDERS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <label className="block text-[11px] text-slate-500">Shadow</label>
        <select
          className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded-lg"
          value={shadow}
          onChange={(e) => onChange({ ...props, shadow: e.target.value as ImageShadow })}
          aria-label="Image shadow"
        >
          {IMAGE_SHADOWS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 border border-slate-200 rounded-lg p-2">
        <p className="text-xs font-medium text-slate-700">Image file</p>
        <p className="text-[11px] text-slate-500">Upload an image or paste a link.</p>
        <ImageUploadButton pageId={pageId} onUploaded={(paths) => onChange({ ...props, src: paths[0] || '' })} />
        <label className="block text-[11px] text-slate-500">Image address (URL)</label>
        <input
          className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded-lg font-mono"
          value={str(props.src)}
          onChange={(e) => onChange({ ...props, src: e.target.value })}
          aria-label="Image URL"
        />
      </div>

      <div className="space-y-2 border border-slate-200 rounded-lg p-2">
        <p className="text-xs font-medium text-slate-700">Caption</p>
        <label className="block text-[11px] text-slate-500">Caption text (optional)</label>
        <input
          className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded-lg"
          value={str(props.caption)}
          onChange={(e) => onChange({ ...props, caption: e.target.value })}
          aria-label="Image caption"
        />
        <label className="block text-[11px] text-slate-500">Caption link (optional)</label>
        <input
          className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded-lg"
          value={str(props.captionHref)}
          onChange={(e) => onChange({ ...props, captionHref: e.target.value })}
          aria-label="Image caption link"
        />
      </div>

      <div className="space-y-2 border border-slate-200 rounded-lg p-2">
        <p className="text-xs font-medium text-slate-700">Accessibility and loading</p>
        <label className="block text-[11px] text-slate-500">Alt text</label>
        <p className="text-[11px] text-slate-500">Describe what is in the image in plain words. Aim for about 40-120 characters.</p>
        <input
          className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded-lg"
          value={str(props.alt)}
          onChange={(e) => onChange({ ...props, alt: e.target.value })}
          aria-label="Image alt text"
        />
        <label className="block text-[11px] text-slate-500">Loading behavior</label>
        <select
          className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded-lg"
          value={loading}
          onChange={(e) => onChange({ ...props, loading: e.target.value as ImageLoading })}
          aria-label="Image loading behavior"
        >
          {IMAGE_LOADING.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function AuthorCardFields({
  props,
  onChange,
  pageId,
}: {
  props: Record<string, unknown>;
  onChange: (p: Record<string, unknown>) => void;
  pageId?: string;
}) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-slate-600">Name</label>
      <input
        className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded-lg"
        value={str(props.name)}
        onChange={(e) => onChange({ ...props, name: e.target.value })}
        aria-label="Author name"
      />
      <label className="block text-xs font-medium text-slate-600">Role or title</label>
      <input
        className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded-lg"
        value={str(props.role)}
        onChange={(e) => onChange({ ...props, role: e.target.value })}
        aria-label="Author role"
      />
      <label className="block text-xs font-medium text-slate-600">Photo address (URL)</label>
      <p className="text-[11px] text-slate-500">Upload a photo or paste a link.</p>
      <ImageUploadButton pageId={pageId} text="Upload photo" onUploaded={(paths) => onChange({ ...props, photo: paths[0] || '' })} />
      <input
        className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded-lg font-mono"
        value={str(props.photo)}
        onChange={(e) => onChange({ ...props, photo: e.target.value })}
        aria-label="Author photo URL"
      />
    </div>
  );
}

function AudioFields({ props, onChange }: { props: Record<string, unknown>; onChange: (p: Record<string, unknown>) => void }) {
  return (
    <div className="space-y-2">
      <label className="block text-xs font-medium text-slate-600">Audio address (URL)</label>
      <input
        className="w-full text-sm px-2 py-1.5 border border-slate-300 rounded-lg font-mono"
        value={str(props.src)}
        onChange={(e) => onChange({ ...props, src: e.target.value })}
        aria-label="Audio URL"
      />
      <label className="block text-xs font-medium text-slate-600">Transcript (advanced JSON)</label>
      <p className="text-[11px] text-slate-500">Usually left empty unless you sync timed captions.</p>
      <textarea
        className="w-full min-h-[100px] font-mono text-xs px-2 py-1.5 border border-slate-300 rounded-lg"
        value={(() => {
          const t = props.transcript;
          try {
            return JSON.stringify(Array.isArray(t) ? t : [], null, 2);
          } catch {
            return '[]';
          }
        })()}
        onChange={(e) => {
          try {
            const parsed = JSON.parse(e.target.value);
            onChange({ ...props, transcript: Array.isArray(parsed) ? parsed : [] });
          } catch {
            /* keep previous until valid */
          }
        }}
        aria-label="Audio transcript JSON"
      />
    </div>
  );
}

function TypeFields({
  block,
  pageId,
  onChangeProps,
}: {
  block: V2Block;
  pageId?: string;
  onChangeProps: (p: Record<string, unknown>) => void;
}) {
  const props = block.props || {};
  switch (block.type) {
    case 'header':
      return <HeaderFields props={props} onChange={onChangeProps} />;
    case 'richText':
      return <RichTextFields blockId={block.id} props={props} onChange={onChangeProps} />;
    case 'peopleList':
      return <PeopleListFields props={props} onChange={onChangeProps} />;
    case 'imageGrid':
      return <ImageGridFields props={props} onChange={onChangeProps} pageId={pageId} />;
    case 'cta':
      return <CtaFields props={props} onChange={onChangeProps} />;
    case 'footer':
      return <FooterFields props={props} onChange={onChangeProps} />;
    case 'image':
      return <ImageFields props={props} onChange={onChangeProps} pageId={pageId} />;
    case 'authorCard':
      return <AuthorCardFields props={props} onChange={onChangeProps} pageId={pageId} />;
    case 'audio':
      return <AudioFields props={props} onChange={onChangeProps} />;
    default:
      return <p className="text-xs text-slate-500">Unknown block type</p>;
  }
}

const BLOCK_HELP: Partial<Record<V2Block['type'], string>> = {
  header: 'Large title area at the top of the page.',
  richText: 'Paragraphs and formatting for your main message.',
  peopleList: 'A list of names with optional tags and photos.',
  imageGrid: 'A grid of photos.',
  cta: 'A single button linking somewhere.',
  footer: 'Contact or credit text at the bottom.',
  image: 'One full-width image.',
  authorCard: 'A name, role, and optional photo.',
  audio: 'An audio clip with optional transcript data.',
};

export function BlockInspector({ block, pageId, onChangeProps, onChangeVisibility }: Props) {
  const [tab, setTab] = useState<'content' | 'advanced'>('content');
  const [advancedText, setAdvancedText] = useState(() => JSON.stringify(block.props || {}, null, 2));
  const [advancedError, setAdvancedError] = useState('');

  const typeLabel = V2_BLOCK_TYPE_LABELS[block.type] || block.type;
  const help = BLOCK_HELP[block.type];

  function applyAdvancedJson() {
    try {
      const parsed = JSON.parse(advancedText);
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        setAdvancedError('Props must be a JSON object');
        return;
      }
      onChangeProps(parsed as Record<string, unknown>);
      setAdvancedError('');
    } catch {
      setAdvancedError('Invalid JSON');
    }
  }

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-semibold text-slate-800">{typeLabel}</p>
        {help && <p className="text-[11px] text-slate-500 mt-0.5">{help}</p>}
      </div>

      <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm">
        <button
          type="button"
          className={`flex-1 px-2 py-1.5 ${tab === 'content' ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
          onClick={() => setTab('content')}
        >
          Content
        </button>
        <button
          type="button"
          className={`flex-1 px-2 py-1.5 border-l border-slate-200 ${tab === 'advanced' ? 'bg-slate-800 text-white' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
          onClick={() => {
            setAdvancedText(JSON.stringify(block.props || {}, null, 2));
            setTab('advanced');
          }}
        >
          Developer
        </button>
      </div>

      <label className="text-sm text-slate-600 flex items-center gap-2">
        <input type="checkbox" checked={block.visibility !== false} onChange={(e) => onChangeVisibility(e.target.checked)} />
        Show this block on the page
      </label>

      {tab === 'content' ? (
        <TypeFields block={block} pageId={pageId} onChangeProps={onChangeProps} />
      ) : (
        <div className="space-y-2">
          <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1">
            Raw settings for this block. Only change this if you know what you are doing — invalid JSON can break the page.
          </p>
          <textarea
            className="w-full min-h-[200px] font-mono text-xs px-2 py-1.5 border border-slate-300 rounded-lg"
            value={advancedText}
            onChange={(e) => setAdvancedText(e.target.value)}
            aria-label="Block props as JSON"
          />
          {advancedError && <p className="text-xs text-red-600">{advancedError}</p>}
          <button type="button" className="w-full px-2 py-1.5 text-sm border border-slate-300 rounded-lg hover:bg-slate-50" onClick={applyAdvancedJson}>
            Apply JSON
          </button>
        </div>
      )}
    </div>
  );
}
