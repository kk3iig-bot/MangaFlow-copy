import { useEffect } from "react";
import { BookText, ExternalLink, Languages, Search } from "lucide-react";
import { Link } from "wouter";

export default function NovelsPage() {
  useEffect(() => {
    document.title = "روايات عربية وعالمية | MangaFlow";
    const meta = document.querySelector('meta[name="description"]') || document.createElement("meta");
    meta.setAttribute("name", "description"); meta.setAttribute("content", "استكشف قسم الروايات العربية والعالمية على MangaFlow.");
    if (!meta.parentElement) document.head.appendChild(meta);
    document.querySelector('meta[name="robots"]')?.setAttribute("content", "index, follow");
  }, []);
  return <div className="content-wrap novel-library-page">
    <section className="novel-hero">
      <div className="eyebrow"><span className="eyebrow-dot" /> حكايات تُقرأ على مهل</div>
      <h1>الروايات،<br /><em>بالعربية وبكل اللغات.</em></h1>
      <p>مساحة مخصصة للروايات، مع البحث واختيار اللغة ومتابعة القراءة.</p>
      <div className="novel-feature-row"><span><Languages size={15} /> عرض اللغات المتاحة</span><span><Search size={15} /> بحث في المكتبة</span><span><BookText size={15} /> قارئ مريح</span></div>
    </section>
    <section className="novel-source-state">
      <div className="novel-state-icon"><BookText size={22} /></div>
      <div><span className="section-kicker">خطوة الربط التالية</span><h2>نحتاج توثيق مصدر الروايات</h2><p>اخترت ربط API مرخّص. أرسل رابط التوثيق الرسمي واسم الخدمة حتى نربط فهرس الروايات والفصول من المصدر الصحيح، من دون عرض محتوى تجريبي على أنه حقيقي.</p></div>
      <Link href="/" className="outline-button">العودة إلى المانغا <ExternalLink size={14} /></Link>
    </section>
    <div className="novel-note"><span>1</span><p>واجهة هذا القسم جاهزة. ستظهر الروايات واللغات المتاحة عند استلام تفاصيل الـAPI المرخّص.</p></div>
  </div>;
}
