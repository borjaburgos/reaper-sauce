export type Ingredient = {
  id: string;
  name: string;
  amount: number;
  unit: string;
  /** Approximate US kitchen measure; grams remain the source of truth. */
  usUnit?: string;
  gramsPerUsUnit?: number;
};

export type RecipeStep = {
  id: string;
  title: string;
  ingredients: string[];
  paragraphs: string[];
  settings: string[];
  note?: string;
};

export const recipeFacts = {
  title: "Carolina Reaper + Mango Hot Sauce",
  equipment: "Thermomix TM7",
  prepTime: "15–20 minutes",
  cookTime: "45–50 minutes",
  totalTime: "About 1 hour + cooling",
  yield: "Approximately 1.2–1.4 liters",
  flavor: "Fruity, tangy, savory, and intensely spicy.",
  heat: "Very hot",
  prepMinutes: [15, 20],
  cookMinutes: [45, 50],
  yieldLiters: [1.2, 1.4],
  yieldNote: "Yield depends on evaporation, produce size, and straining.",
} as const;

export const ingredients: Ingredient[] = [
  { id: "reapers", name: "Carolina Reaper peppers", amount: 3, unit: "" },
  {
    id: "bell-peppers",
    name: "red bell peppers, deseeded",
    amount: 600,
    unit: "g",
    usUnit: "cup",
    gramsPerUsUnit: 150,
  },
  {
    id: "carrots",
    name: "carrots, peeled",
    amount: 160,
    unit: "g",
    usUnit: "cup",
    gramsPerUsUnit: 128,
  },
  {
    id: "onion",
    name: "yellow onion",
    amount: 180,
    unit: "g",
    usUnit: "cup",
    gramsPerUsUnit: 160,
  },
  { id: "garlic", name: "garlic cloves", amount: 5, unit: "" },
  {
    id: "ginger",
    name: "fresh ginger",
    amount: 15,
    unit: "g",
    usUnit: "tbsp",
    gramsPerUsUnit: 6,
  },
  {
    id: "mango",
    name: "ripe mango flesh",
    amount: 350,
    unit: "g",
    usUnit: "cup",
    gramsPerUsUnit: 165,
  },
  {
    id: "vinegar",
    name: "apple cider vinegar",
    amount: 350,
    unit: "g",
    usUnit: "cup",
    gramsPerUsUnit: 240,
  },
  {
    id: "water",
    name: "water",
    amount: 250,
    unit: "g",
    usUnit: "cup",
    gramsPerUsUnit: 240,
  },
  {
    id: "lime",
    name: "fresh lime juice",
    amount: 70,
    unit: "g",
    usUnit: "tbsp",
    gramsPerUsUnit: 15,
  },
  {
    id: "honey",
    name: "honey",
    amount: 70,
    unit: "g",
    usUnit: "tbsp",
    gramsPerUsUnit: 21,
  },
  {
    id: "salt",
    name: "fine sea salt",
    amount: 15,
    unit: "g",
    usUnit: "tsp",
    gramsPerUsUnit: 6,
  },
  {
    id: "oil",
    name: "extra-virgin olive oil",
    amount: 20,
    unit: "g",
    usUnit: "tbsp",
    gramsPerUsUnit: 13.5,
  },
];

