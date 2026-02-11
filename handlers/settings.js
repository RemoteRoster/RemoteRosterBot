module.exports = {
  name: 'settings',
  description: 'Settings menu',
  execute: async (ctx) => {
    const settingsMenu = {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '🔔 Notifications', callback_data: 'settings_notifications' }
          ],
          [
            { text: '🔐 Privacy', callback_data: 'settings_privacy' }
          ],
          [
            { text: '⬅️ Back to Menu', callback_data: 'back_main' }
          ]
        ]
      }
    };
    await ctx.editMessageText('⚙️ **Settings**\n\nConfigure your preferences:', { parse_mode: 'Markdown', reply_markup: settingsMenu.reply_markup });
  }
};