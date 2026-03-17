interface HeroSectionProps {
  sectionName: string;
  quote: string;
}

export function HeroSection({ sectionName, quote }: HeroSectionProps) {
  return (
    <header className="gradient-bg pt-12 pb-24 px-6 text-center text-white relative overflow-hidden">
      <div className="relative z-10">
        <p className="text-blue-300 font-semibold tracking-widest uppercase text-sm mb-2">
          Graduation Souvenir
        </p>
        <h1 className="serif text-4xl md:text-5xl font-bold mb-4">
          Section: {sectionName}
        </h1>
        <div className="h-1 w-20 bg-blue-500 mx-auto rounded-full mb-4"></div>
        <p className="text-lg opacity-80 italic max-w-md mx-auto">"{quote}"</p>
      </div>
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-600 rounded-full opacity-20 blur-3xl"></div>
    </header>
  );
}
