require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const crypto = require('crypto');

const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
const ADMIN_CHAT_ID = process.env.ADMIN_CHAT_ID;

const sessions = new Map();
const submissionLock = new Set();
const spamGuard = new Map();

function generateReference() {
  return 'RR-' + crypto.randomBytes(3).toString('hex').toUpperCase();
}

function resetSession(chatId) {
  sessions.set(chatId, {
    step: null,
    data: {}
  });
}

function isSpamming(chatId) {
  const now = Date.now();
  const last = spamGuard.get(chatId) || 0;
  if (now - last < 1000) return true;
  spamGuard.set(chatId, now);
  return false;
}

function mainMenu(chatId) {
  bot.sendMessage(chatId,
`Remote Roster – Application Support Services

We provide structured document preparation and administrative application assistance.

We do not guarantee employment.
We are not an employer.
We are not affiliated with hiring companies.`,
{
  reply_markup: {
    keyboard: [
      ["📝 Apply for Assistance"],
      ["🧠 Job Suitability Test"],
      ["📄 CV Guidelines"],
      ["💳 Service Fee Information"],
      ["❓ FAQ"],
      ["📜 Terms & Legal Notice"],
      ["📞 Contact"]
    ],
    resize_keyboard: true
  }
});
}

/* ---------------- START ---------------- */

bot.onText(/\/start/, (msg) => {
  resetSession(msg.chat.id);
  mainMenu(msg.chat.id);
});

