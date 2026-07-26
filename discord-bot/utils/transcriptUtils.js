const { AttachmentBuilder } = require('discord.js');

/**
 * يجمع جميع رسائل القناة ويولّد ملف HTML جاهز للتنزيل
 */
async function generateTranscript(channel, ticketData) {
  // جلب جميع الرسائل (حتى 500 رسالة)
  const messages = await fetchAllMessages(channel);

  const html = buildHTML(channel, ticketData, messages);

  const buffer = Buffer.from(html, 'utf-8');
  const fileName = `تكت-${ticketData.paddedNumber}-${sanitize(ticketData.ownerTag)}.html`;

  const attachment = new AttachmentBuilder(buffer, { name: fileName });
  return { attachment, fileName, messageCount: messages.length };
}

// ====================================================
// جلب جميع رسائل القناة
// ====================================================
async function fetchAllMessages(channel) {
  const all = [];
  let lastId = null;

  while (true) {
    const options = { limit: 100 };
    if (lastId) options.before = lastId;

    const batch = await channel.messages.fetch(options).catch(() => null);
    if (!batch || batch.size === 0) break;

    all.push(...batch.values());
    lastId = batch.last().id;

    if (batch.size < 100) break;
  }

  // ترتيب من الأقدم للأحدث
  return all.reverse();
}

