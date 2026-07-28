require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const { loadCommands } = require('./handlers/commandHandler');
const { loadEvents } = require('./handlers/eventHandler');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent, // مطلوب لقراءة رسائل التذاكر في اللوق
  ],
  partials: [Partials.Channel, Partials.Message],
});

client.commands = new Collection();

loadCommands(client);
loadEvents(client);

client.login(process.env.DISCORD_TOKEN).catch((err) => {
  console.error('❌ فشل تسجيل الدخول:', err.message);
  process.exit(1);
});
