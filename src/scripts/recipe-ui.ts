import { ingredients, recipeFacts, steps } from "../data/recipe.ts";
import {
  clampStep,
  formatIngredient,
  heatAdjustment,
  PROGRESS_KEY,
  readProgress,
  saveProgress,
} from "../lib/recipe.ts";
import type { ProgressStorage, Units } from "../lib/recipe.ts";

const element = <T extends HTMLElement>(id: string): T | null =>
  document.getElementById(id) as T | null;
const ingredientChecks = [
  ...document.querySelectorAll<HTMLInputElement>("[data-ingredient]"),
];
const stepChecks = [
  ...document.querySelectorAll<HTMLInputElement>("[data-step]"),
];
const dialog = element<HTMLDialogElement>("cooking-dialog");
let storage: ProgressStorage | null = null;
try {
  storage = window.localStorage;
} catch {
  // The page remains useful when browser privacy settings block local storage.
}
const progress = readProgress(storage);
let units: Units = "metric";
let scale = 1;
let opener: HTMLElement | null = null;
let toastTimeout: ReturnType<typeof setTimeout> | undefined;

function toast(message: string) {
  const target = element("toast");
  if (!target) return;
  clearTimeout(toastTimeout);
  target.textContent = message;
  target.hidden = false;
  toastTimeout = setTimeout(() => {
    target.hidden = true;
  }, 5000);
}

function persist() {
  const saved = saveProgress(storage, progress);
  const status = element("storage-status");
  if (status) {
    status.textContent = saved
      ? "Your progress is saved on this device."
      : "This browser cannot save progress. Your checklist will last only while this page stays open.";
    status.classList.toggle("is-unavailable", !saved);
  }
}

function allStepsDone() {
  return steps.every((step) => progress.steps.includes(step.id));
}

function renderProgress() {
  for (const checkbox of ingredientChecks) {
    checkbox.checked = progress.ingredients.includes(
      checkbox.dataset.ingredient ?? "",
    );
  }
  for (const checkbox of stepChecks) {
    checkbox.checked = progress.steps.includes(checkbox.dataset.step ?? "");
  }
  document.querySelectorAll<HTMLElement>("[data-step-card]").forEach((card) => {
    card.classList.toggle(
      "is-complete",
      progress.steps.includes(card.dataset.stepCard ?? ""),
    );
  });
  const ingredientCount = element("ingredient-count");
  if (ingredientCount)
    ingredientCount.textContent = `${progress.ingredients.length} of ${ingredients.length} ready`;
  const stepCount = element("step-count");
  if (stepCount)
    stepCount.textContent = `${progress.steps.length} of ${steps.length} completed`;
  const banner = element("complete-banner");
  if (banner) banner.hidden = !allStepsDone();
  document.body.classList.toggle("recipe-complete", allStepsDone());
}

function renderAmounts() {
  document
    .querySelectorAll<HTMLElement>("[data-ingredient-label]")
    .forEach((label) => {
      const ingredient = ingredients.find(
        (item) => item.id === label.dataset.ingredientLabel,
      );
      if (ingredient)
        label.textContent = formatIngredient(ingredient, scale, units);
    });
  document
    .querySelectorAll<HTMLButtonElement>("[data-unit]")
    .forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.unit === units),
      );
    });
  document
    .querySelectorAll<HTMLButtonElement>("[data-scale]")
    .forEach((button) => {
      button.setAttribute(
        "aria-pressed",
        String(Number(button.dataset.scale) === scale),
      );
    });
  const yieldText = element("scaled-yield");
  if (yieldText) {
    yieldText.textContent = `${(recipeFacts.yieldLiters[0] * scale).toFixed(1)}–${(recipeFacts.yieldLiters[1] * scale).toFixed(1)} L`;
  }
  const scaleNote = element("scale-note");
  if (scaleNote) scaleNote.hidden = scale === 1;
  renderCookingStep();
}

