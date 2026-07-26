const { EmbedBuilder } = require('discord.js');
const config = require('../config/config');

// ========== Embed لوحة التذاكر ==========
function buildPanelEmbed() {
  return new EmbedBuilder()
    .setTitle('🎫 نظام التذاكر')
    .setDescription(
      '> مرحباً بك في نظام الدعم الخاص بنا!\n\n' +
      '**لفتح تذكرة، اختر نوعها من القائمة أدناه:**\n\n' +
      '🛠️ **دعم فني** — للمشاكل التقنية والأعطال\n' +
      '⚠️ **شكوى** — للإبلاغ عن مشكلة أو عضو\n' +
      '💡 **اقتراح** — لتقديم اقتراحاتك لتحسين السيرفر\n' +
      '👑 **طلب إدارة** — للتواصل مع فريق الإدارة\n\n' +
      '*سيتم إنشاء قناة خاصة بك لمعالجة طلبك.*'
    )
    .setColor(config.colors.primary)
    .setFooter({ text: 'نظام التذاكر الاحترافي • يسعدنا خدمتكم' })
    .setTimestamp();
}

// ========== Embed داخل التذكرة ==========
function buildTicketEmbed(user, ticketType, ticketNumber) {
  const typeInfo = config.ticketTypes[ticketType] || { label: ticketType, emoji: '🎫' };
  return new EmbedBuilder()
    .setTitle(`🎫 تذكرة رقم #${String(ticketNumber).padStart(4, '0')}`)
    .setDescription(
      '> مرحباً! تم فتح تذكرتك بنجاح.\n' +
      '> يرجى شرح مشكلتك أو طلبك بالتفصيل وسيقوم فريق الدعم بالرد عليك.'
    )
    .addFields(
      { name: '👤 صاحب التذكرة', value: `<@${user.id}>`, inline: true },
      { name: '📂 نوع التذكرة', value: typeInfo.label, inline: true },
      { name: '🔢 رقم التذكرة', value: `#${String(ticketNumber).padStart(4, '0')}`, inline: true },
      { name: '⏰ وقت الإنشاء', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false },
      { name: '📌 الحالة', value: '🟡 في انتظار الاستلام', inline: true },
    )
    .setColor(typeInfo.color || config.colors.primary)
    .setThumbnail(user.displayAvatarURL({ dynamic: true }))
    .setFooter({ text: 'استخدم الأزرار أدناه لإدارة التذكرة' })
    .setTimestamp();
}

// ========== Embed استلام التذكرة ==========
function buildClaimEmbed(admin, ticketNumber) {
  return new EmbedBuilder()
    .setTitle('✅ تم استلام التذكرة')
    .setDescription(`قام <@${admin.id}> باستلام هذه التذكرة.\n\nسيتم الرد عليك في أقرب وقت ممكن.`)
    .addFields(
      { name: '👮 الإداري المستلم', value: `<@${admin.id}>`, inline: true },
      { name: '⏰ وقت الاستلام', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
    )
    .setColor(config.colors.success)
    .setFooter({ text: `تذكرة رقم #${String(ticketNumber).padStart(4, '0')}` })
    .setTimestamp();
}

// ========== Embed إضافة عضو ==========
function buildAddMemberEmbed(addedUser, adminUser) {
  return new EmbedBuilder()
    .setTitle('➕ تمت إضافة عضو')
    .setDescription(`تمت إضافة <@${addedUser.id}> إلى هذه التذكرة من قِبَل <@${adminUser.id}>.`)
    .setColor(config.colors.success)
    .setTimestamp();
}

// ========== Embed إزالة عضو ==========
function buildRemoveMemberEmbed(removedUser, adminUser) {
  return new EmbedBuilder()
    .setTitle('➖ تمت إزالة عضو')
    .setDescription(`تمت إزالة <@${removedUser.id}> من هذه التذكرة من قِبَل <@${adminUser.id}>.`)
    .setColor(config.colors.danger)
    .setTimestamp();
}

// ========== Embed إغلاق التذكرة ==========
function buildCloseEmbed(closedBy, ticketNumber) {
  return new EmbedBuilder()
    .setTitle('🔒 تم إغلاق التذكرة')
    .setDescription(`تم إغلاق هذه التذكرة من قِبَل <@${closedBy.id}>.`)
    .addFields(
      { name: '⏰ وقت الإغلاق', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
      { name: '👤 أغلقها', value: `<@${closedBy.id}>`, inline: true },
    )
    .setColor(config.colors.danger)
    .setFooter({ text: `تذكرة رقم #${String(ticketNumber).padStart(4, '0')}` })
    .setTimestamp();
}

// ========== Embed سجل الأحداث ==========
function buildLogEmbed(action, fields, color) {
  return new EmbedBuilder()
    .setTitle(action)
    .addFields(fields)
    .setColor(color || config.colors.info)
    .setTimestamp();
}

// ========== Embed خطأ ==========
function buildErrorEmbed(message) {
  return new EmbedBuilder()
    .setTitle('❌ خطأ')
    .setDescription(message)
    .setColor(config.colors.danger)
    .setTimestamp();
}

// ========== Embed نجاح ==========
function buildSuccessEmbed(message) {
  return new EmbedBuilder()
    .setTitle('✅ نجاح')
    .setDescription(message)
    .setColor(config.colors.success)
    .setTimestamp();
}

module.exports = {
  buildPanelEmbed,
  buildTicketEmbed,
  buildClaimEmbed,
  buildAddMemberEmbed,
  buildRemoveMemberEmbed,
  buildCloseEmbed,
  buildLogEmbed,
  buildErrorEmbed,
  buildSuccessEmbed,
};
