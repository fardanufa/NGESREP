import { FAVORITE_ACCOUNT_KEY, getFavorites, refreshFavorites, removeFavorite } from "../favorites.js";
import { esc, imgTag, rupiah, stateBox, toast } from "../ui.js";

const emptyState = stateBox(
  "soup_kitchen",
  "Belum ada resep favorit",
  "Tekan ikon hati pada resep untuk menyimpannya",
  `<a href="#/beranda" class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-label-lg shadow-sm hover:opacity-90 active:scale-95 transition-all">
    <span aria-hidden="true" class="material-symbols-outlined text-[20px]">search</span>Cari Resep</a>`
);

function card(item, priority = false) {
  return `
  <div class="min-w-0 bg-surface-container-lowest rounded-2xl p-3 shadow-sm flex items-center justify-between gap-3">
    <a href="#/resep/${esc(item.id)}" class="flex items-center gap-3 min-w-0 flex-1 active:scale-[0.99] transition-transform">
      <div class="w-[76px] h-[76px] rounded-xl overflow-hidden bg-surface-container shrink-0">
        ${imgTag(item.image_url, item.name, "w-full h-full object-cover", priority ? "eager" : "lazy")}
      </div>
      <div class="flex flex-col min-w-0 flex-1 gap-1">
        <span class="font-headline-sm text-headline-sm text-on-surface truncate">${esc(item.name)}</span>
        <div class="flex flex-wrap items-center gap-2 text-on-surface-variant font-body-sm text-body-sm">
          <span class="flex items-center gap-0.5">
            <span aria-hidden="true" class="material-symbols-outlined text-[14px]">schedule</span>${Number(item.cook_time) || 0} mnt
          </span>
          <span class="text-outline-variant">&bull;</span>
          <span class="bg-secondary/10 text-secondary font-label-sm text-label-sm px-2 py-0.5 rounded-full font-semibold">${rupiah(item.cost_estimate)}</span>
        </div>
      </div>
    </a>
    <button type="button" data-remove="${esc(item.id)}" aria-label="Hapus dari favorit"
      class="w-11 h-11 rounded-full flex items-center justify-center text-primary hover:bg-surface-container-high transition-colors shrink-0 disabled:opacity-50">
      <span aria-hidden="true" class="material-symbols-outlined text-[24px]" style="font-variation-settings: 'FILL' 1;">favorite</span>
    </button>
  </div>`;
}

export async function favorit(main, _id, signal) {
  main.innerHTML = `
  <div class="px-gutter pt-space-md flex flex-col gap-space-md pb-space-lg">
    <section class="flex items-center justify-between">
      <div>
        <h1 class="font-headline-lg text-headline-lg text-on-surface">Resep Favorit</h1>
        <p class="font-body-md text-body-md text-on-surface-variant">Koleksi resep andalan yang sudah kamu simpan</p>
      </div>
      <div class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center text-primary shadow-sm shrink-0">
        <span aria-hidden="true" class="material-symbols-outlined text-[22px]" style="font-variation-settings: 'FILL' 1;">favorite</span>
      </div>
    </section>
    <div id="favorites-list" class="grid gap-space-sm md:grid-cols-2"></div>
    <p id="favorites-status" class="sr-only" aria-live="polite"></p>
  </div>`;

  const container = main.querySelector("#favorites-list");
  const status = main.querySelector("#favorites-status");
  let syncing = true;

  function draw() {
    const favorites = getFavorites();

    if (!favorites.length) {
      container.innerHTML = emptyState;
      return;
    }

    container.innerHTML = favorites.map((item, index) => card(item, index === 0)).join("");

    container.querySelectorAll("[data-remove]").forEach((button) => {
      button.disabled = syncing;
      button.addEventListener("click", async () => {
        const id = button.dataset.remove;
        const name = favorites.find((item) => item.id === id)?.name || "Resep";
        const index = [...container.querySelectorAll("[data-remove]")].indexOf(button);
        button.disabled = true;
        try {
          await removeFavorite(id);
          if (signal.aborted) return;
          draw();
          status.textContent = `${name} dihapus dari favorit.`;
          const buttons = container.querySelectorAll("[data-remove]");
          (buttons[Math.min(index, buttons.length - 1)] || container.querySelector("a"))?.focus();
        } catch (error) {
          if (signal.aborted) return;
          toast(error.status ? error.message : "Favorit tidak terhapus. Periksa koneksi atau penyimpanan browser.");
          button.disabled = false;
        }
      });
    });
  }

  draw();
  window.addEventListener("storage", (event) => {
    if (event.key === FAVORITE_ACCOUNT_KEY || event.key === null) draw();
  }, { signal });
  try {
    await refreshFavorites(signal);
  } catch (error) {
    if (!signal.aborted && error.status) toast("Favorit belum tersinkron. Buka ulang halaman ini untuk mencoba lagi.");
  } finally {
    syncing = false;
    if (!signal.aborted) draw();
  }
}
