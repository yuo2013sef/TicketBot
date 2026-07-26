module.exports = {
  // رمز البوت - يُحمَّل من متغيرات البيئة
  token: process.env.DISCORD_TOKEN,

  // معرّف التطبيق - يُحمَّل من متغيرات البيئة
  clientId: process.env.DISCORD_CLIENT_ID,

  // معرّف السيرفر (اختياري - للنشر المحلي السريع)
  guildId: process.env.DISCORD_GUILD_ID || null,

  // ألوان الـ Embeds
  colors: {
    primary: 0x5865f2,    // أزرق Discord
    success: 0x57f287,    // أخضر
    danger: 0xed4245,     // أحمر
    warning: 0xfee75c,    // أصفر
    info: 0x5865f2,       // أزرق
    ticket: 0x2b2d31,     // رمادي داكن
  },

  // أنواع التذاكر المتاحة
  ticketTypes: {
    'دعم-فني': { label: '🛠️ دعم فني', emoji: '🛠️', color: 0x5865f2 },
    'شكوى': { label: '⚠️ شكوى', emoji: '⚠️', color: 0xed4245 },
    'اقتراح': { label: '💡 اقتراح', emoji: '💡', color: 0xfee75c },
    'طلب-إدارة': { label: '👑 طلب إدارة', emoji: '👑', color: 0x57f287 },
  },
};
