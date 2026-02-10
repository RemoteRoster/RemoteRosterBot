
const TelegramBot = require('node-telegram-bot-api');

// Use environment variables for safety
const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = Number(process.env.ADMIN_CHAT_ID);

if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
  console.error("Missing BOT_TOKEN or ADMIN_CHAT_ID environment variables.");
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const users = {};

// /start
bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id,
`Welcome to Remote Roster 👷‍♂️
FIFO Job Application Assistance

Choose an option below:`,
{
  reply_markup: {
    keyboard: [
      ['🛠 Apply for FIFO Jobs'],
      ['❓ FAQ', '📞 Contact']
    ],
    resize_keyboard: true
  }
});
});

// Message handler
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;

  if (text === '🛠 Apply for FIFO Jobs') {
    users[chatId] = { step: 1, data: {} };
    return bot.sendMessage(chatId, 'Full name:');
  }

  if (!users[chatId]) return;
  const u = users[chatId];

  if (u.step === 1) {
    u.data.name = text; u.step++;
    return bot.sendMessage(chatId, 'Phone number:');
  }
  if (u.step === 2) {
    u.data.phone = text; u.step++;
    return bot.sendMessage(chatId, 'Email address:');
  }
  if (u.step === 3) {
    u.data.email = text; u.step++;
    return bot.sendMessage(chatId, 'Country:');
  }
  if (u.step === 4) {
    u.data.country = text; u.step++;
    return bot.sendMessage(chatId, 'Preferred FIFO role:');
  }
  if (u.step === 5) {
    u.data.role = text; u.step++;
    return bot.sendMessage(chatId, 'Years of experience:');
  }
  if (u.step === 6) {
    u.data.experience = text; u.step = 7;
    return bot.sendMessage(chatId, 'Upload your CV (PDF/DOC):');
  }

  // Payment confirmation
  if (u.step === 8) {
    const tx = text;
    await bot.sendMessage(ADMIN_CHAT_ID,
`💰 PAYMENT CONFIRMATION

Ref: ${u.data.ref}
TX: ${tx}
User: @${msg.from.username || 'N/A'}`);

    await bot.sendMessage(chatId,
`✅ Payment received

Reference: ${u.data.ref}
We will contact you within 24–72 hours.`);

    delete users[chatId];
  }
});

// CV upload
bot.on('document', async (msg) => {
  const chatId = msg.chat.id;
  const u = users[chatId];
  if (!u || u.step !== 7) return;

  const ref = `RR-${Date.now().toString().slice(-6)}`;
  u.data.ref = ref;

  await bot.sendMessage(ADMIN_CHAT_ID,
`🆕 NEW FIFO APPLICATION

Ref: ${ref}
Name: ${u.data.name}
Phone: ${u.data.phone}
Email: ${u.data.email}
Country: ${u.data.country}
Role: ${u.data.role}
Experience: ${u.data.experience}
Telegram: @${msg.from.username || 'N/A'}`);

  await bot.sendDocument(ADMIN_CHAT_ID, msg.document.file_id);

  u.step = 8;

  await bot.sendMessage(chatId,
`Application submitted.

Reference Number:
${ref}

💳 Payment Details
Telebirr: 0957409770
Receiver: Hawi Tesfaye

Payments are handled by a third-party agent for application processing services only.

Send your Telebirr transaction reference after payment.`);
});

// FAQ
bot.onText(/❓ FAQ/, (msg) => {
  bot.sendMessage(msg.chat.id,
`FAQ
• We are not an employer
• No job guarantees
• Payment is for service handling
• Processing time: 24–72 hours
• Refund only if service not delivered`);
});

// Contact
bot.onText(/📞 Contact/, (msg) => {
  bot.sendMessage(msg.chat.id,
`Contact
Telegram: https://t.me/remote_roster
Email: RemoteRoster@hotmail.com`);
});
