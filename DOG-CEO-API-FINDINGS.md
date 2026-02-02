# Dog CEO API — Breed Mapping Audit Findings

## Overview

The Dog CEO API (`https://dog.ceo/api`) is the primary image source for this app. An audit was performed against the actual API image repository ([jigsawpieces/dog-api-images](https://github.com/jigsawpieces/dog-api-images)) to verify all mappings.

## API Breed List (from image repository folders)

The Dog CEO API serves images from the following breed folders:

```
affenpinscher, african-wild, airedale, akita, appenzeller, australian-kelpie,
australian-shepherd, bakharwal-indian, basenji, beagle, bluetick, borzoi,
bouvier, boxer, brabancon, briard, buhund-norwegian, bulldog-boston,
bulldog-english, bulldog-french, bullterrier-staffordshire,
cattledog-australian, cavapoo, chihuahua, chippiparai-indian, chow, clumber,
cockapoo, collie-border, collie, coonhound, corgi-cardigan, corgi,
cotondetulear, dachshund, dalmatian, dane-great, danish-swedish-farmdog,
deerhound-scottish, dhole, dingo, doberman, elkhound-norwegian, entlebucher,
eskimo, finnish-lapphund, frise-bichon, gaddi-indian, german-shepherd,
greyhound-indian, greyhound-italian, greyhound, groenendael, havanese,
hound-afghan, hound-basset, hound-blood, hound-english, hound-ibizan,
hound-plott, hound-walker, husky, keeshond, kelpie, kombai, komondor, kuvasz,
labradoodle, labrador, leonberg, lhasa, malamute, malinois, maltese,
mastiff-bull, mastiff-english, mastiff-indian, mastiff-tibetan, mexicanhairless,
mix, mountain-bernese, mountain-swiss, mudhol-indian, newfoundland, otterhound,
ovcharka-caucasian, papillon, pariah-indian, pekinese, pembroke,
pinscher-miniature, pinscher, pitbull, pointer-german, pointer-germanlonghair,
pomeranian, poodle-medium, poodle-miniature, poodle-standard, poodle-toy, pug,
puggle, pyrenees, rajapalayam-indian, redbone, retriever-chesapeake,
retriever-curly, retriever-flatcoated, retriever-golden, ridgeback-rhodesian,
rottweiler, rough-collie, saluki, samoyed, schipperke, schnauzer-giant,
schnauzer-miniature, schnauzer, segugio-italian, setter-english, setter-gordon,
setter-irish, sharpei, sheepdog-english, sheepdog-indian, sheepdog-shetland,
shiba, shihtzu, spaniel-blenheim, spaniel-brittany, spaniel-cocker,
spaniel-irish, spaniel-japanese, spaniel-sussex, spaniel-welsh, spitz-indian,
spitz-japanese, springer-english, stbernard, terrier-american,
terrier-andalusian, terrier-australian, terrier-bedlington, terrier-border,
terrier-boston, terrier-cairn, terrier-dandie, terrier-fox, terrier-irish,
terrier-kerryblue, terrier-lakeland, terrier-norfolk, terrier-norwich,
terrier-patterdale, terrier-russell, terrier-scottish, terrier-sealyham,
terrier-silky, terrier-tibetan, terrier-toy, terrier-welsh,
terrier-westhighland, terrier-wheaten, terrier-yorkshire, tervuren, vizsla,
waterdog-spanish, weimaraner, whippet, wolfhound-irish
```

Folder names use hyphens to join `breed-subbreed` (e.g., `bulldog-boston` → API path `bulldog/boston`).

## Incorrect Mappings Found & Removed

~40 breeds were mapped to a **different breed** as a "closest match" fallback. This caused incorrect photos to display. All were removed. Examples:

| AKC Breed | Was Mapped To | Showed Photos Of |
|---|---|---|
| Puli | `komondor` | Komondor |
| Chinese Crested | `mexicanhairless` | Xoloitzcuintli |
| Belgian Sheepdog | `sheepdog/english` | Old English Sheepdog |
| Cane Corso | `mastiff/bull` | Bullmastiff |
| Anatolian Shepherd Dog | `german/shepherd` | German Shepherd |
| Black Russian Terrier | `terrier/scottish` | Scottish Terrier |
| Manchester Terrier | `doberman` | Doberman Pinscher |
| Skye Terrier | `terrier/silky` | Silky Terrier |
| Berger Picard | `briard` | Briard |
| Pyrenean Shepherd | `pyrenees` | Great Pyrenees |
| Nova Scotia Duck Tolling Retriever | `retriever/golden` | Golden Retriever |

## Mappings Fixed (correct breed existed under different path)

| AKC Breed | Was | Fixed To |
|---|---|---|
| Belgian Sheepdog | `sheepdog/english` | `groenendael` |
| German Pinscher | `doberman` | `pinscher` |
| Standard Schnauzer | `schnauzer/giant` | `schnauzer` |
| Collie (Rough Collie) | `collie/border` | `collie` |

## Approximate Mappings Kept

These map to a very closely related breed/variant and are acceptable:

| AKC Breed | Mapped To | Rationale |
|---|---|---|
| Biewer Terrier | `terrier/yorkshire` | Biewer is a Yorkshire Terrier color variant |
| Irish Red and White Setter | `setter/irish` | Same setter family, very similar appearance |
| Wirehaired Vizsla | `vizsla` | Closely related breed, similar appearance |

## Breeds Not Available in Dog CEO API

~50 AKC breeds have no match in the Dog CEO API. These use the **Wikipedia REST API** as a fallback image source (`https://en.wikipedia.org/api/rest_v1/page/summary/{title}`).

## Current Coverage

- **Dog CEO API**: 144 breeds (with image galleries)
- **Wikipedia fallback**: ~50 breeds (single image per breed)
- **Total AKC breeds**: ~194
