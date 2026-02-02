export interface Breed {
  name: string;
  slug: string;
  apiBreed?: string;
}

export interface BreedGroup {
  name: string;
  slug: string;
  description: string;
  breeds: Breed[];
}

function toSlug(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function mapToApi(name: string): string | undefined {
  // Only map breeds that exist in the Dog CEO API (https://dog.ceo/api)
  // and where the mapping returns photos of the CORRECT breed.
  // Breeds without a mapping here will show a placeholder instead of wrong photos.
  const mappings: Record<string, string> = {
    // --- Direct / verified matches ---
    "affenpinscher": "affenpinscher",
    "afghan hound": "hound/afghan",
    "airedale terrier": "airedale",
    "akita": "akita",
    "alaskan malamute": "malamute",
    "american english coonhound": "coonhound",
    "american eskimo dog": "eskimo",
    "american staffordshire terrier": "terrier/american",
    "australian cattle dog": "cattledog/australian",
    "australian shepherd": "australian/shepherd",
    "australian terrier": "terrier/australian",
    "basenji": "basenji",
    "basset hound": "hound/basset",
    "beagle": "beagle",
    "beauceron": "beauceron",
    "bedlington terrier": "terrier/bedlington",
    "belgian malinois": "malinois",
    "belgian sheepdog": "groenendael",
    "belgian tervuren": "tervuren",
    "bernese mountain dog": "mountain/bernese",
    "bichon frise": "frise/bichon",
    "black and tan coonhound": "coonhound",
    "bloodhound": "hound/blood",
    "bluetick coonhound": "bluetick",
    "border collie": "collie/border",
    "border terrier": "terrier/border",
    "borzoi": "borzoi",
    "boston terrier": "bulldog/boston",
    "bouvier des flandres": "bouvier",
    "boxer": "boxer",
    "briard": "briard",
    "brittany": "spaniel/brittany",
    "brussels griffon": "brabancon",
    "bulldog": "bulldog/english",
    "bullmastiff": "mastiff/bull",
    "cairn terrier": "terrier/cairn",
    "cardigan welsh corgi": "corgi/cardigan",
    "cavalier king charles spaniel": "spaniel/blenheim",
    "chesapeake bay retriever": "retriever/chesapeake",
    "chihuahua": "chihuahua",
    "chinese shar-pei": "sharpei",
    "chow chow": "chow",
    "clumber spaniel": "clumber",
    "cocker spaniel": "spaniel/cocker",
    "collie": "collie",
    "coton de tulear": "cotondetulear",
    "curly-coated retriever": "retriever/curly",
    "dachshund": "dachshund",
    "dalmatian": "dalmatian",
    "dandie dinmont terrier": "terrier/dandie",
    "doberman pinscher": "doberman",
    "english cocker spaniel": "spaniel/cocker",
    "english foxhound": "hound/english",
    "english setter": "setter/english",
    "english springer spaniel": "springer/english",
    "entlebucher mountain dog": "entlebucher",
    "finnish lapphund": "finnish/lapphund",
    "finnish spitz": "spitz/finnish",
    "flat-coated retriever": "retriever/flatcoated",
    "french bulldog": "bulldog/french",
    "german pinscher": "pinscher",
    "german shepherd dog": "german/shepherd",
    "german shorthaired pointer": "pointer/german",
    "giant schnauzer": "schnauzer/giant",
    "golden retriever": "retriever/golden",
    "gordon setter": "setter/gordon",
    "great dane": "dane/great",
    "great pyrenees": "pyrenees",
    "greater swiss mountain dog": "mountain/swiss",
    "greyhound": "greyhound",
    "havanese": "havanese",
    "ibizan hound": "hound/ibizan",
    "irish setter": "setter/irish",
    "irish terrier": "terrier/irish",
    "irish water spaniel": "spaniel/irish",
    "irish wolfhound": "wolfhound/irish",
    "italian greyhound": "greyhound/italian",
    "japanese chin": "spaniel/japanese",
    "keeshond": "keeshond",
    "kerry blue terrier": "terrier/kerryblue",
    "komondor": "komondor",
    "kuvasz": "kuvasz",
    "labrador retriever": "labrador",
    "lakeland terrier": "terrier/lakeland",
    "leonberger": "leonberg",
    "lhasa apso": "lhasa",
    "maltese": "maltese",
    "mastiff": "mastiff/english",
    "miniature pinscher": "pinscher/miniature",
    "miniature schnauzer": "schnauzer/miniature",
    "newfoundland": "newfoundland",
    "norfolk terrier": "terrier/norfolk",
    "norwegian buhund": "buhund/norwegian",
    "norwegian elkhound": "elkhound/norwegian",
    "norwich terrier": "terrier/norwich",
    "old english sheepdog": "sheepdog/english",
    "otterhound": "otterhound",
    "papillon": "papillon",
    "parson russell terrier": "terrier/russell",
    "pekingese": "pekinese",
    "pembroke welsh corgi": "pembroke",
    "plott hound": "hound/plott",
    "pomeranian": "pomeranian",
    "poodle": "poodle/standard",
    "poodle (toy)": "poodle/toy",
    "pug": "pug",
    "redbone coonhound": "redbone",
    "rhodesian ridgeback": "ridgeback/rhodesian",
    "rottweiler": "rottweiler",
    "russell terrier": "terrier/russell",
    "saluki": "saluki",
    "samoyed": "samoyed",
    "schipperke": "schipperke",
    "scottish deerhound": "deerhound/scottish",
    "scottish terrier": "terrier/scottish",
    "sealyham terrier": "terrier/sealyham",
    "shetland sheepdog": "sheepdog/shetland",
    "shiba inu": "shiba",
    "shih tzu": "shihtzu",
    "siberian husky": "husky",
    "silky terrier": "terrier/silky",
    "smooth fox terrier": "terrier/fox",
    "soft coated wheaten terrier": "terrier/wheaten",
    "spanish water dog": "waterdog/spanish",
    "st. bernard": "stbernard",
    "staffordshire bull terrier": "bullterrier/staffordshire",
    "standard schnauzer": "schnauzer",
    "sussex spaniel": "spaniel/sussex",
    "tibetan mastiff": "mastiff/tibetan",
    "tibetan terrier": "terrier/tibetan",
    "toy fox terrier": "terrier/toy",
    "treeing walker coonhound": "hound/walker",
    "vizsla": "vizsla",
    "weimaraner": "weimaraner",
    "welsh springer spaniel": "spaniel/welsh",
    "welsh terrier": "terrier/welsh",
    "west highland white terrier": "terrier/westhighland",
    "whippet": "whippet",
    "wire fox terrier": "terrier/fox",
    "xoloitzcuintli": "mexicanhairless",
    "yorkshire terrier": "terrier/yorkshire",
    // --- Close visual matches (same breed family) ---
    "biewer terrier": "terrier/yorkshire",
    "irish red and white setter": "setter/irish",
    "wirehaired vizsla": "vizsla",
  };
  return mappings[name.toLowerCase()];
}

function createBreed(name: string): Breed {
  return {
    name,
    slug: toSlug(name),
    apiBreed: mapToApi(name)
  };
}

export const breedGroups: BreedGroup[] = [
  {
    name: "Herding Group",
    slug: "herding",
    description: "These intelligent dogs control the movement of other animals. They make excellent companions and respond beautifully to training.",
    breeds: [
      "Australian Cattle Dog", "Australian Shepherd", "Bearded Collie", "Beauceron",
      "Belgian Laekenois", "Belgian Malinois", "Belgian Sheepdog", "Belgian Tervuren", "Bergamasco Sheepdog",
      "Berger Picard", "Border Collie", "Bouvier des Flandres", "Briard",
      "Canaan Dog", "Cardigan Welsh Corgi", "Collie", "Entlebucher Mountain Dog",
      "Finnish Lapphund", "German Shepherd Dog", "Icelandic Sheepdog",
      "Lancashire Heeler", "Miniature American Shepherd", "Mudi", "Norwegian Buhund", "Old English Sheepdog",
      "Pembroke Welsh Corgi", "Polish Lowland Sheepdog", "Puli", "Pumi",
      "Pyrenean Shepherd", "Shetland Sheepdog", "Spanish Water Dog", "Swedish Vallhund"
    ].map(createBreed)
  },
  {
    name: "Hound Group",
    slug: "hound",
    description: "Most hounds share the common ancestral trait of being used for hunting, using either acute scenting powers or phenomenal stamina.",
    breeds: [
      "Afghan Hound", "American English Coonhound", "American Foxhound", "American Leopard Hound", "Azawakh", "Basenji",
      "Basset Hound", "Beagle", "Black and Tan Coonhound", "Bloodhound",
      "Bluetick Coonhound", "Borzoi", "Cirneco Dell'Etna", "Dachshund",
      "English Foxhound", "Grand Basset Griffon Vendeen", "Greyhound", "Harrier", "Ibizan Hound", "Irish Wolfhound",
      "Norwegian Elkhound", "Otterhound", "Petit Basset Griffon Vendeen",
      "Pharaoh Hound", "Plott Hound", "Portuguese Podengo Pequeno", "Redbone Coonhound",
      "Rhodesian Ridgeback", "Saluki", "Scottish Deerhound", "Sloughi",
      "Treeing Walker Coonhound", "Whippet"
    ].map(createBreed)
  },
  {
    name: "Toy Group",
    slug: "toy",
    description: "These diminutive dogs embody sheer delight. They make ideal apartment dogs and terrific companions.",
    breeds: [
      "Affenpinscher", "Biewer Terrier", "Brussels Griffon", "Cavalier King Charles Spaniel",
      "Chihuahua", "Chinese Crested", "English Toy Spaniel", "Havanese",
      "Italian Greyhound", "Japanese Chin", "Maltese", "Manchester Terrier",
      "Miniature Pinscher", "Papillon", "Pekingese", "Pomeranian", "Poodle (Toy)",
      "Pug", "Russian Toy", "Shih Tzu", "Silky Terrier", "Toy Fox Terrier", "Yorkshire Terrier"
    ].map(createBreed)
  },
  {
    name: "Non-Sporting Group",
    slug: "non-sporting",
    description: "A diverse group with varied personalities and appearances, from the Chow Chow to the Dalmatian to the French Bulldog.",
    breeds: [
      "American Eskimo Dog", "Bichon Frise", "Boston Terrier", "Bulldog",
      "Chinese Shar-Pei", "Chow Chow", "Coton De Tulear", "Dalmatian",
      "Finnish Spitz", "French Bulldog", "Keeshond", "Lhasa Apso", "Lowchen",
      "Norwegian Lundehund", "Poodle", "Schipperke", "Shiba Inu", "Tibetan Spaniel",
      "Tibetan Terrier", "Xoloitzcuintli"
    ].map(createBreed)
  },
  {
    name: "Sporting Group",
    slug: "sporting",
    description: "Naturally active and alert, Sporting dogs make likeable, well-rounded companions. They excel in water and woods.",
    breeds: [
      "American Water Spaniel", "Barbet", "Boykin Spaniel", "Bracco Italiano", "Brittany", "Chesapeake Bay Retriever",
      "Clumber Spaniel", "Cocker Spaniel", "Curly-Coated Retriever",
      "English Cocker Spaniel", "English Setter", "English Springer Spaniel",
      "Field Spaniel", "Flat-Coated Retriever", "German Shorthaired Pointer",
      "German Wirehaired Pointer", "Golden Retriever", "Gordon Setter",
      "Irish Red and White Setter", "Irish Setter", "Irish Water Spaniel",
      "Labrador Retriever", "Lagotto Romagnolo", "Nederlandse Kooikerhondje", "Nova Scotia Duck Tolling Retriever",
      "Pointer", "Spinone Italiano", "Sussex Spaniel", "Vizsla", "Weimaraner",
      "Welsh Springer Spaniel", "Wirehaired Pointing Griffon", "Wirehaired Vizsla"
    ].map(createBreed)
  },
  {
    name: "Terrier Group",
    slug: "terrier",
    description: "Feisty and energetic, terriers have distinctive personalities. Their ancestors were bred to hunt and kill vermin.",
    breeds: [
      "Airedale Terrier", "American Hairless Terrier", "American Staffordshire Terrier",
      "Australian Terrier", "Bedlington Terrier", "Border Terrier", "Bull Terrier",
      "Cairn Terrier", "Cesky Terrier", "Dandie Dinmont Terrier", "Glen of Imaal Terrier",
      "Irish Terrier", "Kerry Blue Terrier", "Lakeland Terrier", "Manchester Terrier",
      "Miniature Bull Terrier", "Miniature Schnauzer", "Norfolk Terrier",
      "Norwich Terrier", "Parson Russell Terrier", "Rat Terrier", "Russell Terrier",
      "Scottish Terrier", "Sealyham Terrier", "Skye Terrier", "Smooth Fox Terrier",
      "Soft Coated Wheaten Terrier", "Staffordshire Bull Terrier", "Welsh Terrier", "West Highland White Terrier",
      "Wire Fox Terrier"
    ].map(createBreed)
  },
  {
    name: "Working Group",
    slug: "working",
    description: "Bred to perform jobs like guarding property, pulling sleds, and water rescues. Intelligent, capable, and make solid companions.",
    breeds: [
      "Akita", "Alaskan Malamute", "Anatolian Shepherd Dog", "Bernese Mountain Dog",
      "Black Russian Terrier", "Boerboel", "Boxer", "Bullmastiff", "Cane Corso",
      "Chinook", "Danish-Swedish Farmdog", "Doberman Pinscher", "Dogo Argentino", "Dogue de Bordeaux", "German Pinscher",
      "Giant Schnauzer", "Great Dane", "Great Pyrenees", "Greater Swiss Mountain Dog",
      "Komondor", "Kuvasz", "Leonberger", "Mastiff", "Neapolitan Mastiff",
      "Newfoundland", "Portuguese Water Dog", "Rottweiler", "Samoyed",
      "Siberian Husky", "Standard Schnauzer", "Tibetan Mastiff", "St. Bernard"
    ].map(createBreed)
  }
];

export function getAllBreeds(): Breed[] {
  return breedGroups.flatMap(g => g.breeds);
}

export function findBreed(slug: string): { breed: Breed; group: BreedGroup } | undefined {
  for (const group of breedGroups) {
    const breed = group.breeds.find(b => b.slug === slug);
    if (breed) return { breed, group };
  }
  return undefined;
}

export function findGroup(slug: string): BreedGroup | undefined {
  return breedGroups.find(g => g.slug === slug);
}
