export type LocalizedText = Record<string, string>;
export type MangaTag = { id: string; attributes: { name: LocalizedText; group: string } };
export type Relationship = { id: string; type: string; attributes?: { fileName?: string; name?: string } };
export type Manga = {
  id: string;
  attributes: {
    title: LocalizedText;
    altTitles?: LocalizedText[];
    description?: LocalizedText;
    status?: string;
    year?: number | null;
    contentRating?: string;
    averageRating?: string;
    originalLanguage?: string;
    lastChapter?: string | null;
    tags?: MangaTag[];
    availableTranslatedLanguages?: string[];
  };
  relationships?: Relationship[];
};
export type Chapter = {
  id: string;
  attributes: {
    chapter?: string | null;
    title?: string | null;
    volume?: string | null;
    translatedLanguage?: string;
    pages?: number;
    publishAt?: string;
    externalUrl?: string | null;
  };
  relationships?: Relationship[];
};
export type ApiResponse<T> = { data: T[]; total: number; limit: number; offset: number };
export type Tag = { id: string; attributes: { name: LocalizedText; group: string } };

export function pickTextInfo(value?: LocalizedText | null): { text: string; language?: string } {
  if (!value) return { text: "" };
  for (const language of ["ar", "ar-ro", "en"]) {
    if (value[language]) return { text: value[language], language };
  }
  const entry = Object.entries(value).find(([, text]) => Boolean(text));
  return entry ? { text: entry[1], language: entry[0] } : { text: "" };
}

export function pickText(value?: LocalizedText | null) {
  return pickTextInfo(value).text;
}

export function mangaTitle(manga: Manga) {
  return pickText(manga.attributes.title) || "عمل بلا عنوان";
}

const arabicTags: Record<string, string> = {
  action: "أكشن", adventure: "مغامرة", comedy: "كوميديا", drama: "دراما", fantasy: "فانتازيا",
  horror: "رعب", mystery: "غموض", romance: "رومانسي", "sci-fi": "خيال علمي", thriller: "إثارة",
  historical: "تاريخي", psychological: "نفسي", sports: "رياضة", tragedy: "مأساة", crime: "جريمة",
  mecha: "ميكا", "boys' love": "حب الفتيان", "girls' love": "حب الفتيات", superhero: "أبطال خارقون",
  "magical girls": "فتيات سحريات", wuxia: "ووشيا", philosophical: "فلسفي", medical: "طبي",
  "slice of life": "حياة يومية", isekai: "إيسيكاي", "school life": "حياة مدرسية",
  reincarnation: "تناسخ", "time travel": "سفر عبر الزمن", genderswap: "تبديل الأدوار الجندرية",
  loli: "لولي", "traditional games": "ألعاب تقليدية", monsters: "وحوش", demons: "شياطين",
  ghosts: "أشباح", animals: "حيوانات", ninja: "نينجا", "incest": "علاقات بين الأقارب",
  survival: "بقاء", zombies: "زومبي", "reverse harem": "هاريم عكسي", "martial arts": "فنون قتالية",
  samurai: "ساموراي", mafia: "مافيا", "virtual reality": "واقع افتراضي", "office workers": "موظفو مكاتب",
  "video games": "ألعاب فيديو", "post-apocalyptic": "ما بعد الكارثة", crossdressing: "تنكر بملابس الجنس الآخر",
  magic: "سحر", harem: "حريم", military: "عسكري", mahjong: "ماجونغ", villainess: "بطلة شريرة",
  vampires: "مصاصو دماء", delinquents: "جانحون", "monster girls": "فتيات وحشيات", shota: "شوتا",
  police: "شرطة", aliens: "كائنات فضائية", cooking: "طبخ", supernatural: "ما وراء الطبيعة",
  music: "موسيقى", gyaru: "غيّارو", school: "مدرسي", "full color": "ملون", "web comic": "كوميك ويب",
  "long strip": "ويب تون طولي", shounen: "شونين", shoujo: "شوجو", seinen: "سينين", josei: "جوسي",
  yaoi: "ياوي", yuri: "يوري",
};

export function tagLabel(tag: MangaTag | Tag) {
  const local = tag.attributes.name.ar || tag.attributes.name["ar-ro"];
  const source = local || tag.attributes.name.en || Object.values(tag.attributes.name)[0] || "";
  return arabicTags[source.trim().toLowerCase().replace(/\s+/g, " ")] || source;
}

const languageNames: Record<string, string> = {
  ar: "العربية", en: "الإنجليزية", ja: "اليابانية", fr: "الفرنسية", es: "الإسبانية",
  "es-la": "الإسبانية اللاتينية", "pt-br": "البرتغالية البرازيلية", pt: "البرتغالية", zh: "الصينية",
  "zh-hk": "الصينية التقليدية", ko: "الكورية", it: "الإيطالية", id: "الإندونيسية", ru: "الروسية",
  tr: "التركية", th: "التايلاندية", vi: "الفيتنامية", de: "الألمانية", pl: "البولندية", fa: "الفارسية",
  nl: "الهولندية", uk: "الأوكرانية", ms: "الماليزية",
};

export function languageLabel(code?: string) {
  if (!code) return "لغة غير محددة";
  const normalized = code.trim().toLowerCase();
  if (languageNames[normalized]) return languageNames[normalized];
  try {
    const localized = new Intl.DisplayNames(["ar"], { type: "language" }).of(normalized);
    if (localized && localized.toLowerCase() !== normalized) return localized;
  } catch { /* Fall back to a neutral Arabic label for unknown language codes. */ }
  return `لغة أخرى (${code})`;
}