/* ---------------- MESSAGE HANDLER ---------------- */

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  if (!msg.text && !msg.document) return;
  if (isSpamming(chatId)) return;

  if (!sessions.has(chatId)) resetSession(chatId);
  const session = sessions.get(chatId);

  /* MAIN MENU HANDLERS */

  if (msg.text === "📝 Apply for Assistance") {
    if (submissionLock.has(chatId)) {
      return bot.sendMessage(chatId, "You already have an active submission in progress.");
    }
    submissionLock.add(chatId);
    session.step = "fullName";
    bot.sendMessage(chatId, "Enter your Full Name (exactly 2 words, letters only):");
    return;
  }

  if (msg.text === "📄 CV Guidelines") {
    return bot.sendMessage(chatId,
`CV Guidelines:

• Maximum 2–3 pages
• Clear employment history
• FIFO-relevant experience highlighted
• Certifications listed clearly
• PDF preferred format

We provide formatting assistance as part of our service.`);
  }

  if (msg.text === "💳 Service Fee Information") {
    return bot.sendMessage(chatId,
`Service Fee Information

This fee covers administrative processing services only.
It does NOT guarantee employment.
It does NOT influence hiring decisions.

Fee:
10 AUD (International)
2000 ETB (Ethiopia)

Telebirr:
0957409770
Hawi Tesfaye

Australia:
PayID (Recommended)
Commonwealth Bank Transfer
Account Name: Dagmawi Tesfaye
BSB: 062-000
Account Number: 12345678

After payment, submit your transaction reference.`);
  }

  if (msg.text === "📜 Terms & Legal Notice") {
    return bot.sendMessage(chatId,
`Terms & Legal Notice

• No job guarantee
• Administrative service only
• No employer affiliation
• Refund only if service not delivered within 5 business days
• False documents void service
• Users are responsible for accuracy of information`);
  }

  if (msg.text === "❓ FAQ") {
    return bot.sendMessage(chatId,
`FAQ

Q: Do you guarantee a job?
A: No.

Q: Are you an employer?
A: No.

Q: What does the fee cover?
A: Document formatting, administrative submission support, tracking.`);
  }

  if (msg.text === "📞 Contact") {
    return bot.sendMessage(chatId,
`Remote Roster Support
Email: RemoteRoster@hotmail.com

Administrative assistance only.`);
  }

  /* ---------------- APPLICATION FLOW ---------------- */

  if (session.step === "fullName") {
    const nameRegex = /^[A-Za-z]+\s[A-Za-z]+$/;
    if (!nameRegex.test(msg.text)) {
      return bot.sendMessage(chatId, "Invalid format. Enter exactly 2 words (letters only).");
    }
    session.data.fullName = msg.text;
    session.step = "phone";
    return bot.sendMessage(chatId, "Enter your phone number (+251XXXXXXXXX or 09XXXXXXXX):");
  }

  if (session.step === "phone") {
    const phoneRegex = /^(\+251\d{9}|09\d{8})$/;
    if (!phoneRegex.test(msg.text)) {
      return bot.sendMessage(chatId, "Invalid phone format.");
    }
    session.data.phone = msg.text;
    session.step = "email";
    return bot.sendMessage(chatId, "Enter your email:");
  }

  if (session.step === "email") {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(msg.text)) {
      return bot.sendMessage(chatId, "Invalid email format.");
    }
    session.data.email = msg.text;
    session.step = "country";
    return bot.sendMessage(chatId, "Enter your country:");
  }

  if (session.step === "country") {
    session.data.country = msg.text;
    session.step = "age";
    return bot.sendMessage(chatId, "Enter your age (18–55):");
  }

  if (session.step === "age") {
    const age = parseInt(msg.text);
    if (isNaN(age) || age < 18 || age > 55) {
      return bot.sendMessage(chatId, "Age must be between 18 and 55.");
    }
    session.data.age = age;
    session.step = "passport";
    return bot.sendMessage(chatId, "Do you have a valid passport? (Yes/No)");
  }

  if (session.step === "passport") {
    if (!["Yes", "No"].includes(msg.text)) {
      return bot.sendMessage(chatId, "Please answer Yes or No.");
    }
    session.data.passport = msg.text;
    session.step = "role";
    return bot.sendMessage(chatId, "Select desired FIFO role:", {
      reply_markup: {
        inline_keyboard: [
          [{ text: "General Labour", callback_data: "role_General Labour" }],
          [{ text: "Machine Operator", callback_data: "role_Machine Operator" }],
          [{ text: "Electrician", callback_data: "role_Electrician" }],
          [{ text: "Welder", callback_data: "role_Welder" }]
        ]
      }
    });
  }

  if (session.step === "certs") {
    session.data.certifications = msg.text;
    session.step = "cv";
    return bot.sendMessage(chatId, "Upload your CV (PDF/DOC/DOCX only):");
  }

  if (session.step === "cv" && msg.document) {
    const allowed = ["application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

    if (!allowed.includes(msg.document.mime_type)) {
      return bot.sendMessage(chatId, "Invalid file type. Upload PDF/DOC/DOCX only.");
    }

    session.data.cvFileId = msg.document.file_id;
    const ref = generateReference();
    session.data.reference = ref;

    await bot.sendMessage(chatId,
`Reference Generated: ${ref}

Please proceed with service fee payment.
Submit your transaction reference once completed.`);

    const summary =
`NEW APPLICATION

Reference: ${ref}
Name: ${session.data.fullName}
Phone: ${session.data.phone}
Email: ${session.data.email}
Country: ${session.data.country}
Age: ${session.data.age}
Passport: ${session.data.passport}
Role: ${session.data.role}
Certifications: ${session.data.certifications}`;

    await bot.sendMessage(ADMIN_CHAT_ID, summary);
    await bot.forwardMessage(ADMIN_CHAT_ID, chatId, msg.message_id);

    session.step = "payment";
    return;
  }

  if (session.step === "payment") {
    session.data.paymentRef = msg.text;

    await bot.sendMessage(chatId,
"Payment recorded. Your documents will be processed within 24 hours.");

    await bot.sendMessage(ADMIN_CHAT_ID,
`PAYMENT RECEIVED
Reference: ${session.data.reference}
User: ${session.data.fullName}
Payment Ref: ${msg.text}`);

    submissionLock.delete(chatId);
    resetSession(chatId);
  }
});

/* INLINE HANDLER */

bot.on("callback_query", (query) => {
  const chatId = query.message.chat.id;
  const session = sessions.get(chatId);

  if (!session) return;

  if (query.data.startsWith("role_")) {
    session.data.role = query.data.replace("role_", "");
    session.step = "certs";
    bot.sendMessage(chatId, "List your certifications:");
  }

  bot.answerCallbackQuery(query.id);
});

/* GLOBAL ERROR HANDLER */
process.on('unhandledRejection', (error) => {
  console.error("Unhandled Rejection:", error);
});
