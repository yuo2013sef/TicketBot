const { REST, Routes, ActivityType } = require('discord.js');
const config = require('../config/config');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`\n✅ البوت يعمل الآن: ${client.user.tag}`);
    console.log(`📊 يخدم ${client.guilds.cache.size} سيرفر\n`);

    // تعيين نشاط البوت
    client.user.setPresence({
      activities: [
        {
          name: '🎫 نظام التذاكر',
          type: ActivityType.Watching,
        },
      ],
      status: 'online',
    });

    // نشر أوامر Slash
    await deployCommands(client);
  },
};

async function deployCommands(client) {
  const commands = [...client.commands.values()].map((cmd) => cmd.data.toJSON());

  const rest = new REST({ version: '10' }).setToken(config.token);

  try {
    console.log('⏳ جاري تسجيل أوامر Slash ...');

    if (config.guildId) {
      // نشر محلي (أسرع للاختبار)
      await rest.put(
        Routes.applicationGuildCommands(client.user.id, config.guildId),
        { body: commands }
      );
      console.log(`✅ تم تسجيل ${commands.length} أمر في السيرفر المحدد.`);
    } else {
      // نشر عام (يستغرق حتى ساعة)
      await rest.put(
        Routes.applicationCommands(client.user.id),
        { body: commands }
      );
      console.log(`✅ تم تسجيل ${commands.length} أمر بشكل عام.`);
    }
  } catch (err) {
    console.error('❌ فشل تسجيل الأوامر:', err.message);
  }
}