export function isArabicLanguage(code?: string) {
  return Boolean(code && (code.toLowerCase() === "ar" || code.toLowerCase().startsWith("ar-")));
}

export function statusLabel(status?: string) {
  const labels: Record<string, string> = { completed: "مكتمل", ongoing: "مستمر", hiatus: "متوقف مؤقتًا", cancelled: "ملغي", active: "مستمر" };
  return status ? labels[status.toLowerCase()] || "غير محدد" : "غير محدد";
}

export function workTypeLabel(language?: string) {
  if (language === "ja") return "مانغا يابانية";
  if (language === "ko") return "مانهوا كورية";
  return language ? `أصل العمل: ${languageLabel(language)}` : "عمل من MangaDex";
}

export function coverFile(manga: Manga) {
  return manga.relationships?.find(item => item.type === "cover_art")?.attributes?.fileName;
}

export function coverUrl(manga: Manga, size: "256" | "512" = "256") {
  const file = coverFile(manga);
  if (!file) return "";
  const sized = `${file}.${size}.jpg`;
  return `/api/mangadex/cover/${manga.id}/${encodeURIComponent(sized)}`;
}

const retryDelays = [450, 1000];

const wait = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

function isRetryableStatus(status: number) {
  return status === 408 || status === 425 || status === 429 || status >= 500;
}

async function request<T>(path: string, params: Record<string, string | string[] | number | undefined> = {}): Promise<T> {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "") continue;
    if (Array.isArray(value)) value.forEach(item => query.append(key, item));
    else query.set(key, String(value));
  }
  const url = `/api/mangadex${path}${query.size ? `?${query}` : ""}`;
  for (let attempt = 0; attempt <= retryDelays.length; attempt += 1) {
    let responseError: Error | null = null;
    try {
      const response = await fetch(url, { headers: { Accept: "application/json" } });
      const body = await response.json().catch(() => ({}));
      if (response.ok) return body as T;
      responseError = new Error(body.error || "تعذر تحميل البيانات من MangaDex.");
      if (!isRetryableStatus(response.status) || attempt === retryDelays.length) {
        throw responseError;
      }
    } catch (error) {
      if (responseError) throw responseError;
      if (attempt === retryDelays.length) {
        throw error instanceof Error ? error : new Error("تعذر الاتصال بخدمة MangaDex.");
      }
    }
    await wait(retryDelays[attempt]);
  }
  throw new Error("تعذر تحميل البيانات من MangaDex.");
}

export async function getTags() {
  const result = await request<ApiResponse<Tag>>("/manga/tag");
  return result.data.filter(tag => tag.attributes.group === "genre" || tag.attributes.group === "theme");
}

export async function searchManga(options: { title?: string; offset?: number; limit?: number; tagId?: string; originalLanguages?: string[]; order?: "latestUploadedChapter" | "followedCount" | "rating" }) {
  const params: Record<string, string | string[] | number | undefined> = {
    limit: options.limit ?? 20,
    offset: options.offset ?? 0,
    "includes[]": ["cover_art"],
    "contentRating[]": ["safe", "suggestive"],
    "order[latestUploadedChapter]": options.order === "followedCount" || options.order === "rating" ? undefined : "desc",
    "order[followedCount]": options.order === "followedCount" ? "desc" : undefined,
    "order[rating]": options.order === "rating" ? "desc" : undefined,
    hasAvailableChapters: "true",
    title: options.title?.trim() || undefined,
    "originalLanguage[]": options.originalLanguages,
  };
  if (options.tagId) params["includedTags[]"] = [options.tagId];
  return request<ApiResponse<Manga>>("/manga", params);
}

export async function getManga(id: string) {
  const result = await request<{ data: Manga }>(`/manga/${encodeURIComponent(id)}`, { "includes[]": ["cover_art", "author", "artist"] });
  return result.data;
}

export async function getChapter(chapterId: string) {
  const result = await request<{ data: Chapter }>(`/chapter/${encodeURIComponent(chapterId)}`, { "includes[]": ["scanlation_group", "user"] });
  return result.data;
}

export async function getChapters(mangaId: string, offset = 0, language = "en", order: "asc" | "desc" = "desc") {
  const params: Record<string, string | string[] | number | undefined> = {
    limit: 100,
    offset,
    "order[chapter]": order,
    "includes[]": ["scanlation_group"],
    "contentRating[]": ["safe", "suggestive"],
  };
  if (language !== "all") params["translatedLanguage[]"] = [language];
  const result = await request<ApiResponse<Chapter>>(`/manga/${encodeURIComponent(mangaId)}/feed`, params);
  return result;
}

export async function getChapterPages(chapterId: string, quality: "data" | "data-saver" = "data-saver") {
  const result = await request<{ baseUrl: string; chapter: { hash: string; data: string[]; dataSaver: string[] } }>(`/at-home/server/${encodeURIComponent(chapterId)}`);
  const files = quality === "data" ? result.chapter.data : result.chapter.dataSaver;
  return files.map(file => `/api/mangadex/page/${chapterId}/${quality}/${result.chapter.hash}/${encodeURIComponent(file)}`);
}
