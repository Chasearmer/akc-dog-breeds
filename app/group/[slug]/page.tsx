"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { findGroup } from "@/lib/breeds";

function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchEnd = useRef<{ x: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = { x: e.targetTouches[0].clientX, y: e.targetTouches[0].clientY };
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    touchEnd.current = { x: e.targetTouches[0].clientX };
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return;
    const dx = touchStart.current.x - touchEnd.current.x;
    const minSwipe = 50;
    if (Math.abs(dx) > minSwipe) {
      if (dx > 0) onSwipeLeft();
      else onSwipeRight();
    }
  }, [onSwipeLeft, onSwipeRight]);

  return { onTouchStart, onTouchMove, onTouchEnd };
}

export default function GroupPage() {
  const { slug } = useParams();
  const group = findGroup(slug as string);
  const [images, setImages] = useState<Record<string, string>>({});
  const [viewerIndex, setViewerIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!group) return;
    group.breeds.forEach(breed => {
      if (breed.apiBreed) {
        fetch(`https://dog.ceo/api/breed/${breed.apiBreed}/images/random`)
          .then(r => r.json())
          .then(d => {
            if (d.status === "success") {
              setImages(prev => ({ ...prev, [breed.slug]: d.message }));
            }
          })
          .catch(() => {});
      } else if (breed.wikiTitle) {
        fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${breed.wikiTitle}`)
          .then(r => r.json())
          .then(d => {
            const url = d.thumbnail?.source || d.originalimage?.source;
            if (url) {
              setImages(prev => ({ ...prev, [breed.slug]: url }));
            }
          })
          .catch(() => {});
      }
    });
  }, [slug]);

  const goNext = useCallback(() => {
    if (!group) return;
    setViewerIndex(i => i === null ? null : (i + 1) % group.breeds.length);
  }, [group]);

  const goPrev = useCallback(() => {
    if (!group) return;
    setViewerIndex(i => i === null ? null : (i === 0 ? group.breeds.length - 1 : i - 1));
  }, [group]);

  const swipeHandlers = useSwipe(goNext, goPrev);

  useEffect(() => {
    if (viewerIndex === null) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
      else if (e.key === "Escape") setViewerIndex(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [viewerIndex, goNext, goPrev]);

  useEffect(() => {
    if (viewerIndex !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [viewerIndex]);

  if (!group) {
    return <div className="container"><p>Group not found</p></div>;
  }

  const currentBreed = viewerIndex !== null ? group.breeds[viewerIndex] : null;

  return (
    <>
      <header>
        <Link href="/"><h1>🐕 AKC Dog Breeds</h1></Link>
        <nav>
          <Link href="/">Browse</Link>
          <Link href="/quiz">Quiz Mode</Link>
        </nav>
      </header>

      <div className="container">
        <Link href="/" className="back-link">← All Groups</Link>
        <h2 style={{ marginBottom: "0.5rem" }}>{group.name}</h2>
        <p style={{ color: "var(--muted)", marginBottom: "1rem" }}>{group.description}</p>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginBottom: "2rem" }}>
          Tap a breed to swipe through photos, or visit their page for details.
        </p>

        <div className="breeds-grid">
          {group.breeds.map((breed, idx) => (
            <div key={breed.slug} className="breed-card" style={{ cursor: "pointer" }} onClick={() => setViewerIndex(idx)}>
              {images[breed.slug] ? (
                <img src={images[breed.slug]} alt={breed.name} className="breed-image" />
              ) : (
                <div className="breed-image" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
                  🐕
                </div>
              )}
              <div>{breed.name}</div>
            </div>
          ))}
        </div>
      </div>

      {currentBreed && (
        <div className="swipe-overlay" onClick={() => setViewerIndex(null)}>
          <div className="swipe-viewer" onClick={e => e.stopPropagation()} {...swipeHandlers}>
            <button className="swipe-close" onClick={() => setViewerIndex(null)} aria-label="Close">✕</button>

            <button className="swipe-arrow swipe-arrow-left" onClick={goPrev} aria-label="Previous breed">‹</button>

            <div className="swipe-content">
              {images[currentBreed.slug] ? (
                <img src={images[currentBreed.slug]} alt={currentBreed.name} className="swipe-image" draggable={false} />
              ) : (
                <div className="swipe-image swipe-placeholder">🐕</div>
              )}
              <h3 className="swipe-breed-name">{currentBreed.name}</h3>
              <div className="swipe-counter">{viewerIndex! + 1} of {group.breeds.length}</div>
              <Link href={`/breed/${currentBreed.slug}`} className="swipe-detail-link">View details →</Link>
            </div>

            <button className="swipe-arrow swipe-arrow-right" onClick={goNext} aria-label="Next breed">›</button>
          </div>
        </div>
      )}
    </>
  );
}
