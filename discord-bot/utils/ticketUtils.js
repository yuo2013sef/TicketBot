const {
  PermissionFlagsBits,
  ChannelType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require('discord.js');
const { getSettings, getTicket, saveTicket, deleteTicket, getNextTicketNumber } = require('./dataUtils');
const { buildTicketEmbed, buildLogEmbed, buildCloseEmbed } = require('./embedUtils');
const config = require('../config/config');

// ========== إنشاء التذكرة ==========
async function createTicket(interaction, ticketType) {
  const guild = interaction.guild;
  const user = interaction.user;
  const settings = getSettings(guild.id);

  if (!settings.ticketCategoryId) {
    // إنشاء كاتيغوري للتذاكر إذا لم يكن موجوداً
    const category = await guild.channels.create({
      name: '🎫 | نظام التذاكر',
      type: ChannelType.GuildCategory,
    });
    settings.ticketCategoryId = category.id;
    const { saveSettings } = require('./dataUtils');
    saveSettings(guild.id, { ticketCategoryId: category.id });
  }

  const ticketNumber = getNextTicketNumber(guild.id);
  const paddedNumber = String(ticketNumber).padStart(4, '0');
  const channelName = `🎫・${paddedNumber}`;

  // ====== صلاحيات الروم ======
  const permissionOverwrites = [
    {
      id: guild.id, // @everyone
      deny: [PermissionFlagsBits.ViewChannel],
    },
    {
      id: user.id, // صاحب التذكرة
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
      ],
    },
  ];

  // إضافة صلاحيات رتبة الدعم
  if (settings.supportRoleId) {
    permissionOverwrites.push({
      id: settings.supportRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ManageMessages,
      ],
    });
  }

  // إضافة صلاحيات رتبة مشرف التكتات
  if (settings.supervisorRoleId) {
    permissionOverwrites.push({
      id: settings.supervisorRoleId,
      allow: [
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.AttachFiles,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.ManageMessages,
      ],
    });
  }

  // إنشاء قناة التذكرة
  const ticketChannel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildText,
    parent: settings.ticketCategoryId || null,
    permissionOverwrites,
    topic: `تذكرة #${paddedNumber} | ${user.tag} | ${ticketType}`,
  });

  // حفظ بيانات التذكرة
  const ticketData = {
    channelId: ticketChannel.id,
    guildId: guild.id,
    ownerId: user.id,
    ownerTag: user.tag,
    ticketType,
    ticketNumber,
    paddedNumber,
    claimedBy: null,
    claimedAt: null,
    members: [],
    createdAt: Date.now(),
    status: 'مفتوحة',
  };
  saveTicket(ticketChannel.id, ticketData);

  // ====== إرسال Embed داخل التذكرة ======
  const ticketEmbed = buildTicketEmbed(user, ticketType, ticketNumber);
  const buttons = buildTicketButtons();

  // بناء محتوى الرسالة: منشن صاحب التكت + منشن رتبة الدعم إن وجدت
  let mentionContent = `<@${user.id}>`;
  if (settings.supportRoleId) {
    mentionContent += ` | <@&${settings.supportRoleId}>`;
  }

  const message = await ticketChannel.send({
    content: mentionContent,
    embeds: [ticketEmbed],
    components: [buttons],
  });

  await message.pin().catch(() => {});

  // ====== إرسال سجل ======
  await sendLog(guild, settings, buildLogEmbed(
    '🎫 تم فتح تذكرة جديدة',
    [
      { name: '👤 صاحب التذكرة', value: `<@${user.id}> (${user.tag})`, inline: true },
      { name: '📂 النوع', value: config.ticketTypes[ticketType]?.label || ticketType, inline: true },
      { name: '🔢 الرقم', value: `#${paddedNumber}`, inline: true },
      { name: '📌 القناة', value: `<#${ticketChannel.id}>`, inline: false },
    ],
    config.colors.success
  ));

  return ticketChannel;
}

// ========== أزرار التذكرة ==========
function buildTicketButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('ticket_claim')
      .setLabel('استلام التذكرة')
      .setEmoji('🙋')
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId('ticket_add_member')
      .setLabel('إضافة عضو')
      .setEmoji('➕')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('ticket_remove_member')
      .setLabel('إزالة عضو')
      .setEmoji('➖')
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId('ticket_close')
      .setLabel('إغلاق التذكرة')
      .setEmoji('🔒')
      .setStyle(ButtonStyle.Danger),
  );
}

// ========== القائمة المنسدلة للوحة التذاكر ==========
function buildTicketSelectMenu() {
  return new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('ticket_select_type')
      .setPlaceholder('اختر نوع التذكرة...')
      .addOptions([
        {
          label: 'دعم فني',
          description: 'للمشاكل التقنية والأعطال',
          value: 'دعم-فني',
          emoji: '🛠️',
        },
        {
          label: 'شكوى',
          description: 'للإبلاغ عن مشكلة أو عضو',
          value: 'شكوى',
          emoji: '⚠️',
        },
        {
          label: 'اقتراح',
          description: 'لتقديم اقتراحاتك لتحسين السيرفر',
          value: 'اقتراح',
          emoji: '💡',
        },
        {
          label: 'طلب إدارة',
          description: 'للتواصل مع فريق الإدارة',
          value: 'طلب-إدارة',
          emoji: '👑',
        },
      ])
  );
}

// ========== إرسال السجل ==========
async function sendLog(guild, settings, embed) {
  if (!settings.logChannelId) return;
  const logChannel = guild.channels.cache.get(settings.logChannelId);
  if (!logChannel) return;
  await logChannel.send({ embeds: [embed] }).catch(() => {});
}

// ========== التحقق من رتبة المشرف ==========
function isSupervisor(member, settings) {
  if (member.permissions.has(PermissionFlagsBits.Administrator)) return true;
  if (settings.supervisorRoleId && member.roles.cache.has(settings.supervisorRoleId)) return true;
  if (settings.supportRoleId && member.roles.cache.has(settings.supportRoleId)) return true;
  return false;
}

module.exports = {
  createTicket,
  buildTicketButtons,
  buildTicketSelectMenu,
  sendLog,
  isSupervisor,
};
