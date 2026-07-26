const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getSettings, saveSettings } = require('../utils/dataUtils');
const { buildSuccessEmbed, buildErrorEmbed } = require('../utils/embedUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ازالة-رتبة-اشراف-التكتات')
    .setDescription('إزالة رتبة مشرف التكتات من إعدادات البوت')
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const settings = getSettings(guild.id);

    if (!settings.supervisorRoleId) {
      return interaction.editReply({
        embeds: [buildErrorEmbed('❌ لم يتم تحديد رتبة مشرف التكتات بعد!')],
      });
    }

    const oldRoleId = settings.supervisorRoleId;

    // حذف رتبة مشرف التكتات من الإعدادات
    saveSettings(guild.id, { supervisorRoleId: null });

    const embed = buildSuccessEmbed(
      `تم إزالة رتبة <@&${oldRoleId}> من إعدادات **مشرف التكتات** بنجاح!\n\n` +
      `لن يتمكن أعضاء هذه الرتبة من الآن فصاعداً من:\n` +
      `• رؤية التذاكر الجديدة\n` +
      `• الكتابة داخل التذاكر\n\n` +
      `لتحديد رتبة جديدة، استخدم الأمر:\n` +
      `\`/متعين-رتبة-مشرف-التكتات\``
    );

    await interaction.editReply({ embeds: [embed] });
  },
};
