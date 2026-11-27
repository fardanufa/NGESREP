import { account } from "../account.js";
import { FAVORITE_ACCOUNT_KEY, withFavoritesLock } from "../favorites.js";
import { esc } from "../ui.js";

const primary = "min-h-11 inline-flex items-center justify-center rounded-full bg-primary text-on-primary px-5 py-2 font-label-lg text-label-lg hover:opacity-90 disabled:opacity-50";
const secondary = "min-h-11 inline-flex items-center justify-center rounded-full bg-surface-container-low px-5 py-2 font-label-lg text-label-lg hover:bg-surface-container-high disabled:opacity-50";

function withSession(run, signal) {
  return withFavoritesLock(async () => {
    try {
      return await run();
    } catch (error) {
      if (error.status !== 401) throw error;
      await account("refresh", signal, {});
      return run();
    }
  });
}

async function resizePhoto(file) {
  if (file.size > 5 * 1024 * 1024 || !["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("Pilih foto JPEG, PNG, atau WebP hingga 5 MB.");
  }
  let bitmap;
  try {
    bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 192;
    const ctx = canvas.getContext("2d");
    const side = Math.min(bitmap.width, bitmap.height);
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, 192, 192);
    ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, 192, 192);
    const avatar = canvas.toDataURL("image/jpeg", 0.85);
    if (!avatar.startsWith("data:image/jpeg;base64,") || avatar.length > 64000) throw new Error();
    return avatar;
  } catch {
    throw new Error("Foto tidak bisa diproses. Pilih foto lain.");
  } finally {
    bitmap?.close();
  }
}

function showProfile(card, user, signal, message = "") {
  const name = user.display_name || "Profil saya";
  card.innerHTML = `
    <div class="flex items-center gap-space-md">
      <div class="relative w-16 h-16 rounded-full bg-primary-fixed flex items-center justify-center overflow-hidden shrink-0">
        <span aria-hidden="true" class="material-symbols-outlined text-[36px] text-primary">account_circle</span>
        ${user.avatar?.startsWith("data:image/jpeg;base64,") ? `<img class="absolute inset-0 w-full h-full object-cover" src="${esc(user.avatar)}" alt="" onerror="this.remove()">` : ""}
      </div>
      <div class="min-w-0">
        <h2 class="font-headline-sm text-headline-sm break-words">${esc(name)}</h2>
        <p class="font-body-sm text-body-sm text-on-surface-variant break-all">${esc(user.email)}</p>
        ${user.nim ? `<p class="font-body-sm text-body-sm text-on-surface-variant break-words">NIM ${esc(user.nim)}</p>` : ""}
      </div>
    </div>
    <div class="flex flex-wrap gap-2">
      <button type="button" class="${primary}">Edit profil</button>
      <a href="#/login" class="${secondary}">Kelola akun</a>
    </div>
    <p role="status" class="font-body-sm text-body-sm text-secondary" ${message ? "" : "hidden"}>${message}</p>`;
  card.querySelector("button").onclick = () => editProfile(card, user, signal);
}

