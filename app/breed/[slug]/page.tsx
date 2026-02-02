"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { findBreed } from "@/lib/breeds";

function useSwipe(onSwipeLeft: () => void, onSwipeRight: () => void) {
  const touchStart = useRef<{ x: number } | null>(null);
  const touchEnd = useRef<{ x: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = { x: e.targetTouches[0].clientX };
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

export default function BreedPage() {
  const { slug } = useParams();
  const result = findBreed(slug as string);
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const apiBreed = result?.breed.apiBreed;
  const wikiTitle = result?.breed.wikiTitle;

  useEffect(() => {
    if (apiBreed) {
      fetch(`https://dog.ceo/api/breed/${apiBreed}/images`)
        .then(r => r.json())
        .then(d => {
          if (d.status === "success") {
            const shuffled = d.message.sort(() => Math.random() - 0.5).slice(0, 20);
            setImages(shuffled);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else if (wikiTitle) {
      fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${wikiTitle}`)
        .then(r => r.json())
        .then(d => {
          const url = d.originalimage?.source || d.thumbnail?.source;
          if (url) {
            setImages([url]);
          }
          setLoading(false);
        })
        .catch(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [apiBreed, wikiTitle]);

  if (!result) {
    return <div className="container"><p>Breed not found</p></div>;
  }

  const { breed, group } = result;

  const prev = useCallback(() => setCurrentIndex(i => (i === 0 ? images.length - 1 : i - 1)), [images.length]);
  const next = useCallback(() => setCurrentIndex(i => (i === images.length - 1 ? 0 : i + 1)), [images.length]);

  const swipeHandlers = useSwipe(next, prev);

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
        <Link href={`/group/${group.slug}`} className="back-link">← {group.name}</Link>
        <h2 style={{ textAlign: "center", marginBottom: "2rem" }}>{breed.name}</h2>

        {loading ? (
          <div className="loading">Loading photos...</div>
        ) : images.length > 0 ? (
          <div className="gallery" {...swipeHandlers}>
            <img src={images[currentIndex]} alt={breed.name} className="gallery-main" draggable={false} />
            <div className="gallery-nav">
              <button onClick={prev}>← Previous</button>
              <button onClick={next}>Next →</button>
            </div>
            <span className="gallery-counter">{currentIndex + 1} of {images.length}</span>
          </div>
        ) : (
          <div style={{ textAlign: "center", color: "var(--muted)", padding: "4rem" }}>
            <div style={{ fontSize: "4rem", marginBottom: "1rem" }}>🐕</div>
            <p>No photos available for this breed yet.</p>
          </div>
        )}
      </div>
    </>
  );
}
