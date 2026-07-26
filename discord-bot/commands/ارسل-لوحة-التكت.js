const { SlashCommandBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');
const { buildPanelEmbed } = require('../utils/embedUtils');
const { buildTicketSelectMenu } = require('../utils/ticketUtils');
const { getSettings, saveSettings } = require('../utils/dataUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ارسل-لوحة-التكت')
    .setDescription('أرسل لوحة نظام التذاكر في قناة محددة')
    .addChannelOption((option) =>
      option
        .setName('القناة')
        .setDescription('القناة التي ستُرسَل فيها اللوحة')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .addChannelOption((option) =>
      option
        .setName('روم-السجلات')
        .setDescription('قناة تسجيل أحداث التذاكر')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const targetChannel = interaction.options.getChannel('القناة') || interaction.channel;
    const logChannel = interaction.options.getChannel('روم-السجلات');

    // حفظ روم السجلات إذا تم تحديده
    if (logChannel) {
      saveSettings(guild.id, { logChannelId: logChannel.id });
    }

    // التحقق من صلاحية الإرسال
    const botMember = guild.members.cache.get(interaction.client.user.id);
    if (!targetChannel.permissionsFor(botMember)?.has(PermissionFlagsBits.SendMessages)) {
      return interaction.editReply({
        content: `❌ البوت لا يمتلك صلاحية الإرسال في <#${targetChannel.id}>!`,
      });
    }

    const panelEmbed = buildPanelEmbed();
    const selectMenu = buildTicketSelectMenu();

    await targetChannel.send({
      embeds: [panelEmbed],
      components: [selectMenu],
    });

    const settings = getSettings(guild.id);
    const logMsg = logChannel
      ? `\n📝 روم السجلات: <#${logChannel.id}>`
      : settings.logChannelId
      ? `\n📝 روم السجلات الحالي: <#${settings.logChannelId}>`
      : '\n⚠️ لم يتم تحديد روم السجلات. استخدم الخيار **روم-السجلات** لتحديده.';

    await interaction.editReply({
      content: `✅ تم إرسال لوحة التذاكر في <#${targetChannel.id}> بنجاح!${logMsg}`,
    });
    setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);
  },
};