function renderCookingStep() {
  const index = clampStep(progress.currentStep, steps.length);
  const step = steps[index];
  if (!step) return;
  const title = element("cooking-title");
  if (title) title.textContent = step.title;
  const count = element("cooking-count");
  if (count) count.textContent = `Step ${index + 1} of ${steps.length}`;
  const meter = element<HTMLProgressElement>("cooking-progress");
  if (meter) {
    meter.max = steps.length;
    meter.value = index + 1;
    meter.setAttribute("aria-label", `Step ${index + 1} of ${steps.length}`);
  }
  const body = element("cooking-body");
  if (body) {
    body.replaceChildren();
    for (const paragraph of step.paragraphs) {
      const node = document.createElement("p");
      node.textContent = paragraph;
      body.append(node);
    }
    if (step.note) {
      const note = document.createElement("p");
      note.className = "cooking-note";
      note.textContent = step.note;
      body.append(note);
    }
  }
  const needed = element<HTMLUListElement>("cooking-ingredients");
  if (needed) {
    needed.replaceChildren();
    for (const id of step.ingredients) {
      const ingredient = ingredients.find((item) => item.id === id);
      if (!ingredient) continue;
      const node = document.createElement("li");
      node.textContent = formatIngredient(ingredient, scale, units);
      needed.append(node);
    }
    if (step.ingredients.length === 0) {
      const node = document.createElement("li");
      node.textContent =
        step.id === "adjust"
          ? "Optional cooked bell pepper, mango, vinegar, and water. See the heat-adjustment guide."
          : "No additional ingredients needed.";
      needed.append(node);
    }
  }
  const settings = element("cooking-settings");
  if (settings) {
    settings.replaceChildren();
    for (const setting of step.settings) {
      const node = document.createElement("span");
      node.className = "machine-setting";
      node.textContent = setting;
      settings.append(node);
    }
    settings.hidden = step.settings.length === 0;
  }
  const previous = element<HTMLButtonElement>("previous-step");
  if (previous) previous.disabled = index === 0;
  const next = element<HTMLButtonElement>("next-step");
  if (next)
    next.textContent =
      index === steps.length - 1 ? "Finish cooking" : "Next step →";
  const done = element<HTMLInputElement>("cooking-done");
  if (done) done.checked = progress.steps.includes(step.id);
}

function setStepDone(id: string, done: boolean) {
  if (!steps.some((step) => step.id === id)) return;
  const previouslyComplete = allStepsDone();
  progress.steps = progress.steps.filter((item) => item !== id);
  if (done) progress.steps.push(id);
  renderProgress();
  const currentDone = element<HTMLInputElement>("cooking-done");
  if (currentDone)
    currentDone.checked = progress.steps.includes(
      steps[progress.currentStep]?.id ?? "",
    );
  persist();
  if (!previouslyComplete && allStepsDone())
    toast("You survived! All nine steps complete. Time to bottle that fire.");
}

for (const checkbox of ingredientChecks) {
  checkbox.addEventListener("change", () => {
    const id = checkbox.dataset.ingredient;
    if (!id || !ingredients.some((item) => item.id === id)) return;
    progress.ingredients = progress.ingredients.filter((item) => item !== id);
    if (checkbox.checked) progress.ingredients.push(id);
    renderProgress();
    persist();
  });
}
for (const checkbox of stepChecks) {
  checkbox.addEventListener("change", () =>
    setStepDone(checkbox.dataset.step ?? "", checkbox.checked),
  );
}
element("reset-ingredients")?.addEventListener("click", () => {
  progress.ingredients = [];
  renderProgress();
  persist();
  toast("Ingredient checklist reset. Ready for another batch.");
});

document
  .querySelectorAll<HTMLButtonElement>("[data-unit]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      if (button.dataset.unit !== "metric" && button.dataset.unit !== "us")
        return;
      units = button.dataset.unit;
      renderAmounts();
    });
  });
document
  .querySelectorAll<HTMLButtonElement>("[data-scale]")
  .forEach((button) => {
    button.addEventListener("click", () => {
      const requested = Number(button.dataset.scale);
      if (![0.5, 1, 1.5].includes(requested)) return;
      scale = requested;
      renderAmounts();
    });
  });

type ScreenWakeLock = {
  released: boolean;
  release(): Promise<void>;
  addEventListener(type: "release", callback: () => void): void;
};
const wakeNavigator = navigator as Navigator & {
  wakeLock?: { request(type: "screen"): Promise<ScreenWakeLock> };
};
let wakeLock: ScreenWakeLock | null = null;
let wakeRequest: Promise<void> | null = null;
const wakeFallback =
  "Keep this screen awake in your device settings. Browsers cannot always prevent sleep.";

function wakeStatus(message: string) {
  const status = element("wake-status");
  if (status) status.textContent = message;
}

async function requestWakeLock() {
  if (
    !dialog?.open ||
    document.visibilityState !== "visible" ||
    wakeRequest ||
    (wakeLock && !wakeLock.released)
  )
    return;
  if (!wakeNavigator.wakeLock) {
    wakeStatus(wakeFallback);
    return;
  }
  wakeRequest = (async () => {
    try {
      const lock = await wakeNavigator.wakeLock!.request("screen");
      if (!dialog?.open || document.visibilityState !== "visible") {
        await lock.release();
        return;
      }
      wakeLock = lock;
      wakeStatus(
        "Screen-awake request active while this page is visible. Your browser or device may still release it.",
      );
      lock.addEventListener("release", () => {
        if (wakeLock !== lock) return;
        wakeLock = null;
        if (dialog?.open) wakeStatus(wakeFallback);
      });
    } catch {
      wakeStatus(wakeFallback);
    }
  })();
  await wakeRequest;
  wakeRequest = null;
}

function releaseWakeLock() {
  const lock = wakeLock;
  wakeLock = null;
  if (lock && !lock.released) void lock.release().catch(() => {});
}

function openCooking(trigger: HTMLElement) {
  if (!dialog) return;
  opener = trigger;
  renderCookingStep();
  if (!dialog.open) dialog.showModal();
  document.body.classList.add("cooking-open");
  wakeStatus(wakeFallback);
  void requestWakeLock();
  element("close-cooking")?.focus();
}

