"use client";

import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import { getAllBreeds, breedGroups, type Breed, type BreedGroup } from "@/lib/breeds";

function getBreedGroup(breed: Breed): BreedGroup | undefined {
  return breedGroups.find(g => g.breeds.some(b => b.slug === breed.slug));
}

export default function QuizPage() {
  // Settings
  const [selectedGroup, setSelectedGroup] = useState("");
  const [photoCount, setPhotoCount] = useState(1);

  // Filtered breed pool based on selected group
  const quizBreeds = selectedGroup
    ? breedGroups.find(g => g.slug === selectedGroup)?.breeds.filter(b => b.apiBreed) ?? []
    : getAllBreeds().filter(b => b.apiBreed);

  // All breeds for the breed dropdown (always the full quiz pool)
  const allGroupNames = breedGroups.map(g => g.name);

  const [currentBreed, setCurrentBreed] = useState<Breed | null>(null);
  const [currentGroup, setCurrentGroup] = useState<BreedGroup | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageIndex, setImageIndex] = useState(0);

  // Breed guess state
  const [breedGuess, setBreedGuess] = useState("");
  const [showBreedSuggestions, setShowBreedSuggestions] = useState(false);
  const [breedHighlightedIndex, setBreedHighlightedIndex] = useState(-1);

  // Group guess state (dropdown)
  const [groupGuess, setGroupGuess] = useState("");

  // Result state
  const [submitted, setSubmitted] = useState(false);
  const [breedCorrect, setBreedCorrect] = useState<boolean | null>(null);
  const [groupCorrect, setGroupCorrect] = useState<boolean | null>(null);
  const [revealed, setRevealed] = useState(false);

  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const breedInputRef = useRef<HTMLInputElement>(null);

  const loadNewBreed = useCallback(async () => {
    if (quizBreeds.length === 0) return;
    setLoading(true);
    setBreedGuess("");
    setGroupGuess("");
    setSubmitted(false);
    setBreedCorrect(null);
    setGroupCorrect(null);
    setRevealed(false);
    setShowBreedSuggestions(false);
    setBreedHighlightedIndex(-1);
    setImageIndex(0);

    const randomBreed = quizBreeds[Math.floor(Math.random() * quizBreeds.length)];
    setCurrentBreed(randomBreed);
    setCurrentGroup(getBreedGroup(randomBreed) ?? null);

    try {
      const res = await fetch(`https://dog.ceo/api/breed/${randomBreed.apiBreed}/images/random/${photoCount}`);
      const data = await res.json();
      if (data.status === "success") {
        const urls = Array.isArray(data.message) ? data.message : [data.message];
        setImageUrls(urls);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
    breedInputRef.current?.focus();
  }, [quizBreeds, photoCount]);

  useEffect(() => {
    loadNewBreed();
  }, [loadNewBreed]);

  // Breed suggestions: show all when focused with empty input, filter when typing
  const breedSuggestions = breedGuess.length > 0
    ? quizBreeds
        .filter(b => b.name.toLowerCase().includes(breedGuess.toLowerCase()))
        .slice(0, 8)
    : quizBreeds.slice().sort((a, b) => a.name.localeCompare(b.name)).slice(0, 8);

  const submitGuess = () => {
    if (!currentBreed || !currentGroup || submitted || revealed) return;

    const isBreedCorrect = breedGuess.trim().toLowerCase() === currentBreed.name.toLowerCase();
    // If no group guessed, default to correct when breed is provided
    const isGroupCorrect = groupGuess === ""
      ? (breedGuess.trim() !== "" ? true : false)
      : groupGuess === currentGroup.name;

    setBreedCorrect(isBreedCorrect);
    setGroupCorrect(isGroupCorrect);
    setSubmitted(true);
    setShowBreedSuggestions(false);
    setTotal(t => t + 1);
    if (isBreedCorrect && isGroupCorrect) setScore(s => s + 1);
  };

  const revealAnswer = () => {
    if (!currentBreed || submitted || revealed) return;
    setRevealed(true);
    setShowBreedSuggestions(false);
    setTotal(t => t + 1);
  };

  const isFinished = submitted || revealed;

  // Whether group was implicitly correct (no group guessed, breed guessed)
  const groupImplied = submitted && groupGuess === "" && breedGuess.trim() !== "";

  const handleBreedKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setBreedHighlightedIndex(i => Math.min(i + 1, breedSuggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setBreedHighlightedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isFinished) {
        loadNewBreed();
      } else if (breedHighlightedIndex >= 0 && breedSuggestions[breedHighlightedIndex]) {
        setBreedGuess(breedSuggestions[breedHighlightedIndex].name);
        setShowBreedSuggestions(false);
      } else if (breedSuggestions.length === 1) {
        setBreedGuess(breedSuggestions[0].name);
        setShowBreedSuggestions(false);
      }
    } else if (e.key === "Escape") {
      setShowBreedSuggestions(false);
    }
  };

  const prevPhoto = () => setImageIndex(i => Math.max(0, i - 1));
  const nextPhoto = () => setImageIndex(i => Math.min(imageUrls.length - 1, i + 1));

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
        {/* Settings bar */}
        <div className="quiz-settings">
          <div className="quiz-setting">
            <label className="quiz-setting-label">Group</label>
            <select
              className="quiz-select"
              value={selectedGroup}
              onChange={e => setSelectedGroup(e.target.value)}
            >
              <option value="">All Groups</option>
              {breedGroups.map(g => (
                <option key={g.slug} value={g.slug}>{g.name}</option>
              ))}
            </select>
          </div>
          <div className="quiz-setting">
            <label className="quiz-setting-label">Photos</label>
            <select
              className="quiz-select"
              value={photoCount}
              onChange={e => setPhotoCount(Number(e.target.value))}
            >
              {[1, 2, 3, 4, 5].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="quiz-setting">
            <span className="quiz-setting-label">Score</span>
            <span className="quiz-score-display">
              <span className="score">{score}/{total}</span>
              {total > 0 && <span className="quiz-accuracy"> {Math.round((score / total) * 100)}%</span>}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading...</div>
        ) : (
          <>
            {/* Photo area with swipe nav */}
            <div className="quiz-photo-area">
              {imageUrls[imageIndex] && (
                <img src={imageUrls[imageIndex]} alt="Mystery dog" className="quiz-image" />
              )}
              {imageUrls.length > 1 && (
                <div className="quiz-photo-nav">
                  <button onClick={prevPhoto} disabled={imageIndex === 0} className="photo-nav-btn">&lt;</button>
                  <span className="photo-counter">{imageIndex + 1}/{imageUrls.length}</span>
                  <button onClick={nextPhoto} disabled={imageIndex === imageUrls.length - 1} className="photo-nav-btn">&gt;</button>
                </div>
              )}
            </div>

            {/* Guess fields - same line */}
            <div className="quiz-fields">
              {/* Breed searchable dropdown */}
              <div className="quiz-input-wrapper">
                <label className="quiz-label">Breed</label>
                <input
                  ref={breedInputRef}
                  type="text"
                  className={`quiz-input ${isFinished && breedCorrect === true ? "input-correct" : ""} ${isFinished && breedCorrect === false ? "input-incorrect" : ""}`}
                  placeholder="Select breed..."
                  value={breedGuess}
                  onChange={e => {
                    setBreedGuess(e.target.value);
                    setShowBreedSuggestions(true);
                    setBreedHighlightedIndex(-1);
                  }}
                  onFocus={() => setShowBreedSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowBreedSuggestions(false), 200)}
                  onKeyDown={handleBreedKeyDown}
                  disabled={isFinished}
                />

                {showBreedSuggestions && breedSuggestions.length > 0 && !isFinished && (
                  <div className="suggestions">
                    {breedSuggestions.map((breed, i) => (
                      <div
                        key={breed.slug}
                        className={`suggestion ${i === breedHighlightedIndex ? "highlighted" : ""}`}
                        onClick={() => {
                          setBreedGuess(breed.name);
                          setShowBreedSuggestions(false);
                        }}
                        onMouseEnter={() => setBreedHighlightedIndex(i)}
                      >
                        {breed.name}
                      </div>
                    ))}
                  </div>
                )}

                {isFinished && breedCorrect !== null && (
                  <span className={`field-result ${breedCorrect ? "field-correct" : "field-incorrect"}`}>
                    {breedCorrect ? "✓" : `✗ ${currentBreed?.name}`}
                  </span>
                )}
                {revealed && (
                  <span className="field-result field-revealed">{currentBreed?.name}</span>
                )}
              </div>

              {/* Group dropdown */}
              <div className="quiz-input-wrapper">
                <label className="quiz-label">Group <span className="quiz-label-hint">(opt)</span></label>
                <select
                  className={`quiz-input quiz-group-select ${isFinished && groupCorrect === true ? "input-correct" : ""} ${isFinished && groupCorrect === false ? "input-incorrect" : ""}`}
                  value={groupGuess}
                  onChange={e => setGroupGuess(e.target.value)}
                  disabled={isFinished}
                >
                  <option value="">—</option>
                  {allGroupNames.map(name => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>

                {submitted && groupCorrect !== null && (
                  <span className={`field-result ${groupCorrect ? "field-correct" : "field-incorrect"}`}>
                    {groupCorrect
                      ? (groupImplied ? `✓ ${currentGroup?.name}` : "✓")
                      : `✗ ${currentGroup?.name}`}
                  </span>
                )}
                {revealed && (
                  <span className="field-result field-revealed">{currentGroup?.name}</span>
                )}
              </div>
            </div>

            {/* Action buttons */}
            <div className="quiz-actions">
              {!isFinished ? (
                <>
                  <button className="submit-btn" onClick={submitGuess}>Submit</button>
                  <button className="reveal-btn" onClick={revealAnswer}>Reveal</button>
                </>
              ) : (
                <>
                  <button className="next-btn" onClick={loadNewBreed}>Next Dog →</button>
                  {currentBreed && (
                    <Link href={`/breed/${currentBreed.slug}`} className="learn-more-btn">
                      Learn More
                    </Link>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
