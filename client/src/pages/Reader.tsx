import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Columns2, Maximize2, Rows3, Settings2, X } from "lucide-react";
import { Link } from "wouter";
import { getChapter, getChapterPages, getChapters, getManga, isArabicLanguage, languageLabel, mangaTitle, pickTextInfo, type Chapter, type Manga } from "@/lib/mangadex";
import { getProgress, saveProgress } from "@/lib/library";

type Mode = "scroll" | "page";
type ReadingTheme = "dark" | "light" | "auto";
export default function Reader({ mangaId, chapterId }: { mangaId: string; chapterId: string }) {
  const [manga, setManga] = useState<Manga | null>(null);
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [pages, setPages] = useState<string[]>([]);
  const [pageRetries, setPageRetries] = useState<Record<number, number>>({});
  const [page, setPage] = useState(0);
  const [mode, setMode] = useState<Mode>(() => localStorage.getItem("mangaflow:reader-mode") === "page" ? "page" : "scroll");
  const [readingTheme, setReadingTheme] = useState<ReadingTheme>(() => {
    const saved = localStorage.getItem("mangaflow:reader-theme");
    return saved === "dark" || saved === "light" || saved === "auto" ? saved : "auto";
  });
  const [systemDark, setSystemDark] = useState(() => window.matchMedia?.("(prefers-color-scheme: dark)").matches ?? true);
  const [direction, setDirection] = useState<"rtl" | "ltr">("rtl");
  const [quality, setQuality] = useState<"data" | "data-saver">("data-saver");
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [chapterList, setChapterList] = useState<Chapter[]>([]);
  const [nextChapters, setNextChapters] = useState<{ newer?: Chapter; older?: Chapter }>({});
  const pageRefs = useRef<(HTMLImageElement | null)[]>([]);
  const saved = getProgress().find(item => item.mangaId === mangaId && item.chapterId === chapterId);
  const chapterLabel = chapter?.attributes.chapter || "خاص";
  const title = manga ? mangaTitle(manga) : "قارئ MangaFlow";
  const titleInfo = manga ? pickTextInfo(manga.attributes.title) : null;
  const titleLanguageNote = titleInfo?.language && !isArabicLanguage(titleInfo.language) ? ` · العنوان المتاح: ${languageLabel(titleInfo.language)}` : "";
  const pageUrls = useMemo(() => pages, [pages]);
  const isDark = readingTheme === "dark" || (readingTheme === "auto" && systemDark);
  const readerSurfaceStyle = { backgroundColor: isDark ? "#0c0e0f" : "#f4f5f2", color: isDark ? "#d3d8d0" : "#202522" };
  const chromeStyle = { backgroundColor: isDark ? "#111315" : "#ffffff", borderColor: isDark ? "rgba(255,255,255,.08)" : "rgba(20,30,24,.14)" };
  useEffect(() => {
    document.title = manga ? `${title} — الفصل ${chapterLabel} | MangaFlow` : "قارئ المانغا | MangaFlow";
    const meta = document.querySelector('meta[name="robots"]') || document.createElement("meta");
    meta.setAttribute("name", "robots"); meta.setAttribute("content", "noindex, nofollow");
    if (!meta.parentElement) document.head.appendChild(meta);
  }, [manga, title, chapterLabel]);

  useEffect(() => {
    let active = true;
    setLoading(true); setError(""); setPages([]); setPageRetries({}); setManga(null); setChapter(null); setPage(0);
    Promise.all([getManga(mangaId), getChapter(chapterId), getChapterPages(chapterId, quality)])
      .then(async ([mangaResult, chapterResult, imagePages]) => {
        if (!active) return;
        setManga(mangaResult); setChapter(chapterResult); setPages(imagePages);
        const chapterResultList = await getChapters(mangaId, 0, chapterResult.attributes.translatedLanguage || "en", "desc").catch(() => null);
        if (!active) return;
        const list = chapterResultList?.data || [];
        setChapterList(list);
        const position = list.findIndex(item => item.id === chapterId);
        if (position >= 0) setNextChapters({ newer: position > 0 ? list[position - 1] : undefined, older: position < list.length - 1 ? list[position + 1] : undefined });
        const lastPage = getProgress().find(item => item.mangaId === mangaId && item.chapterId === chapterId)?.page;
        if (typeof lastPage === "number") setPage(Math.min(lastPage, Math.max(0, imagePages.length - 1)));
      })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : "تعذر تحميل الفصل."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [mangaId, chapterId, quality]);

  useEffect(() => { localStorage.setItem("mangaflow:reader-mode", mode); }, [mode]);
  useEffect(() => {
    localStorage.setItem("mangaflow:reader-theme", readingTheme);
    const media = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!media) return;
    const sync = () => setSystemDark(media.matches);
    sync();
    media.addEventListener?.("change", sync);
    return () => media.removeEventListener?.("change", sync);
  }, [readingTheme]);

  const store = useCallback((pageIndex: number) => {
    if (!manga) return;
    setPage(pageIndex);
    saveProgress({ mangaId, title: mangaTitle(manga), chapterId, chapterLabel, page: pageIndex, updatedAt: Date.now() });
  }, [manga, mangaId, chapterId, chapterLabel]);

  useEffect(() => {
    if (mode !== "scroll" || !pageUrls.length) return;
    const observers: IntersectionObserver[] = [];
    pageUrls.forEach((_, index) => {
      const element = pageRefs.current[index];
      if (!element) return;
      const observer = new IntersectionObserver(entries => {
        if (entries[0]?.isIntersecting) store(index);
      }, { threshold: 0.45 });
      observer.observe(element); observers.push(observer);
    });
    return () => observers.forEach(observer => observer.disconnect());
  }, [mode, pageUrls, store]);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        const forward = direction === "rtl" ? event.key === "ArrowLeft" : event.key === "ArrowRight";
        store(Math.max(0, Math.min(pages.length - 1, page + (forward ? 1 : -1))));
      }
      if (event.key === "Escape") setShowSettings(false);
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [direction, page, pages.length, store]);

  const turn = (forward: boolean) => store(Math.max(0, Math.min(pages.length - 1, page + (forward ? 1 : -1))));
  const retryPage = (index: number) => {
    const attempt = pageRetries[index] || 0;
    if (attempt >= 2) {
      setPageRetries(current => ({ ...current, [index]: 3 }));
      return;
    }
    window.setTimeout(() => setPageRetries(current => ({ ...current, [index]: attempt + 1 })), 500 * (attempt + 1));
  };
  const resetPageRetry = (index: number) => setPageRetries(current => ({ ...current, [index]: 0 }));
  const pageFallback = (index: number) => <div className="reader-page-fallback" style={{ color: isDark ? "#d3d8d0" : "#202522", padding: 24, textAlign: "center" }}><strong>تعذر تحميل الصفحة {index + 1}</strong><button className="outline-button" style={{ marginTop: 12 }} onClick={() => resetPageRetry(index)}>إعادة المحاولة</button></div>;
  const topbar = <header className="reader-topbar" style={chromeStyle}><Link href={`/manga/${mangaId}`} className="reader-exit" aria-label="العودة إلى العمل"><X size={19} /></Link><div className="reader-heading"><Link href={`/manga/${mangaId}`} dir="auto" lang={titleInfo?.language}>{title}</Link><span>الفصل {chapterLabel} · {languageLabel(chapter?.attributes.translatedLanguage)}{chapter?.attributes.title ? ` · ${chapter.attributes.title}` : ""}{titleLanguageNote}</span></div><button className={`icon-button reader-settings ${showSettings ? "active" : ""}`} onClick={() => setShowSettings(value => !value)} aria-label="إعدادات القارئ"><Settings2 size={19} /></button></header>;

  if (loading) return <div className={`reader-frame theme-${isDark ? "dark" : "light"}`} style={readerSurfaceStyle}>{topbar}<div className="reader-loading"><span className="reader-spinner" /><strong>نرتب الصفحات…</strong><span>لحظات ونكمل الحكاية</span></div></div>;
  if (error || !manga || !chapter) return <div className={`reader-frame theme-${isDark ? "dark" : "light"}`} style={readerSurfaceStyle}>{topbar}<div className="reader-loading"><strong>تعذر فتح الفصل</strong><span>{error || "قد يكون الفصل غير متاح."}</span><Link href={`/manga/${mangaId}`} className="outline-button">العودة إلى العمل <ArrowLeft size={15} /></Link></div></div>;

  return <div className={`reader-frame mode-${mode} theme-${isDark ? "dark" : "light"}`} style={readerSurfaceStyle}>
    {topbar}
    {showSettings && <div className="reader-settings-panel" style={chromeStyle}><span>مظهر القارئ</span><div><button className={readingTheme === "auto" ? "selected" : ""} onClick={() => setReadingTheme("auto")}>تلقائي</button><button className={readingTheme === "dark" ? "selected" : ""} onClick={() => setReadingTheme("dark")}>ليلي</button><button className={readingTheme === "light" ? "selected" : ""} onClick={() => setReadingTheme("light")}>نهاري</button></div><span>طريقة العرض</span><div><button className={mode === "scroll" ? "selected" : ""} onClick={() => setMode("scroll")}><Rows3 size={15} />تمرير رأسي</button><button className={mode === "page" ? "selected" : ""} onClick={() => setMode("page")}><Columns2 size={15} />صفحة واحدة</button></div><span>اتجاه القراءة</span><div><button className={direction === "rtl" ? "selected" : ""} onClick={() => setDirection("rtl")}>يمين ← يسار</button><button className={direction === "ltr" ? "selected" : ""} onClick={() => setDirection("ltr")}>يسار ← يمين</button></div><span>جودة الصور</span><div><button className={quality === "data-saver" ? "selected" : ""} onClick={() => setQuality("data-saver")}>موفرة</button><button className={quality === "data" ? "selected" : ""} onClick={() => setQuality("data")}>أصلية</button></div></div>}
    <div className="reader-canvas" dir="ltr" style={readerSurfaceStyle}>
      {!pages.length ? <div className="reader-loading"><strong>لا توجد صفحات متاحة</strong><span>قد يكون الفصل رابطًا خارجيًا أو لم تعد صفحاته متاحة.</span><Link href={`/manga/${mangaId}`} className="outline-button">عرض فصول أخرى</Link></div> : mode === "scroll" ? <div className="scroll-pages">{pages.map((src, index) => pageRetries[index] >= 3 ? <div key={`${src}-fallback`}>{pageFallback(index)}</div> : <img key={`${src}-${pageRetries[index] || 0}`} ref={element => { pageRefs.current[index] = element; }} src={src} alt={`صفحة ${index + 1}`} loading={index < 3 ? "eager" : "lazy"} onError={() => retryPage(index)} />)}</div> : <div className="single-page"><button className="page-turn turn-back" onClick={() => turn(false)} disabled={page === 0} aria-label="الصفحة السابقة">{direction === "rtl" ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}</button>{pageRetries[page] >= 3 ? pageFallback(page) : <img key={`${pages[page]}-${pageRetries[page] || 0}`} src={pages[page]} alt={`صفحة ${page + 1} من ${pages.length}`} onError={() => retryPage(page)} />}<button className="page-turn turn-next" onClick={() => turn(true)} disabled={page >= pages.length - 1} aria-label="الصفحة التالية">{direction === "rtl" ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}</button></div>}
    </div>
    {pages.length > 0 && <footer className="reader-controls" style={chromeStyle}><div className="chapter-jump"><Link href={nextChapters.older ? `/read/${mangaId}/${nextChapters.older.id}` : "#"} className={!nextChapters.older ? "disabled" : ""} aria-label="الفصل الأقدم"><ChevronRight size={18} /><span>السابق</span></Link><span className="chapter-jump-label">{chapterLabel}</span><Link href={nextChapters.newer ? `/read/${mangaId}/${nextChapters.newer.id}` : "#"} className={!nextChapters.newer ? "disabled" : ""} aria-label="الفصل الأحدث"><span>التالي</span><ChevronLeft size={18} /></Link></div><div className="page-progress"><span>{page + 1} <i>/</i> {pages.length}</span><div className="progress-track"><span style={{ width: `${((page + 1) / pages.length) * 100}%` }} /></div></div><div className="reader-actions"><button className={mode === "scroll" ? "selected" : ""} onClick={() => setMode("scroll")} aria-label="عرض متتابع"><Rows3 size={16} /></button><button className={mode === "page" ? "selected" : ""} onClick={() => setMode("page")} aria-label="عرض صفحة واحدة"><Maximize2 size={16} /></button><button onClick={() => setShowSettings(value => !value)} aria-label="الإعدادات"><Settings2 size={16} /></button></div></footer>}
    <div className="reader-credit">الصفحات مقدمة عبر MangaDex · احترم حقوق أصحاب المحتوى</div>
  </div>;
}
