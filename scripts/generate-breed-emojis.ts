/**
 * Generate emoji-style icons for all AKC dog breeds using Replicate's sdxl-emoji model.
 *
 * Usage:
 *   REPLICATE_API_TOKEN=<your-token> npx tsx scripts/generate-breed-emojis.ts
 *
 * Options (via env vars):
 *   REPLICATE_API_TOKEN  - Required. Your Replicate API token.
 *   VIEWS                - Comma-separated views to generate. Default: "face"
 *                          Options: face, side
 *   BREEDS               - Comma-separated breed slugs to generate (for partial runs).
 *                          Default: all breeds.
 *   SKIP_EXISTING        - Set to "false" to regenerate existing images. Default: "true"
 *   CONCURRENCY          - Number of parallel requests. Default: "4"
 */

import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Breed list (inlined to avoid import issues with path aliases)
// ---------------------------------------------------------------------------

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

interface Breed {
  name: string;
  slug: string;
}

const ALL_BREED_NAMES: string[] = [
  // Herding
  "Australian Cattle Dog", "Australian Shepherd", "Bearded Collie", "Beauceron",
  "Belgian Malinois", "Belgian Sheepdog", "Belgian Tervuren", "Bergamasco",
  "Berger Picard", "Border Collie", "Bouvier des Flandres", "Briard",
  "Canaan Dog", "Cardigan Welsh Corgi", "Collie", "Entlebucher Moutain Dog",
  "Finnish Lapphund", "German Shepherd Dog", "Icelandic Sheepdog",
  "Miniature American Shepherd", "Norwegian Buhund", "Old English Sheepdog",
  "Pembroke Welsh Corgi", "Polish Lowland Sheepdog", "Puli", "Pumi",
  "Pyrenean Sheepdog", "Shetland Sheepdog", "Spanish Water Dog", "Swedish Vallhund",
  // Hound
  "Afghan Hound", "American English Coonhound", "American Foxhound", "Basenji",
  "Basset Hound", "Beagle", "Black and Tan Coonhound", "Bloodhound",
  "Bluetick Coonhound", "Borzoi", "Cirneco Dell'Etna", "Dachshund",
  "English Foxhound", "Greyhound", "Harrier", "Ibizan Hound", "Irish Wolfhound",
  "Norwegian Elkhound", "Otterhound", "Petit Basset Griffon Vendeen",
  "Pharaoh Hound", "Plott", "Portuguese Podengo Pequeno", "Redbone Coonhound",
  "Rhodesian Ridgeback", "Saluki", "Scottish Deerhound", "Sloughi",
  "Treeing Walker Coonhound", "Whippet",
  // Toy
  "Affenpinscher", "Brussels Griffon", "Cavalier King Charles Spaniel",
  "Chihuahua", "Chinese Crested", "English Toy Spaniel", "Havanese",
  "Italian Greyhound", "Japanese Chin", "Maltese", "Manchester Terrier",
  "Miniature Pinscher", "Papillon", "Pekingese", "Pomeranian", "Poodle (Toy)",
  "Pug", "Shih Tzu", "Silky Terrier", "Toy Fox Terrier", "Yorkshire Terrier",
  // Non-Sporting
  "American Eskimo Dog", "Bichon Frise", "Boston Terrier", "Bulldog",
  "Chinese Shar-Pei", "Chow Chow", "Coton De Tulear", "Dalmatian",
  "Finish Spitz", "French Bulldog", "Keeshond", "Lhasa Apso", "Lowchen",
  "Norwegian Lundhund", "Poodle", "Schipperke", "Shiba Inu", "Tibetan Spaniel",
  "Tibetan Terrier", "Xoloitzcuintli",
  // Sporting
  "American Water Spaniel", "Boykin Spaniel", "Brittany", "Chesapeake Bay Retriever",
  "Clumber Spaniel", "Cocker Spaniel", "Curly-Coated Retriever",
  "English Cocker Spaniel", "English Setter", "English Springer Spaniel",
  "Field Spaniel", "Flat-Coated Retriever", "German Shorthaired Pointer",
  "German Wirehaired Pointer", "Golden Retriever", "Gordon Setter",
  "Irish Red and White Setter", "Irish Setter", "Irish Water Spaniel",
  "Labrador Retriever", "Lagotto Romagnolo", "Nova Scotia Duck Tolling Retriever",
  "Pointer", "Spinone Italiano", "Sussex Spaniel", "Vizsla", "Weimaraner",
  "Welsh Springer Spaniel", "Wirehaired Pointing Griffon", "Wirehaired Vizsla",
  // Terrier
  "Airedale Terrier", "American Hairless Terrier", "American Staffordshire Terrier",
  "Australian Terrier", "Bedlington Terrier", "Border Terrier", "Bull Terrier",
  "Cairn Terrier", "Cesky Terrier", "Dandie Dinmont Terrier", "Glen of Imaal Terrier",
  "Irish Terrier", "Kerry Blue Terrier", "Lakeland Terrier", "Manchester Terrier",
  "Miniature Bull Terrier", "Miniature Schnauzer", "Norfolk Terrier",
  "Norwich Terrier", "Parson Russell Terrier", "Rat Terrier", "Russell Terrier",
  "Scottish Terrier", "Sealyham Terrier", "Skye Terrier", "Smooth Fox Terrier",
  "Staffordshire Bull Terrier", "Welsh Terrier", "West Highland White Terrier",
  "Wire Fox Terrier",
  // Working
  "Akita", "Alaskan Malamute", "Anatolian Shepherd Dog", "Bernese Mountain Dog",
  "Black Russian Terrier", "Boerboel", "Boxer", "Bullmastiff", "Cane Corso",
  "Chinook", "Doberman Pinscher", "Dogue de Bordeaux", "German Pinscher",
  "Giant Schnauzer", "Great Dane", "Great Pyrenees", "Greater Swiss Mountain Dog",
  "Komondor", "Kuvasz", "Leonberger", "Mastiff", "Neapolitan Mastiff",
  "Newfoundland", "Portuguese Water Dog", "Rottweiler", "Samoyed",
  "Siberian Husky", "Standard Schnauzer", "Tibetan Mastiff", "St. Bernard",
];

