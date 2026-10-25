# MangaFlow — مانغا ومانهوا بالعربية

واجهة عربية من اليمين إلى اليسار لاكتشاف المانغا اليابانية والمانهوا الكورية وقراءة الفصول المتاحة عبر MangaDex. قد تكون بعض العناوين أو الأوصاف بلغة المصدر؛ يوضح الموقع اللغة ولا يدّعي ترجمة محتوى غير متاح.

## تشغيل المشروع

يتطلب المشروع Node.js وpnpm 10. بعد تنزيل المستودع:

```bash
git clone https://github.com/kk3iig-bot/MangaFlow.git
cd MangaFlow
corepack enable
pnpm install
pnpm dev
```

يفتح خادم التطوير على المنفذ `3000` افتراضيًا. قبل حفظ تعديل شغّل:

```bash
pnpm check
pnpm build
```

للاختبارات استخدم `pnpm test`. ولتنسيق ملف واحد استخدم `pnpm exec prettier --write <مسار-الملف>`.

## من أين أبدأ التعديل؟

الصفحات موجودة في `client/src/pages/`، والمكونات المشتركة في `client/src/components/`، وعميل MangaDex والتخزين المحلي في `client/src/lib/`. التنسيق العام في `client/src/index.css`، ووسم اللغة والتحقق من Google في `client/index.html`.

راجع [دليل بنية الملفات والتعديل](docs/EDITING_GUIDE.md) لخريطة الملفات وخطوات تغيير الألوان والكتابة والتصنيفات وإضافة صفحة بأمان.

## حفظ التعديلات ونشرها

المستودع المتصل هو `kk3iig-bot/MangaFlow` على GitHub. احفظ التغييرات في الفرع `main` عبر commit وpush؛ بعدها افتح لوحة مشروع Webdev واضغط **Publish** لنشر أحدث checkpoint. رفع الملفات إلى GitHub وحده لا يعني أن الموقع أصبح منشورًا.

لا ترفع ملفات `.env` أو مفاتيح سرية أو بيانات دخول إلى المستودع. ولتغيير مسارات الصفحات، حدّث `client/src/App.tsx` و`client/public/manus-routes.json` معًا.
