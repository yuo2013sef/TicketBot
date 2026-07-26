# 🎫 بوت نظام التذاكر الاحترافي

بوت Discord متكامل لنظام التذاكر باللغة العربية، مبني بـ **JavaScript** و **discord.js v14**.

---

## 📁 هيكل المشروع

```
discord-bot/
├── index.js                          # نقطة البداية
├── deploy-commands.js                # ملف نشر الأوامر يدوياً
├── .env.example                      # مثال على متغيرات البيئة
├── config/
│   └── config.js                     # إعدادات البوت والألوان
├── commands/
│   ├── ارسل-لوحة-التكت.js           # أمر إرسال لوحة التذاكر
│   ├── رتبة-الدعم.js                 # أمر تحديد رتبة الدعم
│   ├── متعين-رتبة-مشرف-التكتات.js   # أمر تحديد رتبة المشرف
│   └── ازالة-رتبة-اشراف-التكتات.js  # أمر إزالة رتبة المشرف
├── events/
│   ├── ready.js                      # حدث بدء تشغيل البوت
│   └── interactionCreate.js          # معالجة جميع التفاعلات
├── handlers/
│   ├── commandHandler.js             # تحميل الأوامر تلقائياً
│   └── eventHandler.js               # تحميل الأحداث تلقائياً
├── utils/
│   ├── ticketUtils.js                # وظائف إنشاء وإدارة التذاكر
│   ├── embedUtils.js                 # بناء Embeds بالعربية
│   └── dataUtils.js                  # قراءة وكتابة JSON
└── data/
    ├── settings.json                 # إعدادات كل سيرفر
    └── tickets.json                  # بيانات التذاكر النشطة
```

---

## 🚀 طريقة التشغيل على Replit

### الخطوة 1: إضافة الأسرار
في Replit، اذهب إلى **Secrets** وأضف:
- `DISCORD_TOKEN` — رمز البوت من [Discord Developer Portal](https://discord.com/developers/applications)
- `DISCORD_CLIENT_ID` — معرّف التطبيق
- `DISCORD_GUILD_ID` — معرّف السيرفر (اختياري للتسجيل السريع)

### الخطوة 2: تشغيل البوت
انقر على **Run** أو شغّل:
```bash
cd discord-bot && npm start
```

---

## ⚙️ الأوامر المتاحة

| الأمر | الوصف | الصلاحية المطلوبة |
|---|---|---|
| `/ارسل-لوحة-التكت` | إرسال لوحة فتح التذاكر | Administrator |
| `/رتبة-الدعم` | تحديد رتبة فريق الدعم | Administrator |
| `/متعين-رتبة-مشرف-التكتات` | تحديد رتبة مشرف التكتات | Administrator |
| `/ازالة-رتبة-اشراف-التكتات` | إزالة رتبة مشرف التكتات | Administrator |

---

## 🎫 أنواع التذاكر

- 🛠️ **دعم فني** — للمشاكل التقنية
- ⚠️ **شكوى** — للإبلاغ عن مشكلة أو عضو
- 💡 **اقتراح** — لتقديم الاقتراحات
- 👑 **طلب إدارة** — للتواصل مع الإدارة

---

## 🔒 نظام الصلاحيات

### رتبة الدعم
- ترى التذاكر وتدخلها
- تستلم التذاكر وترد عليها
- عند استلام التذكرة: تُسحب صلاحية الكتابة من بقية الدعم

### رتبة مشرف التكتات
- ترى **جميع** التذاكر دون قيد
- تكتب في أي تذكرة حتى لو لم تستلمها
- تراقب عمل فريق الدعم

---

## 📝 السجلات (Logs)

يسجّل البوت الأحداث التالية في روم السجلات:
- ✅ فتح تذكرة جديدة
- 🙋 استلام تذكرة
- ➕ إضافة عضو
- ➖ إزالة عضو
- 🔒 إغلاق تذكرة
- 🗑️ حذف تذكرة

---

## 🔐 صلاحيات البوت المطلوبة

في Developer Portal، قم بتفعيل:
- ✅ `GUILD_MEMBERS` (Privileged Intent)
- ✅ `MESSAGE_CONTENT` (Privileged Intent)

**Permissions:**
- Manage Channels
- Manage Roles
- Read Messages / View Channels
- Send Messages
- Embed Links
- Attach Files
- Read Message History
- Use External Emojis
- Add Reactions
- Manage Messages
- Use Application Commands
