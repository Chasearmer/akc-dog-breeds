"use client";

import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import { getAllBreeds, type Breed } from "@/lib/breeds";

export default function QuizPage() {
  const allBreeds = getAllBreeds().filter(b => b.apiBreed);
  const [currentBreed, setCurrentBreed] = useState<Breed | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [guess, setGuess] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [result, setResult] = useState<"correct" | "incorrect" | null>(null);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadNewBreed = useCallback(async () => {
    setLoading(true);
    setGuess("");
    setResult(null);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    
    const randomBreed = allBreeds[Math.floor(Math.random() * allBreeds.length)];
    setCurrentBreed(randomBreed);
    
    try {
      const res = await fetch(`https://dog.ceo/api/breed/${randomBreed.apiBreed}/images/random`);
      const data = await res.json();
      if (data.status === "success") {
        setImageUrl(data.message);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
    inputRef.current?.focus();
  }, [allBreeds]);

  useEffect(() => {
    loadNewBreed();
  }, []);

  const suggestions = guess.length > 0
    ? allBreeds
        .filter(b => b.name.toLowerCase().includes(guess.toLowerCase()))
        .slice(0, 8)
    : [];

  const checkAnswer = (selectedName: string) => {
    if (!currentBreed || result) return;
    
    const isCorrect = selectedName.toLowerCase() === currentBreed.name.toLowerCase();
    setResult(isCorrect ? "correct" : "incorrect");
    setGuess(selectedName);
    setShowSuggestions(false);
    setTotal(t => t + 1);
    if (isCorrect) setScore(s => s + 1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (result) {
        loadNewBreed();
      } else if (highlightedIndex >= 0 && suggestions[highlightedIndex]) {
        checkAnswer(suggestions[highlightedIndex].name);
      } else if (suggestions.length === 1) {
        checkAnswer(suggestions[0].name);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };

  return (
    <>
      <header>
        <Link href="/"><h1>🐕 AKC Dog Breeds</h1></Link>
        <nav>
          <Link href="/">Browse</Link>
          <Link href="/quiz" className="active">Quiz Mode</Link>
        </nav>
      </header>
      
      <div className="quiz-container">
        <h2 style={{ marginBottom: "1rem" }}>Name That Breed!</h2>
        
        <div className="quiz-stats">
          <span>Score: <span className="score">{score}/{total}</span></span>
          {total > 0 && <span>({Math.round((score / total) * 100)}% accuracy)</span>}
        </div>
        
        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {imageUrl && <img src={imageUrl} alt="Mystery dog" className="quiz-image" />}
            
            <div className="quiz-input-wrapper">
              <input
                ref={inputRef}
                type="text"
                className="quiz-input"
                placeholder="Type the breed name..."
                value={guess}
                onChange={e => {
                  setGuess(e.target.value);
                  setShowSuggestions(true);
                  setHighlightedIndex(-1);
                }}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onKeyDown={handleKeyDown}
                disabled={!!result}
              />
              
              {showSuggestions && suggestions.length > 0 && !result && (
                <div className="suggestions">
                  {suggestions.map((breed, i) => (
                    <div
                      key={breed.slug}
                      className={`suggestion ${i === highlightedIndex ? "highlighted" : ""}`}
                      onClick={() => checkAnswer(breed.name)}
                      onMouseEnter={() => setHighlightedIndex(i)}
                    >
                      {breed.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {result && (
              <>
                <div className={`result ${result}`}>
                  {result === "correct" ? (
                    <>✓ Correct!</>
                  ) : (
                    <>✗ It was {currentBreed?.name}</>
                  )}
                </div>
                <button className="next-btn" onClick={loadNewBreed}>
                  Next Dog →
                </button>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}
