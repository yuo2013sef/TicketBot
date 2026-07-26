const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { getSettings, saveSettings } = require('../utils/dataUtils');
const { buildSuccessEmbed, buildErrorEmbed } = require('../utils/embedUtils');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('متعين-رتبة-مشرف-التكتات')
    .setDescription('تحديد رتبة مشرف التكتات التي لها صلاحية مراقبة جميع التذاكر')
    .addRoleOption((option) =>
      option
        .setName('الرتبة')
        .setDescription('الرتبة التي ستكون مشرفة على جميع التذاكر')
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
        embeds: [buildErrorEmbed('❌ لا يمكن تحديد رتبة @everyone!')],
      });
    }

    const settings = getSettings(guild.id);

    // التحقق من أن الرتبة ليست هي نفس رتبة الدعم
    if (settings.supportRoleId === role.id) {
      return interaction.editReply({
        embeds: [buildErrorEmbed('❌ هذه الرتبة محددة بالفعل كرتبة الدعم! اختر رتبة مختلفة.')],
      });
    }

    // حفظ رتبة مشرف التكتات
    saveSettings(guild.id, { supervisorRoleId: role.id });

    const embed = buildSuccessEmbed(
      `تم تحديد <@&${role.id}> كرتبة **مشرف التكتات** بنجاح!\n\n` +
      `**صلاحيات هذه الرتبة:**\n` +
      `• رؤية **جميع** التذاكر والدخول إليها\n` +
      `• الكتابة داخل **جميع** التذاكر\n` +
      `• الرد داخل أي تذكرة حتى لو لم يستلمها\n` +
      `• استلام التذاكر وإدارتها\n` +
      `• إضافة وإزالة الأعضاء\n` +
      `• إغلاق وحذف التذاكر\n\n` +
      `⚡ **لا يحتاج أعضاء هذه الرتبة إلى صلاحية Administrator**`
    );

    await interaction.editReply({ embeds: [embed] });
  },
};
