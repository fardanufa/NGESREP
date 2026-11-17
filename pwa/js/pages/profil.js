import { PROFILE } from "../config.js";
import { esc } from "../ui.js";

const TECH = [
  ["html", "HTML5 Semantic"],
  ["palette", "CSS3 & Tailwind"],
  ["javascript", "JavaScript ES6+"],
  ["terminal", "Node.js Runtime"],
  ["hub", "Express.js API"],
  ["database", "Supabase DB"],
];

function techItem([icon, label]) {
  return `
  <div class="flex items-center gap-2 p-2 rounded-lg bg-surface-container-low">
    <div class="w-7 h-7 rounded-md bg-surface-container flex items-center justify-center shrink-0">
      <span class="material-symbols-outlined text-[18px] text-primary">${icon}</span>
    </div>
    <span class="font-label-md text-label-md text-on-surface truncate">${label}</span>
  </div>`;
}

export async function profil(main) {
  const githubButton = PROFILE.github.startsWith("http")
    ? `<a href="${esc(PROFILE.github)}" target="_blank" rel="noopener noreferrer"
        class="w-full flex items-center justify-center gap-2 py-3 px-space-md rounded-full bg-surface-container-high hover:bg-surface-container text-primary font-label-lg text-label-lg transition-transform active:scale-95 shadow-sm">
        <span class="material-symbols-outlined text-[20px]">code</span>
        <span>Lihat di GitHub</span>
      </a>`
    : "";

  main.innerHTML = `
  <div class="flex flex-col w-full px-gutter gap-space-md pb-6">
    <div class="flex items-center gap-space-xs pt-space-xs">
      <span class="material-symbols-outlined text-primary text-[20px]">badge</span>
      <h1 class="font-headline-md text-headline-md text-on-surface">Profil &amp; Tentang</h1>
    </div>

    <section class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm relative overflow-hidden">
      <div class="absolute -right-6 -bottom-6 w-24 h-24 rounded-full bg-primary/5 pointer-events-none"></div>
      <div class="flex items-start gap-space-md">
        <div class="relative shrink-0">
          <div class="w-16 h-16 rounded-full bg-surface-container-high p-0.5 shadow-sm">
            <div class="w-full h-full rounded-full bg-primary-fixed flex items-center justify-center overflow-hidden relative">
              <span class="material-symbols-outlined text-[36px] text-primary">account_circle</span>
              <img src="${esc(PROFILE.foto)}" alt="Foto ${esc(PROFILE.nama)}" class="absolute inset-0 w-full h-full object-cover" onerror="this.remove()">
            </div>
          </div>
          <div class="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center shadow">
            <span class="material-symbols-outlined text-[14px]">school</span>
          </div>
        </div>

        <div class="flex-1 min-w-0">
          <h2 class="font-headline-sm text-headline-sm text-on-surface truncate">${esc(PROFILE.nama)}</h2>
          <p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5">Mahasiswa ${esc(PROFILE.kampus)}</p>
          <div class="flex flex-wrap items-center gap-2 mt-2">
            <span class="px-2 py-0.5 rounded-md bg-surface-container font-label-sm text-label-sm text-on-surface-variant">NIM ${esc(PROFILE.nim)}</span>
            <span class="px-2 py-0.5 rounded-md bg-surface-container font-label-sm text-label-sm text-on-surface-variant">${esc(PROFILE.kelas)}</span>
          </div>
        </div>
      </div>
    </section>

    <section class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-md">
      <div class="flex items-center gap-space-md pb-space-xs">
        <div class="h-12 w-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-surface-container-low p-1 shadow-sm">
          <img src="icons/icon-192.png" alt="NGESREP" class="h-10 w-10 object-contain" onerror="this.remove()">
        </div>
        <div>
          <h3 class="font-headline-sm text-headline-sm text-on-surface">Tentang NGESREP</h3>
          <p class="font-label-sm text-label-sm text-primary">Solusi Masak Sehat &amp; Ramah Kantong</p>
        </div>
      </div>

      <p class="font-body-md text-body-md text-on-surface-variant leading-relaxed">
        NGESREP adalah aplikasi panduan memasak mandiri untuk mahasiswa kos di Semarang.
        Isinya resep lezat dengan bahan terjangkau dan langkah memasak yang singkat.
      </p>

      <div class="p-space-sm rounded-lg bg-surface-container-low space-y-space-xs">
        <div class="flex items-start gap-space-xs">
          <span class="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">location_on</span>
          <div>
            <span class="font-label-lg text-label-lg text-on-surface block">Asal Nama</span>
            <p class="font-body-sm text-body-sm text-on-surface-variant mt-0.5">
              Diambil dari nama kelurahan di Semarang, sekaligus plesetan akrab dari kata
              <span class="font-semibold text-primary">"ngeresep"</span> (meracik resep masakan).
            </p>
          </div>
        </div>
      </div>

      <div class="p-space-sm rounded-lg bg-primary-fixed/40 flex items-start gap-space-xs">
        <span class="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">auto_awesome</span>
        <div>
          <span class="font-label-lg text-label-lg text-primary block">Akronim NGESREP</span>
          <p class="font-body-md text-body-md font-semibold text-on-surface mt-0.5">
            <span class="text-primary font-bold">N</span>ikmat,
            <span class="text-primary font-bold">G</span>ampang,
            <span class="text-primary font-bold">E</span>konomis,
            <span class="text-primary font-bold">S</span>ehat &mdash;
            <span class="text-on-surface">REsep Praktis</span>
          </p>
        </div>
      </div>
    </section>

    <section class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-sm">
      <div class="flex items-center gap-space-xs">
        <span class="material-symbols-outlined text-primary text-[20px]">code</span>
        <h3 class="font-headline-sm text-headline-sm text-on-surface">Teknologi Aplikasi</h3>
      </div>
      <div class="grid grid-cols-2 gap-space-sm pt-space-xs">${TECH.map(techItem).join("")}</div>
      <div class="flex items-center gap-space-sm p-space-sm rounded-lg bg-secondary-container/30 text-on-secondary-container mt-1">
        <div class="w-7 h-7 rounded-md bg-secondary-container flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-[18px] text-on-secondary-container">install_mobile</span>
        </div>
        <div class="min-w-0">
          <span class="font-label-md text-label-md block font-semibold">Progressive Web App (PWA)</span>
          <span class="font-body-sm text-body-sm opacity-80 block">Dapat di-install &amp; diakses luring</span>
        </div>
      </div>
    </section>

    <section class="space-y-space-md pt-space-xs">
      ${githubButton}
      <div class="text-center space-y-1">
        <div class="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
          <span class="w-1.5 h-1.5 rounded-full bg-secondary"></span>
          <span>Versi 1.0.0</span>
        </div>
        <p class="font-body-sm text-body-sm text-on-surface-variant flex items-center justify-center gap-1">
          Dibuat dengan
          <span class="material-symbols-outlined text-[14px] text-primary" style="font-variation-settings: 'FILL' 1;">favorite</span>
          untuk anak kos
        </p>
      </div>
    </section>
  </div>`;
}
