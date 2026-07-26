const {
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  PermissionFlagsBits,
  UserSelectMenuBuilder,
} = require('discord.js');
const { getSettings, getTicket, saveTicket, deleteTicket } = require('../utils/dataUtils');
const { createTicket, buildTicketButtons, isSupervisor, sendLog } = require('../utils/ticketUtils');
const { generateTranscript } = require('../utils/transcriptUtils');
const {
  buildClaimEmbed,
  buildAddMemberEmbed,
  buildRemoveMemberEmbed,
  buildCloseEmbed,
  buildErrorEmbed,
  buildSuccessEmbed,
  buildLogEmbed,
  buildTicketEmbed,
} = require('../utils/embedUtils');
const config = require('../config/config');

module.exports = {
  name: 'interactionCreate',
  once: false,
  async execute(interaction, client) {
    try {
      // ====== أوامر Slash ======
      if (interaction.isChatInputCommand()) {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;
        await command.execute(interaction, client);
        return;
      }

      // ====== قائمة اختيار نوع التذكرة ======
      if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_select_type') {
        await handleTicketTypeSelect(interaction);
        return;
      }

      // ====== أزرار التذكرة ======
      if (interaction.isButton()) {
        switch (interaction.customId) {
          case 'ticket_claim':
            await handleClaimTicket(interaction);
            break;
          case 'ticket_add_member':
            await handleAddMemberPrompt(interaction);
            break;
          case 'ticket_remove_member':
            await handleRemoveMemberPrompt(interaction);
            break;
          case 'ticket_close':
            await handleCloseTicket(interaction);
            break;
          case 'ticket_confirm_delete':
            await handleDeleteTicket(interaction);
            break;
          case 'ticket_cancel_delete':
            await interaction.update({ content: '❌ تم إلغاء حذف التذكرة.', components: [], embeds: [] });
            break;
        }
        return;
      }

      // ====== قائمة اختيار عضو لإضافته ======
      if (interaction.isUserSelectMenu() && interaction.customId === 'ticket_select_add_member') {
        await handleAddMember(interaction);
        return;
      }

      // ====== قائمة اختيار عضو لإزالته ======
      if (interaction.isUserSelectMenu() && interaction.customId === 'ticket_select_remove_member') {
        await handleRemoveMember(interaction);
        return;
      }
    } catch (err) {
      console.error('❌ خطأ في interactionCreate:', err);
      const errEmbed = buildErrorEmbed('حدث خطأ غير متوقع، يرجى المحاولة لاحقاً.');
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errEmbed], ephemeral: true }).catch(() => {});
      } else {
        await interaction.reply({ embeds: [errEmbed], ephemeral: true }).catch(() => {});
      }
    }
  },
};

// ====================================================
// اختيار نوع التذكرة
// ====================================================
async function handleTicketTypeSelect(interaction) {
  await interaction.deferReply({ ephemeral: true });

  const ticketType = interaction.values[0];
  const guild = interaction.guild;
  const user = interaction.user;

  // التحقق من وجود تذكرة مفتوحة فعلاً (القناة موجودة + الحالة مفتوحة)
  const { readJSON } = getTicketDataCheck();
  const allTickets = readJSON();
  const existingTicket = Object.values(allTickets).find(
    (t) => t.guildId === guild.id && t.ownerId === user.id && t.status === 'مفتوحة'
  );

  if (existingTicket) {
    // تحقق من أن القناة لا تزال موجودة فعلاً في السيرفر
    const ch = guild.channels.cache.get(existingTicket.channelId);
    if (ch) {
      await interaction.editReply({
        content: `❌ لديك تذكرة مفتوحة بالفعل! <#${ch.id}>`,
      });
      // حذف الرد بعد 5 ثواني
      setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);
      return;
    } else {
      // القناة حُذفت لكن البيانات لم تُحذف → نظّف البيانات القديمة
      deleteTicket(existingTicket.channelId);
    }
  }

  const ticketChannel = await createTicket(interaction, ticketType);

  await interaction.editReply({
    content: `✅ تم إنشاء تذكرتك بنجاح! <#${ticketChannel.id}>`,
  });
  // حذف الرد بعد 5 ثواني
  setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);
}