// ====================================================
// بناء ملف HTML
// ====================================================
function buildHTML(channel, ticketData, messages) {
  const typeLabel = {
    'دعم-فني': '🛠️ دعم فني',
    'شكوى': '⚠️ شكوى',
    'اقتراح': '💡 اقتراح',
    'طلب-إدارة': '👑 طلب إدارة',
  }[ticketData.ticketType] || ticketData.ticketType;

  const createdAt = new Date(ticketData.createdAt).toLocaleString('ar-SA', {
    dateStyle: 'full', timeStyle: 'short',
  });

  const messagesHTML = messages.map((msg) => buildMessageHTML(msg)).join('\n');

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>لوق التكت #${ticketData.paddedNumber}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: #313338;
      color: #dbdee1;
      font-family: 'Segoe UI', Tahoma, Arial, sans-serif;
      font-size: 15px;
      direction: rtl;
    }
    .header {
      background: #1e1f22;
      padding: 20px 30px;
      border-bottom: 2px solid #5865f2;
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .header-icon { font-size: 36px; }
    .header-info h1 { font-size: 20px; color: #fff; margin-bottom: 4px; }
    .header-info p  { font-size: 13px; color: #949ba4; }
    .meta {
      background: #2b2d31;
      padding: 16px 30px;
      display: flex;
      flex-wrap: wrap;
      gap: 24px;
      border-bottom: 1px solid #404249;
    }
    .meta-item { display: flex; flex-direction: column; gap: 3px; }
    .meta-item .label { font-size: 11px; font-weight: 700; color: #949ba4; text-transform: uppercase; }
    .meta-item .value { font-size: 14px; color: #dbdee1; }
    .messages { padding: 16px 30px; max-width: 900px; margin: 0 auto; }
    .message {
      display: flex;
      gap: 14px;
      padding: 8px 10px;
      border-radius: 6px;
      margin-bottom: 2px;
      transition: background 0.1s;
    }
    .message:hover { background: #2e3035; }
    .message.system {
      background: #2b2d31;
      border-right: 3px solid #5865f2;
      padding: 10px 14px;
      margin: 10px 0;
      border-radius: 4px;
    }
    .avatar {
      width: 40px; height: 40px;
      border-radius: 50%;
      background: #5865f2;
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 16px; color: #fff;
      flex-shrink: 0; margin-top: 2px;
    }
    .avatar img { width: 40px; height: 40px; border-radius: 50%; }
    .msg-body { flex: 1; min-width: 0; }
    .msg-header { display: flex; align-items: baseline; gap: 8px; margin-bottom: 4px; flex-wrap: wrap; }
    .msg-author { font-weight: 600; color: #fff; font-size: 15px; }
    .msg-author.bot-tag { color: #5865f2; }
    .msg-time { font-size: 11px; color: #949ba4; }
    .bot-badge {
      background: #5865f2; color: #fff;
      font-size: 10px; font-weight: 700;
      padding: 1px 5px; border-radius: 3px;
    }
    .msg-content { color: #dbdee1; line-height: 1.5; word-break: break-word; }
    .msg-content a { color: #00a8fc; }
    .embed {
      border-right: 4px solid #5865f2;
      background: #2b2d31;
      padding: 12px 16px;
      border-radius: 4px;
      margin-top: 6px;
    }
    .embed-title { font-weight: 700; font-size: 15px; color: #fff; margin-bottom: 6px; }
    .embed-desc { font-size: 14px; color: #dbdee1; line-height: 1.5; }
    .embed-field { margin-top: 10px; }
    .embed-field .field-name { font-size: 12px; font-weight: 700; color: #dbdee1; margin-bottom: 2px; }
    .embed-field .field-value { font-size: 14px; color: #b5bac1; }
    .attachment {
      background: #2b2d31;
      border: 1px solid #404249;
      border-radius: 6px;
      padding: 10px 14px;
      margin-top: 6px;
      font-size: 13px; color: #00a8fc;
    }
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 12px;
      color: #949ba4;
      border-top: 1px solid #404249;
      margin-top: 20px;
    }
    .no-msgs { text-align: center; color: #949ba4; padding: 40px; }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-icon">🎫</div>
    <div class="header-info">
      <h1>لوق التكت #${ticketData.paddedNumber}</h1>
      <p>القناة: ${channel.name} • السيرفر: ${channel.guild?.name || 'غير معروف'}</p>
    </div>
  </div>

  <div class="meta">
    <div class="meta-item">
      <span class="label">صاحب التكت</span>
      <span class="value">${escapeHtml(ticketData.ownerTag)}</span>
    </div>
    <div class="meta-item">
      <span class="label">نوع التكت</span>
      <span class="value">${typeLabel}</span>
    </div>
    <div class="meta-item">
      <span class="label">رقم التكت</span>
      <span class="value">#${ticketData.paddedNumber}</span>
    </div>
    <div class="meta-item">
      <span class="label">تاريخ الفتح</span>
      <span class="value">${createdAt}</span>
    </div>
    ${ticketData.claimedBy ? `
    <div class="meta-item">
      <span class="label">استلمه</span>
      <span class="value">ID: ${ticketData.claimedBy}</span>
    </div>` : ''}
    <div class="meta-item">
      <span class="label">عدد الرسائل</span>
      <span class="value">${messages.length}</span>
    </div>
  </div>

  <div class="messages">
    ${messages.length === 0
      ? '<div class="no-msgs">لا توجد رسائل في هذه التذكرة</div>'
      : messagesHTML}
  </div>

  <div class="footer">
    تم إنشاء هذا الملف تلقائياً عند إغلاق التكت • نظام التذاكر الاحترافي
  </div>
</body>
</html>`;
}

// ====================================================
// بناء HTML لكل رسالة
// ====================================================
function buildMessageHTML(msg) {
  if (!msg.author) return '';

  const isBot = msg.author.bot;
  const avatarLetter = msg.author.username?.[0]?.toUpperCase() || '?';
  const avatarURL = msg.author.displayAvatarURL?.({ size: 64, extension: 'png' }) || '';
  const timeStr = msg.createdAt.toLocaleString('ar-SA', { dateStyle: 'short', timeStyle: 'short' });

  // رسائل النظام (مثل pinned messages)
  if (msg.system) {
    return `<div class="message system">
      <span class="msg-content">📌 ${escapeHtml(msg.content || 'رسالة نظام')}</span>
    </div>`;
  }

  let contentHTML = '';

  // المحتوى النصي
  if (msg.content) {
    contentHTML += `<div class="msg-content">${escapeHtml(msg.content)}</div>`;
  }

  // Embeds
  for (const embed of msg.embeds || []) {
    contentHTML += buildEmbedHTML(embed);
  }

  // المرفقات
  for (const att of msg.attachments?.values() || []) {
    const isImage = att.contentType?.startsWith('image/');
    contentHTML += `<div class="attachment">
      📎 ${isImage ? `<img src="${att.url}" style="max-width:300px;max-height:200px;border-radius:4px;display:block;margin-top:6px;" alt="${escapeHtml(att.name)}" />` : `<a href="${att.url}" target="_blank">${escapeHtml(att.name)}</a>`}
    </div>`;
  }

  return `<div class="message">
    <div class="avatar">${avatarURL ? `<img src="${avatarURL}" alt="${avatarLetter}" onerror="this.style.display='none';this.parentElement.textContent='${avatarLetter}'" />` : avatarLetter}</div>
    <div class="msg-body">
      <div class="msg-header">
        <span class="msg-author${isBot ? ' bot-tag' : ''}">${escapeHtml(msg.author.username || '؟')}${isBot ? ' <span class="bot-badge">BOT</span>' : ''}</span>
        <span class="msg-time">${timeStr}</span>
      </div>
      ${contentHTML || '<div class="msg-content" style="color:#949ba4;font-style:italic;">— رسالة فارغة أو ملف —</div>'}
    </div>
  </div>`;
}

// ====================================================
// بناء HTML للـ Embed
// ====================================================
function buildEmbedHTML(embed) {
  const color = embed.color ? `#${embed.color.toString(16).padStart(6, '0')}` : '#5865f2';
  let html = `<div class="embed" style="border-color:${color}">`;
  if (embed.title) html += `<div class="embed-title">${escapeHtml(embed.title)}</div>`;
  if (embed.description) html += `<div class="embed-desc">${escapeHtml(embed.description)}</div>`;
  for (const f of embed.fields || []) {
    html += `<div class="embed-field">
      <div class="field-name">${escapeHtml(f.name)}</div>
      <div class="field-value">${escapeHtml(f.value)}</div>
    </div>`;
  }
  html += '</div>';
  return html;
}

// ====================================================
// مساعدات
// ====================================================
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/\n/g, '<br>');
}

function sanitize(str) {
  return (str || 'unknown').replace(/[^a-zA-Z0-9\u0600-\u06FF_-]/g, '_').slice(0, 30);
}

module.exports = { generateTranscript };
