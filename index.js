const TelegramBot = require('node-telegram-bot-api');

const BOT_TOKEN = process.env.BOT_TOKEN;
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

if (!BOT_TOKEN || !ADMIN_CHAT_ID) {
  console.error('Missing BOT_TOKEN or ADMIN_CHAT_ID');
  process.exit(1);
}

const bot = new TelegramBot(BOT_TOKEN, { polling: true });
const users = {};

/* ───────── START ───────── */
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  delete users[chatId];

  bot.sendMessage(
    chatId,
`👷‍♂️ *Remote Roster*
FIFO Job Application Assistance

Choose an option:`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🛠 Apply for FIFO Jobs', callback_data: 'apply' }],
          [{ text: '❓ FAQ', callback_data: 'faq' }],
          [{ text: '📞 Contact', callback_data: 'contact' }]
        ]
      }
    }
  );
});

/* ───────── BUTTON HANDLER ───────── */
bot.on('callback_query', async (q) => {
  const chatId = q.message.chat.id;
  const data = q.data;

  // APPLY
  if (data === 'apply') {
    users[chatId] = { step: 'name', data: {} };
    return bot.sendMessage(chatId, 'Full name:');
  }

  // FAQ
  if (data === 'faq') {
    return bot.sendMessage(
      chatId,
`❓ *FAQ*
• We are not an employer  
• No job guarantees  
• Payment is for application handling services  
• Processing time: 24–72 hours  
• Refund only if service is not delivered`,
      { parse_mode: 'Markdown' }
    );
  }

  // CONTACT
  if (data === 'contact') {
    return bot.sendMessage(
      chatId,
`📞 *Contact*
Telegram: https://t.me/remote_roster
Email: RemoteRoster@hotmail.com`,
      { parse_mode: 'Markdown' }
    );
  }

  // ROLE SELECTION
  if (data.startsWith('role_')) {
    users[chatId].data.role = data.replace('role_', '');
    users[chatId].step = 'experience';

    return bot.sendMessage(chatId,
      'Years of experience:',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '0–1 years', callback_data: 'exp_0-1' }],
            [{ text: '2–4 years', callback_data: 'exp_2-4' }],
            [{ text: '5+ years', callback_data: 'exp_5+' }]
          ]
        }
      }
    );
  }

  // EXPERIENCE SELECTION
  if (data.startsWith('exp_')) {
    users[chatId].data.experience = data.replace('exp_', '');
    users[chatId].step = 'cv';
    return bot.sendMessage(chatId, '📄 Upload your CV (PDF or DOC):');
  }

  // PAYMENT METHOD – TELEBIRR
  if (data === 'pay_telebirr') {
    users[chatId].data.paymentMethod = 'Telebirr';
    users[chatId].step = 'payment';

    return bot.sendMessage(chatId,
`💳 *Telebirr Payment Details*

📱 Number: *0957409770*  
👤 Receiver: *Hawi Tesfaye*

Payments are handled by a *third-party agent* for application processing services.

⏳ *Payment will be processed within 24 hours.*

Send your *Telebirr transaction reference* after payment.`,
      { parse_mode: 'Markdown' }
    );
  }

  // PAYMENT METHOD – AUSTRALIAN BANK
  if (data === 'pay_aus') {
    users[chatId].data.paymentMethod = 'Australian Bank Transfer';
    users[chatId].step = 'payment';

    return bot.sendMessage(chatId,
`🏦 *Australian Bank Transfer Details*

Bank Name: *Commonwealth Bank of Australia*  
Account Name: *Dagmawi Tesfaye*  
BSB: *062-000*  
Account Number: *10493821*  
Reference: *${users[chatId].data.ref}*

This account belongs to a *third-party processing agent*.

⏳ *Payment will be processed within 24 hours.*

Send your *transfer reference or receipt ID* after payment.`,
      { parse_mode: 'Markdown' }
    );
  }
});

/* ───────── TEXT INPUT HANDLER ───────── */
bot.on('message', async (msg) => {
  const chatId = msg.chat.id;
  const text = msg.text;
  const u = users[chatId];

  if (!u || !text) return;

  if (u.step === 'name') {
    u.data.name = text;
    u.step = 'phone';
    return bot.sendMessage(chatId, 'Phone number:');
  }

  if (u.step === 'phone') {
    u.data.phone = text;
    u.step = 'email';
    return bot.sendMessage(chatId, 'Email address:');
  }

  if (u.step === 'email') {
    u.data.email = text;
    u.step = 'country';
    return bot.sendMessage(chatId, 'Country:');
  }

  if (u.step === 'country') {
    u.data.country = text;
    u.step = 'role';

    return bot.sendMessage(chatId,
      'Select your preferred FIFO role:',
      {
        reply_markup: {
          inline_keyboard: [
            [{ text: '🧰 General Labour', callback_data: 'role_Labour' }],
            [{ text: '🚚 Operator / Driver', callback_data: 'role_Operator' }],
            [{ text: '🔧 Trades (Electrician, Welder)', callback_data: 'role_Trades' }],
            [{ text: '🛡 Safety / Support', callback_data: 'role_Support' }]
          ]
        }
      }
    );
  }

  // PAYMENT REFERENCE
  if (u.step === 'payment') {
    u.data.tx = text;

    await bot.sendMessage(
      ADMIN_CHAT_ID,
`💰 *PAYMENT SUBMITTED*
Ref: ${u.data.ref}
Method: ${u.data.paymentMethod}
TX / Ref: ${u.data.tx}
User: @${msg.from.username || 'No username'}`,
      { parse_mode: 'Markdown' }
    );

    await bot.sendMessage(
      chatId,
`✅ Payment reference submitted

Your application is under review.
⏳ *Payment will be processed within 24 hours.*

Reference:
*${u.data.ref}*`,
      { parse_mode: 'Markdown' }
    );

    delete users[chatId];
  }
});

/* ───────── CV UPLOAD ───────── */
bot.on('document', async (msg) => {
  const chatId = msg.chat.id;
  const u = users[chatId];
  if (!u || u.step !== 'cv') return;

  const ref = `RR-${Date.now().toString().slice(-6)}`;
  u.data.ref = ref;

  await bot.sendMessage(
    ADMIN_CHAT_ID,
`🆕 *NEW FIFO APPLICATION*
Ref: ${ref}
Name: ${u.data.name}
Phone: ${u.data.phone}
Email: ${u.data.email}
Country: ${u.data.country}
Role: ${u.data.role}
Experience: ${u.data.experience}
Telegram: @${msg.from.username || 'No username'}`,
    { parse_mode: 'Markdown' }
  );

  await bot.sendDocument(ADMIN_CHAT_ID, msg.document.file_id);

  u.step = 'payment_method';

  bot.sendMessage(
    chatId,
`📌 *Application submitted*

Reference:
*${ref}*

💳 Choose a payment method:`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: '🇪🇹 Telebirr', callback_data: 'pay_telebirr' }],
          [{ text: '🇦🇺 Australian Bank Transfer', callback_data: 'pay_aus' }]
        ]
      }
    }
  );
});
