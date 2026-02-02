"use client";

import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import { getAllBreeds, breedGroups, type Breed, type BreedGroup } from "@/lib/breeds";

function getBreedGroup(breed: Breed): BreedGroup | undefined {
  return breedGroups.find(g => g.breeds.some(b => b.slug === breed.slug));
}

export default function QuizPage() {
  const allBreeds = getAllBreeds().filter(b => b.apiBreed);
  const allGroupNames = breedGroups.map(g => g.name);

  const [currentBreed, setCurrentBreed] = useState<Breed | null>(null);
  const [currentGroup, setCurrentGroup] = useState<BreedGroup | null>(null);
  const [imageUrl, setImageUrl] = useState("");

  // Breed guess state
  const [breedGuess, setBreedGuess] = useState("");
  const [showBreedSuggestions, setShowBreedSuggestions] = useState(false);
  const [breedHighlightedIndex, setBreedHighlightedIndex] = useState(-1);

  // Group guess state
  const [groupGuess, setGroupGuess] = useState("");
  const [showGroupSuggestions, setShowGroupSuggestions] = useState(false);
  const [groupHighlightedIndex, setGroupHighlightedIndex] = useState(-1);

  // Result state
  const [submitted, setSubmitted] = useState(false);
  const [breedCorrect, setBreedCorrect] = useState<boolean | null>(null);
  const [groupCorrect, setGroupCorrect] = useState<boolean | null>(null);
  const [revealed, setRevealed] = useState(false);

  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const breedInputRef = useRef<HTMLInputElement>(null);
  const groupInputRef = useRef<HTMLInputElement>(null);

  const loadNewBreed = useCallback(async () => {
    setLoading(true);
    setBreedGuess("");
    setGroupGuess("");
    setSubmitted(false);
    setBreedCorrect(null);
    setGroupCorrect(null);
    setRevealed(false);
    setShowBreedSuggestions(false);
    setShowGroupSuggestions(false);
    setBreedHighlightedIndex(-1);
    setGroupHighlightedIndex(-1);

    const randomBreed = allBreeds[Math.floor(Math.random() * allBreeds.length)];
    setCurrentBreed(randomBreed);
    setCurrentGroup(getBreedGroup(randomBreed) ?? null);

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
    breedInputRef.current?.focus();
  }, [allBreeds]);

  useEffect(() => {
    loadNewBreed();
  }, []);

  const breedSuggestions = breedGuess.length > 0
    ? allBreeds
        .filter(b => b.name.toLowerCase().includes(breedGuess.toLowerCase()))
        .slice(0, 8)
    : [];

  const groupSuggestions = groupGuess.length > 0
    ? allGroupNames
        .filter(g => g.toLowerCase().includes(groupGuess.toLowerCase()))
        .slice(0, 8)
    : [];

  const submitGuess = () => {
    if (!currentBreed || !currentGroup || submitted || revealed) return;

    const isBreedCorrect = breedGuess.trim().toLowerCase() === currentBreed.name.toLowerCase();
    // If breed is guessed and no group provided, default group to correct
    const isGroupCorrect = groupGuess.trim() === ""
      ? (breedGuess.trim() !== "" ? true : false)
      : groupGuess.trim().toLowerCase() === currentGroup.name.toLowerCase();

    setBreedCorrect(isBreedCorrect);
    setGroupCorrect(isGroupCorrect);
    setSubmitted(true);
    setShowBreedSuggestions(false);
    setShowGroupSuggestions(false);
    setTotal(t => t + 1);
    if (isBreedCorrect && isGroupCorrect) setScore(s => s + 1);
  };

  const revealAnswer = () => {
    if (!currentBreed || submitted || revealed) return;
    setRevealed(true);
    setShowBreedSuggestions(false);
    setShowGroupSuggestions(false);
    setTotal(t => t + 1);
  };

  const isFinished = submitted || revealed;

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
        groupInputRef.current?.focus();
      } else if (breedSuggestions.length === 1) {
        setBreedGuess(breedSuggestions[0].name);
        setShowBreedSuggestions(false);
        groupInputRef.current?.focus();
      }
    } else if (e.key === "Escape") {
      setShowBreedSuggestions(false);
    }
  };

  const handleGroupKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setGroupHighlightedIndex(i => Math.min(i + 1, groupSuggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setGroupHighlightedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (isFinished) {
        loadNewBreed();
      } else if (groupHighlightedIndex >= 0 && groupSuggestions[groupHighlightedIndex]) {
        setGroupGuess(groupSuggestions[groupHighlightedIndex]);
        setShowGroupSuggestions(false);
      } else if (groupSuggestions.length === 1) {
        setGroupGuess(groupSuggestions[0]);
        setShowGroupSuggestions(false);
      }
    } else if (e.key === "Escape") {
      setShowGroupSuggestions(false);
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

            <div className="quiz-fields">
              {/* Breed input */}
              <div className="quiz-input-wrapper">
                <label className="quiz-label">Breed</label>
                <input
                  ref={breedInputRef}
                  type="text"
                  className={`quiz-input ${isFinished && breedCorrect === true ? "input-correct" : ""} ${isFinished && breedCorrect === false ? "input-incorrect" : ""}`}
                  placeholder="Type the breed name..."
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
                          groupInputRef.current?.focus();
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

              {/* Group input */}
              <div className="quiz-input-wrapper">
                <label className="quiz-label">Group <span className="quiz-label-hint">(optional)</span></label>
                <input
                  ref={groupInputRef}
                  type="text"
                  className={`quiz-input ${isFinished && groupCorrect === true ? "input-correct" : ""} ${isFinished && groupCorrect === false ? "input-incorrect" : ""}`}
                  placeholder="Type the group name..."
                  value={groupGuess}
                  onChange={e => {
                    setGroupGuess(e.target.value);
                    setShowGroupSuggestions(true);
                    setGroupHighlightedIndex(-1);
                  }}
                  onFocus={() => setShowGroupSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowGroupSuggestions(false), 200)}
                  onKeyDown={handleGroupKeyDown}
                  disabled={isFinished}
                />

                {showGroupSuggestions && groupSuggestions.length > 0 && !isFinished && (
                  <div className="suggestions">
                    {groupSuggestions.map((name, i) => (
                      <div
                        key={name}
                        className={`suggestion ${i === groupHighlightedIndex ? "highlighted" : ""}`}
                        onClick={() => {
                          setGroupGuess(name);
                          setShowGroupSuggestions(false);
                        }}
                        onMouseEnter={() => setGroupHighlightedIndex(i)}
                      >
                        {name}
                      </div>
                    ))}
                  </div>
                )}

                {isFinished && groupCorrect !== null && (
                  <span className={`field-result ${groupCorrect ? "field-correct" : "field-incorrect"}`}>
                    {groupCorrect ? "✓" : `✗ ${currentGroup?.name}`}
                  </span>
                )}
                {revealed && (
                  <span className="field-result field-revealed">{currentGroup?.name}</span>
                )}
              </div>
            </div>

            {!isFinished && (
              <div className="quiz-actions">
                <button className="submit-btn" onClick={submitGuess}>
                  Submit Guess
                </button>
                <button className="reveal-btn" onClick={revealAnswer}>
                  Reveal Answer
                </button>
              </div>
            )}

            {submitted && (
              <div className={`result ${breedCorrect && groupCorrect ? "correct" : "incorrect"}`}>
                {breedCorrect && groupCorrect
                  ? "✓ Correct!"
                  : breedCorrect && !groupCorrect
                  ? "Breed correct, group incorrect"
                  : !breedCorrect && groupCorrect
                  ? "Group correct, breed incorrect"
                  : "✗ Incorrect"}
              </div>
            )}

            {revealed && (
              <div className="result revealed">
                Answer: {currentBreed?.name} — {currentGroup?.name}
              </div>
            )}

            {isFinished && (
              <button className="next-btn" onClick={loadNewBreed}>
                Next Dog →
              </button>
            )}
          </>
        )}
      </div>
    </>
  );
}
