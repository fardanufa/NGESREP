export async function account(path, signal, body, method = body === undefined ? "GET" : "POST", userId) {
  const res = await fetch(`/api/auth/${path}`, {
    method, cache: "no-store", signal: signal
      ? AbortSignal.any([signal, AbortSignal.timeout(10000)]) : AbortSignal.timeout(10000),
    headers: {
      ...(body !== undefined && { "Content-Type": "application/json" }),
      ...(userId && { "X-Favorites-User": userId }),
    },
    body: JSON.stringify(body),
  });
  if (res.status === 204) return;
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) throw Object.assign(
    new Error(data?.error || "Layanan akun belum tersedia."), { status: res.status },
  );
  return data;
}
