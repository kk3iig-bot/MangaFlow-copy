import { useEffect, useState } from "react";
import { ArrowDownWideNarrow, ArrowLeft, ArrowRight, Bookmark, BookOpen, Check, ChevronLeft, ChevronRight, Heart, LoaderCircle, RotateCcw } from "lucide-react";
import { Link } from "wouter";
import { coverUrl, getChapters, getManga, isArabicLanguage, languageLabel, mangaTitle, pickTextInfo, statusLabel, tagLabel, workTypeLabel, type Chapter, type Manga } from "@/lib/mangadex";
import { isFavorite, toggleFavorite } from "@/lib/library";

export default function MangaDetails({ id }: { id: string }) {
  const [manga, setManga] = useState<Manga | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [chapterRefresh, setChapterRefresh] = useState(0);
  const [language, setLanguage] = useState("all");
  const [ascending, setAscending] = useState(false);
  const [favorite, setFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [chapterLoading, setChapterLoading] = useState(true);
  const [error, setError] = useState("");
  const [chapterError, setChapterError] = useState("");
  useEffect(() => {
    if (!manga) return;
    const titleInfo = pickTextInfo(manga.attributes.title);
    const title = titleInfo.text || mangaTitle(manga);
    const descriptionInfo = pickTextInfo(manga.attributes.description);
    const description = (descriptionInfo.text || "اكتشف تفاصيل العمل وفصوله على MangaFlow.").replace(/\s+/g, " ").trim().slice(0, 155);
    document.title = `${title} | MangaFlow`;
    const meta = document.querySelector('meta[name="description"]') || document.createElement("meta");
    meta.setAttribute("name", "description"); meta.setAttribute("content", description);
    if (!meta.parentElement) document.head.appendChild(meta);
    document.querySelector('meta[name="robots"]')?.setAttribute("content", "index, follow");
  }, [manga]);

  useEffect(() => {
    let active = true; setLoading(true); setError("");
    getManga(id).then(value => { if (active) { setManga(value); setFavorite(isFavorite(value.id)); } })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : "تعذر تحميل تفاصيل العمل."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);
  useEffect(() => {
    let active = true; setChapterLoading(true); setChapterError("");
    getChapters(id, offset, language, ascending ? "asc" : "desc").then(result => { if (active) { setChapters(result.data); setTotal(result.total); } })
      .catch(err => { if (active) { setChapters([]); setTotal(0); setChapterError(err instanceof Error ? err.message : "تعذر تحميل الفصول."); } })
      .finally(() => { if (active) setChapterLoading(false); });
    return () => { active = false; };
  }, [id, offset, language, ascending, chapterRefresh]);

  if (loading) return <div className="detail-loading"><LoaderCircle className="spin" size={24} /> جاري فتح العمل…</div>;
  if (!manga) return <div className="content-wrap state-panel error-panel"><strong>تعذر العثور على هذا العمل</strong><p>{error || "قد يكون غير متاح على MangaDex."}</p><Link href="/" className="outline-button">العودة للاكتشاف</Link></div>;
  const titleInfo = pickTextInfo(manga.attributes.title);
  const descriptionInfo = pickTextInfo(manga.attributes.description);
  const title = titleInfo.text || mangaTitle(manga);
  const cover = coverUrl(manga, "512");
  const description = descriptionInfo.text || "لا يتوفر وصف لهذا العمل في المصدر حتى الآن.";
  const availableLanguages = [...new Set(manga.attributes.availableTranslatedLanguages || [])].filter(Boolean).sort();
  const status = statusLabel(manga.attributes.status);
  const workType = workTypeLabel(manga.attributes.originalLanguage);

  return <div className="content-wrap detail-page">
    <Link href="/" className="back-link"><ArrowRight size={16} /> العودة إلى الاكتشاف</Link>
    <section className="detail-hero">
      <div className="detail-cover-wrap">{cover ? <img className="detail-cover" src={cover} alt={`غلاف ${title}`} /> : <div className="cover-placeholder detail-cover"><span>MF</span></div>}<span className="cover-bottom-fade" /></div>
      <div className="detail-copy">
        <div className="eyebrow"><span className="eyebrow-dot" /> {workType} · {status} {manga.attributes.year ? `· ${manga.attributes.year}` : ""}</div>
        <h1 dir="auto" lang={titleInfo.language}>{title}</h1>
        {titleInfo.language && !isArabicLanguage(titleInfo.language) && <span className="source-language-note">العنوان المتاح: {languageLabel(titleInfo.language)}</span>}
        <div className="detail-labels">{(manga.attributes.tags || []).filter(tag => ["genre", "theme"].includes(tag.attributes.group)).slice(0, 7).map(tag => <span key={tag.id}>{tagLabel(tag)}</span>)}</div>
        {descriptionInfo.language && !isArabicLanguage(descriptionInfo.language) && <span className="source-language-note">الوصف المتاح: {languageLabel(descriptionInfo.language)}</span>}
        <p className="detail-description" dir="auto" lang={descriptionInfo.language}>{description}</p>
        <div className="detail-stats"><div><strong>{manga.attributes.lastChapter || "—"}</strong><span>آخر فصل مدرج</span></div><div><strong>{manga.attributes.contentRating === "suggestive" ? "+16" : "عام"}</strong><span>تصنيف المحتوى</span></div><div><strong>{manga.attributes.year || "—"}</strong><span>سنة النشر</span></div></div>
        <div className="detail-actions"><button className={`primary-button ${favorite ? "saved" : ""}`} onClick={() => setFavorite(toggleFavorite(manga))}><Heart size={17} fill={favorite ? "currentColor" : "none"} />{favorite ? "في مفضلتك" : "أضف للمفضلة"}</button>{chapters[0] && <Link href={`/read/${manga.id}/${chapters[0].id}`} className="outline-button"><BookOpen size={17} />ابدأ القراءة <ArrowLeft size={16} /></Link>}</div>
        <div className="detail-attribution"><Bookmark size={13} /> بيانات العمل من MangaDex</div>
      </div>
      <div className="detail-side-art"><span className="side-orbit" /><span>العمل<br />{manga.id.slice(0, 4).toUpperCase()}</span></div>
    </section>

    <section className="chapters-section">
      <div className="section-heading"><div><div className="section-kicker">اقلب الصفحة</div><h2>الفصول <span className="chapter-count">{total ? total.toLocaleString("ar") : ""}</span></h2></div>
        <div className="chapter-controls"><label className="language-select"><span>لغة الفصول</span><select aria-label="تصفية الفصول حسب اللغة" value={language} onChange={event => { setLanguage(event.target.value); setOffset(0); }}><option value="all">كل الفصول واللغات</option>{availableLanguages.map(code => <option key={code} value={code}>{languageLabel(code)}</option>)}</select></label><button className="outline-button sort-chapters" onClick={() => { setAscending(value => !value); setOffset(0); }}><ArrowDownWideNarrow size={15} />{ascending ? "الأقدم أولًا" : "الأحدث أولًا"}</button></div>
      </div>
      {!availableLanguages.length && <p className="language-source-note">لم يعلن MangaDex قائمة لغات لهذا العمل؛ تظهر لغة كل فصل بجوار بياناته.</p>}
      {chapterError ? <div className="state-panel error-panel"><strong>تعذر تحميل الفصول</strong><p>{chapterError}</p><button className="outline-button" onClick={() => setChapterRefresh(value => value + 1)}>حاول مجددًا</button></div> : chapterLoading ? <div className="detail-loading"><LoaderCircle className="spin" size={21} /> جاري تحميل الفصول…</div> : chapters.length ? <div className="chapter-list">{chapters.map((chapter, index) => {
        const number = chapter.attributes.chapter || "خاص";
        const label = chapter.attributes.title ? `الفصل ${number} — ${chapter.attributes.title}` : `الفصل ${number}`;
        const group = chapter.relationships?.find(item => item.type === "scanlation_group")?.attributes?.name;
        return <Link className="chapter-row" key={chapter.id} href={`/read/${manga.id}/${chapter.id}`}><span className="chapter-number">{String(offset + index + 1).padStart(2, "0")}</span><span className="chapter-title"><strong>{label}</strong><small>{group || "MangaDex"} · {chapter.attributes.pages || "—"} صفحة · {languageLabel(chapter.attributes.translatedLanguage)}</small></span><time>{chapter.attributes.publishAt ? new Date(chapter.attributes.publishAt).toLocaleDateString("ar") : ""}</time><span className="chapter-open"><ChevronLeft size={17} /></span></Link>;
      })}</div> : <div className="state-panel"><strong>لا توجد فصول بهذه اللغة بعد</strong><p>اختر لغة أخرى أو راجع العمل لاحقًا.</p></div>}
      {!chapterLoading && total > 100 && <div className="pagination"><span>{offset + 1}–{Math.min(offset + 100, total)} من {total.toLocaleString("ar")}</span><div><button disabled={!offset} onClick={() => setOffset(Math.max(0, offset - 100))} aria-label="الفصول السابقة"><ChevronRight size={18} /></button><button disabled={offset + 100 >= total} onClick={() => setOffset(offset + 100)} aria-label="المزيد من الفصول"><ChevronLeft size={18} /></button></div></div>}
    </section>
  </div>;
}
