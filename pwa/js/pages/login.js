import { backLink, esc, loadingBox, toast } from "../ui.js";
import { account } from "../account.js";
import { refreshFavorites, setFavoriteAccount, withFavoritesLock } from "../favorites.js";

function formHTML(mode) {
  const isLogin = mode === "login";
  return `
  <div class="max-w-md mx-auto px-gutter py-space-xl">
    <div class="text-center mb-8">
      <img src="icons/icon-192.png" alt="NGESREP" class="h-16 w-16 mx-auto mb-4 object-contain" onerror="this.remove()">
      <h1 class="font-headline-lg text-headline-lg text-on-surface font-bold">${isLogin ? "Masuk" : "Daftar"}</h1>
      <p class="font-body-md text-body-md text-on-surface-variant mt-2">
        ${isLogin ? "Masuk ke akun NGESREP" : "Buat akun NGESREP dengan email"}
      </p>
    </div>

    <form id="auth-form" method="post" class="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm space-y-4">
      <p id="form-error" role="alert" class="hidden rounded-xl bg-error-container text-on-error-container px-3 py-2 font-body-sm text-body-sm"></p>

      <div>
        <label for="email" class="block font-label-md text-label-md text-on-surface mb-1">Email</label>
        <input type="email" id="email" name="email" required maxlength="254" autocomplete="username"
          class="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="contoh@email.com">
      </div>

      <div>
        <label for="password" class="block font-label-md text-label-md text-on-surface mb-1">Password</label>
        <input type="password" id="password" name="password" required maxlength="256" ${isLogin ? "" : 'minlength="6" aria-describedby="password-hint"'} autocomplete="${isLogin ? 'current-password' : 'new-password'}"
          class="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="${isLogin ? 'Masukkan password' : 'Minimal 6 karakter'}">
        ${!isLogin ? `<p id="password-hint" class="font-body-sm text-body-sm text-on-surface-variant mt-1">Minimal 6 karakter.</p>` : ""}
      </div>

      ${!isLogin ? `
      <div>
        <label for="confirmPassword" class="block font-label-md text-label-md text-on-surface mb-1">Konfirmasi Password</label>
        <input type="password" id="confirmPassword" name="confirmPassword" required minlength="6" autocomplete="new-password"
          class="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Ulangi password">
      </div>` : ""}

      <button type="submit" id="submit-btn"
        class="w-full py-3 px-4 rounded-xl bg-primary text-on-primary font-label-lg font-semibold shadow-sm hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
        ${isLogin ? "Masuk" : "Daftar"}
      </button>
    </form>

    <p class="text-center font-body-md text-body-md text-on-surface-variant mt-4">
      ${isLogin ? "Belum punya akun?" : "Sudah punya akun?"}
      <button type="button" id="toggle-mode" class="text-primary font-semibold ml-1 py-1">${isLogin ? "Daftar di sini" : "Masuk di sini"}</button>
    </p>

    <div class="mt-6 pt-4 border-t border-outline">
      ${backLink("#/beranda", "Kembali ke Beranda")}
    </div>
  </div>`;
}

function showForm(main, mode, signal) {
  document.title = "Masuk / Daftar · NGESREP";
  main.innerHTML = formHTML(mode);
  const form = main.querySelector("#auth-form");
  const toggle = main.querySelector("#toggle-mode");
  const error = main.querySelector("#form-error");

  function showError(message, field) {
    error.textContent = message;
    error.classList.remove("hidden");
    form.querySelectorAll("input").forEach((input) => input.removeAttribute("aria-invalid"));
    if (field) {
      field.setAttribute("aria-invalid", "true");
      field.focus();
    }
  }

  form.addEventListener("input", () => {
    error.classList.add("hidden");
    form.querySelectorAll("[aria-invalid]").forEach((input) => input.removeAttribute("aria-invalid"));
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = main.querySelector("#submit-btn");
    const formData = new FormData(form);
    const email = formData.get("email").trim();
    const password = formData.get("password");
    const confirmPassword = formData.get("confirmPassword");

    if (mode === "register" && password !== confirmPassword) {
      showError("Password dan konfirmasi password tidak sama.", main.querySelector("#confirmPassword"));
      return;
    }

    btn.disabled = true;
    toggle.disabled = true;
    btn.textContent = mode === "login" ? "Memproses..." : "Mendaftar...";

    try {
      const data = await withFavoritesLock(async () => {
        const user = await account(mode, signal, { email, password });
        if (user.id) setFavoriteAccount(user.id);
        return user;
      });
      if (signal.aborted) return;
      if (data.needsConfirmation) {
        showForm(main, "login", signal);
        main.querySelector("#email").value = email;
        toast("Cek email untuk konfirmasi, lalu masuk.");
      } else {
        showAccount(main, data.email, signal);
        void refreshFavorites(signal).catch(() => {
          if (!signal.aborted) toast("Favorit belum tersinkron. Buka Favorit untuk mencoba lagi.");
        });
      }
    } catch (err) {
      if (signal.aborted) return;
      showError(err.status ? err.message : "Tidak dapat menghubungi layanan akun. Periksa koneksi lalu coba lagi.");
      btn.disabled = false;
      toggle.disabled = false;
      btn.textContent = mode === "login" ? "Masuk" : "Daftar";
    }
  });

  toggle.addEventListener("click", () => {
    showForm(main, mode === "login" ? "register" : "login", signal);
    main.querySelector("#email").focus();
  });
}

function showAccount(main, email, signal) {
  document.title = "Akun · NGESREP";
  main.innerHTML = `<section class="w-full max-w-md mx-auto px-gutter py-space-xl space-y-4">
    <h1 class="font-headline-lg text-headline-lg">Akun NGESREP</h1>
    <p class="break-all">Masuk sebagai ${esc(email)}</p>
    <div class="flex flex-wrap items-center gap-2">
      ${backLink("#/beranda", "Ke Beranda")}
      <button type="button" class="min-h-11 rounded-full bg-surface-container-low px-6 py-3 text-on-surface hover:bg-surface-container-high focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary disabled:opacity-50">Keluar</button>
    </div>
  </section>`;
  const button = main.querySelector("button");
  button.onclick = async () => {
    button.disabled = true;
    try {
      await withFavoritesLock(async () => {
        await account("logout", signal, {});
        setFavoriteAccount();
      });
      if (!signal.aborted) showForm(main, "login", signal);
    } catch {
      if (signal.aborted) return;
      toast("Gagal keluar. Coba lagi saat terhubung.");
      button.disabled = false;
    }
  };
}

export async function login(main, _id, signal) {
  main.innerHTML = loadingBox("Memeriksa sesi…");
  try {
    const data = await withFavoritesLock(async () => {
      try {
        const user = await account("me", signal).catch((err) => {
          if (err.status !== 401) throw err;
          return account("refresh", signal, {});
        });
        setFavoriteAccount(user.id);
        return user;
      } catch (err) {
        if (err.status === 401) setFavoriteAccount();
        throw err;
      }
    });
    if (!signal.aborted) showAccount(main, data.email, signal);
  } catch (err) {
    if (signal.aborted) return;
    showForm(main, "login", signal);
    if (err.status !== 401) toast("Layanan akun belum tersedia. Coba lagi nanti.");
  }
}