function getTicketDataCheck() {
  const fs = require('fs');
  const path = require('path');
  const TICKETS_PATH = path.join(__dirname, '..', 'data', 'tickets.json');
  return {
    readJSON: () => {
      try {
        return JSON.parse(fs.readFileSync(TICKETS_PATH, 'utf8'));
      } catch {
        return {};
      }
    },
  };
}

// ====================================================
// استلام التذكرة
// ====================================================
async function handleClaimTicket(interaction) {
  await interaction.deferReply({ ephemeral: false });

  const guild = interaction.guild;
  const admin = interaction.user;
  const member = interaction.member;
  const settings = getSettings(guild.id);

  // التحقق من الصلاحيات
  if (!isSupervisor(member, settings)) {
    return interaction.editReply({
      embeds: [buildErrorEmbed('❌ ليس لديك صلاحية استلام التذاكر!')],
      ephemeral: true,
    });
  }

  const ticket = getTicket(interaction.channel.id);
  if (!ticket) {
    return interaction.editReply({ embeds: [buildErrorEmbed('❌ هذه القناة ليست تذكرة!')] });
  }

  if (ticket.claimedBy) {
    return interaction.editReply({
      embeds: [buildErrorEmbed(`❌ هذه التذكرة تم استلامها بالفعل من قِبَل <@${ticket.claimedBy}>!`)],
    });
  }

  // تحديث بيانات التذكرة
  ticket.claimedBy = admin.id;
  ticket.claimedAt = Date.now();
  ticket.status = 'مُستلَمة';
  saveTicket(interaction.channel.id, ticket);

  const channel = interaction.channel;

  // رتبة الدعم: تبقى مشاهدة فقط (لا تغيير، هكذا أُنشئت)
  // نعيد تأكيد الـ deny صراحةً لضمان عدم الكتابة
  if (settings.supportRoleId) {
    await channel.permissionOverwrites.edit(settings.supportRoleId, {
      ViewChannel: true,
      ReadMessageHistory: true,
      SendMessages: false,
      CreatePublicThreads: false,
      CreatePrivateThreads: false,
      SendMessagesInThreads: false,
      AttachFiles: false,
      EmbedLinks: false,
    }).catch(() => {});
  }

  // الإداري المستلم فقط يحصل على صلاحية الكتابة الكاملة
  await channel.permissionOverwrites.edit(admin.id, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true,
    AttachFiles: true,
    EmbedLinks: true,
    CreatePublicThreads: false,
    CreatePrivateThreads: false,
    SendMessagesInThreads: false,
  }).catch(() => {});

  // إرسال Embed الاستلام
  const claimEmbed = buildClaimEmbed(admin, ticket.ticketNumber);
  await interaction.editReply({ embeds: [claimEmbed] });

  // تحديث الـ Embed الرئيسي في التذكرة بتغيير الحالة
  const ticketEmbed = buildTicketEmbed(
    { id: ticket.ownerId, tag: ticket.ownerTag, displayAvatarURL: () => null },
    ticket.ticketType,
    ticket.ticketNumber
  );
  ticketEmbed.spliceFields(4, 1, { name: '📌 الحالة', value: `🟢 مستلمة من <@${admin.id}>`, inline: true });

  // إرسال سجل
  await sendLog(guild, settings, buildLogEmbed(
    '🙋 تم استلام تذكرة',
    [
      { name: '👮 الإداري', value: `<@${admin.id}> (${admin.tag})`, inline: true },
      { name: '📌 القناة', value: `<#${channel.id}>`, inline: true },
      { name: '🔢 الرقم', value: `#${ticket.paddedNumber}`, inline: true },
    ],
    config.colors.primary
  ));
}

