import type { V2Block } from '../../types';
import type { ReactElement, ReactNode } from 'react';
import {
  alignClass,
  contentSizeClass,
  fontPresetClass,
  imageAlignClass,
  imageBorderClass,
  imageFitClass,
  imageFocalPointClass,
  imageLoadingValue,
  imageRadiusClass,
  imageRatioClass,
  imageShadowClass,
  imageWidthClass,
} from './blockLabels';

export type BlockRenderProps = {
  props: Record<string, unknown>;
  /** When true, links and rich HTML do not navigate — clicks select the block in the editor preview. */
  previewInteractive?: boolean;
};

function text(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function list(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

function object(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function layoutWrap(props: Record<string, unknown>, extra: string) {
  return `${alignClass(props.textAlign)} ${fontPresetClass(props.fontPreset)} ${extra}`.trim();
}

function HeaderBlock({ props }: BlockRenderProps) {
  const title = text(props.title);
  const subtitle = text(props.subtitle);
  const left = text(props.metaLeft);
  const right = text(props.metaRight);
  return (
    <section className={`rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 shadow ${layoutWrap(props, '')}`}>
      <h1 className="text-3xl font-bold whitespace-pre-line">{title}</h1>
      {subtitle && <p className="mt-2 opacity-90 whitespace-pre-line">{subtitle}</p>}
      {(left || right) && (
        <div className="mt-4 flex flex-wrap gap-4 text-sm opacity-90">
          {left && <span className="whitespace-pre-line">{left}</span>}
          {right && <span className="whitespace-pre-line">{right}</span>}
        </div>
      )}
    </section>
  );
}

function RichTextBlock({ props, previewInteractive }: BlockRenderProps) {
  const content = text(props.content);
  const sizeCls = contentSizeClass(props.contentSize);
  return (
    <section className={`bg-white rounded-2xl p-6 border border-slate-200 shadow-sm ${layoutWrap(props, '')}`}>
      <div
        className={`prose max-w-none ${sizeCls} ${previewInteractive ? 'pointer-events-none select-none' : ''}`}
        dangerouslySetInnerHTML={{ __html: content || '<p></p>' }}
      />
    </section>
  );
}

function PeopleListBlock({ props }: BlockRenderProps) {
  const items = Array.isArray(props.items) ? props.items : [];
  const footerText = text(props.footerText);
  return (
    <section className={`bg-slate-900 text-white rounded-2xl p-6 shadow ${layoutWrap(props, '')}`}>
      <div className="grid gap-2">
        {items.map((raw, idx) => {
          const row = object(raw);
          const name = text(row.name);
          const tag = text(row.tag);
          return (
            <div key={`${name}-${idx}`} className="flex items-center justify-between border-b border-white/20 pb-1">
              <span>{name || 'Unnamed'}</span>
              {tag && <span className="text-xs opacity-80">{tag}</span>}
            </div>
          );
        })}
      </div>
      {footerText && <p className="mt-4 text-xs opacity-80">{footerText}</p>}
    </section>
  );
}

function ImageGridBlock({ props }: BlockRenderProps) {
  const images = list(props.images);
  return (
    <section className={`bg-white rounded-2xl p-4 border border-slate-200 shadow-sm ${layoutWrap(props, '')}`}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {images.map((src, i) => (
          <img key={`${src}-${i}`} src={src} alt="" className="rounded-lg object-cover w-full aspect-square bg-slate-100" loading="lazy" />
        ))}
      </div>
      {images.length === 0 && <p className="text-sm text-slate-500">No images</p>}
    </section>
  );
}

function CtaBlock({ props, previewInteractive }: BlockRenderProps) {
  const label = text(props.label) || 'Call to action';
  const href = text(props.href) || '#';
  return (
    <section className={`bg-white rounded-2xl p-6 border border-slate-200 shadow-sm ${layoutWrap(props, '')}`}>
      <a
        href={href}
        className="inline-block px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        onClick={previewInteractive ? (e) => e.preventDefault() : undefined}
      >
        {label}
      </a>
    </section>
  );
}

function FooterBlock({ props, previewInteractive }: BlockRenderProps) {
  const shopName = text(props.shopName);
  const tagline = text(props.tagline);
  const location = text(props.location);
  const linkUrl = text(props.linkUrl);
  return (
    <footer className={`rounded-2xl bg-slate-100 p-6 text-sm text-slate-700 border border-slate-200 ${layoutWrap(props, '')}`}>
      <p className="font-semibold">{shopName}</p>
      {tagline && <p>{tagline}</p>}
      {location && <p>{location}</p>}
      {linkUrl && (
        <p className="mt-2">
          <a
            className="text-blue-600 hover:underline"
            href={linkUrl}
            onClick={previewInteractive ? (e) => e.preventDefault() : undefined}
          >
            {linkUrl}
          </a>
        </p>
      )}
    </footer>
  );
}

function ImageBlock({ props, previewInteractive }: BlockRenderProps) {
  const src = text(props.src);
  const alt = text(props.alt);
  const caption = text(props.caption);
  const captionHref = text(props.captionHref);
  const ratioCls = imageRatioClass(props.ratio);
  const wrapperWidth = imageWidthClass(props.widthPreset);
  const wrapperAlign = imageAlignClass(props.align);
  const fitCls = imageFitClass(props.fit);
  const focalCls = imageFocalPointClass(props.focalPoint);
  const radiusCls = imageRadiusClass(props.radius);
  const borderCls = imageBorderClass(props.border);
  const shadowCls = imageShadowClass(props.shadow);
  const loading = imageLoadingValue(props.loading);
  if (!src) return null;
  return (
    <section className={`bg-white rounded-2xl p-3 border border-slate-200 shadow-sm ${layoutWrap(props, '')}`}>
      <div className={`${wrapperWidth} ${wrapperAlign}`}>
        <div className={`${ratioCls ? `${ratioCls} ` : ''}overflow-hidden ${radiusCls} ${borderCls} ${shadowCls}`.trim()}>
          <img
            src={src}
            alt={alt}
            loading={loading}
            className={`${ratioCls ? 'h-full w-full ' : 'w-full max-h-[520px] '}${fitCls} ${focalCls}`.trim()}
          />
        </div>
        {caption &&
          (captionHref ? (
            <a
              href={captionHref}
              className="mt-2 block text-sm text-slate-600 hover:text-blue-700 hover:underline"
              onClick={previewInteractive ? (e) => e.preventDefault() : undefined}
            >
              {caption}
            </a>
          ) : (
            <p className="mt-2 text-sm text-slate-600">{caption}</p>
          ))}
      </div>
    </section>
  );
}

function AuthorCardBlock({ props }: BlockRenderProps) {
  const name = text(props.name);
  const role = text(props.role);
  const photo = text(props.photo);
  return (
    <section className={`bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4 ${layoutWrap(props, '')}`}>
      {photo && <img src={photo} alt={name} className="w-16 h-16 rounded-full object-cover" />}
      <div>
        <p className="font-semibold">{name || 'Author'}</p>
        {role && <p className="text-sm text-slate-600">{role}</p>}
      </div>
    </section>
  );
}

function AudioBlock({ props }: BlockRenderProps) {
  const src = text(props.src);
  if (!src) return null;
  return (
    <section className={`bg-white rounded-2xl p-6 border border-slate-200 shadow-sm ${layoutWrap(props, '')}`}>
      <audio src={src} controls className="w-full" />
    </section>
  );
}

const registry: Record<string, (p: BlockRenderProps) => ReactElement | null> = {
  header: HeaderBlock,
  richText: RichTextBlock,
  peopleList: PeopleListBlock,
  imageGrid: ImageGridBlock,
  cta: CtaBlock,
  footer: FooterBlock,
  image: ImageBlock,
  authorCard: AuthorCardBlock,
  audio: AudioBlock,
};

function BlockPreviewShell({
  blockId,
  selected,
  onSelect,
  children,
}: {
  blockId: string;
  selected: boolean;
  onSelect?: (id: string) => void;
  children: ReactNode;
}) {
  if (!onSelect) return children;
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={selected ? 'This block is selected in the inspector' : 'Select this block to edit in the inspector'}
      onClick={() => onSelect(blockId)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(blockId);
        }
      }}
      className={`rounded-2xl transition outline-none cursor-pointer ${selected ? 'ring-2 ring-blue-500 ring-offset-2' : 'hover:ring-1 hover:ring-slate-300'}`}
    >
      {children}
    </div>
  );
}

export type BlockRendererProps = {
  blocks: V2Block[];
  /** When set with `onBlockSelect`, preview blocks are clickable and show selection ring. */
  selectedBlockId?: string;
  onBlockSelect?: (blockId: string) => void;
};

export function BlockRenderer({ blocks, selectedBlockId, onBlockSelect }: BlockRendererProps) {
  const previewInteractive = Boolean(onBlockSelect);
  return (
    <div className="space-y-6">
      {blocks.filter((b) => b.visibility !== false).map((block) => {
        const Comp = registry[block.type];
        if (!Comp) return null;
        const inner = <Comp props={block.props || {}} previewInteractive={previewInteractive} />;
        return (
          <BlockPreviewShell
            key={block.id}
            blockId={block.id}
            selected={selectedBlockId === block.id}
            onSelect={onBlockSelect}
          >
            {inner}
          </BlockPreviewShell>
        );
      })}
    </div>
  );
}