export const steps: RecipeStep[] = [
  {
    id: "prepare",
    title: "Prepare the Reapers",
    ingredients: ["reapers"],
    paragraphs: [
      "Wear disposable gloves. Remove stems, seeds, and as much pale internal placenta as practical. The placenta contains much of the capsaicin.",
      "Avoid touching your eyes or face. Do not dry-fry or roast the Reapers.",
    ],
    settings: [],
    note: "Keep gloves on when handling the peppers, sauce, and any utensils that touch them.",
  },
  {
    id: "chop",
    title: "Chop the aromatics",
    ingredients: ["onion", "carrots", "garlic", "ginger", "oil"],
    paragraphs: [
      "Place onion, carrots, garlic, and ginger in the Thermomix bowl. Chop for 5 seconds at Speed 5.",
      "Scrape down. Add olive oil, then cook for 8 minutes at 120°C on Speed 1.",
    ],
    settings: ["5 sec / Speed 5", "8 min / 120°C / Speed 1"],
  },
  {
    id: "bell-peppers",
    title: "Add bell peppers",
    ingredients: ["bell-peppers"],
    paragraphs: [
      "Add the deseeded red bell peppers. Chop for 5 seconds at Speed 4.",
      "Then cook for 10 minutes at 120°C on Speed 1.",
    ],
    settings: ["5 sec / Speed 4", "10 min / 120°C / Speed 1"],
  },
  {
    id: "reapers",
    title: "Add Carolina Reapers",
    ingredients: ["reapers", "vinegar", "water", "salt"],
    paragraphs: [
      "Carefully add the prepared Reapers, vinegar, water, and salt. Cook for 20 minutes at 100°C on Speed 1.",
      "Ensure adequate ventilation. Follow the TM7’s instructions for safely venting steam and preventing splashes. Do not improvise lid configurations.",
    ],
    settings: ["20 min / 100°C / Speed 1"],
  },
  {
    id: "mango",
    title: "Mango and honey",
    ingredients: ["mango", "honey"],
    paragraphs: ["Add mango and honey. Cook for 8 minutes at 95°C on Speed 2."],
    settings: ["8 min / 95°C / Speed 2"],
  },
  {
    id: "blend",
    title: "Blend",
    ingredients: [],
    paragraphs: [
      "Allow the mixture to cool sufficiently for safe blending. Following the Thermomix manufacturer’s hot-liquid blending instructions, increase speed gradually and blend until smooth.",
      "Suggested target: 30 seconds at Speed 5–8. Follow with additional blending as needed, up to 1 minute at Speed 10.",
    ],
    settings: ["30 sec / Speed 5–8", "Up to 1 min / Speed 10, only when safe"],
    note: "Only use high-speed blending when the temperature, bowl contents, and manufacturer’s guidance permit it.",
  },
  {
    id: "strain",
    title: "Optional straining",
    ingredients: [],
    paragraphs: [
      "For a smooth, pourable hot sauce, strain through a fine-mesh sieve.",
      "For a thicker, more rustic sauce, leave unstrained.",
    ],
    settings: [],
  },
  {
    id: "finish",
    title: "Finish",
    ingredients: ["lime"],
    paragraphs: [
      "Add the fresh lime juice. Mix for 20 seconds at Speed 4.",
      "Taste a tiny amount only after cooling it.",
    ],
    settings: ["20 sec / Speed 4"],
  },
  {
    id: "adjust",
    title: "Adjust heat",
    ingredients: [],
    paragraphs: [
      "If too hot, separately cook additional bell pepper and mango until tender, then blend into the sauce in increments.",
      "For each adjustment, consider approximately 150 g bell pepper, 75 g mango, 30 g vinegar, and 30 g water.",
      "Reheat and blend as needed, without exceeding the TM7 bowl capacity. Taste again after cooling.",
    ],
    settings: [],
    note: "Dilution reduces the concentration of heat but cannot guarantee a medium-spicy sauce.",
  },
];

export const dilutionIngredients = [
  "1–2 additional red bell peppers",
  "Up to 150 g additional mango",
  "Extra vinegar and water as needed",
];

export const safetyNotes = [
  "The three-Reaper recipe is already extremely spicy. Scaling ingredients does not guarantee a particular heat level.",
  "Larger batches may exceed the TM7’s maximum safe working capacity. A scaled recipe may require multiple batches.",
  "Thermomix cooking times are the original recipe’s guidance; scaled cooking times have not been validated.",
  "US kitchen measures are approximate. Original metric weights are authoritative, especially for Thermomix cooking.",
  "Fractional peppers and cloves describe the scaled amount. Pepper size and heat vary; a fraction does not guarantee predictable heat.",
];

export const storageNotes = [
  "Use thoroughly cleaned, food-safe bottles or jars. Label each with the preparation date.",
  "Refrigerate promptly. Without validated acidity and preservation procedures, use within approximately 2–4 weeks or freeze portions for longer storage.",
  "Do not leave homemade sauce unrefrigerated for extended periods. This recipe is not validated for room-temperature shelf stability.",
  "A pH reading alone does not validate a shelf-stable bottling process.",
];

export const optionalUpgrade =
  "Char the red bell peppers on a grill or under a broiler before adding them to the Thermomix for roasted depth and complexity. Do not roast the Reapers.";
