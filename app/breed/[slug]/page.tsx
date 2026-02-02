"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { findBreed } from "@/lib/breeds";

export default function BreedPage() {
  const { slug } = useParams();
  const result = findBreed(slug as string);
  const [images, setImages] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const apiBreed = result?.breed.apiBreed;

  useEffect(() => {
    if (!apiBreed) {
      setLoading(false);
      return;
    }

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
  }, [apiBreed]);

  if (!result) {
    return <div className="container"><p>Breed not found</p></div>;
  }

  const { breed, group } = result;

  const prev = () => setCurrentIndex(i => (i === 0 ? images.length - 1 : i - 1));
  const next = () => setCurrentIndex(i => (i === images.length - 1 ? 0 : i + 1));

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
          <div className="gallery">
            <img src={images[currentIndex]} alt={breed.name} className="gallery-main" />
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
