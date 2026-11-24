import { getTips } from "../api.js";
import { esc, imgTag, stateBox, retryButton } from "../ui.js";

const skeleton = Array.from(
  { length: 3 },
  () => `
  <div class="motion-safe:animate-pulse bg-surface-container-lowest rounded-2xl p-space-md flex gap-space-md items-center shadow-sm">
    <div class="w-24 h-24 rounded-xl bg-surface-container shrink-0"></div>
    <div class="flex-1 flex flex-col gap-2">
      <div class="h-4 w-2/3 bg-surface-container rounded"></div>
      <div class="h-3 w-full bg-surface-container rounded"></div>
      <div class="h-3 w-1/2 bg-surface-container rounded"></div>
    </div>
  </div>`
).join("");

function snippet(text = "") {
  const clean = String(text).replace(/\s+/g, " ").trim();
  return esc(clean.length > 120 ? `${clean.slice(0, 120)}…` : clean);
}

function card(tip, priority = false) {
  return `
  <a href="#/tips/${esc(tip.id)}" class="bg-surface-container-lowest rounded-2xl p-space-md shadow-sm flex gap-space-md items-center cursor-pointer transition-transform active:scale-[0.99]">
    <div class="w-24 h-24 rounded-xl overflow-hidden shrink-0 bg-surface-container">
      ${imgTag(tip.image_url, tip.title, "w-full h-full object-cover", priority ? "eager" : "lazy")}
    </div>
    <div class="flex flex-col justify-between flex-1 min-w-0">
      <div class="flex flex-col gap-space-xs">
        <h2 class="font-headline-sm text-headline-sm text-on-surface truncate">${esc(tip.title)}</h2>
        <p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2">${snippet(tip.content)}</p>
      </div>
      <div class="flex items-center gap-space-xs mt-2 text-primary font-label-md text-label-md font-bold">
        <span>Baca selengkapnya</span>
        <span aria-hidden="true" class="material-symbols-outlined text-[16px]">arrow_forward</span>
      </div>
    </div>
  </a>`;
}

export async function tips(main, _id, signal) {
  main.innerHTML = `
  <div class="w-full px-margin md:px-6 lg:px-8 max-w-6xl mx-auto flex flex-col gap-space-lg pb-space-xl">
    <section class="flex flex-col gap-space-xs pt-space-md">
      <div class="flex items-center gap-space-xs">
        <span aria-hidden="true" class="material-symbols-outlined text-primary text-[26px]" style="font-variation-settings: 'FILL' 1;">tips_and_updates</span>
        <h1 class="font-headline-lg text-headline-lg text-on-surface">Tips Dapur Anak Kos</h1>
      </div>
      <p class="font-body-md text-body-md text-on-surface-variant">Biar masak makin gampang, hemat, dan anti-ribet di kosan</p>
      <p data-count class="sr-only" aria-live="polite"></p>
    </section>

    <div class="relative w-full">
      <div class="w-full h-12 bg-surface-container-lowest rounded-full shadow-sm flex items-center px-space-md gap-space-sm focus-within:outline focus-within:outline-2 focus-within:outline-primary">
        <span aria-hidden="true" class="material-symbols-outlined text-outline text-[22px]">search</span>
        <input id="tips-search" type="search" aria-label="Cari tips" placeholder="Cari trik sayur, rice cooker, kulkas..."
          class="w-full h-full min-w-0 bg-transparent text-on-surface placeholder:text-on-surface-variant text-body-md font-body-md focus:outline-none">
        <button type="button" id="tips-clear" aria-label="Hapus pencarian" class="hidden text-outline hover:text-on-surface p-1 rounded-full">
          <span aria-hidden="true" class="material-symbols-outlined text-[18px]">close</span>
        </button>
      </div>
    </div>

    <div id="tips-list" class="flex flex-col gap-space-md md:grid md:grid-cols-2 xl:grid-cols-3">${skeleton}</div>
  </div>`;

  const list = main.querySelector("#tips-list");
  const input = main.querySelector("#tips-search");
  const clear = main.querySelector("#tips-clear");

  let allTips;
  let query = "";

  function draw() {
    if (!allTips) return;
    const keyword = query.toLowerCase();
    const items = allTips.filter(
      (tip) =>
        !keyword ||
        (tip.title || "").toLowerCase().includes(keyword) ||
        (tip.content || "").toLowerCase().includes(keyword)
    );

    const count = main.querySelector("[data-count]");
    if (count) count.textContent = `${items.length} tips ditemukan`;

    list.innerHTML = items.length
      ? items.map((tip, index) => card(tip, index === 0)).join("")
      : stateBox("search_off", "Tips tidak ditemukan", "Coba kata kunci lain, misalnya sayur atau kulkas.");
  }

  input.addEventListener("input", () => {
    query = input.value.trim();
    clear.classList.toggle("hidden", !query);
    draw();
  });

  clear.addEventListener("click", () => {
    input.value = "";
    query = "";
    clear.classList.add("hidden");
    draw();
    input.focus();
  });

  async function load() {
    list.innerHTML = skeleton;
    try {
      allTips = await getTips(signal);
      if (signal.aborted) return;
      draw();
    } catch {
      if (signal.aborted) return;
      list.innerHTML = stateBox(
        "cloud_off",
        "Gagal memuat tips",
        "Periksa koneksi internet lalu coba lagi.",
        retryButton()
      );
      list.querySelector("[data-retry]").onclick = load;
    }
  }

  await load();
}
