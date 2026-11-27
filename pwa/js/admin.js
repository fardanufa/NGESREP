export async function adminRequest(path, { method = "GET", body, signal } = {}) {
  const type = body instanceof Blob ? body.type : "application/json";
  const response = await fetch(`/api/auth/admin/${path}`, {
    method, signal, cache: "no-store", redirect: "error",
    ...(body !== undefined && {
      headers: { "Content-Type": type },
      body: body instanceof Blob ? body : JSON.stringify(body),
    }),
  });
  if (response.status === 204) return;
  const data = await response.json().catch(() => null);
  if (!response.ok || !data) throw Object.assign(
    new Error(data?.error || "Layanan admin tidak tersedia. Coba lagi nanti."),
    { status: response.status },
  );
  return data;
}
