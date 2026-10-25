import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Search, SlidersHorizontal, Sparkles, TrendingUp, X } from "lucide-react";
import { Link, useLocation } from "wouter";
import MangaCard from "@/components/MangaCard";
import { coverUrl, getTags, mangaTitle, searchManga, tagLabel, type Manga, type Tag } from "@/lib/mangadex";
import { getProgress } from "@/lib/library";

const pageSize = 20;
export default function Home({ mode = "discover" }: { mode?: "discover" | "search" }) {
  const [, navigate] = useLocation();
  useEffect(() => {
    const title = mode === "search" ? "البحث عن مانغا ومانهوا | MangaFlow" : "اكتشف المانغا والمانهوا | MangaFlow";
    const description = mode === "search" ? "ابحث عن المانغا والمانهوا حسب العنوان والنوع والوسوم في مكتبة MangaFlow." : "اكتشف مانغا ومانهوا جديدة وتابع قراءتك في مكتبة MangaFlow العربية.";
    document.title = title;
    const meta = document.querySelector('meta[name="description"]') || document.createElement("meta");
    meta.setAttribute("name", "description"); meta.setAttribute("content", description);
    if (!meta.parentElement) document.head.appendChild(meta);
    document.querySelector('meta[name="robots"]')?.setAttribute("content", "index, follow");
  }, [mode]);
  const [items, setItems] = useState<Manga[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState("");
  const [workType, setWorkType] = useState<"both" | "manga" | "manhwa">("both");
  const [query, setQuery] = useState("");
  const [submitted, setSubmitted] = useState("");
  const [order, setOrder] = useState<"latestUploadedChapter" | "followedCount" | "rating">("latestUploadedChapter");
  const [offset, setOffset] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState(getProgress());
  const showSearch = mode === "search" || submitted.length > 0 || selectedTag.length > 0 || workType !== "both";
  const originalLanguages = workType === "both" ? ["ja", "ko"] : workType === "manga" ? ["ja"] : ["ko"];

  useEffect(() => {
    getTags().then(setTags).catch(() => setTags([]));
    const sync = () => setProgress(getProgress());
    window.addEventListener("mangaflow:library", sync);
    return () => window.removeEventListener("mangaflow:library", sync);
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    searchManga({ title: submitted || undefined, offset, limit: pageSize, tagId: selectedTag || undefined, originalLanguages, order })
      .then(result => { if (active) { setItems(result.data); setTotal(result.total); } })
      .catch(err => { if (active) setError(err instanceof Error ? err.message : "تعذر تحميل الأعمال."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [submitted, offset, selectedTag, workType, order, refreshKey]);

  const featured = items[0];
  const displayItems = useMemo(() => items, [items]);
  const submitSearch = (event: React.FormEvent) => { event.preventDefault(); setOffset(0); setSubmitted(query.trim()); };
  const chooseTag = (id: string) => { setSelectedTag(current => current === id ? "" : id); setOffset(0); };
  const progressItem = progress[0];

  return <div className="content-wrap">
    <section className="hero-block">
      <div className="hero-copy">
        <div className="eyebrow"><span className="eyebrow-dot" /> عالمك، على رف واحد</div>
        <h1>ابحث عن<br /><em>حكايتك التالية.</em></h1>
        <p>أعمال جديدة، عوالم بعيدة، وفصل واحد يكفي لتبدأ.</p>
        <form className="hero-search" onSubmit={submitSearch}>
          <Search size={19} />
          <input aria-label="ابحث عن مانغا أو مانهوا" placeholder="اسم العمل أو كلمة من عنوانه" value={query} onChange={event => setQuery(event.target.value)} />
          {query && <button type="button" className="clear-search" onClick={() => { setQuery(""); setSubmitted(""); }} aria-label="مسح البحث"><X size={16} /></button>}
          <button className="search-submit" type="submit">ابحث <ArrowLeft size={16} /></button>
        </form>
        <div className="hero-proof"><span><Sparkles size={14} /> كتالوج متجدد</span><span>·</span><span>تقدمك محفوظ على جهازك</span></div>
      </div>
      <div className="hero-art" aria-hidden="true">
        {featured && coverUrl(featured, "512") && <img src={coverUrl(featured, "512")} alt="" />}
        <div className="art-grain" /><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" />
        <span className="art-number">01</span><span className="art-caption">حكايات تتحرك</span>
        <div className="art-sticker"><span>اقرأ</span><ArrowRight size={16} /></div>
      </div>
      <div className="hero-index">01 <span>/ 04</span></div>
    </section>

    {progressItem && <section className="continue-strip">
      <div className="continue-icon"><span>↗</span></div>
      <div className="continue-copy"><span className="section-kicker">أكمل حكايتك</span><strong>{progressItem.title}</strong><span>الفصل {progressItem.chapterLabel} · الصفحة {progressItem.page + 1}</span></div>
      <Link href={`/read/${progressItem.mangaId}/${progressItem.chapterId}`} className="continue-button">تابع القراءة <ArrowLeft size={16} /></Link>
      <div className="continue-progress"><span style={{ width: `${Math.min(95, Math.max(8, progressItem.page * 8))}%` }} /></div>
    </section>}

    <section className="section-block">
      <div className="section-heading">
        <div><div className="section-kicker">اختيرت لك</div><h2>{submitted ? `نتائج «${submitted}»` : selectedTag ? "على ذوقك" : "اكتشف شيئًا جديدًا"}</h2></div>
        <div className="section-actions">
          <label className="sort-control"><SlidersHorizontal size={15} /><select value={order} onChange={event => { setOrder(event.target.value as typeof order); setOffset(0); }} aria-label="ترتيب الأعمال"><option value="latestUploadedChapter">الأحدث</option><option value="followedCount">الأكثر متابعة</option><option value="rating">الأعلى تقييمًا</option></select></label>
          <Link href="/search" className="text-link">كل الأعمال <ArrowLeft size={15} /></Link>
        </div>
      </div>
      <div className="tag-rail type-rail" role="group" aria-label="نوع العمل"><span className="tag-intro">النوع</span>{([{ id: "both", label: "مانغا ومانهوا" }, { id: "manga", label: "مانغا يابانية" }, { id: "manhwa", label: "مانهوا كورية" }] as const).map(option => <button key={option.id} type="button" aria-pressed={workType === option.id} onClick={() => { setWorkType(option.id); setOffset(0); }} className={`tag-pill ${workType === option.id ? "selected" : ""}`}>{option.label}</button>)}</div>
      <div className="tag-rail"><span className="tag-intro">مزاجك اليوم</span>{tags.slice(0, 12).map(tag => <button key={tag.id} onClick={() => chooseTag(tag.id)} className={`tag-pill ${selectedTag === tag.id ? "selected" : ""}`}>{tagLabel(tag)}</button>)}{selectedTag && <button className="tag-reset" onClick={() => chooseTag("")}><X size={13} /> إزالة الفلتر</button>}</div>
      {error ? <div className="state-panel error-panel"><strong>لم نتمكن من جلب الكتالوج</strong><p>{error}</p><button className="outline-button" onClick={() => setRefreshKey(value => value + 1)}>حاول مجددًا</button></div> : loading ? <div className="manga-grid">{Array.from({ length: 10 }).map((_, index) => <div className="skeleton-card" key={index}><span /><i /><i /></div>)}</div> : displayItems.length ? <div className="manga-grid">{displayItems.map((manga, index) => <MangaCard key={manga.id} manga={manga} index={index} />)}</div> : <div className="state-panel"><strong>لم نجد عناوين مطابقة</strong><p>جرّب كلمة أخرى أو أزل أحد المرشحات.</p><button className="outline-button" onClick={() => { setSubmitted(""); setQuery(""); setSelectedTag(""); setWorkType("both"); }}>مسح البحث والمرشحات</button></div>}
      {!loading && total > pageSize && <div className="pagination"><span>عرض {offset + 1}–{Math.min(offset + pageSize, total)} من {total.toLocaleString("ar")}</span><div><button disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - pageSize))} aria-label="الصفحة السابقة"><ChevronRight size={18} /></button><button disabled={offset + pageSize >= total} onClick={() => setOffset(offset + pageSize)} aria-label="الصفحة التالية"><ChevronLeft size={18} /></button></div></div>}
    </section>

    {!showSearch && <section className="source-note"><TrendingUp size={18} /><div><strong>من MangaDex إلى رفك</strong><span>الواجهة عربية، أما العناوين والأوصاف والفصول فتعرض باللغة التي يوفرها MangaDex، وتظهر لغة كل فصل بالعربية.</span></div><button onClick={() => navigate("/search")}>استكشف الكتالوج <ArrowLeft size={15} /></button></section>}
  </div>;
}
