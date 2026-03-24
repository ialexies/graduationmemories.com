import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Lightbox from 'yet-another-react-lightbox';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import Slideshow from 'yet-another-react-lightbox/plugins/slideshow';
import Thumbnails from 'yet-another-react-lightbox/plugins/thumbnails';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';

interface ImageSliderProps {
  images: string[];
  title?: string;
  autoPlayInterval?: number;
  layout?: 'carousel' | 'grid';
}

export function ImageSlider({
  images,
  title = 'Our Journey',
  autoPlayInterval = 4000,
  layout = 'carousel',
}: ImageSliderProps) {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const swipeHandled = useRef(false);
  const gridScrollRef = useRef<HTMLDivElement>(null);
  const gridDragRef = useRef({ isDragging: false, startX: 0, startScrollLeft: 0, didDrag: false });
  const gridLastDragEndRef = useRef(0);
  const [isGridHovered, setIsGridHovered] = useState(false);

  const slides = useMemo(
    () => images.map((src, i) => ({ src, alt: `${title} — image ${i + 1}` })),
    [images, title]
  );

  const goNext = useCallback(() => {
    if (images.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrent((i) => (i + 1) % images.length);
      setIsTransitioning(false);
    }, 220);
  }, [images.length]);

  const goPrev = useCallback(() => {
    if (images.length <= 1) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrent((i) => (i - 1 + images.length) % images.length);
      setIsTransitioning(false);
    }, 220);
  }, [images.length]);

  useEffect(() => {
    if (layout !== 'carousel' || images.length <= 1) return;
    const id = setInterval(goNext, autoPlayInterval);
    return () => clearInterval(id);
  }, [layout, images.length, autoPlayInterval, goNext]);

  useEffect(() => {
    if (images.length <= 1) return;
    const nextIdx = (current + 1) % images.length;
    const prevIdx = (current - 1 + images.length) % images.length;
    [images[nextIdx], images[prevIdx]].forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [images, current]);

  const handleTouchStart = (e: React.TouchEvent) => {
    swipeHandled.current = false;
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      swipeHandled.current = true;
      diff > 0 ? goNext() : goPrev();
    }
  };

  function openLightbox() {
    if (swipeHandled.current) {
      swipeHandled.current = false;
      return;
    }
    setLightboxIndex(current);
    setLightboxOpen(true);
  }

  function closeLightbox() {
    setLightboxOpen(false);
    setCurrent(lightboxIndex);
  }

  const handleGridPointerDown = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    gridDragRef.current = { isDragging: false, startX: clientX, startScrollLeft: gridScrollRef.current?.scrollLeft ?? 0, didDrag: false };
  }, []);

  const handleGridPointerMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const isTouch = 'touches' in e;
    if (!isTouch && (e as React.MouseEvent).buttons === 0) return;
    const clientX = isTouch ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const { startX, startScrollLeft } = gridDragRef.current;
    if (Math.abs(clientX - startX) > 5) {
      gridDragRef.current.isDragging = true;
      gridDragRef.current.didDrag = true;
      if (gridScrollRef.current) {
        gridScrollRef.current.scrollLeft = startScrollLeft - (clientX - startX);
      }
      if (isTouch) e.preventDefault();
    }
  }, []);

  const handleGridPointerUp = useCallback(() => {
    if (gridDragRef.current.didDrag) {
      gridLastDragEndRef.current = Date.now();
    }
    gridDragRef.current.isDragging = false;
  }, []);

  useEffect(() => {
    const el = gridScrollRef.current;
    if (!el || layout !== 'grid') return;
    const onTouchMove = (e: TouchEvent) => {
      if (gridDragRef.current.didDrag) e.preventDefault();
    };
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    return () => el.removeEventListener('touchmove', onTouchMove);
  }, [layout, images.length]);

  useEffect(() => {
    if (layout !== 'grid' || images.length <= 1) return;
    const el = gridScrollRef.current;
    if (!el) return;
    const scrollSpeedPxPerSec = 65;
    const pauseAfterDragMs = 3000;
    let rafId: number;
    let lastTime = 0;
    const tick = (now: number) => {
      if (!lastTime) lastTime = now;
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      if (lightboxOpen || isGridHovered || Date.now() - gridLastDragEndRef.current < pauseAfterDragMs) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      const maxScroll = el.scrollWidth - el.clientWidth;
      if (maxScroll <= 0) {
        rafId = requestAnimationFrame(tick);
        return;
      }
      el.scrollLeft += scrollSpeedPxPerSec * dt;
      if (el.scrollLeft >= maxScroll) {
        el.scrollLeft = 0;
      }
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [layout, images.length, lightboxOpen, isGridHovered]);

  if (!images.length) {
    if (layout === 'grid') {
      return (
        <section className="full-bleed mb-10 py-12" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-accent) 22%, rgb(248 250 252))' }}>
          <h2 className="text-2xl font-bold text-center tracking-wide mb-6 text-slate-800">GALLERY</h2>
          <div className="flex items-center justify-center min-h-[200px]">
            <p className="text-sm text-slate-500">No images yet</p>
          </div>
        </section>
      );
    }
    return (
      <section className="mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div
            className="p-2 rounded-lg bg-slate-100"
            style={{ backgroundColor: 'color-mix(in srgb, var(--theme-accent) 12%, rgb(241 245 249))', color: 'var(--theme-accent)' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
        </div>
        <div className="rounded-2xl overflow-hidden shadow-lg border-4 border-white aspect-[4/3] bg-slate-100 flex items-center justify-center">
          <p className="text-slate-500 text-sm">No images yet</p>
        </div>
      </section>
    );
  }

  if (layout === 'grid') {
    return (
      <section className="full-bleed mb-10 py-10 sm:py-12 px-0" style={{ backgroundColor: 'color-mix(in srgb, var(--theme-accent) 22%, rgb(248 250 252))' }}>
        <h2 className="text-2xl font-bold text-center tracking-wide mb-6 text-slate-800">{title}</h2>
        <div
          ref={gridScrollRef}
          className="gallery-scrollbar grid gap-3 overflow-x-auto overflow-y-hidden py-6 pb-2 scroll-smooth cursor-grab active:cursor-grabbing select-none"
          style={{
            gridTemplateRows: 'repeat(3, 150px)',
            gridAutoFlow: 'column',
            gridAutoColumns: 'minmax(120px, 140px)',
            maxHeight: 'calc(3 * 150px + 2 * 12px + 48px)',
          }}
          onMouseEnter={() => setIsGridHovered(true)}
          onMouseLeave={() => {
            setIsGridHovered(false);
            handleGridPointerUp();
          }}
          onMouseDown={handleGridPointerDown}
          onMouseMove={handleGridPointerMove}
          onMouseUp={handleGridPointerUp}
          onTouchStart={handleGridPointerDown}
          onTouchMove={handleGridPointerMove}
          onTouchEnd={handleGridPointerUp}
        >
          {images.map((src, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                if (gridDragRef.current.didDrag) {
                  gridDragRef.current.didDrag = false;
                  return;
                }
                setLightboxIndex(i);
                setLightboxOpen(true);
              }}
              className="w-full h-full rounded-xl overflow-hidden border-2 border-white focus:outline-none focus:ring-2 focus:ring-[var(--theme-accent)] focus:ring-offset-2 focus:ring-offset-[color-mix(in_srgb,var(--theme-accent)_22%,rgb(248_250_252))] transition-smooth hover:opacity-90 block"
              style={{ backgroundColor: 'rgb(241 245 249)' }}
              aria-label={`View image ${i + 1}`}
            >
              <img
                src={src}
                alt={`${title} — image ${i + 1}`}
                className="w-full h-full object-cover block"
                loading={i < 16 ? 'eager' : 'lazy'}
                draggable={false}
              />
            </button>
          ))}
        </div>
        <Lightbox
          plugins={[Counter, Slideshow, Thumbnails, Zoom]}
          slideshow={{ delay: autoPlayInterval }}
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          index={lightboxIndex}
          slides={slides}
          on={{
            view: ({ index }) => setLightboxIndex(index),
          }}
          controller={{ closeOnBackdropClick: true }}
          carousel={{ finite: images.length <= 1 }}
        />
      </section>
    );
  }

  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="p-2 rounded-lg bg-slate-100"
          style={{ backgroundColor: 'color-mix(in srgb, var(--theme-accent) 12%, rgb(241 245 249))', color: 'var(--theme-accent)' }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-6 h-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800">{title}</h2>
      </div>
      <div
        className="rounded-2xl overflow-hidden shadow-lg border-4 border-white relative aspect-[4/3] bg-slate-200 touch-pan-y"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <button
          type="button"
          onClick={openLightbox}
          className="absolute inset-0 z-[5] flex h-full w-full cursor-zoom-in border-0 bg-transparent p-0 text-left"
          aria-label={`View ${title} in fullscreen gallery`}
        >
          <img
            src={images[current]}
            alt={`${title} ${current + 1}`}
            className={`h-full w-full object-cover transition-smooth select-none ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}
            loading={current === 0 ? 'eager' : 'lazy'}
            draggable={false}
          />
        </button>
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrev();
              }}
              disabled={isTransitioning}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center transition-smooth [color:var(--theme-accent)] hover:[color:var(--theme-primary)]"
              aria-label="Previous image"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 19l-7-7 7-7"
                />
              </svg>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNext();
              }}
              disabled={isTransitioning}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-white/90 hover:bg-white shadow-md flex items-center justify-center transition-smooth [color:var(--theme-accent)] hover:[color:var(--theme-primary)]"
              aria-label="Next image"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-2">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrent(i);
                  }}
                  className={`w-2 h-2 rounded-full transition-smooth ${
                    i === current ? '' : 'opacity-50 hover:opacity-75'
                  }`}
                  style={{ backgroundColor: i === current ? 'var(--theme-accent)' : 'white' }}
                  aria-label={`Go to image ${i + 1}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Lightbox
        plugins={[Counter, Slideshow, Thumbnails, Zoom]}
        slideshow={{ delay: autoPlayInterval }}
        open={lightboxOpen}
        close={closeLightbox}
        index={lightboxIndex}
        slides={slides}
        on={{
          view: ({ index }) => setLightboxIndex(index),
        }}
        controller={{ closeOnBackdropClick: true }}
        carousel={{ finite: images.length <= 1 }}
      />
    </section>
  );
}