// ====================================================
// إضافة عضو - عرض قائمة الاختيار
// ====================================================
async function handleAddMemberPrompt(interaction) {
  const guild = interaction.guild;
  const member = interaction.member;
  const settings = getSettings(guild.id);

  if (!isSupervisor(member, settings)) {
    return interaction.reply({
      embeds: [buildErrorEmbed('❌ ليس لديك صلاحية إضافة أعضاء!')],
      ephemeral: true,
    });
  }

  const ticket = getTicket(interaction.channel.id);
  if (!ticket) {
    return interaction.reply({ embeds: [buildErrorEmbed('❌ هذه القناة ليست تذكرة!')], ephemeral: true });
  }

  const selectMenu = new ActionRowBuilder().addComponents(
    new UserSelectMenuBuilder()
      .setCustomId('ticket_select_add_member')
      .setPlaceholder('اختر العضو الذي تريد إضافته...')
      .setMinValues(1)
      .setMaxValues(1)
  );

  await interaction.reply({
    content: '**اختر العضو الذي تريد إضافته إلى التذكرة:**',
    components: [selectMenu],
    ephemeral: true,
  });
}

// ====================================================
// إضافة عضو - التنفيذ
// ====================================================
async function handleAddMember(interaction) {
  await interaction.deferUpdate();

  const guild = interaction.guild;
  const admin = interaction.user;
  const settings = getSettings(guild.id);
  const ticket = getTicket(interaction.channel.id);

  if (!ticket) {
    return interaction.followUp({ embeds: [buildErrorEmbed('❌ لم يتم العثور على بيانات التذكرة!')], ephemeral: true });
  }

  const targetUser = interaction.users.first();
  if (!targetUser) {
    return interaction.followUp({ embeds: [buildErrorEmbed('❌ لم يتم اختيار عضو!')], ephemeral: true });
  }

  // منع إضافة صاحب التذكرة أو البوت
  if (targetUser.id === ticket.ownerId || targetUser.bot) {
    return interaction.followUp({
      embeds: [buildErrorEmbed('❌ لا يمكن إضافة هذا المستخدم!')],
      ephemeral: true,
    });
  }

  // منع الإضافة المكررة
  if (ticket.members.includes(targetUser.id)) {
    return interaction.followUp({
      embeds: [buildErrorEmbed(`❌ <@${targetUser.id}> موجود بالفعل في التذكرة!`)],
      ephemeral: true,
    });
  }

  // إضافة صلاحية للعضو
  await interaction.channel.permissionOverwrites.edit(targetUser.id, {
    ViewChannel: true,
    SendMessages: true,
    ReadMessageHistory: true,
    AttachFiles: true,
  }).catch(() => {});

  // تحديث البيانات
  ticket.members.push(targetUser.id);
  saveTicket(interaction.channel.id, ticket);

  // إرسال إشعار داخل التذكرة
  await interaction.channel.send({ embeds: [buildAddMemberEmbed(targetUser, admin)] });

  // إرسال سجل
  await sendLog(guild, settings, buildLogEmbed(
    '➕ تمت إضافة عضو إلى تذكرة',
    [
      { name: '👤 العضو المضاف', value: `<@${targetUser.id}> (${targetUser.tag})`, inline: true },
      { name: '👮 الإداري', value: `<@${admin.id}>`, inline: true },
      { name: '📌 القناة', value: `<#${interaction.channel.id}>`, inline: true },
    ],
    config.colors.success
  ));

  await interaction.editReply({
    content: `✅ تمت إضافة <@${targetUser.id}> إلى التذكرة بنجاح.`,
    components: [],
  });
}

