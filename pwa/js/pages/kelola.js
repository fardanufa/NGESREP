import { adminRequest } from "../admin.js";
import { loadingBox } from "../ui.js";

const field = "block w-full min-h-11 rounded-xl border border-outline bg-surface px-3 py-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary";

export async function kelola(main, _id, signal) {
  const request = (options) => adminRequest("session", {
    ...options, signal: AbortSignal.any([signal, AbortSignal.timeout(20000)]),
  });
  main.innerHTML = `<section class="mx-auto w-full max-w-3xl space-y-4 px-gutter py-space-lg">
    <h1 class="sr-only">Masuk admin</h1>
    <p role="alert" class="hidden rounded-xl bg-error-container px-4 py-3 text-on-error-container"></p>
    <div data-panel>${loadingBox("Memeriksa sesi admin…")}</div>
  </section>`;
  const panel = main.querySelector("[data-panel]");
  const alert = main.querySelector("[role=alert]");
  const showError = (message = "") => {
    alert.textContent = message;
    alert.classList.toggle("hidden", !message);
  };
  const goHome = () => { if (!signal.aborted) location.replace("#/beranda"); };
  const serviceError = (error) => error.status ? error.message : "Tidak dapat menghubungi layanan admin. Periksa koneksi lalu coba lagi.";

  try {
    await request();
    goHome();
    return;
  } catch (error) {
    if (signal.aborted) return;
    if (error.status !== 401) showError(serviceError(error));
  }

  panel.innerHTML = `<form method="post" class="max-w-md space-y-4 rounded-2xl bg-surface-container-lowest p-5">
    <div class="space-y-1">
      <h2 class="font-headline-sm text-headline-sm">Masuk sebagai admin</h2>
      <p class="text-on-surface-variant">Masuk untuk menambah, mengubah, dan menghapus resep di Beranda.</p>
    </div>
    <div>
      <label for="catalog-email" class="mb-1 block text-sm font-semibold">Email</label>
      <input id="catalog-email" class="${field}" name="email" type="email" autocomplete="username" autocapitalize="none" maxlength="254" required>
    </div>
    <div>
      <label for="catalog-password" class="mb-1 block text-sm font-semibold">Kata sandi</label>
      <input id="catalog-password" class="${field}" name="password" type="password" autocomplete="current-password" maxlength="256" required>
    </div>
    <button type="submit" class="min-h-11 rounded-full bg-primary px-4 py-2 font-semibold text-on-primary hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50">Masuk</button>
  </form>`;
  const form = panel.querySelector("form");
  const email = form.elements.namedItem("email");
  const password = form.elements.namedItem("password");
  const submit = form.querySelector("button");
  form.onsubmit = async (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    submit.disabled = true;
    submit.textContent = "Sedang masuk…";
    showError();
    const body = { email: email.value, password: password.value };
    password.value = "";
    try {
      await request({ method: "POST", body });
      goHome();
    } catch (error) {
      if (signal.aborted) return;
      showError(serviceError(error));
      submit.disabled = false;
      submit.textContent = "Masuk";
      password.focus();
    }
  };
}
