module.exports = {
  name: 'roster',
  description: 'View roster menu',
  execute: async (ctx) => {
    const rosterMenu = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔍 Search', callback_data: 'roster_search' },
            { text: '📊 Statistics', callback_data: 'roster_stats' }
          ],
          [
            { text: '⬅️ Back to Menu', callback_data: 'back_main' }
          ]
        ]
      }
    };
    await ctx.editMessageText('📋 **Roster Menu**\n\nSelect an option below:', { parse_mode: 'Markdown', reply_markup: rosterMenu.reply_markup });
  }
};