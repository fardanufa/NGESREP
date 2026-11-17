import { beranda } from "./pages/beranda.js";
import { detailResep } from "./pages/detailResep.js";
import { tips } from "./pages/tips.js";
import { detailTips } from "./pages/detailTips.js";
import { favorit } from "./pages/favorit.js";
import { profil } from "./pages/profil.js";

const header = document.getElementById("app-header");
const main = document.getElementById("app");
const nav = document.getElementById("bottom-nav");

// Daftar rute hash. Rute detail memakai stack (tanpa bottom nav).
const ROUTES = [
  { re: /^\/beranda\/?$/, page: beranda, tab: "beranda" },
  { re: /^\/resep\/([^/]+)$/, page: detailResep, title: "Detail Resep", back: "#/beranda" },
  { re: /^\/tips\/?$/, page: tips, tab: "tips" },
  { re: /^\/tips\/([^/]+)$/, page: detailTips, title: "Detail Tips", back: "#/tips" },
  { re: /^\/favorit\/?$/, page: favorit, tab: "favorit" },
  { re: /^\/profil\/?$/, page: profil, tab: "profil" },
];

function logoHTML() {
  return `<a href="#/beranda" class="flex items-center h-12" aria-label="NGESREP">
    <img src="images/logo-full.png" alt="NGESREP" class="h-12 w-auto object-contain max-w-[160px]"
      onerror="this.onerror=null;this.replaceWith(document.createTextNode('NGESREP'))">
  </a>`;
}

function drawHeader(route) {
  if (route.tab) {
    header.innerHTML = `<div class="h-16 px-gutter max-w-[480px] mx-auto flex items-center justify-between">${logoHTML()}</div>`;
    return;
  }

  header.innerHTML = `
    <div class="h-16 px-gutter max-w-[480px] mx-auto flex items-center gap-2">
      <button type="button" data-back aria-label="Kembali" class="w-11 h-11 flex items-center justify-center rounded-full text-on-surface hover:bg-surface-container transition-colors">
        <span class="material-symbols-outlined text-[24px]">arrow_back</span>
      </button>
      <h1 class="font-headline-sm text-headline-sm text-on-surface truncate">${route.title}</h1>
    </div>`;

  header.querySelector("[data-back]").addEventListener("click", () => {
    if (history.length > 1) history.back();
    else location.hash = route.back;
  });
}

function markActiveTab(tab) {
  for (const link of nav.querySelectorAll("a[data-tab]")) {
    const active = link.dataset.tab === tab;
    link.classList.toggle("text-primary", active);
    link.classList.toggle("bg-primary-fixed/40", active);
    link.classList.toggle("font-bold", active);
    link.classList.toggle("text-on-surface-variant", !active);
  }
}

export async function renderRoute() {
  const path = (location.hash || "#/beranda").replace(/^#/, "");

  let matched = null;
  for (const route of ROUTES) {
    const params = path.match(route.re);
    if (params) {
      matched = { route, params };
      break;
    }
  }

  if (!matched) {
    location.hash = "#/beranda";
    return;
  }

  const { route, params } = matched;
  drawHeader(route);
  nav.classList.toggle("hidden", !route.tab);
  markActiveTab(route.tab);
  window.scrollTo(0, 0);

  await route.page(main, params[1]);
}
