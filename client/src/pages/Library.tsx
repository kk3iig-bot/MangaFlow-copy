import { useEffect, useState } from "react";
import { ArrowLeft, Bookmark, Clock3, Heart, Trash2 } from "lucide-react";
import { Link } from "wouter";
import MangaCard from "@/components/MangaCard";
import { getFavorites, getProgress, removeProgress, type Progress } from "@/lib/library";
import type { Manga } from "@/lib/mangadex";

export function FavoritesPage() {
  useEffect(() => {
    document.title = "المفضلة | MangaFlow";
    const meta = document.querySelector('meta[name="robots"]') || document.createElement("meta");
    meta.setAttribute("name", "robots"); meta.setAttribute("content", "noindex, nofollow");
    if (!meta.parentElement) document.head.appendChild(meta);
  }, []);
  const [items, setItems] = useState<Manga[]>(getFavorites());
  useEffect(() => { const sync = () => setItems(getFavorites() as Manga[]); window.addEventListener("mangaflow:library", sync); return () => window.removeEventListener("mangaflow:library", sync); }, []);
  return <div className="content-wrap library-page"><div className="page-title-row"><div><div className="section-kicker">رفّك الخاص</div><h1>المفضلة <span className="title-count">{items.length.toLocaleString("ar")}</span></h1><p>الأعمال التي تريد العودة إليها محفوظة على هذا الجهاز.</p></div><Bookmark size={29} className="page-title-icon" /></div>
    {items.length ? <div className="manga-grid">{items.map((manga, index) => <MangaCard key={manga.id} manga={manga} index={index} />)}</div> : <div className="empty-library"><div className="empty-icon"><Heart size={23} /></div><strong>رفّك ينتظر أول حكاية</strong><p>اضغط القلب على أي غلاف ليبقى قريبًا منك.</p><Link href="/" className="primary-button">اكتشف أعمالًا <ArrowLeft size={16} /></Link></div>}
  </div>;
}

export function HistoryPage() {
  useEffect(() => {
    document.title = "متابعة القراءة | MangaFlow";
    const meta = document.querySelector('meta[name="robots"]') || document.createElement("meta");
    meta.setAttribute("name", "robots"); meta.setAttribute("content", "noindex, nofollow");
    if (!meta.parentElement) document.head.appendChild(meta);
  }, []);
  const [items, setItems] = useState<Progress[]>(getProgress());
  useEffect(() => { const sync = () => setItems(getProgress()); window.addEventListener("mangaflow:library", sync); return () => window.removeEventListener("mangaflow:library", sync); }, []);
  return <div className="content-wrap library-page"><div className="page-title-row"><div><div className="section-kicker">من آخر موضع</div><h1>متابعة القراءة <span className="title-count">{items.length.toLocaleString("ar")}</span></h1><p>تقدمك يبقى في المتصفح، ولا يُرسل إلى MangaDex.</p></div><Clock3 size={29} className="page-title-icon" /></div>
    {items.length ? <div className="history-list">{items.map(item => <article className="history-card" key={item.mangaId}><div className="history-thumb"><span>MF</span></div><div className="history-info"><span className="section-kicker">آخر قراءة · {new Date(item.updatedAt).toLocaleDateString("ar")}</span><strong>{item.title}</strong><span>الفصل {item.chapterLabel} · الصفحة {item.page + 1}</span></div><Link href={`/read/${item.mangaId}/${item.chapterId}`} className="continue-button">تابع <ArrowLeft size={15} /></Link><button className="icon-button history-remove" aria-label="حذف سجل القراءة" onClick={() => removeProgress(item.mangaId)}><Trash2 size={16} /></button></article>)}</div> : <div className="empty-library"><div className="empty-icon"><Clock3 size={23} /></div><strong>لا توجد قراءة حديثة</strong><p>افتح أي فصل، وسنحفظ آخر موضع وصلت إليه.</p><Link href="/" className="primary-button">ابدأ الاستكشاف <ArrowLeft size={16} /></Link></div>}
  </div>;
}
