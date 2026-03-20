import { useRef, useState } from "react";

interface TeacherAudioPlayerProps {
  src: string;
  label?: string;
}

export function TeacherAudioPlayer({
  src,
  label = "A message from your teacher",
}: TeacherAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [hasStarted, setHasStarted] = useState(false);

  const handlePlayClick = () => {
    const el = audioRef.current;
    if (!el) return;
    el.play()
      .then(() => setHasStarted(true))
      .catch(() => {});
  };

  if (!src?.trim()) return null;

  return (
    <section
      className="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-sm border border-slate-100 mb-6"
      aria-label="Teacher voice recording"
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handlePlayClick}
          className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-transform hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--theme-accent)]"
          style={{
            backgroundColor: "var(--theme-accent)",
            color: "white",
          }}
          aria-label="Listen to message"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-slate-700 truncate">{label}</p>
          {!hasStarted ? (
            <button
              type="button"
              onClick={handlePlayClick}
              className="mt-1 text-sm font-medium hover:underline"
              style={{ color: "var(--theme-accent)" }}
            >
              Tap to listen
            </button>
          ) : null}
        </div>
      </div>
      <audio
        ref={audioRef}
        src={src}
        preload="auto"
        playsInline
        controls={hasStarted}
        autoPlay={hasStarted}
        className={`mt-2 w-full h-10 max-w-full ${hasStarted ? "block" : "hidden"}`}
      />
    </section>
  );
}
