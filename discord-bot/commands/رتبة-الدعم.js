const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getSettings, saveSettings } = require('../utils/dataUtils');
const { buildSuccessEmbed, buildErrorEmbed } = require('../utils/embedUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('رتبة-الدعم')
    .setDescription('تحديد رتبة فريق الدعم الذين يتعاملون مع التذاكر')
    .addRoleOption((option) =>
      option
        .setName('الرتبة')
        .setDescription('الرتبة التي ستكون مسؤولة عن التذاكر')
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: true });

    const guild = interaction.guild;
    const role = interaction.options.getRole('الرتبة');

    // منع تحديد رتبة @everyone
    if (role.id === guild.id) {
      return interaction.editReply({
        embeds: [buildErrorEmbed('❌ لا يمكن تحديد رتبة @everyone كرتبة دعم!')],
      });
    }

    // حفظ رتبة الدعم
    saveSettings(guild.id, { supportRoleId: role.id });

    const embed = buildSuccessEmbed(
      `تم تحديد <@&${role.id}> كرتبة الدعم بنجاح!\n\n` +
      `**صلاحيات هذه الرتبة:**\n` +
      `• رؤية جميع التذاكر والدخول إليها\n` +
      `• الكتابة داخل التذاكر\n` +
      `• استلام التذاكر والرد عليها\n` +
      `• إضافة وإزالة الأعضاء من التذاكر\n` +
      `• إغلاق التذاكر`
    );

    await interaction.editReply({ embeds: [embed] });
    setTimeout(() => interaction.deleteReply().catch(() => {}), 5000);
  },
};