const ALL_BREEDS: Breed[] = ALL_BREED_NAMES.map((name) => ({
  name,
  slug: toSlug(name),
}));

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
if (!REPLICATE_API_TOKEN) {
  console.error("Error: REPLICATE_API_TOKEN environment variable is required.");
  console.error("Sign up at https://replicate.com and create an API token.");
  process.exit(1);
}

type View = "face" | "side";

const VIEWS: View[] = (process.env.VIEWS || "face")
  .split(",")
  .map((v) => v.trim() as View);

const BREED_FILTER = process.env.BREEDS
  ? process.env.BREEDS.split(",").map((s) => s.trim())
  : null;

const SKIP_EXISTING = process.env.SKIP_EXISTING !== "false";
const CONCURRENCY = parseInt(process.env.CONCURRENCY || "4", 10);

const OUT_DIR = path.resolve(__dirname, "..", "public", "breed-icons");
const MODEL_VERSION =
  "fofr/sdxl-emoji:dee76b5afde21b0f01ed7925f0665b7e879c50ee718c5f78a9d38e04d523cc5e";

// ---------------------------------------------------------------------------
// Replicate API helpers
// ---------------------------------------------------------------------------

const REPLICATE_BASE = "https://api.replicate.com/v1";

interface ReplicatePrediction {
  id: string;
  status: "starting" | "processing" | "succeeded" | "failed" | "canceled";
  output?: string[];
  error?: string;
}

async function replicatePost(
  endpoint: string,
  body: Record<string, unknown>
): Promise<ReplicatePrediction> {
  const res = await fetch(`${REPLICATE_BASE}${endpoint}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
      Prefer: "wait",
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Replicate API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<ReplicatePrediction>;
}

async function replicateGet(url: string): Promise<ReplicatePrediction> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Replicate API error ${res.status}: ${text}`);
  }
  return res.json() as Promise<ReplicatePrediction>;
}

async function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function pollPrediction(id: string): Promise<ReplicatePrediction> {
  const url = `${REPLICATE_BASE}/predictions/${id}`;
  while (true) {
    const pred = await replicateGet(url);
    if (pred.status === "succeeded" || pred.status === "failed" || pred.status === "canceled") {
      return pred;
    }
    await sleep(2000);
  }
}

