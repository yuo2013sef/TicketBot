require('dotenv').config();
const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('./config/config');

const commands = [];
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  if (command.data) {
    commands.push(command.data.toJSON());
    console.log(`📦 تم تحميل الأمر: ${command.data.name}`);
  }
}

const rest = new REST({ version: '10' }).setToken(config.token);

(async () => {
  try {
    console.log(`\n⏳ جاري تسجيل ${commands.length} أمر ...`);

    if (config.guildId) {
      await rest.put(
        Routes.applicationGuildCommands(config.clientId, config.guildId),
        { body: commands }
      );
      console.log(`✅ تم تسجيل ${commands.length} أمر في السيرفر المحدد بنجاح!`);
    } else {
      await rest.put(
        Routes.applicationCommands(config.clientId),
        { body: commands }
      );
      console.log(`✅ تم تسجيل ${commands.length} أمر عالمياً بنجاح!`);
    }
  } catch (err) {
    console.error('❌ فشل تسجيل الأوامر:', err);
  }
})();
