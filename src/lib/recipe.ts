import { ingredients, recipeMethods } from "../data/recipe.ts";
import type { CookingMethod, Ingredient } from "../data/recipe.ts";

export type Units = "metric" | "us";
export type Progress = {
  ingredients: string[];
  steps: string[];
  currentStep: number;
};
export type ProgressStorage = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export const PROGRESS_KEY = "reaper-sauce-progress-v1";

export function progressKey(method: CookingMethod = "thermomix"): string {
  return method === "thermomix"
    ? PROGRESS_KEY
    : "reaper-sauce-stovetop-progress-v1";
}

/** Scaling changes amounts only; it never validates cooking time or bowl capacity. */
export function scaleAmount(amount: number, scale: number): number {
  if (
    !Number.isFinite(amount) ||
    amount < 0 ||
    !Number.isFinite(scale) ||
    scale < 0
  ) {
    throw new RangeError(
      "Amounts and multipliers must be finite, non-negative numbers.",
    );
  }
  const result = amount * scale;
  if (!Number.isFinite(result))
    throw new RangeError("Scaled amount is too large.");
  return Number(result.toFixed(6));
}

const fractions = ["", "⅛", "¼", "⅜", "½", "⅝", "¾", "⅞"];

function kitchenFraction(value: number, subdivisions = 8): string {
  const rounded = Math.round(value * subdivisions) / subdivisions;
  if (rounded === 0 && value > 0)
    return value.toFixed(2).replace(/0+$/, "").replace(/\.$/, "");
  const whole = Math.floor(rounded);
  const fraction = fractions[Math.round((rounded - whole) * 8)];
  return `${whole || (fraction ? "" : "0")}${fraction}`;
}

/** A complete accessible label, including the original gram weight in US mode. */
export function formatIngredient(
  ingredient: Ingredient,
  scale = 1,
  units: Units = "metric",
): string {
  const amount = scaleAmount(ingredient.amount, scale);
  if (ingredient.unit === "")
    return `${kitchenFraction(amount)} ${ingredient.name}`;
  const metric = `${amount} ${ingredient.unit}`;
  if (
    units === "us" &&
    ingredient.unit === "g" &&
    ingredient.usUnit &&
    ingredient.gramsPerUsUnit &&
    Number.isFinite(ingredient.gramsPerUsUnit) &&
    ingredient.gramsPerUsUnit > 0
  ) {
    const converted = amount / ingredient.gramsPerUsUnit;
    const quantity = kitchenFraction(
      converted,
      ingredient.usUnit === "cup" ? 8 : 4,
    );
    const unit =
      ingredient.usUnit === "cup"
        ? quantity === "1"
          ? "cup"
          : "cups"
        : ingredient.usUnit;
    return `≈ ${quantity} ${unit} (${metric}) ${ingredient.name}`;
  }
  return `${metric} ${ingredient.name}`;
}

/** One incremental dilution addition, in grams, multiplied as requested. */
export function heatAdjustment(multiplier = 1): {
  bellPepper: number;
  mango: number;
  vinegar: number;
  water: number;
} {
  return {
    bellPepper: scaleAmount(150, multiplier),
    mango: scaleAmount(75, multiplier),
    vinegar: scaleAmount(30, multiplier),
    water: scaleAmount(30, multiplier),
  };
}

export function clampStep(index: number, total: number): number {
  if (!Number.isFinite(index) || !Number.isFinite(total) || total <= 0)
    return 0;
  return Math.max(0, Math.min(Math.floor(index), Math.floor(total) - 1));
}

export function emptyProgress(): Progress {
  return { ingredients: [], steps: [], currentStep: 0 };
}

function knownIds(value: unknown, allowed: Set<string>): string[] {
  if (!Array.isArray(value)) return [];
  return [
    ...new Set(
      value.filter(
        (item): item is string => typeof item === "string" && allowed.has(item),
      ),
    ),
  ];
}

function validProgress(
  value: unknown,
  method: CookingMethod = "thermomix",
): Progress {
  const steps = recipeMethods[method].steps;
  if (!value || typeof value !== "object" || Array.isArray(value))
    return emptyProgress();
  const data = value as Record<string, unknown>;
  return {
    ingredients: knownIds(
      data.ingredients,
      new Set(ingredients.map((item) => item.id)),
    ),
    steps: knownIds(data.steps, new Set(steps.map((step) => step.id))),
    currentStep: clampStep(
      typeof data.currentStep === "number" ? data.currentStep : 0,
      steps.length,
    ),
  };
}

/** Unavailable, blocked, or corrupt browser storage must never prevent cooking. */
export function readProgress(
  storage?: ProgressStorage | null,
  method: CookingMethod = "thermomix",
): Progress {
  try {
    const saved = storage?.getItem(progressKey(method));
    return saved ? validProgress(JSON.parse(saved), method) : emptyProgress();
  } catch {
    return emptyProgress();
  }
}

/** Returns false when storage is unavailable, blocked, or full. */
export function saveProgress(
  storage: ProgressStorage | null | undefined,
  progress: Progress,
  method: CookingMethod = "thermomix",
): boolean {
  if (!storage) return false;
  try {
    storage.setItem(
      progressKey(method),
      JSON.stringify(validProgress(progress, method)),
    );
    return true;
  } catch {
    return false;
  }
}
