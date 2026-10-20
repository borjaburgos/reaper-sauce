import test from "node:test";
import assert from "node:assert/strict";
import { ingredients, recipeMethods, steps } from "../src/data/recipe.ts";
import {
  clampStep,
  emptyProgress,
  formatIngredient,
  heatAdjustment,
  PROGRESS_KEY,
  progressKey,
  readProgress,
  saveProgress,
  scaleAmount,
} from "../src/lib/recipe.ts";

const ingredient = (id: string) => {
  const result = ingredients.find((item) => item.id === id);
  assert.ok(result);
  return result;
};

function memoryStorage(initial?: string) {
  const values = new Map<string, string>(
    initial === undefined ? [] : [[PROGRESS_KEY, initial]],
  );
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => {
      values.set(key, value);
    },
  };
}

test("all supported batch scales preserve exact metric amounts", () => {
  for (const item of ingredients) {
    for (const multiplier of [0.5, 1, 1.5]) {
      assert.equal(
        scaleAmount(item.amount, multiplier),
        item.amount * multiplier,
      );
    }
  }
  assert.equal(scaleAmount(70, 0.5), 35);
  assert.equal(scaleAmount(15, 1.5), 22.5);
  assert.equal(scaleAmount(0.1, 3), 0.3);
  for (const invalid of [-1, NaN, Infinity])
    assert.throws(() => scaleAmount(150, invalid), RangeError);
});

test("metric labels retain exact grams and transparent fractional peppers", () => {
  assert.equal(
    formatIngredient(ingredient("bell-peppers"), 1, "metric"),
    "600 g red bell peppers, deseeded",
  );
  assert.equal(
    formatIngredient(ingredient("reapers"), 0.5, "metric"),
    "1½ Carolina Reaper peppers",
  );
  assert.equal(
    formatIngredient(ingredient("reapers"), 1.5, "us"),
    "4½ Carolina Reaper peppers",
  );
  assert.equal(
    formatIngredient(ingredient("ginger"), 0.5),
    "7.5 g fresh ginger",
  );
});

test("US kitchen conversions are approximate and retain authoritative weights", () => {
  assert.equal(
    formatIngredient(ingredient("bell-peppers"), 1, "us"),
    "≈ 4 cups (600 g) red bell peppers, deseeded",
  );
  assert.equal(
    formatIngredient(ingredient("carrots"), 1, "us"),
    "≈ 1¼ cups (160 g) carrots, peeled",
  );
  assert.equal(
    formatIngredient(ingredient("salt"), 1, "us"),
    "≈ 2½ tsp (15 g) fine sea salt",
  );
  assert.equal(
    formatIngredient(ingredient("water"), 1, "us"),
    "≈ 1 cup (250 g) water",
  );
  assert.equal(
    formatIngredient(ingredient("oil"), 1.5, "us"),
    "≈ 2¼ tbsp (30 g) extra-virgin olive oil",
  );
  assert.equal(
    formatIngredient({ id: "x", name: "test", amount: 10, unit: "g" }, 1, "us"),
    "10 g test",
  );
});

test("dilution calculates additions without promising a heat rating", () => {
  assert.deepEqual(heatAdjustment(), {
    bellPepper: 150,
    mango: 75,
    vinegar: 30,
    water: 30,
  });
  assert.deepEqual(heatAdjustment(2), {
    bellPepper: 300,
    mango: 150,
    vinegar: 60,
    water: 60,
  });
  assert.deepEqual(heatAdjustment(0.5), {
    bellPepper: 75,
    mango: 37.5,
    vinegar: 15,
    water: 15,
  });
  assert.throws(() => heatAdjustment(-1), RangeError);
});

test("step navigation stays in range including malformed saved indices", () => {
  assert.equal(clampStep(-1, steps.length), 0);
  assert.equal(clampStep(1, steps.length), 1);
  assert.equal(clampStep(100, steps.length), steps.length - 1);
  assert.equal(clampStep(3.8, steps.length), 3);
  assert.equal(clampStep(NaN, steps.length), 0);
  assert.equal(clampStep(1, 0), 0);
});

test("progress survives a reload, resets, and uses independent defaults", () => {
  const storage = memoryStorage();
  const progress = {
    ingredients: ["reapers", "mango"],
    steps: ["prepare", "chop"],
    currentStep: 2,
  };
  assert.equal(saveProgress(storage, progress), true);
  assert.deepEqual(readProgress(storage), progress);
  assert.equal(saveProgress(storage, emptyProgress()), true);
  assert.deepEqual(readProgress(storage), emptyProgress());
  const first = emptyProgress();
  first.ingredients.push("reapers");
  assert.deepEqual(emptyProgress().ingredients, []);
});

