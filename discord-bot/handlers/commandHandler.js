const fs = require('fs');
const path = require('path');

function loadCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter((f) => f.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if (!command.data || !command.execute) {
      console.warn(`⚠️ الملف ${file} لا يحتوي على data أو execute.`);
      continue;
    }

    client.commands.set(command.data.name, command);
    console.log(`✅ تم تحميل الأمر: ${command.data.name}`);
  }
}

module.exports = { loadCommands };
