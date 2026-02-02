# Plan: Dog Breed Emoji/Icon Image Generation

## Goal

Generate small, consistent emoji-style images for each of the ~191 AKC dog breeds in the app. These will be used as visual identifiers in:

- A new "All Breeds" browser/filter page
- List views and selection interfaces
- Future data visualizations (size plots, trait comparisons)
- Detail page headers

## Recommended Service: Replicate `fofr/sdxl-emoji`

After researching all major image generation APIs, **Replicate's sdxl-emoji model** is the clear best fit:

| Criteria | Details |
|---|---|
| **Model** | `fofr/sdxl-emoji` on Replicate |
| **What it does** | SDXL fine-tuned specifically for Apple-style emoji generation |
| **Cost** | ~$0.0077/image → ~$3 for 400 images (200 breeds × 2 views) |
| **Quality** | Purpose-built for emoji — clean, glossy, consistent at small sizes |
| **Consistency** | Uses `TOK` trigger word + LoRA fine-tuning = uniform style across all breeds |
| **Speed** | ~8 seconds per image on Nvidia L40S |
| **API** | Simple REST API, Node/Python SDKs, instant API key signup |

### Why not alternatives?

- **OpenAI DALL-E 3 / GPT Image 1**: More expensive ($0.04-0.12/image), not emoji-optimized, min 1024×1024 output
- **Google Imagen (Vertex AI)**: $0.04/image, complex GCP setup, tends toward realism
- **Stability AI**: $0.03/image, no emoji fine-tuning
- **Recraft V3 SVG**: Good if we wanted vectors ($0.08/SVG), but overkill for emoji-sized icons
- **FLUX Schnell**: Cheaper ($0.003) but no emoji fine-tuning, inconsistent style

## Implementation Plan

### Phase 1: Generation Script

Create a Node.js script (`scripts/generate-breed-emojis.ts`) that:

1. Reads all breeds from `lib/breeds.ts`
2. Calls the Replicate API for each breed with prompts like:
   - Face view: `"A TOK emoji of a [breed name] dog face, front view"`
   - Side view: `"A TOK emoji of a [breed name] dog, side profile"` (optional second pass)
3. Downloads the generated images
4. Saves them to `public/breed-icons/[slug]-face.png` and optionally `[slug]-side.png`
5. Includes retry logic and progress tracking
6. Generates a manifest JSON mapping slugs to available icons

**API key setup**: Sign up at https://replicate.com, create an API token, set as `REPLICATE_API_TOKEN` environment variable.

### Phase 2: Data Model Updates

Extend `lib/breeds.ts`:

```typescript
export interface Breed {
  name: string;
  slug: string;
  apiBreed?: string;
  // New fields (future phases)
  sizeCategory?: 'toy' | 'small' | 'medium' | 'large' | 'giant';
  shedding?: 1 | 2 | 3 | 4 | 5;
  trainability?: 1 | 2 | 3 | 4 | 5;
  energyLevel?: 1 | 2 | 3 | 4 | 5;
  // etc.
}
```

Add a helper to resolve icon paths:

```typescript
export function getBreedIconPath(slug: string, view: 'face' | 'side' = 'face'): string {
  return `/breed-icons/${slug}-${view}.png`;
}
```

### Phase 3: All-Breeds Browser Page

Create `/app/breeds/page.tsx` with:

- Grid of all 191 breeds showing emoji icon + name
- Search/filter text input (filters by breed name)
- Dropdown filters (by group, and later by traits like size, shedding, etc.)
- Sorting options (alphabetical, by group)
- Click to navigate to breed detail page
- Responsive grid layout matching existing dark theme

### Phase 4: Integration

- Add breed emoji icons to existing group grid views
- Add icon to breed detail page header
- Use icons in quiz mode as supplementary visuals
- Add icons to any future visualization/plotting pages

## File Structure

```
scripts/
  generate-breed-emojis.ts    # One-time generation script
public/
  breed-icons/
    affenpinscher-face.png
    affenpinscher-side.png     # Optional
    airedale-terrier-face.png
    ...
app/
  breeds/
    page.tsx                   # New all-breeds browser page
lib/
  breeds.ts                    # Extended with icon helpers
```

## Cost Summary

- **Replicate API**: ~$1.50 for face emojis only, ~$3 for face + side views
- **One-time cost**: Images are generated once and committed to the repo as static assets
- **No ongoing API costs** for serving the icons

## Next Steps

1. You create a Replicate account and API token at https://replicate.com
2. Set the token as `REPLICATE_API_TOKEN` in your environment
3. I build the generation script and run it
4. Review generated images, re-generate any that don't look right
5. Build the all-breeds browser page using the generated icons
