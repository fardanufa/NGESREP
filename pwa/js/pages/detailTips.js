import { getTip, getTips } from "../api.js";
import { esc, imgTag, loadingBox, stateBox, retryButton } from "../ui.js";

const backLink = `<a href="#/tips" class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-label-lg shadow-sm hover:opacity-90 active:scale-95 transition-all">
  <span aria-hidden="true" class="material-symbols-outlined text-[20px]">arrow_back</span>Kembali ke Tips</a>`;

function otherCard(tip) {
  return `
  <a href="#/tips/${esc(tip.id)}" class="flex items-center gap-space-md bg-surface-container-lowest p-space-sm rounded-2xl shadow-sm hover:shadow-md transition-shadow active:scale-[0.99]">
    <div class="w-20 h-20 rounded-xl overflow-hidden shrink-0 bg-surface-container">
      ${imgTag(tip.image_url, tip.title, "w-full h-full object-cover")}
    </div>
    <div class="flex flex-col min-w-0 flex-1 justify-center gap-0.5">
      <h3 class="font-headline-sm text-headline-sm text-on-surface line-clamp-2 leading-snug font-bold">${esc(tip.title)}</h3>
      <span class="font-body-sm text-body-sm text-primary flex items-center gap-0.5 mt-0.5 font-semibold">
        Baca selengkapnya <span aria-hidden="true" class="material-symbols-outlined text-[14px]">arrow_forward</span>
      </span>
    </div>
  </a>`;
}

function view(tip) {
  const paragraphs = String(tip.content || "")
    .split("\n\n")
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);

  return `
  <div class="flex flex-col w-full pb-safe md:max-w-4xl md:mx-auto">
    <div class="flex flex-col px-gutter pt-space-sm gap-space-md pb-space-lg">
      <div class="relative w-full aspect-[16/10] rounded-2xl overflow-hidden shadow-sm bg-surface-container">
        ${imgTag(tip.image_url, tip.title, "w-full h-full object-cover", "eager")}
      </div>

      <h1 class="font-headline-lg text-headline-lg text-on-surface font-extrabold tracking-tight">${esc(tip.title)}</h1>

      <div class="flex flex-col gap-space-md text-on-surface font-body-lg text-body-lg leading-relaxed">
        ${paragraphs.map((paragraph) => `<p class="text-on-surface">${esc(paragraph)}</p>`).join("")}
      </div>

      ${
        tip.highlight
          ? `<div class="flex items-start gap-2 p-space-md rounded-2xl bg-secondary-container/40 text-on-secondary-container">
              <span aria-hidden="true" class="material-symbols-outlined text-[20px] text-secondary shrink-0">savings</span>
              <div>
                <p class="font-label-lg text-label-lg font-bold mb-1">Catatan Hemat Anak Kos</p>
                <p class="font-body-sm text-body-sm leading-relaxed">${esc(tip.highlight)}</p>
              </div>
            </div>`
          : ""
      }

      <div data-others hidden class="flex-col gap-space-sm pt-space-sm"></div>
    </div>
  </div>`;
}

export async function detailTips(main, id, signal) {
  main.innerHTML = loadingBox("Memuat tips…");
  try {
    const tip = await getTip(id, signal);
    if (signal.aborted) return;
    document.title = `${tip.title} · NGESREP`;
    main.innerHTML = view(tip);
    const section = main.querySelector("[data-others]");
    try {
      const all = await getTips(signal);
      const others = all.filter((item) => item.id !== tip.id).slice(0, 2);
      if (signal.aborted || !others.length) return;
      section.hidden = false;
      section.classList.add("flex");
      section.innerHTML = `<h2 class="font-headline-sm text-headline-sm font-bold">Tips Lainnya</h2>${others.map(otherCard).join("")}`;
    } catch {
      // Daftar tips lain tidak wajib; tips utama tetap ditampilkan.
    }
  } catch (err) {
    if (signal.aborted) return;
    if ([404, 410].includes(err.status)) {
      main.innerHTML = `<div class="px-gutter pt-space-md">${stateBox(
        "search_off",
        "Tips tidak ditemukan",
        "Tips ini mungkin sudah dihapus atau alamatnya salah.",
        backLink
      )}</div>`;
      return;
    }

    main.innerHTML = `<div class="px-gutter pt-space-md">${stateBox(
      "cloud_off",
      "Gagal memuat tips",
      "Periksa koneksi internet lalu coba lagi.",
      retryButton()
    )}</div>`;
    main.querySelector("[data-retry]").onclick = () => detailTips(main, id, signal);
  }
}
