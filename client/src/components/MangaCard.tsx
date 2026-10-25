import { Heart, Star } from "lucide-react";
import { Link } from "wouter";
import { coverUrl, isArabicLanguage, languageLabel, mangaTitle, pickTextInfo, statusLabel, tagLabel, workTypeLabel, type Manga } from "@/lib/mangadex";
import { isFavorite, toggleFavorite } from "@/lib/library";
import { useEffect, useState } from "react";

export default function MangaCard({ manga, index = 0 }: { manga: Manga; index?: number }) {
  const [favorite, setFavorite] = useState(isFavorite(manga.id));
  useEffect(() => {
    const sync = () => setFavorite(isFavorite(manga.id));
    window.addEventListener("mangaflow:library", sync);
    return () => window.removeEventListener("mangaflow:library", sync);
  }, [manga.id]);
  const cover = coverUrl(manga);
  const titleInfo = pickTextInfo(manga.attributes.title);
  const title = mangaTitle(manga);
  const tags = manga.attributes.tags?.filter(tag => tag.attributes.group === "genre").slice(0, 2) ?? [];
  const status = statusLabel(manga.attributes.status);
  const workType = workTypeLabel(manga.attributes.originalLanguage);
  return (
    <article className="manga-card" style={{ animationDelay: `${Math.min(index % 8, 7) * 35}ms` }}>
      <Link href={`/manga/${manga.id}`} className="manga-card-cover" aria-label={`تفاصيل ${title}`}>
        {cover ? <img src={cover} alt={`غلاف ${title}`} loading="lazy" /> : <div className="cover-placeholder"><span>MF</span></div>}
        <span className="cover-sheen" />
      </Link>
      <button className={`favorite-chip ${favorite ? "is-active" : ""}`} aria-label={favorite ? "إزالة من المفضلة" : "إضافة إلى المفضلة"} onClick={() => setFavorite(toggleFavorite(manga))}>
        <Heart size={16} fill={favorite ? "currentColor" : "none"} />
      </button>
      {manga.attributes.contentRating === "suggestive" && <span className="rating-chip">+16</span>}
      <div className="manga-card-meta">
        <Link href={`/manga/${manga.id}`} className="manga-card-title" dir="auto" lang={titleInfo.language}>{title}</Link>
        {titleInfo.language && !isArabicLanguage(titleInfo.language) && <small className="manga-card-language">العنوان المتاح: {languageLabel(titleInfo.language)}</small>}
        <div className="manga-card-subline">
          <span>{workType}</span>
          {status && <span>{status}</span>}
          {manga.attributes.year && <span>{manga.attributes.year}</span>}
        </div>
        <div className="manga-card-tags">
          {manga.attributes.averageRating && <span className="rating"><Star size={12} fill="currentColor" /> {Number(manga.attributes.averageRating).toFixed(1)}</span>}
          {tags.map(tag => <span key={tag.id}>{tagLabel(tag)}</span>)}
        </div>
      </div>
    </article>
  );
}
