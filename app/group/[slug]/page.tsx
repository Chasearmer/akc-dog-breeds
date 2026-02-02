"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { findGroup } from "@/lib/breeds";

export default function GroupPage() {
  const { slug } = useParams();
  const group = findGroup(slug as string);
  const [images, setImages] = useState<Record<string, string>>({});

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
      }
    });
  }, [group]);

  if (!group) {
    return <div className="container"><p>Group not found</p></div>;
  }

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
        <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>{group.description}</p>
        
        <div className="breeds-grid">
          {group.breeds.map(breed => (
            <Link key={breed.slug} href={`/breed/${breed.slug}`} className="breed-card">
              {images[breed.slug] ? (
                <img src={images[breed.slug]} alt={breed.name} className="breed-image" />
              ) : (
                <div className="breed-image" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>
                  🐕
                </div>
              )}
              <div>{breed.name}</div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}