function editProfile(card, user, signal) {
  card.innerHTML = `
    <h2 class="font-headline-sm text-headline-sm">Edit profil</h2>
    <form method="post" class="space-y-4">
      <div>
        <label for="display-name" class="block font-label-md text-label-md mb-1">Nama tampilan</label>
        <input id="display-name" autocomplete="nickname" required maxlength="60" value="${esc(user.display_name)}"
          class="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline focus:outline-none focus:ring-2 focus:ring-primary">
      </div>
      <div>
        <label for="profile-nim" class="block font-label-md text-label-md mb-1">NIM (opsional)</label>
        <input id="profile-nim" inputmode="numeric" pattern="[0-9]{1,30}" maxlength="30" value="${esc(user.nim)}"
          aria-describedby="nim-hint" class="w-full px-4 py-3 rounded-xl bg-surface-container border border-outline focus:outline-none focus:ring-2 focus:ring-primary">
        <p id="nim-hint" class="font-body-sm text-body-sm text-on-surface-variant">Gunakan angka saja, maksimal 30 digit.</p>
      </div>
      <div>
        <label for="profile-photo" class="block font-label-md text-label-md mb-1">Foto profil</label>
        <input type="file" id="profile-photo" accept="image/jpeg,image/png,image/webp" aria-describedby="photo-hint"
          class="block w-full max-w-full py-2 text-body-sm">
        <p id="photo-hint" class="font-body-sm text-body-sm text-on-surface-variant">JPEG, PNG, atau WebP hingga 5 MB. Kosongkan jika tidak ingin mengganti foto.</p>
      </div>
      <p role="alert" class="font-body-sm text-body-sm text-error" hidden></p>
      <div class="flex flex-wrap gap-2">
        <button type="submit" class="${primary}">Simpan</button>
        <button type="button" class="${secondary}">Batal</button>
      </div>
    </form>`;
  const form = card.querySelector("form");
  const name = form.querySelector("#display-name");
  const nim = form.querySelector("#profile-nim");
  const photo = form.querySelector("#profile-photo");
  const alert = form.querySelector("[role=alert]");
  const [save, cancel] = form.querySelectorAll("button");
  const finish = (message) => {
    showProfile(card, user, signal, message);
    card.querySelector("button").focus();
  };
  cancel.onclick = () => finish();
  name.focus();

  form.onsubmit = async (event) => {
    event.preventDefault();
    if (save.disabled) return;
    alert.hidden = true;
    const displayName = name.value.trim();
    const studentId = nim.value.trim();
    const file = photo.files[0];
    if (!displayName) {
      alert.textContent = "Isi nama tampilan.";
      alert.hidden = false;
      name.focus();
      return;
    }
    for (const control of form.elements) control.disabled = true;
    save.textContent = "Menyimpan…";
    let photoError;
    try {
      const avatar = file && await resizePhoto(file).catch((error) => {
        photoError = error.message;
        throw error;
      });
      signal.throwIfAborted();
      user = await withSession(() => account("profile", signal, {
        id: user.id, display_name: displayName, nim: studentId, avatar,
      }, "PUT"), signal);
      if (!signal.aborted) finish("Profil tersimpan.");
    } catch (error) {
      if (signal.aborted) return;
      alert.textContent = photoError || (error.status === 401 ? "Sesi berakhir. Klik Batal, lalu masuk lagi lewat Kelola akun."
        : error.status ? error.message : "Profil belum tersimpan. Periksa koneksi, lalu coba lagi.");
      alert.hidden = false;
    } finally {
      for (const control of form.elements) control.disabled = false;
      save.textContent = "Simpan";
    }
  };
}

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
      <span aria-hidden="true" class="material-symbols-outlined text-[18px] text-primary">${icon}</span>
    </div>
    <span class="font-label-md text-label-md text-on-surface truncate">${label}</span>
  </div>`;
}

export async function profil(main, _id, signal) {
  main.innerHTML = `
  <div class="flex flex-col w-full px-gutter md:px-6 max-w-4xl mx-auto gap-space-md pb-6">
    <div class="flex items-center gap-space-xs pt-space-xs">
      <span aria-hidden="true" class="material-symbols-outlined text-primary text-[20px]">badge</span>
      <h1 class="font-headline-lg text-headline-lg text-on-surface">Profil</h1>
    </div>

    <section id="account-profile" aria-label="Profil akun" class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-4"></section>

    <section class="bg-surface-container-lowest rounded-xl p-space-md shadow-sm space-y-space-md">
      <div class="flex items-center gap-space-md pb-space-xs">
        <div class="h-12 w-12 rounded-xl overflow-hidden shrink-0 flex items-center justify-center bg-surface-container-low p-1 shadow-sm">
          <img src="icons/icon-192.png" alt="NGESREP" class="h-10 w-10 object-contain" onerror="this.remove()">
        </div>
        <div>
          <h2 class="font-headline-sm text-headline-sm text-on-surface">Tentang NGESREP</h2>
          <p class="font-label-sm text-label-sm text-primary">Solusi Masak Sehat &amp; Ramah Kantong</p>
        </div>
      </div>

      <p class="font-body-md text-body-md text-on-surface-variant leading-relaxed">
        NGESREP adalah aplikasi panduan memasak mandiri untuk mahasiswa kos di Semarang.
        Isinya resep lezat dengan bahan terjangkau dan langkah memasak yang singkat.
      </p>

      <div class="p-space-sm rounded-lg bg-surface-container-low space-y-space-xs">
        <div class="flex items-start gap-space-xs">
          <span aria-hidden="true" class="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">location_on</span>
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
        <span aria-hidden="true" class="material-symbols-outlined text-primary text-[18px] shrink-0 mt-0.5">auto_awesome</span>
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
        <span aria-hidden="true" class="material-symbols-outlined text-primary text-[20px]">code</span>
        <h2 class="font-headline-sm text-headline-sm text-on-surface">Teknologi Aplikasi</h2>
      </div>
      <div class="grid grid-cols-2 md:grid-cols-3 gap-space-sm pt-space-xs">${TECH.map(techItem).join("")}</div>
      <div class="flex items-center gap-space-sm p-space-sm rounded-lg bg-secondary-container/30 text-on-secondary-container mt-1">
        <div class="w-7 h-7 rounded-md bg-secondary-container flex items-center justify-center shrink-0">
          <span aria-hidden="true" class="material-symbols-outlined text-[18px] text-on-secondary-container">install_mobile</span>
        </div>
        <div class="min-w-0">
          <span class="font-label-md text-label-md block font-semibold">Progressive Web App (PWA)</span>
          <span class="font-body-sm text-body-sm opacity-80 block">Dapat di-install &amp; diakses luring</span>
        </div>
      </div>
    </section>

    <section class="space-y-space-md pt-space-xs">
      <a href="https://github.com/fardanufa/NGESREP" target="_blank" rel="noopener noreferrer"
        class="w-full flex items-center justify-center gap-2 py-3 px-space-md rounded-full bg-surface-container-high hover:bg-surface-container text-primary font-label-lg text-label-lg transition-transform active:scale-95 shadow-sm">
        <span aria-hidden="true" class="material-symbols-outlined text-[20px]">code</span>
        <span>Lihat di GitHub</span>
      </a>
      <div class="text-center space-y-1">
        <div class="inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-surface-container text-on-surface-variant font-label-sm text-label-sm">
          <span class="w-1.5 h-1.5 rounded-full bg-secondary"></span>
          <span>Versi 1.0.0</span>
        </div>
        <p class="font-body-sm text-body-sm text-on-surface-variant flex items-center justify-center gap-1">
          Dibuat dengan
          <span aria-hidden="true" class="material-symbols-outlined text-[14px] text-primary" style="font-variation-settings: 'FILL' 1;">favorite</span>
          untuk anak kos
        </p>
      </div>
    </section>
  </div>`;

  const card = main.querySelector("#account-profile");
  let current;
  async function load() {
    current?.abort();
    current = new AbortController();
    const request = AbortSignal.any([signal, current.signal]);
    card.innerHTML = `<p role="status" class="text-on-surface-variant">Memeriksa akun…</p>`;
    try {
      const user = await withSession(() => account("profile", request), request);
      if (!request.aborted) showProfile(card, user, request);
    } catch (error) {
      if (request.aborted) return;
      const guest = error.status === 401;
      card.innerHTML = `
        <h2 class="font-headline-sm text-headline-sm">Profil saya</h2>
        <p class="font-body-md text-body-md text-on-surface-variant">${guest
          ? "Masuk untuk mengatur nama, foto, dan NIM."
          : "Profil belum bisa dimuat. Periksa koneksi, lalu coba lagi."}</p>
        ${guest ? `<a href="#/login" class="${primary}">Akun · Masuk / Daftar</a>`
          : `<div class="flex flex-wrap gap-2"><button type="button" class="${primary}">Coba lagi</button>
            <a href="#/login" class="${secondary}">Kelola akun</a></div>`}`;
      if (!guest) card.querySelector("button").onclick = load;
    }
  }
  window.addEventListener("storage", (event) => {
    if (event.key !== FAVORITE_ACCOUNT_KEY) return;
    const idOf = (value) => {
      try { return JSON.parse(value)?.id; } catch { return undefined; }
    };
    if (idOf(event.oldValue) !== idOf(event.newValue)) void load();
  }, { signal });
  await load();
}
