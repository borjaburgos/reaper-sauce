const dialog = document.querySelector<HTMLDialogElement>("#label-dialog")!;
const format = document.querySelector<HTMLSelectElement>("#label-format")!;
const width = document.querySelector<HTMLInputElement>("#label-width")!;
const height = document.querySelector<HTMLInputElement>("#label-height")!;
const form = document.querySelector<HTMLFormElement>("#label-form")!;
const sheet = document.querySelector<HTMLDivElement>("#label-print-sheet")!;
const base = import.meta.env.BASE_URL;
let reopen = false;
document
  .querySelector("#open-labels")
  ?.addEventListener("click", () => dialog.showModal());
document
  .querySelector("#close-labels")
  ?.addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      dialog.close();
  }
});
format.addEventListener("change", () => {
  const round = format.value === "round";
  width.value = round ? "3" : "2.5";
  height.value = round ? "3" : "4";
  document.querySelector("#height-field")?.toggleAttribute("hidden", round);
  document.querySelector("#width-caption")!.textContent = round
    ? "Diameter (inches)"
    : "Width (inches)";
});
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const w = Number(width.value),
    h = format.value === "round" ? w : Number(height.value);
  sheet.replaceChildren();
  const note = document.createElement("p");
  note.textContent = `REAPER SAUCE · ${w} × ${h} in · Print at 100% / Actual size on US Letter. Cut along the border.`;
  const guide = document.createElement("div");
  guide.className = "cut-guide";
  const art = new Image();
  art.src = `${base}art/label-${format.value}.svg`;
  art.alt = "Printable Reaper Sauce label";
  art.style.width = `${w}in`;
  art.style.height = `${h}in`;
  guide.append(art);
  sheet.append(note, guide);
  try {
    await art.decode();
  } catch {
    return;
  }
  reopen = true;
  dialog.close();
  document.body.dataset.printMode = "labels";
  window.print();
});
window.addEventListener("afterprint", () => {
  delete document.body.dataset.printMode;
  if (reopen) {
    reopen = false;
    dialog.showModal();
  }
});
