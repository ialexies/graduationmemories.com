import { useRef, useState, useEffect } from "react";
import type { TranscriptWord } from "../types";

interface TeacherAudioPlayerProps {
  src: string;
  authorLabel?: string;
  transcript?: TranscriptWord[];
}

export function TeacherAudioPlayer({
  src,
  authorLabel = "Host",
  transcript,
}: TeacherAudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const transcriptRef = useRef<HTMLDivElement>(null);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentWordIndex, setCurrentWordIndex] = useState<number>(-1);

  const handlePlayClick = () => {
    const el = audioRef.current;
    if (!el) return;
    el.play()
      .then(() => setHasStarted(true))
      .catch(() => {});
  };

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !transcript?.length) return;
    const onTimeUpdate = () => {
      const t = el.currentTime;
      const idx = transcript.findIndex((w) => t >= w.start && t <= w.end);
      setCurrentWordIndex(idx >= 0 ? idx : -1);
    };
    el.addEventListener("timeupdate", onTimeUpdate);
    return () => el.removeEventListener("timeupdate", onTimeUpdate);
  }, [transcript]);

  useEffect(() => {
    if (currentWordIndex < 0 || !transcriptRef.current) return;
    const span = transcriptRef.current.querySelector(`[data-word-idx="${currentWordIndex}"]`);
    span?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [currentWordIndex]);

  if (!src?.trim()) return null;

  const hasTranscript = transcript && transcript.length > 0;

  return (
    <section
      className="bg-white/90 backdrop-blur rounded-2xl p-4 shadow-sm border border-slate-100 mb-6"
      aria-label={`${authorLabel} voice recording`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={handlePlayClick}
          className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-smooth hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--theme-accent)] ${!hasStarted ? "animate-pulse-play" : ""}`}
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
          <p className="text-sm font-medium text-slate-700 truncate">Listen from {authorLabel}</p>
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
      {hasTranscript && (
        <div
          ref={transcriptRef}
          className="mt-3 max-h-24 overflow-y-auto rounded-lg bg-slate-50/80 px-3 py-2 text-sm text-slate-600 leading-relaxed"
          role="region"
          aria-live="polite"
          aria-label="Transcription"
        >
          {transcript.map((w, i) => (
            <span
              key={i}
              data-word-idx={i}
              className={i === currentWordIndex ? "font-semibold text-slate-900" : ""}
              style={i === currentWordIndex ? { color: "var(--theme-accent)" } : undefined}
            >
              {w.word}{" "}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}
