// Alamat API publik untuk PWA.
export const API_BASE_URL = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "" : "https://ngesrep-7xy6.vercel.app";

export const PROFILE = {
  nama: "Fardanu Fibri Alfarizi",
  nim: "21120124110105",
  kelas: "Prak PPB",
  kampus: "Universitas Diponegoro",
  foto: "images/profile.jpg",
  github: "https://github.com/fardanufa/NGESREP",
};