// ====================================================
// إزالة عضو - عرض قائمة الاختيار
// ====================================================
async function handleRemoveMemberPrompt(interaction) {
  const guild = interaction.guild;
  const member = interaction.member;
  const settings = getSettings(guild.id);

  if (!isSupervisor(member, settings)) {
    return interaction.reply({
      embeds: [buildErrorEmbed('❌ ليس لديك صلاحية إزالة أعضاء!')],
      ephemeral: true,
    });
  }

  const ticket = getTicket(interaction.channel.id);
  if (!ticket) {
    return interaction.reply({ embeds: [buildErrorEmbed('❌ هذه القناة ليست تذكرة!')], ephemeral: true });
  }

  if (!ticket.members || ticket.members.length === 0) {
    return interaction.reply({
      embeds: [buildErrorEmbed('❌ لا يوجد أعضاء مضافون في هذه التذكرة!')],
      ephemeral: true,
    });
  }

  const selectMenu = new ActionRowBuilder().addComponents(
    new UserSelectMenuBuilder()
      .setCustomId('ticket_select_remove_member')
      .setPlaceholder('اختر العضو الذي تريد إزالته...')
      .setMinValues(1)
      .setMaxValues(1)
  );

  await interaction.reply({
    content: '**اختر العضو الذي تريد إزالته من التذكرة:**',
    components: [selectMenu],
    ephemeral: true,
  });
}

// ====================================================
// إزالة عضو - التنفيذ
// ====================================================
async function handleRemoveMember(interaction) {
  await interaction.deferUpdate();

  const guild = interaction.guild;
  const admin = interaction.user;
  const settings = getSettings(guild.id);
  const ticket = getTicket(interaction.channel.id);

  if (!ticket) {
    return interaction.followUp({ embeds: [buildErrorEmbed('❌ لم يتم العثور على بيانات التذكرة!')], ephemeral: true });
  }

  const targetUser = interaction.users.first();
  if (!targetUser) {
    return interaction.followUp({ embeds: [buildErrorEmbed('❌ لم يتم اختيار عضو!')], ephemeral: true });
  }

  // منع إزالة صاحب التذكرة
  if (targetUser.id === ticket.ownerId) {
    return interaction.followUp({
      embeds: [buildErrorEmbed('❌ لا يمكن إزالة صاحب التذكرة!')],
      ephemeral: true,
    });
  }

  if (!ticket.members.includes(targetUser.id)) {
    return interaction.followUp({
      embeds: [buildErrorEmbed(`❌ <@${targetUser.id}> غير موجود في قائمة الأعضاء المضافين!`)],
      ephemeral: true,
    });
  }

  // إزالة صلاحية العضو
  await interaction.channel.permissionOverwrites.delete(targetUser.id).catch(() => {});

  // تحديث البيانات
  ticket.members = ticket.members.filter((id) => id !== targetUser.id);
  saveTicket(interaction.channel.id, ticket);

  // إرسال إشعار
  await interaction.channel.send({ embeds: [buildRemoveMemberEmbed(targetUser, admin)] });

  // إرسال سجل
  await sendLog(guild, settings, buildLogEmbed(
    '➖ تمت إزالة عضو من تذكرة',
    [
      { name: '👤 العضو المُزال', value: `<@${targetUser.id}> (${targetUser.tag})`, inline: true },
      { name: '👮 الإداري', value: `<@${admin.id}>`, inline: true },
      { name: '📌 القناة', value: `<#${interaction.channel.id}>`, inline: true },
    ],
    config.colors.danger
  ));

  await interaction.editReply({
    content: `✅ تمت إزالة <@${targetUser.id}> من التذكرة بنجاح.`,
    components: [],
  });
}

