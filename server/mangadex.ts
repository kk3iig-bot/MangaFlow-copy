import type { Express, Request, Response } from "express";

const API = "https://api.mangadex.org";
const USER_AGENT = "MangaFlow/0.1 (public manga browser)";
const UUID = "[0-9a-fA-F-]{36}";
const MAX_IMAGE_BYTES = 32 * 1024 * 1024;
const MAX_CONCURRENT_IMAGES = 12;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);
const cache = new Map<string, { expires: number; value: unknown }>();
const imageMetaCache = new Map<string, { expires: number; value: any }>();
let nextRequestAt = 0;
let activeImageRequests = 0;

async function waitForApiSlot() {
  const now = Date.now();
  const wait = Math.max(0, nextRequestAt - now);
  nextRequestAt = Math.max(now, nextRequestAt) + 240;
  if (wait) await new Promise(resolve => setTimeout(resolve, wait));
}

function setCors(res: Response) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("X-Content-Type-Options", "nosniff");
}

function isAllowedApiPath(path: string) {
  return path === "/manga" || path === "/manga/tag" ||
    new RegExp(`^/chapter/${UUID}$`).test(path) ||
    new RegExp(`^/manga/${UUID}$`).test(path) ||
    new RegExp(`^/manga/${UUID}/feed$`).test(path) ||
    new RegExp(`^/at-home/server/${UUID}$`).test(path);
}

function safeFile(value: string) {
  return /^[a-zA-Z0-9._-]{1,240}$/.test(value) && !value.includes("..") && !value.startsWith(".");
}

function sendError(res: Response, status: number, message: string) {
  res.status(status).json({ error: message });
}

async function fetchJson(url: string, key: string, ttlMs: number) {
  const saved = cache.get(key);
  if (saved && saved.expires > Date.now()) return saved.value;
  await waitForApiSlot();
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    const error = new Error(`MangaDex returned ${response.status}`) as Error & { status?: number; retryAfter?: string };
    error.status = response.status;
    error.retryAfter = response.headers.get("retry-after") ?? undefined;
    throw error;
  }
  const body = await response.json();
  cache.set(key, { expires: Date.now() + ttlMs, value: body });
  if (cache.size > 500) {
    const firstKey = cache.keys().next().value;
    if (firstKey) cache.delete(firstKey);
  }
  return body;
}

async function fetchImage(url: string, res: Response) {
  if (activeImageRequests >= MAX_CONCURRENT_IMAGES) {
    res.setHeader("Retry-After", "2");
    return sendError(res, 503, "خدمة الصور مشغولة الآن. أعد المحاولة بعد لحظات.");
  }
  activeImageRequests += 1;
  try {
    const upstream = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "image/avif,image/webp,image/*,*/*;q=0.8" },
      signal: AbortSignal.timeout(20000),
    });
    if (!upstream.ok) {
      if (upstream.status === 429) res.setHeader("Retry-After", upstream.headers.get("retry-after") ?? "5");
      return sendError(res, upstream.status, "تعذر تحميل الصورة من MangaDex.");
    }
    const type = (upstream.headers.get("content-type") ?? "image/jpeg").split(";", 1)[0].trim().toLowerCase();
    if (!allowedImageTypes.has(type)) return sendError(res, 502, "صيغة الصورة غير مدعومة.");
    const declaredLength = Number(upstream.headers.get("content-length") ?? 0);
    if (Number.isFinite(declaredLength) && declaredLength > MAX_IMAGE_BYTES) {
      void upstream.body?.cancel().catch(() => undefined);
      return sendError(res, 413, "حجم الصورة يتجاوز الحد المسموح.");
    }
    if (!upstream.body) return sendError(res, 502, "استجابة الصورة فارغة.");
    const reader = upstream.body.getReader();
    const chunks: Buffer[] = [];
    let totalBytes = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_IMAGE_BYTES) {
        await reader.cancel().catch(() => undefined);
        return sendError(res, 413, "حجم الصورة يتجاوز الحد المسموح.");
      }
      chunks.push(Buffer.from(value));
    }
    const buffer = Buffer.concat(chunks, totalBytes);
    res.status(200);
    res.setHeader("Content-Type", type);
    res.setHeader("Content-Length", String(buffer.byteLength));
    res.setHeader("Cache-Control", "public, max-age=1800, stale-while-revalidate=3600");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.send(buffer);
  } finally {
    activeImageRequests -= 1;
  }
}

