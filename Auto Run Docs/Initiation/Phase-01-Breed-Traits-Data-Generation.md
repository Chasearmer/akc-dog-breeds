# Phase 01: Breed Traits Data Generation & Data Model

This phase creates the foundation for breed trait data by extending the data model, building a generation script that uses Claude to produce structured trait ratings for all ~194 AKC breeds, and storing the results as a static JSON file. By the end of this phase, the project will have a complete `breed-traits.json` file with 1-5 scale ratings and descriptions for every breed, ready to be displayed in the UI. This phase is fully autonomous — no API keys or user input are needed because the generation script runs via the Claude CLI (`claude` command), which is already available in the development environment.

## Tasks

- [x] Extend the breed data model in `lib/breeds.ts` to support trait data:
  - Add a `BreedTraits` interface with the following fields:
    - `slug`: string (matches the breed's slug for lookup)
    - `traits`: object containing each trait as a key, where each trait has:
      - `score`: number (1-5 scale)
      - `description`: string (1-2 sentence explanation of why this breed gets that score)
    - The trait keys should be: `energyLevel`, `friendliness`, `trainability`, `groomingNeeds`, `goodWithChildren`, `barkingLevel`, `shedding`
    - `size`: string enum — "Small" | "Medium" | "Large" | "Giant"
    - `overview`: string (2-3 sentence breed personality/temperament summary)
  - Add a `getBreedTraits(slug: string)` function that loads and returns traits from a JSON file at `data/breed-traits.json`
  - Add a `getAllBreedTraits()` function that returns the full array
  - Keep the existing `Breed`, `BreedGroup`, and related functions unchanged
  - Create the `data/` directory and an empty `data/breed-traits.json` placeholder (empty array `[]`)
  > **Completed:** Added `BreedTraitRating` and `BreedTraits` interfaces, `getBreedTraits(slug)` and `getAllBreedTraits()` functions with in-memory caching, and created `data/breed-traits.json` placeholder. Imports (`fs`, `path`) placed at top of file. All existing interfaces and functions unchanged.

- [x] Create a breed trait generation script at `scripts/generate-breed-traits.ts` that produces trait data for all breeds using the Claude CLI:
  - Import `getAllBreeds` from `@/lib/breeds` (use relative path `../lib/breeds` since this runs via tsx, not Next.js)
  - The script should process breeds in batches of 10 to keep each prompt focused
  - For each batch, use Node.js `child_process.execSync` to call: `claude -p "<prompt>" --output-format json`
  - The prompt for each batch should:
    - List the breed names in the batch
    - Ask Claude to return a JSON array with trait ratings (1-5) and descriptions for each trait, a size category, and a 2-3 sentence overview
    - Include the specific trait keys: energyLevel, friendliness, trainability, groomingNeeds, goodWithChildren, barkingLevel, shedding
    - Specify that the response must be ONLY valid JSON, no markdown fences or explanation
    - Ask Claude to be accurate to well-known breed characteristics (e.g., Border Collies should score 5 on energy, Bulldogs should score 1-2)
  - Parse the JSON response from each batch using `JSON.parse()` on the `result` field of the Claude CLI JSON output
  - Accumulate all results into a single array
  - Write the final array to `data/breed-traits.json` with pretty-printing (`JSON.stringify(data, null, 2)`)
  - Add error handling: if a batch fails, log the error and the breed names, skip that batch, and continue
  - After writing the file, print a summary: total breeds processed, any failures
  - Add a script entry in `package.json`: `"generate-traits": "tsx scripts/generate-breed-traits.ts"`
  > **Completed:** Created `scripts/generate-breed-traits.ts` with batch-of-10 processing using `npx @anthropic-ai/claude-code -p` with `--output-format json`. Parses `result` field from CLI JSON output, strips any markdown fences, accumulates all traits, writes to `data/breed-traits.json` with pretty-printing. Includes error handling with batch skip/continue and summary output. Added `"generate-traits"` script to `package.json`. Verified compilation and imports work via tsx.

- [x] Run the breed trait generation script to populate `data/breed-traits.json`:
  - Execute `npm run generate-traits` from the project root
  - Verify the output file exists and contains entries for all ~194 breeds
  - Spot-check a few entries for correctness (e.g., Golden Retriever should be high friendliness, low barking; Siberian Husky should be high energy, high shedding)
  - If any breeds are missing due to batch failures, re-run just those breeds by modifying the script temporarily or running a targeted follow-up
  > **Completed:** Script improvements made before running: added resume support (loads existing entries and skips processed breeds), more robust JSON extraction from CLI responses (handles preamble text), increased timeout to 180s, saves progress after each batch, and uses Sonnet model for reliable JSON output. All 21 batches succeeded on the first run — 204 unique breed entries generated (205 total breeds, Manchester Terrier appears in both Toy and Terrier groups with the same slug; duplicate removed). Spot-checks passed: Golden Retriever (friendliness 5/5, goodWithChildren 5/5), Siberian Husky (energy 5/5, shedding 5/5), Border Collie (energy 5/5, trainability 5/5), Bulldog (energy 1/5), Basenji (barkingLevel 1/5), Poodle (shedding 1/5), Great Dane (Giant size). All entries have valid scores (1-5), all 7 trait keys, size, and overview.

- [ ] Verify the data model integration works end-to-end:
  - Create a small test script at `scripts/verify-traits.ts` that:
    - Imports `getAllBreeds` from `../lib/breeds` and reads `data/breed-traits.json`
    - Checks that every breed slug in the breeds list has a matching entry in the traits JSON
    - Reports any breeds missing trait data
    - Reports any trait entries that have invalid scores (outside 1-5 range) or missing fields
  - Run the verification script: `npx tsx scripts/verify-traits.ts`
  - Fix any issues found (missing breeds, invalid data)
  - Delete the verification script after confirming data integrity — it was a one-time check

- [ ] Build the project to confirm nothing is broken:
  - Run `npm run build` to ensure the Next.js project compiles successfully with the new data model additions
  - Fix any TypeScript errors or import issues that arise
