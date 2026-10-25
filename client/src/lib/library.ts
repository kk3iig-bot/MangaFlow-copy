import type { Manga } from "./mangadex";

const FAVORITES_KEY = "mangaflow:favorites:v1";
const PROGRESS_KEY = "mangaflow:progress:v1";
export type Progress = { mangaId: string; title: string; chapterId: string; chapterLabel: string; page: number; updatedAt: number };
type SavedManga = Pick<Manga, "id" | "attributes" | "relationships">;

function read<T>(key: string, fallback: T): T {
  try { const value = localStorage.getItem(key); return value ? JSON.parse(value) as T : fallback; }
  catch { return fallback; }
}
function notify() { window.dispatchEvent(new Event("mangaflow:library")); }

export function getFavorites(): SavedManga[] { return read(FAVORITES_KEY, []); }
export function isFavorite(id: string) { return getFavorites().some(item => item.id === id); }
export function toggleFavorite(manga: Manga) {
  const current = getFavorites();
  const next = current.some(item => item.id === manga.id) ? current.filter(item => item.id !== manga.id) : [{ id: manga.id, attributes: manga.attributes, relationships: manga.relationships }, ...current];
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(next)); notify();
  return next.some(item => item.id === manga.id);
}
export function getProgress(): Progress[] { return read(PROGRESS_KEY, []); }
export function saveProgress(progress: Progress) {
  const next = [progress, ...getProgress().filter(item => item.mangaId !== progress.mangaId)];
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(next.slice(0, 100))); notify();
}
export function removeProgress(mangaId: string) {
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(getProgress().filter(item => item.mangaId !== mangaId))); notify();
}
