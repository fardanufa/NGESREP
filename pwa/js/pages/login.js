import { esc, toast } from "../ui.js";

const backLink = `<a href="#/beranda" class="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary font-label-lg shadow-sm hover:opacity-90 active:scale-95 transition-all">
  <span class="material-symbols-outlined text-[20px]">arrow_back</span>Kembali ke Beranda</a>`;

function formHTML(mode) {
  const isLogin = mode === "login";
  return `
  <div class="max-w-md mx-auto px-gutter py-space-xl">
    <div class="text-center mb-8">
      <h1 class="font-headline-lg text-headline-lg text-on-surface font-bold">${isLogin ? "Masuk" : "Daftar"}</h1>
      <p class="font-body-md text-body-md text-on-surface-variant mt-2">
        ${isLogin ? "Masuk ke akun NGESREP" : "Buat akun NGESREP dengan email"}
      </p>
    </div>

    <form id="auth-form" class="bg-surface-container-lowest rounded-2xl p-space-lg shadow-sm space-y-4">
      <div>
        <label for="email" class="block font-label-md text-label-md text-on-surface mb-1">Email</label>
        <input type="email" id="email" name="email" required maxlength="254" autocomplete="username"
          class="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline text-on-surface placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="contoh@email.com">
      </div>

      <div>
        <label for="password" class="block font-label-md text-label-md text-on-surface mb-1">Password</label>
        <input type="password" id="password" name="password" required maxlength="256" ${isLogin ? "" : 'minlength="6"'} autocomplete="${isLogin ? 'current-password' : 'new-password'}"
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

async function account(action, signal, body) {
  const res = await fetch(`/api/auth/${action}`, action === "me" ? { signal } : {
    signal, method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body ?? {}),
  });
  if (res.status === 204) return;
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(data.error || "Layanan akun belum tersedia."), { status: res.status });
  return data;
}

function showForm(main, mode, signal) {
  main.innerHTML = formHTML(mode);
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
    toggle.disabled = true;
    btn.textContent = mode === "login" ? "Memproses..." : "Mendaftar...";

    try {
      const data = await account(mode, signal, { email, password });
      if (signal.aborted) return;
      if (data.needsConfirmation) {
        showForm(main, "login", signal);
        main.querySelector("#email").value = email;
        toast("Cek email untuk konfirmasi, lalu masuk.");
      } else showAccount(main, data.email, signal);
    } catch (err) {
      if (signal.aborted) return;
      toast(err.status ? err.message : "Tidak dapat menghubungi layanan akun.");
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
  main.innerHTML = `<section class="w-full max-w-md mx-auto px-gutter py-space-xl space-y-4">
    <h1 class="font-headline-lg text-headline-lg">Akun NGESREP</h1>
    <p class="break-all">Masuk sebagai ${esc(email)}</p>
    <button type="button" class="px-6 py-3 rounded-full bg-primary text-on-primary">Keluar</button>
  </section>`;
  const button = main.querySelector("button");
  button.onclick = async () => {
    button.disabled = true;
    try {
      await account("logout", signal);
      if (!signal.aborted) showForm(main, "login", signal);
    } catch {
      if (signal.aborted) return;
      toast("Gagal keluar. Coba lagi saat terhubung.");
      button.disabled = false;
    }
  };
}

export async function login(main, _id, signal) {
  main.textContent = "Memeriksa sesi…";
  try {
    const data = await account("me", signal).catch((err) => {
      if (err.status !== 401) throw err;
      return account("refresh", signal);
    });
    if (!signal.aborted) showAccount(main, data.email, signal);
  } catch (err) {
    if (signal.aborted) return;
    showForm(main, "login", signal);
    if (err.status !== 401) toast("Layanan akun belum tersedia. Coba lagi nanti.");
  }
}
