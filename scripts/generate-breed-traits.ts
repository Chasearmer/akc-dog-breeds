/**
 * Generate breed trait data for all AKC dog breeds using the Claude CLI.
 * Processes breeds in batches of 10 and writes results to data/breed-traits.json.
 *
 * Usage:
 *   npm run generate-traits
 */

import { writeFileSync, readFileSync, existsSync } from "fs";
import { execSync } from "child_process";
import { resolve } from "path";

// Import breed list from the project's data module
import { getAllBreeds } from "../lib/breeds";

interface BreedTraitRating {
  score: number;
  description: string;
}

interface BreedTraits {
  slug: string;
  traits: {
    energyLevel: BreedTraitRating;
    friendliness: BreedTraitRating;
    trainability: BreedTraitRating;
    groomingNeeds: BreedTraitRating;
    goodWithChildren: BreedTraitRating;
    barkingLevel: BreedTraitRating;
    shedding: BreedTraitRating;
  };
  size: "Small" | "Medium" | "Large" | "Giant";
  overview: string;
}

const BATCH_SIZE = 10;
const OUTPUT_PATH = resolve(__dirname, "..", "data", "breed-traits.json");

function buildPrompt(breeds: { name: string; slug: string }[]): string {
  const breedList = breeds
    .map((b) => `- "${b.name}" (slug: "${b.slug}")`)
    .join("\n");

  return `You are a dog breed expert. Generate trait data for the following AKC dog breeds:

${breedList}

For EACH breed, return an object with:
- "slug": the breed's slug (provided above)
- "traits": an object with these keys, each having "score" (integer 1-5) and "description" (1-2 sentence explanation):
  - "energyLevel": 1=very low energy, 5=extremely active
  - "friendliness": 1=aloof/reserved, 5=extremely friendly to everyone
  - "trainability": 1=very independent/stubborn, 5=extremely eager to please and easy to train
  - "groomingNeeds": 1=minimal grooming, 5=extensive daily grooming
  - "goodWithChildren": 1=not recommended for children, 5=excellent with children of all ages
  - "barkingLevel": 1=rarely barks, 5=very vocal/frequent barker
  - "shedding": 1=minimal/hypoallergenic, 5=heavy constant shedding
- "size": one of "Small", "Medium", "Large", or "Giant"
- "overview": 2-3 sentence breed personality/temperament summary

Be accurate to well-known breed characteristics. For example:
- Border Collies should score 5 on energyLevel and trainability
- Bulldogs should score 1-2 on energyLevel
- Golden Retrievers should be high on friendliness and goodWithChildren
- Basenjis should score 1 on barkingLevel (they don't bark)
- Poodles should score 1 on shedding (hypoallergenic)

CRITICAL: Your response must be ONLY a valid JSON array. Do not include ANY text before or after the JSON. No markdown fences, no explanation, no preamble, no "Here is" or "Sure" — just the raw JSON array starting with [ and ending with ].`;
}

function parseCLIResponse(rawOutput: string): BreedTraits[] {
  const parsed = JSON.parse(rawOutput);
  const resultText: string = parsed.result;

  // Strip markdown fences if present despite instructions
  let cleaned = resultText.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
  }

  // Extract JSON array from response even if there's preamble text
  const arrayStart = cleaned.indexOf("[");
  const arrayEnd = cleaned.lastIndexOf("]");
  if (arrayStart !== -1 && arrayEnd !== -1 && arrayEnd > arrayStart) {
    cleaned = cleaned.slice(arrayStart, arrayEnd + 1);
  }

  return JSON.parse(cleaned);
}

async function main() {
  const allBreeds = getAllBreeds();
  const totalBreeds = allBreeds.length;

  // Load existing traits for resume support
  let existingTraits: BreedTraits[] = [];
  if (existsSync(OUTPUT_PATH)) {
    try {
      const raw = readFileSync(OUTPUT_PATH, "utf-8");
      existingTraits = JSON.parse(raw);
    } catch {
      existingTraits = [];
    }
  }
  const existingSlugs = new Set(existingTraits.map((t) => t.slug));

  // Filter out already-processed breeds
  const remainingBreeds = allBreeds.filter((b) => !existingSlugs.has(b.slug));

  console.log(`Total breeds: ${totalBreeds}`);
  console.log(`Already processed: ${existingSlugs.size}`);
  console.log(`Remaining: ${remainingBreeds.length}`);

  if (remainingBreeds.length === 0) {
    console.log("All breeds already processed!");
    return;
  }

  console.log(`Processing ${remainingBreeds.length} breeds in batches of ${BATCH_SIZE}\n`);

  const allTraits: BreedTraits[] = [...existingTraits];
  const failedBatches: string[][] = [];

  for (let i = 0; i < remainingBreeds.length; i += BATCH_SIZE) {
    const batch = remainingBreeds.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(remainingBreeds.length / BATCH_SIZE);
    const breedNames = batch.map((b) => b.name);

    console.log(
      `Batch ${batchNum}/${totalBatches}: ${breedNames.join(", ")}`
    );

    const prompt = buildPrompt(batch);

    try {
      const rawOutput = execSync(
        `npx -y @anthropic-ai/claude-code -p ${shellEscape(prompt)} --output-format json --model claude-sonnet-4-5-20250929`,
        {
          encoding: "utf-8",
          maxBuffer: 1024 * 1024 * 10,
          timeout: 180_000,
          stdio: ["pipe", "pipe", "pipe"],
        }
      );

      const batchTraits = parseCLIResponse(rawOutput);
      allTraits.push(...batchTraits);
      // Save progress after each batch
      writeFileSync(OUTPUT_PATH, JSON.stringify(allTraits, null, 2) + "\n");
      console.log(`  OK — ${batchTraits.length} breeds processed (${allTraits.length} total)\n`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`  FAIL — ${msg}`);
      console.error(`  Skipped breeds: ${breedNames.join(", ")}\n`);
      failedBatches.push(breedNames);
    }
  }

  // Write results
  writeFileSync(OUTPUT_PATH, JSON.stringify(allTraits, null, 2) + "\n");

  // Summary
  console.log("=".repeat(60));
  console.log(`Total breeds processed: ${allTraits.length}/${totalBreeds}`);
  console.log(`Output: ${OUTPUT_PATH}`);

  if (failedBatches.length > 0) {
    console.log(`\nFailed batches (${failedBatches.length}):`);
    for (const names of failedBatches) {
      console.log(`  - ${names.join(", ")}`);
    }
  } else {
    console.log("All batches succeeded!");
  }
}

function shellEscape(str: string): string {
  // Use $'...' quoting with escaped single quotes and backslashes
  return (
    "$'" +
    str
      .replace(/\\/g, "\\\\")
      .replace(/'/g, "\\'")
      .replace(/\n/g, "\\n") +
    "'"
  );
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