test("progress rejects unknown ids, duplicates, wrong types, and invalid JSON safely", () => {
  const storage = memoryStorage(
    JSON.stringify({
      ingredients: ["reapers", "reapers", "unknown", 7],
      steps: ["prepare", "bogus"],
      currentStep: 99,
    }),
  );
  assert.deepEqual(readProgress(storage), {
    ingredients: ["reapers"],
    steps: ["prepare"],
    currentStep: steps.length - 1,
  });
  for (const value of ["broken JSON", "null", "[]", "3", '"text"']) {
    assert.deepEqual(readProgress(memoryStorage(value)), emptyProgress());
  }
  assert.deepEqual(
    readProgress(
      memoryStorage('{"ingredients":{},"steps":"prepare","currentStep":"7"}'),
    ),
    emptyProgress(),
  );
});

test("blocked, full, or unavailable storage leaves the recipe usable", () => {
  const blocked = {
    getItem: () => {
      throw new Error("blocked");
    },
    setItem: () => {
      throw new Error("full");
    },
  };
  assert.deepEqual(readProgress(blocked), emptyProgress());
  assert.equal(saveProgress(blocked, emptyProgress()), false);
  assert.deepEqual(readProgress(null), emptyProgress());
  assert.equal(saveProgress(undefined, emptyProgress()), false);
});

test("every step refers only to existing ingredients and the complete recipe has nine steps", () => {
  const ingredientIds = new Set(ingredients.map((item) => item.id));
  assert.equal(ingredients.length, 13);
  assert.equal(steps.length, 9);
  assert.equal(new Set(steps.map((step) => step.id)).size, steps.length);
  for (const step of steps)
    for (const id of step.ingredients)
      assert.ok(ingredientIds.has(id), `${step.id}: ${id}`);
});

test("both cooking methods cover the same ingredients with appliance-appropriate instructions", () => {
  assert.equal(recipeMethods.thermomix.steps, steps);
  assert.equal(recipeMethods.stovetop.steps.length, 9);
  for (const method of Object.values(recipeMethods)) {
    assert.equal(
      new Set(method.steps.map((step) => step.id)).size,
      method.steps.length,
    );
    for (const step of method.steps) {
      for (const id of step.ingredients)
        assert.ok(ingredients.some((item) => item.id === id));
    }
    for (const item of ingredients)
      assert.ok(
        method.steps.some((step) => step.ingredients.includes(item.id)),
        item.id,
      );
  }
  const stoveText = JSON.stringify(recipeMethods.stovetop.steps);
  assert.doesNotMatch(stoveText, /Thermomix|TM7|Speed \d|120°C/);
  assert.match(stoveText, /very tender/);
  assert.match(stoveText, /room temperature/);
  assert.match(
    stoveText,
    /Never blend warm or hot sauce in a sealed personal blender cup/,
  );
  assert.match(
    stoveText,
    /150 g bell pepper, 75 g mango, 30 g vinegar, and 30 g water/,
  );
});

test("method-specific progress preserves existing TM7 progress and keeps stovetop completion separate", () => {
  const storage = memoryStorage();
  const original = {
    ingredients: ["reapers"],
    steps: ["prepare"],
    currentStep: 2,
  };
  const stove = {
    ingredients: ["mango"],
    steps: ["prepare", "chop"],
    currentStep: 5,
  };
  saveProgress(storage, original);
  assert.equal(progressKey("thermomix"), PROGRESS_KEY);
  assert.notEqual(progressKey("stovetop"), PROGRESS_KEY);
  assert.deepEqual(readProgress(storage, "stovetop"), emptyProgress());
  assert.equal(saveProgress(storage, stove, "stovetop"), true);
  assert.deepEqual(readProgress(storage), original);
  assert.deepEqual(readProgress(storage, "stovetop"), stove);
  saveProgress(storage, emptyProgress(), "stovetop");
  assert.deepEqual(readProgress(storage), original);
  assert.deepEqual(readProgress(storage, "stovetop"), emptyProgress());
  storage.setItem(
    progressKey("stovetop"),
    JSON.stringify({ steps: ["unknown", "chop"], currentStep: 99 }),
  );
  assert.deepEqual(readProgress(storage, "stovetop"), {
    ingredients: [],
    steps: ["chop"],
    currentStep: 8,
  });
});