// ---------------------------------------------------------------------------
// Image generation
// ---------------------------------------------------------------------------

function buildPrompt(breedName: string, view: View): string {
  const viewDesc = view === "face"
    ? "face, front view, looking at camera"
    : "full body, side profile view";
  return `A TOK emoji of a ${breedName} dog, ${viewDesc}`;
}

async function downloadImage(url: string, dest: string): Promise<void> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download image: ${res.status}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buffer);
}

interface GenerationTask {
  breed: Breed;
  view: View;
  outPath: string;
}

async function generateOne(task: GenerationTask): Promise<boolean> {
  const { breed, view, outPath } = task;
  const label = `${breed.name} (${view})`;

  if (SKIP_EXISTING && fs.existsSync(outPath)) {
    console.log(`  SKIP  ${label} — already exists`);
    return true;
  }

  const prompt = buildPrompt(breed.name, view);
  console.log(`  GEN   ${label}`);

  try {
    // Use the Prefer: wait header for synchronous predictions (up to 60s).
    // If the prediction doesn't finish in time, we fall back to polling.
    const [owner, modelAndVersion] = MODEL_VERSION.split("/");
    const [model, version] = modelAndVersion.split(":");

    let prediction = await replicatePost("/predictions", {
      version,
      input: {
        prompt,
        negative_prompt: "text, watermark, blurry, low quality, deformed",
        width: 512,
        height: 512,
        num_outputs: 1,
        num_inference_steps: 30,
        guidance_scale: 7.5,
        lora_scale: 0.8,
      },
    });

    // If not yet finished (Prefer: wait timed out), poll
    if (prediction.status !== "succeeded" && prediction.status !== "failed") {
      prediction = await pollPrediction(prediction.id);
    }

    if (prediction.status === "failed") {
      console.error(`  FAIL  ${label}: ${prediction.error}`);
      return false;
    }

    if (!prediction.output || prediction.output.length === 0) {
      console.error(`  FAIL  ${label}: no output returned`);
      return false;
    }

    await downloadImage(prediction.output[0], outPath);
    console.log(`  OK    ${label} → ${path.basename(outPath)}`);
    return true;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`  FAIL  ${label}: ${msg}`);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  // Ensure output directory exists
  fs.mkdirSync(OUT_DIR, { recursive: true });

  // Build task list
  const breeds = BREED_FILTER
    ? ALL_BREEDS.filter((b) => BREED_FILTER!.includes(b.slug))
    : ALL_BREEDS;

  const tasks: GenerationTask[] = [];
  for (const breed of breeds) {
    for (const view of VIEWS) {
      tasks.push({
        breed,
        view,
        outPath: path.join(OUT_DIR, `${breed.slug}-${view}.png`),
      });
    }
  }

  console.log(`\nGenerating ${tasks.length} images for ${breeds.length} breeds`);
  console.log(`Views: ${VIEWS.join(", ")}`);
  console.log(`Concurrency: ${CONCURRENCY}`);
  console.log(`Output: ${OUT_DIR}`);
  console.log(`Skip existing: ${SKIP_EXISTING}\n`);

  let succeeded = 0;
  let failed = 0;
  let skipped = 0;

  // Process in batches of CONCURRENCY
  for (let i = 0; i < tasks.length; i += CONCURRENCY) {
    const batch = tasks.slice(i, i + CONCURRENCY);
    const results = await Promise.all(batch.map(async (task) => {
      if (SKIP_EXISTING && fs.existsSync(task.outPath)) {
        console.log(`  SKIP  ${task.breed.name} (${task.view}) — already exists`);
        skipped++;
        return true;
      }
      return generateOne(task);
    }));

    for (const ok of results) {
      if (ok) succeeded++;
      else failed++;
    }

    // Brief pause between batches to be polite to the API
    if (i + CONCURRENCY < tasks.length) {
      await sleep(500);
    }
  }

  // Adjust for skip double-count (generateOne also counts skips as success)
  console.log(`\nDone! ${succeeded} succeeded, ${failed} failed, ${skipped} skipped`);

  if (failed > 0) {
    console.log("\nTo retry failed breeds, run the script again with SKIP_EXISTING=true (default).");
    process.exit(1);
  }
}

main();