document
  .querySelectorAll<HTMLElement>("#start-cooking, [data-start-cooking]")
  .forEach((button) => {
    button.addEventListener("click", () => openCooking(button));
  });
element("close-cooking")?.addEventListener("click", () => dialog?.close());
dialog?.addEventListener("close", () => {
  releaseWakeLock();
  document.body.classList.remove("cooking-open");
  opener?.focus({ preventScroll: true });
});
dialog?.addEventListener("click", (event) => {
  if (event.target !== dialog) return;
  const box = dialog.getBoundingClientRect();
  if (
    event.clientX < box.left ||
    event.clientX > box.right ||
    event.clientY < box.top ||
    event.clientY > box.bottom
  )
    dialog.close();
});
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible" && dialog?.open)
    void requestWakeLock();
});
window.addEventListener("pagehide", releaseWakeLock);
element("previous-step")?.addEventListener("click", () => {
  progress.currentStep = clampStep(progress.currentStep - 1, steps.length);
  persist();
  renderCookingStep();
  dialog?.scrollTo({ top: 0, behavior: "instant" });
  element("cooking-title")?.focus({ preventScroll: true });
});
element("next-step")?.addEventListener("click", () => {
  if (progress.currentStep === steps.length - 1) {
    dialog?.close();
    if (allStepsDone()) {
      element("complete-banner")?.scrollIntoView({
        block: "center",
        behavior: "instant",
      });
    } else {
      toast(
        "Cooking mode closed. Check off each completed step to save your progress.",
      );
    }
    return;
  }
  progress.currentStep = clampStep(progress.currentStep + 1, steps.length);
  persist();
  renderCookingStep();
  dialog?.scrollTo({ top: 0, behavior: "instant" });
  element("cooking-title")?.focus({ preventScroll: true });
});
element<HTMLInputElement>("cooking-done")?.addEventListener(
  "change",
  (event) => {
    const checkbox = event.currentTarget as HTMLInputElement;
    setStepDone(steps[progress.currentStep]?.id ?? "", checkbox.checked);
  },
);

element("copy-link")?.addEventListener("click", async () => {
  const url = new URL(window.location.href);
  url.hash = "";
  try {
    await navigator.clipboard.writeText(url.href);
    toast("Recipe link copied. Pass the heat around.");
  } catch {
    const previousFocus =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    const field = document.createElement("textarea");
    field.value = url.href;
    field.readOnly = true;
    field.setAttribute("aria-label", "Recipe link");
    field.style.cssText =
      "position:fixed;top:0;left:0;opacity:0;width:1px;height:1px;";
    document.body.append(field);
    field.select();
    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch {
      /* Browser declined the fallback. */
    }
    field.remove();
    previousFocus?.focus({ preventScroll: true });
    toast(
      copied
        ? "Recipe link copied. Pass the heat around."
        : "Copy the address from your browser to share this recipe.",
    );
  }
});
const shareButton = element<HTMLButtonElement>("share-recipe");
if (shareButton) {
  shareButton.hidden = typeof navigator.share !== "function";
  shareButton.addEventListener("click", async () => {
    const url = new URL(window.location.href);
    url.hash = "";
    try {
      await navigator.share({
        title: "REAPER SAUCE — Bold Flavor. Respect the Heat.",
        text: "Carolina Reaper, mango & lime. A very hot homemade sauce for the Thermomix TM7.",
        url: url.href,
      });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError"))
        toast("Sharing is unavailable here. Use Copy recipe link instead.");
    }
  });
}
element("print-recipe")?.addEventListener("click", () => {
  document.body.dataset.printMode = "recipe";
  window.print();
});
window.addEventListener("afterprint", () => {
  if (document.body.dataset.printMode === "recipe")
    delete document.body.dataset.printMode;
});

function renderDilution() {
  const select = element<HTMLSelectElement>("dilution");
  const output = element("dilution-result");
  if (!select || !output) return;
  const multiplier = Number(select.value);
  if (![1, 2].includes(multiplier)) return;
  const addition = heatAdjustment(multiplier);
  output.textContent = `${addition.bellPepper} g bell pepper + ${addition.mango} g mango + ${addition.vinegar} g vinegar + ${addition.water} g water`;
}
element("dilution")?.addEventListener("change", renderDilution);

window.addEventListener("storage", (event) => {
  if (!storage || (event.key !== PROGRESS_KEY && event.key !== null)) return;
  // Ignore sessionStorage and any other storage area using the same key.
  if (event.storageArea && event.storageArea !== storage) return;
  const saved = readProgress(storage);
  progress.ingredients = saved.ingredients;
  progress.steps = saved.steps;
  progress.currentStep = saved.currentStep;
  renderProgress();
  renderCookingStep();
  // A storage event comes from another tab; never write it back and create a loop.
});

const initialToast = element("toast");
if (initialToast) initialToast.hidden = true;
renderProgress();
renderAmounts();
renderDilution();
persist();