export function registerMangaDexRoutes(app: Express) {
  app.options("/api/mangadex/*", (_req, res) => { setCors(res); res.status(204).end(); });

  app.get("/api/mangadex/*", async (req: Request, res: Response) => {
    setCors(res);
    const path = req.path.replace(/^\/api\/mangadex/, "");
    const imageMatch = path.match(new RegExp(`^/page/(${UUID})/(data|data-saver)/([0-9a-fA-F]{16,64})/([^/]+)$`));
    const coverMatch = path.match(new RegExp(`^/cover/(${UUID})/([^/]+)$`));

    try {
      if (imageMatch) {
        const [, chapterId, quality, hash, filename] = imageMatch;
        if (!safeFile(filename)) return sendError(res, 400, "اسم ملف غير صالح.");
        let meta = imageMetaCache.get(chapterId)?.value;
        if (!meta || imageMetaCache.get(chapterId)!.expires <= Date.now()) {
          meta = await fetchJson(`${API}/at-home/server/${chapterId}`, `at-home:${chapterId}`, 12 * 60 * 1000);
          imageMetaCache.set(chapterId, { expires: Date.now() + 12 * 60 * 1000, value: meta });
        }
        const base = typeof meta?.baseUrl === "string" ? meta.baseUrl : "";
        const chapter = meta?.chapter;
        const accepted = quality === "data" ? chapter?.data : chapter?.dataSaver;
        if (!base.startsWith("https://") || chapter?.hash !== hash || !Array.isArray(accepted) || !accepted.includes(filename)) {
          return sendError(res, 400, "بيانات صفحة الفصل غير صالحة.");
        }
        const imageUrl = `${base.replace(/\/+$/, "")}/${quality}/${hash}/${encodeURIComponent(filename)}`;
        return await fetchImage(imageUrl, res);
      }

      if (coverMatch) {
        const [, mangaId, filename] = coverMatch;
        if (!safeFile(filename)) return sendError(res, 400, "اسم غلاف غير صالح.");
        return await fetchImage(`https://uploads.mangadex.org/covers/${mangaId}/${encodeURIComponent(filename)}`, res);
      }

      if (!isAllowedApiPath(path)) return sendError(res, 404, "مسار MangaDex غير متاح.");
      const rawQuery = req.originalUrl.split("?", 2)[1] ?? "";
      const query = new URLSearchParams(rawQuery);
      const target = `${API}${path}${query.size ? `?${query.toString()}` : ""}`;
      const ttl = path === "/manga/tag" ? 6 * 60 * 60 * 1000 : path.startsWith("/at-home/") ? 12 * 60 * 1000 : 45 * 1000;
      const result = await fetchJson(target, target, ttl);
      res.setHeader("Cache-Control", "public, max-age=20, stale-while-revalidate=30");
      res.json(result);
    } catch (error) {
      const failure = error as Error & { status?: number; retryAfter?: string };
      if (failure.status === 429) {
        res.setHeader("Retry-After", failure.retryAfter ?? "5");
        return sendError(res, 429, "تجاوزت الطلبات الحد المؤقت لدى MangaDex. انتظر قليلًا ثم أعد المحاولة.");
      }
      console.error("[MangaDex proxy]", failure.message);
      return sendError(res, 502, "تعذر الاتصال بخدمة MangaDex. حاول مرة أخرى بعد قليل.");
    }
  });
}
