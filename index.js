// Improved index.js for RemoteRosterBot
const { Telegraf } = require('telegraf');
const bot = new Telegraf('YOUR_BOT_TOKEN');

// Helper function to create inline keyboard buttons
const createInlineKeyboard = (options) => {
    return options.map(option => [{ text: option.text, callback_data: option.callback_data }]);
};

// Start command handler
bot.start((ctx) => {
    ctx.reply('Welcome to RemoteRosterBot! Please choose an option:', {
        reply_markup: {
            inline_keyboard: createInlineKeyboard([
                { text: 'Option 1', callback_data: 'option1' },
                { text: 'Option 2', callback_data: 'option2' },
                { text: 'Help', callback_data: 'help' }
            ])
        }
    });
});

// Callback query handler
bot.on('callback_query', (ctx) => {
    const callbackData = ctx.callbackQuery.data;
    switch (callbackData) {
        case 'option1':
            ctx.answerCbQuery('You selected Option 1!');
            // Implement additional logic for Option 1
            break;
        case 'option2':
            ctx.answerCbQuery('You selected Option 2!');
            // Implement additional logic for Option 2
            break;
        case 'help':
            ctx.answerCbQuery('Help information will be provided here.');
            // Provide help information
            break;
        default:
            ctx.answerCbQuery('Unknown option. Please try again.');
            break;
    }
});

// Error handling
bot.catch((err, ctx) => {
    console.error(`Error encountered for ${ctx.updateType}:`, err);
    ctx.reply('An error occurred, please try again later.');
});

// Start the bot
bot.launch();

console.log('Bot is running...');
