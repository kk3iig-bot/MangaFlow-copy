import { BookOpen, Compass, Heart, History, Search, Sparkles } from "lucide-react";
import { Link, useLocation } from "wouter";
import type { ReactNode } from "react";

const links = [
  { href: "/", label: "اكتشف", icon: Compass },
  { href: "/search", label: "بحث", icon: Search },
  { href: "/favorites", label: "المفضلة", icon: Heart },
  { href: "/history", label: "متابعة القراءة", icon: History },
];

export default function AppShell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const reader = location.startsWith("/read/");
  return (
    <div className={`app-shell ${reader ? "reader-shell" : ""}`}>
      {!reader && <header className="topbar">
        <Link href="/" className="brand"><img src="/mangaflow-mark.svg" alt="" /><span>Manga<span className="brand-flow">Flow</span></span></Link>
        <nav className="desktop-nav" aria-label="التنقل الرئيسي">
          {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`nav-link ${location === href ? "active" : ""}`}><Icon size={17} />{label}</Link>)}
        </nav>
        <Link href="/search" className="top-search"><Search size={17} /><span>ابحث عن عمل...</span><kbd>⌘ K</kbd></Link>
        <div className="avatar-mark"><Sparkles size={16} /></div>
      </header>}
      <main className={`page-body ${reader ? "reader-body" : ""}`}>{children}</main>
      {!reader && <nav className="mobile-nav" aria-label="التنقل للجوال">
        {links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} className={`mobile-nav-link ${location === href ? "active" : ""}`}><Icon size={19} /><span>{label}</span></Link>)}
      </nav>}
      {!reader && <footer className="site-footer"><BookOpen size={14} /><span>البيانات والفصول من MangaDex</span><span className="footer-sep">·</span><span>احترام حقوق المترجمين وأصحاب الأعمال</span></footer>}
    </div>
  );
}
