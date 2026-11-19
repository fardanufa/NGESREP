// Helper tampilan yang dipakai semua halaman.

export const esc = (value = "") =>
  String(value).replace(
    /[&<>"']/g,
    (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]
  );

export const rupiah = (value) => `Rp ${new Intl.NumberFormat("id-ID").format(Number(value) || 0)}`;

export function imgSrc(path) {
  return path ? String(path).replace(/^\.?\//, "") : "images/placeholder.svg";
}

// Gambar dengan cadangan placeholder bila gagal dimuat.
export function imgTag(path, alt, className = "", loading = "lazy") {
  return `<img src="${esc(imgSrc(path))}" alt="${esc(alt)}" loading="${loading}" class="${className}" onerror="this.onerror=null;this.src='images/placeholder.svg'">`;
}

export function skeletonList(count = 3) {
  return Array.from(
    { length: count },
    () => `
    <div class="motion-safe:animate-pulse bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm">
      <div class="w-full aspect-[16/10] bg-surface-container"></div>
      <div class="p-space-md flex flex-col gap-2">
        <div class="h-3 w-20 bg-surface-container rounded"></div>
        <div class="h-4 w-2/3 bg-surface-container rounded"></div>
        <div class="h-3 w-full bg-surface-container rounded"></div>
      </div>
    </div>`
  ).join("");
}

// Kotak keadaan kosong / error / tidak ditemukan. `action` adalah HTML tombol (opsional).
export function stateBox(icon, title, text, action = "") {
  return `
  <div class="flex flex-col items-center justify-center text-center py-12 px-4 bg-surface-container-lowest rounded-2xl shadow-sm">
    <div class="w-20 h-20 rounded-full bg-surface-container flex items-center justify-center text-primary mb-4">
      <span class="material-symbols-outlined text-[40px]">${esc(icon)}</span>
    </div>
    <h2 class="font-headline-sm text-headline-sm text-on-surface mb-2">${esc(title)}</h2>
    <p class="font-body-md text-body-md text-on-surface-variant max-w-xs mb-6">${esc(text)}</p>
    ${action}
  </div>`;
}

export function retryButton() {
  return `<button type="button" data-retry class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-label-lg shadow-sm hover:opacity-90 active:scale-95 transition-all">
    <span class="material-symbols-outlined text-[20px]">refresh</span>Coba Lagi</button>`;
}

export function toast(message) {
  const status = document.getElementById("app-status");
  const el = document.createElement("div");
  el.className =
    "fixed bottom-24 left-1/2 -translate-x-1/2 z-[70] w-[90%] max-w-[400px] rounded-full bg-inverse-surface text-inverse-on-surface font-label-md text-label-md px-4 py-3 shadow-lg text-center";
  el.textContent = message;
  status.replaceChildren(el);
  setTimeout(() => el.remove(), 3500);
}
