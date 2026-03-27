import type { V2Block } from '../../types';
import type { ReactElement } from 'react';

function text(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function list(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string') : [];
}

function object(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function HeaderBlock({ props }: { props: Record<string, unknown> }) {
  const title = text(props.title);
  const subtitle = text(props.subtitle);
  const left = text(props.metaLeft);
  const right = text(props.metaRight);
  return (
    <section className="rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-8 shadow">
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

function RichTextBlock({ props }: { props: Record<string, unknown> }) {
  const content = text(props.content);
  return (
    <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: content || '<p></p>' }} />
    </section>
  );
}

function PeopleListBlock({ props }: { props: Record<string, unknown> }) {
  const items = Array.isArray(props.items) ? props.items : [];
  const footerText = text(props.footerText);
  return (
    <section className="bg-slate-900 text-white rounded-2xl p-6 shadow">
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

function ImageGridBlock({ props }: { props: Record<string, unknown> }) {
  const images = list(props.images);
  return (
    <section className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {images.map((src, i) => (
          <img key={`${src}-${i}`} src={src} alt="" className="rounded-lg object-cover w-full aspect-square bg-slate-100" loading="lazy" />
        ))}
      </div>
      {images.length === 0 && <p className="text-sm text-slate-500">No images</p>}
    </section>
  );
}

function CtaBlock({ props }: { props: Record<string, unknown> }) {
  const label = text(props.label) || 'Call to action';
  const href = text(props.href) || '#';
  return (
    <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm text-center">
      <a href={href} className="inline-block px-5 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700">
        {label}
      </a>
    </section>
  );
}

function FooterBlock({ props }: { props: Record<string, unknown> }) {
  const shopName = text(props.shopName);
  const tagline = text(props.tagline);
  const location = text(props.location);
  const linkUrl = text(props.linkUrl);
  return (
    <footer className="rounded-2xl bg-slate-100 p-6 text-sm text-slate-700 border border-slate-200">
      <p className="font-semibold">{shopName}</p>
      {tagline && <p>{tagline}</p>}
      {location && <p>{location}</p>}
      {linkUrl && (
        <p className="mt-2">
          <a className="text-blue-600 hover:underline" href={linkUrl}>
            {linkUrl}
          </a>
        </p>
      )}
    </footer>
  );
}

function ImageBlock({ props }: { props: Record<string, unknown> }) {
  const src = text(props.src);
  const alt = text(props.alt);
  if (!src) return null;
  return (
    <section className="bg-white rounded-2xl p-3 border border-slate-200 shadow-sm">
      <img src={src} alt={alt} className="rounded-xl w-full object-cover max-h-[520px]" />
    </section>
  );
}

function AuthorCardBlock({ props }: { props: Record<string, unknown> }) {
  const name = text(props.name);
  const role = text(props.role);
  const photo = text(props.photo);
  return (
    <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-center gap-4">
      {photo && <img src={photo} alt={name} className="w-16 h-16 rounded-full object-cover" />}
      <div>
        <p className="font-semibold">{name || 'Author'}</p>
        {role && <p className="text-sm text-slate-600">{role}</p>}
      </div>
    </section>
  );
}

function AudioBlock({ props }: { props: Record<string, unknown> }) {
  const src = text(props.src);
  if (!src) return null;
  return (
    <section className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
      <audio src={src} controls className="w-full" />
    </section>
  );
}

const registry: Record<string, (props: { props: Record<string, unknown> }) => ReactElement | null> = {
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

export function BlockRenderer({ blocks }: { blocks: V2Block[] }) {
  return (
    <div className="space-y-6">
      {blocks.filter((b) => b.visibility !== false).map((block) => {
        const Comp = registry[block.type];
        if (!Comp) return null;
        return <Comp key={block.id} props={block.props || {}} />;
      })}
    </div>
  );
}

