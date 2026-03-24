interface HeroSectionProps {
  sectionName: string;
  quote: string;
  themeLabel?: string;
  titleLabel?: string;
}

export function HeroSection({ sectionName, quote, themeLabel = 'Event Memories', titleLabel = 'Event' }: HeroSectionProps) {
  return (
    <header
      className="pt-12 pb-24 px-6 text-center text-white relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, var(--theme-gradient-start) 0%, var(--theme-gradient-end) 100%)',
      }}
    >
      <div className="relative z-10">
        <p className="font-semibold tracking-widest uppercase text-sm mb-2 opacity-90 whitespace-pre-line" style={{ color: 'rgba(255,255,255,0.9)' }}>
          {themeLabel}
        </p>
        <h1 className="serif text-4xl md:text-5xl font-bold mb-4 whitespace-pre-line">
          {titleLabel}: {sectionName}
        </h1>
        <div className="h-1 w-20 mx-auto rounded-full mb-4" style={{ backgroundColor: 'var(--theme-accent)' }}></div>
        <p className="text-lg opacity-80 italic max-w-md mx-auto whitespace-pre-line">"{quote}"</p>
      </div>
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: 'var(--theme-accent)' }}></div>
    </header>
  );
}
