import type { Footer as FooterType } from '../types';

interface FooterProps {
  footer: FooterType;
}

export function Footer({ footer }: FooterProps) {
  const branding = (
      <div className="flex justify-center items-center gap-2 grayscale opacity-50">
        {footer.logo ? (
          <img
            src={footer.logo}
            alt={footer.shopName}
            className="w-8 h-8 object-contain"
          />
        ) : (
          <div className="w-8 h-8 bg-slate-800 rounded-md"></div>
        )}
        <span className="font-bold tracking-tighter text-slate-800 text-xl uppercase">
          {footer.shopName}
        </span>
      </div>
    );

  return (
    <footer className="mt-16 text-center space-y-4">
      {footer.linkUrl ? (
        <a
          href={footer.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block hover:opacity-80 transition-smooth"
        >
          {branding}
        </a>
      ) : (
        branding
      )}
      <p className="text-slate-400 text-xs uppercase tracking-widest">
        {footer.tagline} • {footer.location}
      </p>
    </footer>
  );
}