// ====================================================
// إغلاق التذكرة
// ====================================================
async function handleCloseTicket(interaction) {
  const guild = interaction.guild;
  const member = interaction.member;
  const settings = getSettings(guild.id);
  const ticket = getTicket(interaction.channel.id);

  if (!ticket) {
    return interaction.reply({ embeds: [buildErrorEmbed('❌ هذه القناة ليست تذكرة!')], ephemeral: true });
  }

  // السماح للإدارة أو صاحب التذكرة بالإغلاق
  const canClose = isSupervisor(member, settings) || interaction.user.id === ticket.ownerId;
  if (!canClose) {
    return interaction.reply({
      embeds: [buildErrorEmbed('❌ ليس لديك صلاحية إغلاق هذه التذكرة!')],
      ephemeral: true,
    });
  }

  await interaction.deferReply();

  const closeEmbed = buildCloseEmbed(interaction.user, ticket.ticketNumber);

  const confirmRow = new ActionRowBuilder().addComponents(
    new (require('discord.js').ButtonBuilder)()
      .setCustomId('ticket_confirm_delete')
      .setLabel('تأكيد الحذف')
      .setEmoji('🗑️')
      .setStyle(require('discord.js').ButtonStyle.Danger),
    new (require('discord.js').ButtonBuilder)()
      .setCustomId('ticket_cancel_delete')
      .setLabel('إلغاء')
      .setEmoji('❌')
      .setStyle(require('discord.js').ButtonStyle.Secondary),
  );

  await interaction.editReply({
    embeds: [closeEmbed],
    components: [confirmRow],
  });

  // تحديث حالة التذكرة
  ticket.status = 'مغلقة';
  ticket.closedBy = interaction.user.id;
  ticket.closedAt = Date.now();
  saveTicket(interaction.channel.id, ticket);

  // سحب صلاحية الكتابة من صاحب التذكرة
  await interaction.channel.permissionOverwrites.edit(ticket.ownerId, {
    SendMessages: false,
  }).catch(() => {});

  // إرسال سجل
  await sendLog(guild, settings, buildLogEmbed(
    '🔒 تم إغلاق تذكرة',
    [
      { name: '👤 أُغلقت من', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
      { name: '📌 القناة', value: `<#${interaction.channel.id}>`, inline: true },
      { name: '🔢 الرقم', value: `#${ticket.paddedNumber}`, inline: true },
      { name: '👤 صاحب التذكرة', value: `<@${ticket.ownerId}>`, inline: true },
    ],
    config.colors.warning
  ));
}

// ====================================================
// حذف التذكرة نهائياً + توليد ملف اللوق
// ====================================================
async function handleDeleteTicket(interaction) {
  await interaction.deferUpdate();

  const guild = interaction.guild;
  const settings = getSettings(guild.id);
  const ticket = getTicket(interaction.channel.id);
  const channel = interaction.channel;

  await channel.send('📄 جاري توليد ملف اللوق، انتظر لحظة...');

  // ====== توليد ملف الترانسكريبت ======
  let transcriptAttachment = null;
  let messageCount = 0;
  try {
    const result = await generateTranscript(channel, ticket || {
      paddedNumber: '0000',
      ownerTag: 'unknown',
      ticketType: 'غير معروف',
      createdAt: Date.now(),
    });
    transcriptAttachment = result.attachment;
    messageCount = result.messageCount;
  } catch (err) {
    console.error('❌ فشل توليد الترانسكريبت:', err.message);
  }

  // ====== إرسال اللوق مع الملف في روم السجلات ======
  const logEmbed = buildLogEmbed(
    '🗑️ تم حذف تذكرة',
    [
      { name: '👤 حذفها', value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
      { name: '🔢 الرقم', value: ticket ? `#${ticket.paddedNumber}` : 'غير معروف', inline: true },
      { name: '👤 صاحب التذكرة', value: ticket ? `<@${ticket.ownerId}>` : 'غير معروف', inline: true },
      { name: '📂 النوع', value: ticket ? (ticket.ticketType || 'غير معروف') : 'غير معروف', inline: true },
      { name: '💬 عدد الرسائل', value: `${messageCount} رسالة`, inline: true },
    ],
    config.colors.danger
  );

  if (settings.logChannelId) {
    const logChannel = guild.channels.cache.get(settings.logChannelId);
    if (logChannel) {
      const logPayload = { embeds: [logEmbed] };
      if (transcriptAttachment) {
        logPayload.files = [transcriptAttachment];
        logPayload.content = '📎 **ملف اللوق الكامل للتذكرة:**';
      }
      await logChannel.send(logPayload).catch(() => {});
    }
  }

  // حذف البيانات
  deleteTicket(channel.id);

  // حذف القناة بعد 3 ثواني
  await channel.send('🗑️ سيتم حذف هذه القناة خلال **3 ثوانٍ**...');
  setTimeout(() => {
    channel.delete('حذف التذكرة').catch(() => {});
  }, 3000);
}
