import { API_BASE_URL } from "../config.js";
import { esc, stateBox, toast } from "../ui.js";

const backLink = `<a href="#/beranda" class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-label-lg shadow-sm hover:opacity-90 active:scale-95 transition-all">
  <span class="material-symbols-outlined text-[20px]">arrow_back</span>Kembali ke Beranda</a>`;

let mode = "login";

function formHTML() {
  const isLogin = mode === "login";
  return `
  <div class="max-w-md mx-auto px-gutter py-space-xl">
    <div class="text-center mb-8">
      <h1 class="font-headline-lg text-headline-lg text-on-surface font-bold">${isLogin ? "Masuk" : "Daftar"}</h1>
      <p class="font-body-md text-body-md text-on-surface-variant mt-2">
        ${isLogin ? "Masuk untuk mengelola resep favorit" : "Buat akun baru untuk mulai menggunakan NGESREP"}
      </p>
    </div>

    <form id="auth-form" class="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm space-y-4" novalidate>
      <div>
        <label for="email" class="block font-label-md text-label-md text-on-surface mb-1">Email</label>
        <input type="email" id="email" name="email" required autocomplete="email"
          class="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="contoh@email.com">
      </div>

      <div>
        <label for="password" class="block font-label-md text-label-md text-on-surface mb-1">Password</label>
        <input type="password" id="password" name="password" required autocomplete="${isLogin ? 'current-password' : 'new-password'}"
          class="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="${isLogin ? 'Masukkan password' : 'Minimal 6 karakter'}">
      </div>

      ${!isLogin ? `
      <div>
        <label for="confirmPassword" class="block font-label-md text-label-md text-on-surface mb-1">Konfirmasi Password</label>
        <input type="password" id="confirmPassword" name="confirmPassword" required autocomplete="new-password"
          class="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Ulangi password">
      </div>` : ""}

      <button type="submit" id="submit-btn"
        class="w-full py-3 px-4 rounded-xl bg-primary text-on-primary font-label-lg font-semibold shadow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
        ${isLogin ? "Masuk" : "Daftar"}
      </button>
    </form>

    <p class="text-center font-body-md text-body-md text-on-surface-variant mt-4">
      ${isLogin ? "Belum punya akun?" : "Sudah punya akun?"}
      <button type="button" id="toggle-mode" class="text-primary font-semibold ml-1">${isLogin ? "Daftar di sini" : "Masuk di sini"}</button>
    </p>

    <div class="mt-6 pt-4 border-t border-outline">
      ${backLink}
    </div>
  </div>`;
}

function setMode(newMode) {
  mode = newMode;
  const main = document.getElementById("app");
  main.innerHTML = formHTML();
  attachListeners(main);
}

function attachListeners(main) {
  const form = main.querySelector("#auth-form");
  const toggle = main.querySelector("#toggle-mode");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = main.querySelector("#submit-btn");
    const formData = new FormData(form);
    const email = formData.get("email").trim();
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (mode === "register" && password !== confirmPassword) {
      toast("Password tidak cocok");
      return;
    }

    btn.disabled = true;
    btn.textContent = mode === "login" ? "Memproses..." : "Mendaftar...";

    try {
      const endpoint = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Terjadi kesalahan");
      }

      // Simpan token
      localStorage.setItem("ngesrep_access_token", data.access_token);
      localStorage.setItem("ngesrep_refresh_token", data.refresh_token);

      toast(mode === "login" ? "Berhasil masuk" : "Registrasi berhasil");
      location.hash = "#/beranda";
    } catch (err) {
      toast(err.message);
      btn.disabled = false;
      btn.textContent = mode === "login" ? "Masuk" : "Daftar";
    }
  });

  toggle.addEventListener("click", () => {
    setMode(mode === "login" ? "register" : "login");
  });
}

export async function login(main) {
  main.innerHTML = formHTML();
  attachListeners(main);
}