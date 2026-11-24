import { renderRoute } from "./router.js";

try {
  localStorage.removeItem("ngesrep_access_token");
  localStorage.removeItem("ngesrep_refresh_token");
} catch { /* Penyimpanan browser opsional. */ }

window.addEventListener("hashchange", renderRoute);

// Tombol lompat ke konten tidak boleh mengubah hash rute.
document.getElementById("skip-link").addEventListener("click", () => {
  document.getElementById("app").focus();
});

// Hash kosong diarahkan ke Beranda.
if (!location.hash) location.replace("#/beranda");
else renderRoute();

// Service worker didaftarkan setelah halaman siap.
window.addEventListener("load", () => {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js");
  }
});
