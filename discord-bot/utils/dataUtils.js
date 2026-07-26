const fs = require('fs');
const path = require('path');

const SETTINGS_PATH = path.join(__dirname, '..', 'data', 'settings.json');
const TICKETS_PATH = path.join(__dirname, '..', 'data', 'tickets.json');

// ========== إعدادات السيرفر ==========

function getSettings(guildId) {
  const all = readJSON(SETTINGS_PATH);
  return all[guildId] || {};
}

function saveSettings(guildId, data) {
  const all = readJSON(SETTINGS_PATH);
  all[guildId] = { ...(all[guildId] || {}), ...data };
  writeJSON(SETTINGS_PATH, all);
}

// ========== بيانات التذاكر ==========

function getTicket(channelId) {
  const all = readJSON(TICKETS_PATH);
  return all[channelId] || null;
}

function saveTicket(channelId, data) {
  const all = readJSON(TICKETS_PATH);
  all[channelId] = data;
  writeJSON(TICKETS_PATH, all);
}

function deleteTicket(channelId) {
  const all = readJSON(TICKETS_PATH);
  delete all[channelId];
  writeJSON(TICKETS_PATH, all);
}

function getNextTicketNumber(guildId) {
  const settings = getSettings(guildId);
  const next = (settings.ticketCounter || 0) + 1;
  saveSettings(guildId, { ticketCounter: next });
  return next;
}

// ========== مساعدات القراءة والكتابة ==========

function readJSON(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
  getSettings,
  saveSettings,
  getTicket,
  saveTicket,
  deleteTicket,
  getNextTicketNumber,
};
